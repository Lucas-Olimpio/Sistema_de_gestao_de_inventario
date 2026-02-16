import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { salesOrderSchema } from "@/lib/schemas";

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

    const safeOrders = orders.map((order) => ({
      ...order,
      totalValue: Number(order.totalValue),
      items: order.items.map((item) => ({
        ...item,
        unitPrice: Number(item.unitPrice),
      })),
    }));

    return NextResponse.json(safeOrders);
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

    // Validate and transform with Zod
    const validatedData = salesOrderSchema.safeParse(body);

    if (!validatedData.success) {
      return NextResponse.json(
        {
          error:
            "Dados inválidos: " +
            JSON.stringify(validatedData.error.flatten().fieldErrors),
        },
        { status: 400 },
      );
    }

    const { customerId, notes, items } = validatedData.data;

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

    // Calculate total (items already transformed to cents by schema)
    const totalValue = items.reduce(
      (sum: number, item: any) => sum + item.quantity * item.unitPrice,
      0,
    );

    const order = await prisma.salesOrder.create({
      data: {
        code,
        customerId,
        notes: notes || null,
        totalValue,
        items: {
          create: items.map((item) => ({
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
