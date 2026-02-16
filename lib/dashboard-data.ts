import { prisma } from "@/lib/prisma";
import { DashboardData } from "@/lib/types";

export async function getDashboardData(
  from?: string,
  to?: string,
): Promise<DashboardData> {
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

  // Total stock value & quantity (snapshot) - Optimized with raw query
  // We use queryRaw because Prisma aggregate doesn't support multiplication (price * quantity)
  const result = await prisma.$queryRaw<
    Array<{ totalVal: unknown; totalQty: unknown }>
  >`
    SELECT SUM(price * quantity) as totalVal, SUM(quantity) as totalQty FROM Product
  `;

  const totalValue = Number(result[0]?.totalVal || 0);
  const totalQuantity = Number(result[0]?.totalQty || 0);

  // Low stock items (snapshot)
  const allProducts = await prisma.product.findMany({
    select: {
      id: true,
      name: true,
      sku: true,
      quantity: true,
      minStock: true,
      category: { select: { name: true } },
    },
    orderBy: { quantity: "asc" },
  });
  const lowStock = allProducts.filter((p) => p.quantity <= (p.minStock || 0));

  // Total categories (snapshot)
  const totalCategories = await prisma.category.count();

  // Recent movements (filtered by period)
  const recentMovementsRaw = await prisma.stockMovement.findMany({
    where: dateFilter,
    include: { product: { select: { name: true, sku: true } } },
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  const recentMovements = recentMovementsRaw.map((m) => ({
    id: m.id,
    type: m.type,
    quantity: m.quantity,
    reason: m.reason || "",
    createdAt: m.createdAt.toISOString(),
    product: m.product,
  }));

  // Movement stats (filtered by period)
  const movementsInData = await prisma.stockMovement.aggregate({
    where: { ...dateFilter, type: "IN" },
    _sum: { quantity: true },
  });
  const totalIn = movementsInData._sum.quantity || 0;

  const movementsOutData = await prisma.stockMovement.aggregate({
    where: { ...dateFilter, type: "OUT" },
    _sum: { quantity: true },
  });
  const totalOut = movementsOutData._sum.quantity || 0;

  // Movements for chart (still need to fetch to group by day in JS)
  const periodMovements = await prisma.stockMovement.findMany({
    where: dateFilter,
    select: { type: true, quantity: true, createdAt: true },
    orderBy: { createdAt: "asc" },
  });

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
    value: cat.products.reduce(
      (sum, p) => sum + Number(p.price) * p.quantity,
      0,
    ),
  }));

  // Financial KPIs (filtered by period)
  const payablesGrouped = await prisma.accountsPayable.groupBy({
    by: ["status"],
    where: dateFilter,
    _sum: { amount: true },
  });

  const totalPayable = payablesGrouped.reduce(
    (acc, curr) => acc + Number(curr._sum.amount || 0),
    0,
  );
  const totalPaid = payablesGrouped
    .filter((p) => p.status === "PAGO")
    .reduce((acc, curr) => acc + Number(curr._sum.amount || 0), 0);

  const receivablesGrouped = await prisma.accountsReceivable.groupBy({
    by: ["status"],
    where: dateFilter,
    _sum: { amount: true },
  });

  const totalReceivable = receivablesGrouped.reduce(
    (acc, curr) => acc + Number(curr._sum.amount || 0),
    0,
  );
  const totalReceived = receivablesGrouped
    .filter((r) => r.status === "RECEBIDO")
    .reduce((acc, curr) => acc + Number(curr._sum.amount || 0), 0);

  // Orders by status (filtered by period)
  const purchaseOrdersGrouped = await prisma.purchaseOrder.groupBy({
    by: ["status"],
    where: dateFilter,
    _count: { status: true },
  });

  const purchaseOrdersByStatus: Record<string, number> = {};
  purchaseOrdersGrouped.forEach((po) => {
    purchaseOrdersByStatus[po.status] = po._count.status;
  });

  const salesOrdersGrouped = await prisma.salesOrder.groupBy({
    by: ["status"],
    where: dateFilter,
    _count: { status: true },
  });

  const salesOrdersByStatus: Record<string, number> = {};
  salesOrdersGrouped.forEach((so) => {
    salesOrdersByStatus[so.status] = so._count.status;
  });

  return {
    totalProducts,
    totalValue,
    totalQuantity,
    totalCategories,
    lowStock: lowStock.map((l) => ({
      ...l,
      minStock: l.minStock || 0,
      category: { name: l.category?.name || "Sem categoria" },
    })),
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
    purchaseOrdersByStatus: purchaseOrdersByStatus,
    salesOrdersByStatus: salesOrdersByStatus,
  };
}
