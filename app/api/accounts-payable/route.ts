import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || "";
    const search = searchParams.get("search") || "";

    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (search) {
      where.purchaseOrder = {
        supplier: { name: { contains: search, mode: "insensitive" } },
      };
    }

    const payables = await prisma.accountsPayable.findMany({
      where,
      include: {
        purchaseOrder: {
          select: {
            code: true,
            supplier: { select: { name: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
    const safePayables = payables.map((p) => ({
      ...p,
      amount: Number(p.amount),
    }));
    return NextResponse.json(safePayables);
  } catch (error) {
    console.error("Error fetching accounts payable:", error);
    return NextResponse.json(
      { error: "Erro ao buscar contas a pagar" },
      { status: 500 },
    );
  }
}


export async function PUT(request: Request) {
  try {
    const session = await auth();
    if (session?.user?.role === "VISUALIZADOR") {
      return NextResponse.json(
        {
          error:
            "Acesso negado: Visualizadores não podem alterar estados de contas.",
        },
        { status: 403 },
      );
    }
    const body = await request.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json({ error: "ID é obrigatório" }, { status: 400 });
    }

    const payable = await prisma.accountsPayable.update({
      where: { id },
      data: {
        status: "PAGO",
        paidAt: new Date(),
      },
    });

    return NextResponse.json(payable);
  } catch (error) {
    console.error("Error updating accounts payable:", error);
    return NextResponse.json(
      { error: "Erro ao atualizar conta a pagar" },
      { status: 500 },
    );
  }
}
