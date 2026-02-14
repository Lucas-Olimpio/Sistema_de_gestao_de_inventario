import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    const order = await prisma.purchaseOrder.findUnique({
      where: { id },
      include: {
        supplier: true,
        items: {
          include: {
            product: { select: { name: true, sku: true, price: true } },
          },
        },
        goodsReceipts: {
          include: {
            items: {
              include: { product: { select: { name: true, sku: true } } },
            },
          },
        },
        payable: true,
      },
    });

    if (!order) {
      return NextResponse.json(
        { error: "Ordem de compra não encontrada" },
        { status: 404 },
      );
    }

    return NextResponse.json(order);
  } catch (error) {
    console.error("Error fetching purchase order:", error);
    return NextResponse.json(
      { error: "Erro ao buscar ordem de compra" },
      { status: 500 },
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { status } = body;

    const order = await prisma.purchaseOrder.findUnique({
      where: { id },
    });

    if (!order) {
      return NextResponse.json(
        { error: "Ordem de compra não encontrada" },
        { status: 404 },
      );
    }

    // Validate status transitions
    const validTransitions: Record<string, string[]> = {
      PENDENTE: ["APROVADA", "CANCELADA"],
      APROVADA: ["EM_TRANSITO", "CANCELADA"],
      EM_TRANSITO: ["RECEBIDA", "CANCELADA"],
    };

    const allowed = validTransitions[order.status] || [];
    if (!allowed.includes(status)) {
      return NextResponse.json(
        {
          error: `Transição inválida: ${order.status} → ${status}`,
        },
        { status: 400 },
      );
    }

    const updated = await prisma.purchaseOrder.update({
      where: { id },
      data: { status },
      include: {
        supplier: true,
        items: {
          include: { product: { select: { name: true, sku: true } } },
        },
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating purchase order:", error);
    return NextResponse.json(
      { error: "Erro ao atualizar ordem de compra" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    const order = await prisma.purchaseOrder.findUnique({
      where: { id },
    });

    if (!order) {
      return NextResponse.json(
        { error: "Ordem de compra não encontrada" },
        { status: 404 },
      );
    }

    if (order.status !== "PENDENTE") {
      return NextResponse.json(
        { error: "Só é possível excluir ordens com status PENDENTE" },
        { status: 400 },
      );
    }

    await prisma.purchaseOrder.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting purchase order:", error);
    return NextResponse.json(
      { error: "Erro ao excluir ordem de compra" },
      { status: 500 },
    );
  }
}
