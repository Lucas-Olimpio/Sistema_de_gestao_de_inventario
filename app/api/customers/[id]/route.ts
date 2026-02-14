import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, cpfCnpj, email, phone, address } = body;

    const customer = await prisma.customer.update({
      where: { id },
      data: {
        name,
        cpfCnpj: cpfCnpj || null,
        email: email || null,
        phone: phone || null,
        address: address || null,
      },
    });

    return NextResponse.json(customer);
  } catch (error: unknown) {
    const prismaError = error as { code?: string };
    if (prismaError.code === "P2002") {
      return NextResponse.json(
        { error: "CPF/CNPJ já cadastrado" },
        { status: 409 },
      );
    }
    console.error("Error updating customer:", error);
    return NextResponse.json(
      { error: "Erro ao atualizar cliente" },
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

    const ordersCount = await prisma.salesOrder.count({
      where: { customerId: id },
    });

    if (ordersCount > 0) {
      return NextResponse.json(
        {
          error: `Não é possível excluir: cliente possui ${ordersCount} pedido(s) vinculado(s)`,
        },
        { status: 400 },
      );
    }

    // Soft delete
    await prisma.customer.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting customer:", error);
    return NextResponse.json(
      { error: "Erro ao excluir cliente" },
      { status: 500 },
    );
  }
}
