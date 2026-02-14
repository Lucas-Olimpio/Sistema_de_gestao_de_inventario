import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const suppliers = await prisma.supplier.findMany({
      orderBy: { name: "asc" },
      include: { _count: { select: { purchaseOrders: true } } },
    });
    return NextResponse.json(suppliers);
  } catch (error) {
    console.error("Error fetching suppliers:", error);
    return NextResponse.json(
      { error: "Erro ao buscar fornecedores" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, cnpj, email, phone } = body;

    if (!name) {
      return NextResponse.json(
        { error: "Nome é obrigatório" },
        { status: 400 },
      );
    }

    const supplier = await prisma.supplier.create({
      data: {
        name,
        cnpj: cnpj || null,
        email: email || null,
        phone: phone || null,
      },
    });

    return NextResponse.json(supplier, { status: 201 });
  } catch (error) {
    console.error("Error creating supplier:", error);
    const e = error as { code?: string };
    if (e.code === "P2002") {
      return NextResponse.json(
        { error: "Fornecedor com esse nome ou CNPJ já existe" },
        { status: 409 },
      );
    }
    return NextResponse.json(
      { error: "Erro ao criar fornecedor" },
      { status: 500 },
    );
  }
}
