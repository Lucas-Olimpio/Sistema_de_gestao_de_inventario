import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get("productId") || "";

    const where: Record<string, unknown> = {};
    if (productId) {
      where.productId = productId;
    }

    const movements = await prisma.stockMovement.findMany({
      where,
      include: { product: { select: { name: true, sku: true } } },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    return NextResponse.json(movements);
  } catch (error) {
    console.error("Error fetching movements:", error);
    return NextResponse.json(
      { error: "Erro ao buscar movimentações" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
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

    // Create movement and update stock in a transaction
    const [movement] = await prisma.$transaction([
      prisma.stockMovement.create({
        data: {
          productId,
          type,
          quantity: qty,
          reason: reason || null,
        },
        include: { product: { select: { name: true, sku: true } } },
      }),
      prisma.product.update({
        where: { id: productId },
        data: {
          quantity:
            type === "IN" ? product.quantity + qty : product.quantity - qty,
        },
      }),
    ]);

    return NextResponse.json(movement, { status: 201 });
  } catch (error) {
    console.error("Error creating movement:", error);
    return NextResponse.json(
      { error: "Erro ao criar movimentação" },
      { status: 500 },
    );
  }
}
