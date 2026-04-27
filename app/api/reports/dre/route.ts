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
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");

    const dateFilter: any = {};
    if (dateFrom) dateFilter.gte = new Date(dateFrom);
    if (dateTo) dateFilter.lte = new Date(dateTo + "T23:59:59.999Z");

    const salesWhere = dateFrom || dateTo ? { createdAt: dateFilter, status: "FATURADA" } : { status: "FATURADA" };
    const purchaseWhere = dateFrom || dateTo ? { createdAt: dateFilter, status: "RECEBIDA" } : { status: "RECEBIDA" };

    // 1. Receita Bruta de Vendas
    const sales = await prisma.salesOrder.aggregate({
      where: salesWhere,
      _sum: { totalValue: true, discountAmount: true, freightAmount: true }
    });
    const receitaLiquida = Number(sales._sum.totalValue || 0);
    const descontosVendas = Number(sales._sum.discountAmount || 0);
    const freteVendas = Number(sales._sum.freightAmount || 0);
    // Receita bruta = totalValue + descontos - frete (reconstituindo o valor original dos itens)
    const receitaBruta = receitaLiquida + descontosVendas - freteVendas;

    // 2. Custo das Mercadorias (CPV) via Ordens de Compra Recebidas
    const purchases = await prisma.purchaseOrder.aggregate({
      where: purchaseWhere,
      _sum: { totalValue: true, discountAmount: true, freightAmount: true }
    });
    const custoProdutos = Number(purchases._sum.totalValue || 0);
    const descontosCompras = Number(purchases._sum.discountAmount || 0);
    const freteCompras = Number(purchases._sum.freightAmount || 0);

    // Lucro Bruto Operacional
    const lucroBruto = receitaLiquida - custoProdutos;

    // 3. Despesas (Transações bancárias de Débito que não estão atreladas a compras de estoque)
    const transactions = await prisma.transaction.aggregate({
      where: {
        type: "DEBIT",
        description: { not: { startsWith: "Pagamento PO-" } }, // Filtrando as que já vieram das Compras
        ...(dateFrom || dateTo ? { createdAt: dateFilter } : {})
      },
      _sum: { amount: true }
    });
    const despesas = Number(transactions._sum.amount || 0);

    // Lucro Líquido
    const lucroLiquido = lucroBruto - despesas;

    const dre = {
      receitaBruta,
      descontosVendas,
      freteVendas,
      receitaLiquida,
      custoProdutos,
      descontosCompras,
      freteCompras,
      lucroBruto,
      despesas,
      lucroLiquido,
      margemLucro: receitaBruta > 0 ? (lucroLiquido / receitaBruta) * 100 : 0
    };

    return NextResponse.json(dre);
  } catch (error) {
    console.error("Error generating DRE:", error);
    return NextResponse.json(
      { error: "Erro ao compilar DRE" },
      { status: 500 },
    );
  }
}
