import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, description } = body;

    const category = await prisma.category.update({
      where: { id },
      data: { name, description: description || null },
    });

    return NextResponse.json(category);
  } catch (error) {
    console.error("Error updating category:", error);
    return NextResponse.json(
      { error: "Erro ao atualizar categoria" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    const productsCount = await prisma.product.count({
      where: { categoryId: id },
    });
    if (productsCount > 0) {
      return NextResponse.json(
        {
          error: `Não é possível excluir: ${productsCount} produto(s) vinculado(s)`,
        },
        { status: 400 },
      );
    }

    await prisma.category.delete({ where: { id } });
    return NextResponse.json({ message: "Categoria deletada" });
  } catch (error) {
    console.error("Error deleting category:", error);
    return NextResponse.json(
      { error: "Erro ao deletar categoria" },
      { status: 500 },
    );
  }
}
