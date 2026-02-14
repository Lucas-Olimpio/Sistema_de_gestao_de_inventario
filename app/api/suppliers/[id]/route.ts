import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, cnpj, email, phone } = body;

    const supplier = await prisma.supplier.update({
      where: { id },
      data: {
        name,
        cnpj: cnpj || null,
        email: email || null,
        phone: phone || null,
      },
    });

    return NextResponse.json(supplier);
  } catch (error) {
    console.error("Error updating supplier:", error);
    return NextResponse.json(
      { error: "Erro ao atualizar fornecedor" },
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

    const hasOrders = await prisma.purchaseOrder.count({
      where: { supplierId: id },
    });
    if (hasOrders > 0) {
      return NextResponse.json(
        { error: "Fornecedor possui ordens de compra e não pode ser excluído" },
        { status: 400 },
      );
    }

    // Soft delete
    await prisma.supplier.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting supplier:", error);
    return NextResponse.json(
      { error: "Erro ao excluir fornecedor" },
      { status: 500 },
    );
  }
}
