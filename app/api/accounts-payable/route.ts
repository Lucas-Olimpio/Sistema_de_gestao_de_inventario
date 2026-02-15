import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const payables = await prisma.accountsPayable.findMany({
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
