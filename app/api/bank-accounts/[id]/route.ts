import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth();
    if (session?.user?.role === "VISUALIZADOR") {
      return NextResponse.json(
        { error: "Acesso negado: Visualizadores não podem editar contas." },
        { status: 403 },
      );
    }

    const { id } = await params;
    const body = await request.json();
    const { name, bankName, accountNumber } = body;

    if (!name || name.trim().length === 0) {
      return NextResponse.json(
        { error: "Nome da conta é obrigatório" },
        { status: 400 },
      );
    }

    const account = await prisma.bankAccount.update({
      where: { id },
      data: {
        name: name.trim(),
        bankName: bankName?.trim() || null,
        accountNumber: accountNumber?.trim() || null,
      },
    });

    return NextResponse.json({
      ...account,
      currentBalance: Number(account.currentBalance),
    });
  } catch (error) {
    console.error("Error updating bank account:", error);
    return NextResponse.json(
      { error: "Erro ao atualizar conta bancária" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth();
    if (session?.user?.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Apenas administradores podem excluir contas bancárias." },
        { status: 403 },
      );
    }

    const { id } = await params;

    // Check if account has transactions
    const account = await prisma.bankAccount.findUnique({
      where: { id },
      include: { _count: { select: { transactions: true } } },
    });

    if (!account) {
      return NextResponse.json(
        { error: "Conta não encontrada" },
        { status: 404 },
      );
    }

    if (account._count.transactions > 0) {
      return NextResponse.json(
        {
          error:
            "Não é possível excluir uma conta com transações. Remova as transações primeiro.",
        },
        { status: 400 },
      );
    }

    await prisma.bankAccount.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting bank account:", error);
    return NextResponse.json(
      { error: "Erro ao excluir conta bancária" },
      { status: 500 },
    );
  }
}
