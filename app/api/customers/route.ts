import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";

    const customers = await prisma.customer.findMany({
      where: {
        AND: [
          search
            ? {
                OR: [
                  { name: { contains: search } },
                  { cpfCnpj: { contains: search } },
                  { email: { contains: search } },
                ],
              }
            : {},
          { deletedAt: null },
        ],
      },
      include: { _count: { select: { salesOrders: true } } },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(customers);
  } catch (error) {
    console.error("Error fetching customers:", error);
    return NextResponse.json(
      { error: "Erro ao buscar clientes" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, cpfCnpj, email, phone, address } = body;

    if (!name) {
      return NextResponse.json(
        { error: "Nome é obrigatório" },
        { status: 400 },
      );
    }

    const customer = await prisma.customer.create({
      data: {
        name,
        cpfCnpj: cpfCnpj || null,
        email: email || null,
        phone: phone || null,
        address: address || null,
      },
    });

    return NextResponse.json(customer, { status: 201 });
  } catch (error: unknown) {
    const prismaError = error as { code?: string };
    if (prismaError.code === "P2002") {
      return NextResponse.json(
        { error: "CPF/CNPJ já cadastrado" },
        { status: 409 },
      );
    }
    console.error("Error creating customer:", error);
    return NextResponse.json(
      { error: "Erro ao criar cliente" },
      { status: 500 },
    );
  }
}
