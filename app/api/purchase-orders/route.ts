import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { purchaseOrderSchema } from "@/lib/schemas";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || "";

    const where: Record<string, unknown> = {};
    if (status) {
      where.status = status;
    }

    where.deletedAt = null;

    const orders = await prisma.purchaseOrder.findMany({
      where,
      include: {
        supplier: true,
        items: { include: { product: { select: { name: true, sku: true } } } },
        _count: { select: { goodsReceipts: true } },
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
    console.error("Error fetching purchase orders:", error);
    return NextResponse.json(
      { error: "Erro ao buscar ordens de compra" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const validatedData = purchaseOrderSchema.safeParse(body);

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

    const { supplierId, notes, items } = validatedData.data;

    // Generate next PO code
    const lastPO = await prisma.purchaseOrder.findFirst({
      orderBy: { code: "desc" },
      select: { code: true },
    });
    const nextNumber = lastPO
      ? parseInt(lastPO.code.replace("PO-", "")) + 1
      : 1;
    const code = `PO-${String(nextNumber).padStart(4, "0")}`;

    // Calculate total (items already transformed to cents by schema)
    const totalValue = items.reduce(
      (sum: number, item: any) => sum + item.quantity * item.unitPrice,
      0,
    );

    const order = await prisma.purchaseOrder.create({
      data: {
        code,
        supplierId,
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
        supplier: true,
        items: {
          include: { product: { select: { name: true, sku: true } } },
        },
      },
    });

    return NextResponse.json(order, { status: 201 });
  } catch (error) {
    console.error("Error creating purchase order:", error);
    return NextResponse.json(
      { error: "Erro ao criar ordem de compra" },
      { status: 500 },
    );
  }
}
