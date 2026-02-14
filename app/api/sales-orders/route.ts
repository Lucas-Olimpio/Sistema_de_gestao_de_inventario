import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");

    const where: Record<string, unknown> = {
      deletedAt: null,
    };
    if (status) where.status = status;

    const orders = await prisma.salesOrder.findMany({
      where,
      include: {
        customer: { select: { name: true } },
        items: {
          include: { product: { select: { name: true, sku: true } } },
        },
        receivable: { select: { status: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(orders);
  } catch (error) {
    console.error("Error fetching sales orders:", error);
    return NextResponse.json(
      { error: "Erro ao buscar pedidos de venda" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { customerId, notes, items } = body;

    if (!customerId || !items || items.length === 0) {
      return NextResponse.json(
        { error: "Cliente e itens são obrigatórios" },
        { status: 400 },
      );
    }

    // Generate sequential code
    const lastOrder = await prisma.salesOrder.findFirst({
      orderBy: { code: "desc" },
      select: { code: true },
    });

    let nextNumber = 1;
    if (lastOrder) {
      const match = lastOrder.code.match(/VD-(\d+)/);
      if (match) nextNumber = parseInt(match[1]) + 1;
    }
    const code = `VD-${String(nextNumber).padStart(4, "0")}`;

    // Calculate total
    const totalValue = (
      items as Array<{ quantity: number; unitPrice: number }>
    ).reduce(
      (sum: number, item: { quantity: number; unitPrice: number }) =>
        sum + item.quantity * item.unitPrice,
      0,
    );

    const order = await prisma.salesOrder.create({
      data: {
        code,
        customerId,
        notes: notes || null,
        totalValue,
        items: {
          create: (
            items as Array<{
              productId: string;
              quantity: number;
              unitPrice: number;
            }>
          ).map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
          })),
        },
      },
      include: {
        customer: { select: { name: true } },
        items: {
          include: { product: { select: { name: true, sku: true } } },
        },
      },
    });

    return NextResponse.json(order, { status: 201 });
  } catch (error) {
    console.error("Error creating sales order:", error);
    return NextResponse.json(
      { error: "Erro ao criar pedido de venda" },
      { status: 500 },
    );
  }
}
