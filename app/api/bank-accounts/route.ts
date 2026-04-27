import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const accounts = await prisma.bankAccount.findMany({
      include: {
        _count: { select: { transactions: true } },
      },
      orderBy: { name: "asc" },
    });

    const safeAccounts = accounts.map((a) => ({
      ...a,
      currentBalance: Number(a.currentBalance),
    }));

    return NextResponse.json(safeAccounts);
  } catch (error) {
    console.error("Error fetching bank accounts:", error);
    return NextResponse.json(
      { error: "Erro ao buscar contas bancárias" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (session?.user?.role === "VISUALIZADOR") {
      return NextResponse.json(
        { error: "Acesso negado: Visualizadores não podem criar contas." },
        { status: 403 },
      );
    }

    const body = await request.json();
    const { name, bankName, accountNumber } = body;

    if (!name || name.trim().length === 0) {
      return NextResponse.json(
        { error: "Nome da conta é obrigatório" },
        { status: 400 },
      );
    }

    const account = await prisma.bankAccount.create({
      data: {
        name: name.trim(),
        bankName: bankName?.trim() || null,
        accountNumber: accountNumber?.trim() || null,
        currentBalance: 0,
      },
    });

    return NextResponse.json(
      { ...account, currentBalance: Number(account.currentBalance) },
      { status: 201 },
    );
  } catch (error) {
    console.error("Error creating bank account:", error);
    return NextResponse.json(
      { error: "Erro ao criar conta bancária" },
      { status: 500 },
    );
  }
}
