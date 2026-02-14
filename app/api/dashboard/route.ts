import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    // Date range filter
    const dateFilter =
      from && to
        ? {
            createdAt: {
              gte: new Date(from),
              lte: new Date(to + "T23:59:59.999Z"),
            },
          }
        : undefined;

    // Total products (snapshot - not filtered by date)
    const totalProducts = await prisma.product.count();

    // Total stock value (snapshot)
    const products = await prisma.product.findMany({
      select: { price: true, quantity: true },
    });
    const totalValue = products.reduce(
      (sum, p) => sum + p.price * p.quantity,
      0,
    );
    const totalQuantity = products.reduce((sum, p) => sum + p.quantity, 0);

    // Low stock items (snapshot)
    const allProducts = await prisma.product.findMany({
      include: { category: true },
      orderBy: { quantity: "asc" },
    });
    const lowStock = allProducts.filter((p) => p.quantity <= p.minStock);

    // Total categories (snapshot)
    const totalCategories = await prisma.category.count();

    // Recent movements (filtered by period)
    const recentMovements = await prisma.stockMovement.findMany({
      where: dateFilter,
      include: { product: { select: { name: true, sku: true } } },
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    // Movement stats (filtered by period)
    const periodMovements = await prisma.stockMovement.findMany({
      where: dateFilter,
      select: { type: true, quantity: true, createdAt: true },
    });

    const totalIn = periodMovements
      .filter((m) => m.type === "IN")
      .reduce((sum, m) => sum + m.quantity, 0);

    const totalOut = periodMovements
      .filter((m) => m.type === "OUT")
      .reduce((sum, m) => sum + m.quantity, 0);

    // Movements grouped by day (for bar chart)
    const movementsByDay: Record<
      string,
      { date: string; in: number; out: number }
    > = {};
    for (const m of periodMovements) {
      const day = new Date(m.createdAt).toISOString().split("T")[0];
      if (!movementsByDay[day]) {
        movementsByDay[day] = { date: day, in: 0, out: 0 };
      }
      if (m.type === "IN") {
        movementsByDay[day].in += m.quantity;
      } else {
        movementsByDay[day].out += m.quantity;
      }
    }
    const movementTimeline = Object.values(movementsByDay).sort((a, b) =>
      a.date.localeCompare(b.date),
    );

    // Category distribution (snapshot)
    const categoryDistribution = await prisma.category.findMany({
      include: {
        _count: { select: { products: true } },
        products: { select: { price: true, quantity: true } },
      },
    });

    const categories = categoryDistribution.map((cat) => ({
      name: cat.name,
      products: cat._count.products,
      value: cat.products.reduce((sum, p) => sum + p.price * p.quantity, 0),
    }));

    // Financial KPIs (filtered by period)
    const payables = await prisma.accountsPayable.findMany({
      where: dateFilter,
      select: { amount: true, status: true },
    });
    const totalPayable = payables.reduce((sum, p) => sum + p.amount, 0);
    const totalPaid = payables
      .filter((p) => p.status === "PAGO")
      .reduce((sum, p) => sum + p.amount, 0);

    const receivables = await prisma.accountsReceivable.findMany({
      where: dateFilter,
      select: { amount: true, status: true },
    });
    const totalReceivable = receivables.reduce((sum, r) => sum + r.amount, 0);
    const totalReceived = receivables
      .filter((r) => r.status === "RECEBIDO")
      .reduce((sum, r) => sum + r.amount, 0);

    // Orders by status (filtered by period)
    const purchaseOrders = await prisma.purchaseOrder.findMany({
      where: dateFilter,
      select: { status: true },
    });

    const purchaseOrdersByStatus: Record<string, number> = {};
    for (const po of purchaseOrders) {
      purchaseOrdersByStatus[po.status] =
        (purchaseOrdersByStatus[po.status] || 0) + 1;
    }

    const salesOrders = await prisma.salesOrder.findMany({
      where: dateFilter,
      select: { status: true },
    });

    const salesOrdersByStatus: Record<string, number> = {};
    for (const so of salesOrders) {
      salesOrdersByStatus[so.status] =
        (salesOrdersByStatus[so.status] || 0) + 1;
    }

    return NextResponse.json({
      totalProducts,
      totalValue,
      totalQuantity,
      totalCategories,
      lowStock,
      lowStockCount: lowStock.length,
      recentMovements,
      totalIn,
      totalOut,
      categories,
      movementTimeline,
      financials: {
        totalPayable,
        totalPaid,
        totalReceivable,
        totalReceived,
        balance: totalReceived - totalPaid,
      },
      purchaseOrdersByStatus,
      salesOrdersByStatus,
    });
  } catch (error) {
    console.error("Error fetching dashboard:", error);
    return NextResponse.json(
      { error: "Erro ao buscar dados do dashboard" },
      { status: 500 },
    );
  }
}
