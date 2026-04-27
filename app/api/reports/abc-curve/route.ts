import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    // Curva ABC de Produtos: Calcular Faturamento por Produto (Vendas FATURADAS)
    const sales = await prisma.salesOrderItem.findMany({
      where: {
        salesOrder: { status: "FATURADA" }
      },
      select: {
        productId: true,
        quantity: true,
        unitPrice: true,
        product: { select: { name: true, sku: true } }
      }
    });

    const productsMap = new Map<string, { id: string, name: string, sku: string, qty: number, revenue: number }>();

    for (const item of sales) {
      const pId = item.productId;
      if (!productsMap.has(pId)) {
        productsMap.set(pId, { id: pId, name: item.product.name, sku: item.product.sku, qty: 0, revenue: 0 });
      }
      const val = productsMap.get(pId)!;
      val.qty += item.quantity;
      val.revenue += (item.quantity * Number(item.unitPrice));
    }

    // Ordenar do maior faturamento para o menor
    const sorted = Array.from(productsMap.values()).sort((a, b) => b.revenue - a.revenue);

    // Calcular percentuais (ABC)
    const totalRevenue = sorted.reduce((sum, p) => sum + p.revenue, 0);
    let accum = 0;
    
    const abcCurve = sorted.map(p => {
      accum += p.revenue;
      const accPercent = (accum / totalRevenue) * 100;
      let classification = "C";
      if (accPercent <= 80) classification = "A";
      else if (accPercent <= 95) classification = "B";

      return {
        ...p,
        classification,
        percentual: ((p.revenue / totalRevenue) * 100).toFixed(2),
        accumPercentual: accPercent.toFixed(2)
      };
    });

    return NextResponse.json({ data: abcCurve, totalRevenue });
  } catch (error) {
    console.error("Error generating ABC Curve:", error);
    return NextResponse.json(
      { error: "Erro ao gerar curva ABC" },
      { status: 500 },
    );
  }
}
