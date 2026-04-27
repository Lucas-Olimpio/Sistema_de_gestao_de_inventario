import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const warehouses = await prisma.warehouse.findMany({
      orderBy: { createdAt: "asc" },
      include: {
        _count: { select: { stocks: true } }
      }
    });

    return NextResponse.json(warehouses);
  } catch (error) {
    console.error("Error fetching warehouses:", error);
    return NextResponse.json(
      { error: "Erro ao buscar armazéns" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (session?.user?.role !== "ADMIN" && session?.user?.role !== "OPERADOR") {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    }

    const { name, location } = await request.json();

    if (!name?.trim()) {
      return NextResponse.json({ error: "Nome do armazém é obrigatório" }, { status: 400 });
    }

    const existing = await prisma.warehouse.findUnique({
      where: { name: name.trim() },
    });

    if (existing) {
      return NextResponse.json({ error: "Já existe um armazém com este nome" }, { status: 400 });
    }

    const warehouse = await prisma.warehouse.create({
      data: {
        name: name.trim(),
        location: location?.trim() || null,
        isActive: true,
      },
    });

    // Auditoria
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: "CREATE",
        entity: "Warehouse",
        entityId: warehouse.id,
        newData: JSON.stringify(warehouse),
      }
    });

    return NextResponse.json(warehouse, { status: 201 });
  } catch (error) {
    console.error("Error creating warehouse:", error);
    return NextResponse.json(
      { error: "Erro ao criar armazém" },
      { status: 500 },
    );
  }
}
