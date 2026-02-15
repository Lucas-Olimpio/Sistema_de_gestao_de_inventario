import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const receivables = await prisma.accountsReceivable.findMany({
      include: {
        salesOrder: {
          select: {
            code: true,
            customer: { select: { name: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
    const safeReceivables = receivables.map((r) => ({
      ...r,
      amount: Number(r.amount),
    }));
    return NextResponse.json(safeReceivables);
  } catch (error) {
    console.error("Error fetching accounts receivable:", error);
    return NextResponse.json(
      { error: "Erro ao buscar contas a receber" },
      { status: 500 },
    );
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json({ error: "ID é obrigatório" }, { status: 400 });
    }

    const receivable = await prisma.accountsReceivable.update({
      where: { id },
      data: {
        status: "RECEBIDO",
        receivedAt: new Date(),
      },
    });

    return NextResponse.json(receivable);
  } catch (error) {
    console.error("Error updating accounts receivable:", error);
    return NextResponse.json(
      { error: "Erro ao atualizar conta a receber" },
      { status: 500 },
    );
  }
}
