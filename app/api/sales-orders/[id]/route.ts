import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const order = await prisma.salesOrder.findUnique({
      where: { id },
      include: {
        customer: true,
        items: {
          include: { product: { select: { name: true, sku: true } } },
        },
        receivables: true,
      },
    });

    if (!order) {
      return NextResponse.json(
        { error: "Pedido não encontrado" },
        { status: 404 },
      );
    }

    // Serialize Decimal fields to Number for JSON safety
    const safeOrder = {
      ...order,
      totalValue: Number(order.totalValue),
      discountAmount: Number(order.discountAmount),
      freightAmount: Number(order.freightAmount),
      items: order.items.map((item) => ({
        ...item,
        unitPrice: Number(item.unitPrice),
      })),
      receivables: order.receivables.map((r) => ({
        ...r,
        amount: Number(r.amount),
      })),
    };

    return NextResponse.json(safeOrder);
  } catch (error) {
    console.error("Error fetching sales order:", error);
    return NextResponse.json(
      { error: "Erro ao buscar pedido" },
      { status: 500 },
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth();
    if (session?.user?.role === "VISUALIZADOR") {
      return NextResponse.json(
        {
          error:
            "Acesso negado: Visualizadores não podem atualizar pedidos de venda.",
        },
        { status: 403 },
      );
    }
    const { id } = await params;
    const body = await request.json();
    const { status } = body;

    const order = await prisma.salesOrder.findUnique({
      where: { id },
      include: { items: true },
    });

    if (!order) {
      return NextResponse.json(
        { error: "Pedido não encontrado" },
        { status: 404 },
      );
    }

    // Status transition validation
    const validTransitions: Record<string, string[]> = {
      PENDENTE: ["APROVADA", "CANCELADA"],
      APROVADA: ["FATURADA", "CANCELADA"],
    };

    const allowed = validTransitions[order.status];
    if (!allowed || !allowed.includes(status)) {
      return NextResponse.json(
        {
          error: `Transição de "${order.status}" para "${status}" não é permitida`,
        },
        { status: 400 },
      );
    }

    // FATURADA: stock out + accounts receivable (in a transaction)
    if (status === "FATURADA") {
      // Verify stock availability for all items
      for (const item of order.items) {
        const product = await prisma.product.findUnique({
          where: { id: item.productId },
          select: { name: true, quantity: true },
        });
        if (!product || product.quantity < item.quantity) {
          return NextResponse.json(
            {
              error: `Estoque insuficiente para "${product?.name || "produto"}". Disponível: ${product?.quantity || 0}, Necessário: ${item.quantity}`,
            },
            { status: 400 },
          );
        }
      }

      // Get default warehouse for stock movements
      const defaultWh = await prisma.warehouse.findFirst();
      if (!defaultWh) {
        return NextResponse.json(
          { error: "Nenhum Armazém cadastrado no sistema." },
          { status: 500 },
        );
      }

      const operations = [];

      // 1. Update order status
      operations.push(
        prisma.salesOrder.update({
          where: { id },
          data: { status: "FATURADA" },
        }),
      );

      // 2. Decrease stock + create OUT movements + update ProductStock
      for (const item of order.items) {
        operations.push(
          prisma.product.update({
            where: {
              id: item.productId,
              quantity: { gte: item.quantity },
            },
            data: { quantity: { decrement: item.quantity } },
          }),
        );
        operations.push(
          prisma.stockMovement.create({
            data: {
              productId: item.productId,
              warehouseId: defaultWh.id,
              type: "OUT",
              quantity: item.quantity,
              reason: `Venda ${order.code}`,
            },
          }),
        );
        operations.push(
          prisma.productStock.upsert({
            where: {
              productId_warehouseId: {
                productId: item.productId,
                warehouseId: defaultWh.id,
              },
            },
            create: {
              productId: item.productId,
              warehouseId: defaultWh.id,
              quantity: 0,
            },
            update: {
              quantity: { decrement: item.quantity },
            },
          }),
        );
      }

      // 3. Create accounts receivable
      operations.push(
        prisma.accountsReceivable.create({
          data: {
            salesOrderId: id,
            amount: order.totalValue,
          },
        }),
      );

      await prisma.$transaction(operations);

      const updated = await prisma.salesOrder.findUnique({
        where: { id },
        include: {
          customer: { select: { name: true } },
          items: {
            include: { product: { select: { name: true, sku: true } } },
          },
        },
      });

      return NextResponse.json(updated);
    }

    // Simple status update (APROVADA or CANCELADA)
    const updated = await prisma.salesOrder.update({
      where: { id },
      data: { status },
      include: {
        customer: { select: { name: true } },
        items: {
          include: { product: { select: { name: true, sku: true } } },
        },
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating sales order:", error);
    return NextResponse.json(
      { error: "Erro ao atualizar pedido" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth();
    if (session?.user?.role === "VISUALIZADOR") {
      return NextResponse.json(
        {
          error:
            "Acesso negado: Visualizadores não podem excluir pedidos de venda.",
        },
        { status: 403 },
      );
    }
    const { id } = await params;
    const order = await prisma.salesOrder.findUnique({
      where: { id },
      select: { status: true },
    });

    if (!order) {
      return NextResponse.json(
        { error: "Pedido não encontrado" },
        { status: 404 },
      );
    }

    if (order.status !== "PENDENTE") {
      return NextResponse.json(
        { error: "Apenas pedidos pendentes podem ser excluídos" },
        { status: 400 },
      );
    }

    // Soft delete to preserve data integrity
    await prisma.salesOrder.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting sales order:", error);
    return NextResponse.json(
      { error: "Erro ao excluir pedido" },
      { status: 500 },
    );
  }
}
