import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    let settings = await prisma.systemSettings.findFirst();

    // Singleton pattern: se não existe, cria o default
    if (!settings) {
      settings = await prisma.systemSettings.create({
        data: {
          companyName: "InvenPro",
          defaultCurrency: "BRL",
          timezone: "America/Sao_Paulo",
        },
      });
    }

    return NextResponse.json(settings);
  } catch (error) {
    console.error("Error fetching system settings:", error);
    return NextResponse.json(
      { error: "Erro ao buscar configurações" },
      { status: 500 },
    );
  }
}

export async function PUT(request: Request) {
  try {
    const session = await auth();
    if (session?.user?.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Acesso negado: Apenas ADMIN pode alterar as configurações." },
        { status: 403 },
      );
    }

    const body = await request.json();
    const { id, companyName, cnpj, logoUrl, defaultCurrency, timezone } = body;

    if (!id) {
      return NextResponse.json({ error: "ID é obrigatório" }, { status: 400 });
    }

    const settings = await prisma.systemSettings.update({
      where: { id },
      data: {
        companyName,
        cnpj,
        logoUrl,
        defaultCurrency,
        timezone,
      },
    });

    return NextResponse.json(settings);
  } catch (error) {
    console.error("Error updating system settings:", error);
    return NextResponse.json(
      { error: "Erro ao atualizar configurações" },
      { status: 500 },
    );
  }
}
