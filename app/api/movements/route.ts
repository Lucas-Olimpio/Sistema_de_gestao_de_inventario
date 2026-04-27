import { NextResponse } from "next/server";
import { waitUntil } from "@vercel/functions";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { logError } from "@/lib/logger";

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const productId = searchParams.get("productId") || "";
    const search = searchParams.get("search") || "";
    const type = searchParams.get("type") || "";
    const dateFrom = searchParams.get("dateFrom") || "";
    const dateTo = searchParams.get("dateTo") || "";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(100, parseInt(searchParams.get("limit") || "20"));
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};

    if (productId) where.productId = productId;
    if (type && ["IN", "OUT"].includes(type)) where.type = type;

    if (search) {
      where.product = {
        OR: [
          { name: { contains: search, mode: "insensitive" } },
          { sku: { contains: search, mode: "insensitive" } },
        ],
      };
    }

    if (dateFrom || dateTo) {
      where.createdAt = {
        ...(dateFrom ? { gte: new Date(dateFrom) } : {}),
        ...(dateTo ? { lte: new Date(dateTo + "T23:59:59.999Z") } : {}),
      };
    }

    const [movements, total] = await Promise.all([
      prisma.stockMovement.findMany({
        where,
        include: { product: { select: { name: true, sku: true } } },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.stockMovement.count({ where }),
    ]);

    return NextResponse.json({
      data: movements,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    // Fire-and-forget background execution using Vercel waitUntil
    waitUntil(
      logError({
        path: "/api/movements (GET)",
        message: "Erro ao buscar movimentações",
        error,
      }).catch(console.error),
    );

    return NextResponse.json(
      { error: "Erro ao buscar movimentações" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    if (session.user.role !== "ADMIN" && session.user.role !== "OPERADOR") {
      return NextResponse.json(
        {
          error:
            "Acesso negado. Apenas Administradores e Operadores podem registar movimentações.",
        },
        { status: 403 },
      );
    }

    const body = await request.json();
    const { productId, type, quantity, reason } = body;

    if (!productId || !type || !quantity) {
      return NextResponse.json(
        { error: "Campos obrigatórios: produto, tipo, quantidade" },
        { status: 400 },
      );
    }

    if (!["IN", "OUT"].includes(type)) {
      return NextResponse.json(
        { error: "Tipo deve ser IN ou OUT" },
        { status: 400 },
      );
    }

    const qty = parseInt(quantity);
    if (qty <= 0) {
      return NextResponse.json(
        { error: "Quantidade deve ser positiva" },
        { status: 400 },
      );
    }

    const product = await prisma.product.findUnique({
      where: { id: productId },
    });
    if (!product) {
      return NextResponse.json(
        { error: "Produto não encontrado" },
        { status: 404 },
      );
    }

    if (type === "OUT" && product.quantity < qty) {
      return NextResponse.json(
        { error: `Estoque insuficiente. Disponível: ${product.quantity}` },
        { status: 400 },
      );
    }

    const defaultWh = await prisma.warehouse.findFirst();
    if (!defaultWh) {
      return NextResponse.json(
        { error: "Nenhum Armazém cadastrado no sistema." },
        { status: 500 }
      );
    }

    // Create movement and update stock in a transaction
    const [movement] = await prisma.$transaction([
      prisma.stockMovement.create({
        data: {
          productId,
          warehouseId: defaultWh.id,
          type,
          quantity: qty,
          reason,
        },
        include: { product: { select: { name: true, sku: true } } },
      }),
      prisma.product.update({
        where: { id: productId },
        data: {
          quantity: type === "IN" ? { increment: qty } : { decrement: qty },
        },
      }),
      prisma.productStock.upsert({
        where: { productId_warehouseId: { productId, warehouseId: defaultWh.id } },
        create: { productId, warehouseId: defaultWh.id, quantity: type === "IN" ? qty : 0 },
        update: { quantity: type === "IN" ? { increment: qty } : { decrement: qty } }
      })
    ]);

    return NextResponse.json(movement, { status: 201 });
  } catch (error) {
    let body = {};
    try {
      body = await request.clone().json();
    } catch (_) {
      /* body not JSON, ignore */
    }

    // Fire-and-forget background execution using Vercel waitUntil
    waitUntil(
      logError({
        path: "/api/movements (POST)",
        message: "Erro ao criar movimentação",
        error,
        payload: body,
      }).catch(console.error),
    );

    return NextResponse.json(
      { error: "Erro ao criar movimentação" },
      { status: 500 },
    );
  }
}
