import { prisma } from "@/lib/prisma";
import { DashboardData } from "@/lib/types";
import { Prisma } from "@prisma/client";

export async function getDashboardData(
  from?: string,
  to?: string,
): Promise<DashboardData> {
  const dateFilter =
    from && to
      ? {
          createdAt: {
            gte: new Date(from),
            lte: new Date(to + "T23:59:59.999Z"),
          },
        }
      : undefined;

  const totalProducts = await prisma.product.count();

  // Raw SQL: Prisma aggregate doesn't support multiplication (price * quantity)
  const result = await prisma.$queryRaw<
    Array<{ totalVal: unknown; totalQty: unknown }>
  >`
    SELECT SUM(price * quantity) as totalVal, SUM(quantity) as totalQty FROM "Product"
  `;

  const totalValue = Number(result[0]?.totalVal || 0);
  const totalQuantity = Number(result[0]?.totalQty || 0);

  const lowStockRaw = await prisma.$queryRaw<
    Array<{
      id: string;
      name: string;
      sku: string;
      quantity: unknown;
      minStock: unknown;
      categoryName: string | null;
    }>
  >`
    SELECT p.id, p.name, p.sku, p.quantity, p."minStock", c.name as categoryName
    FROM "Product" p
    LEFT JOIN "Category" c ON p."categoryId" = c.id
    WHERE p.quantity <= p."minStock" AND p."deletedAt" IS NULL
    ORDER BY p.quantity ASC
  `;

  const lowStock = lowStockRaw.map((l) => ({
    id: l.id,
    name: l.name,
    sku: l.sku,
    quantity: Number(l.quantity),
    minStock: Number(l.minStock || 0),
    category: { name: l.categoryName || "Sem categoria" },
  }));

  const totalCategories = await prisma.category.count();

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

  let dateCondition = Prisma.sql`WHERE 1=1`;
  if (from && to) {
    const start = new Date(from);
    const end = new Date(to);
    end.setUTCHours(23, 59, 59, 999);

    const startDate = start.toISOString();
    const endDate = end.toISOString();
    dateCondition = Prisma.sql`WHERE "createdAt" >= ${startDate}::timestamptz AND "createdAt" <= ${endDate}::timestamptz`;
  }

  const movementsByDayRaw = await prisma.$queryRaw<
    Array<{ date: string; inQty: number; outQty: number }>
  >`
    SELECT 
      TO_CHAR("createdAt"::date, 'YYYY-MM-DD') as date,
      CAST(SUM(CASE WHEN type = 'IN' THEN quantity ELSE 0 END) AS INTEGER) as "inQty",
      CAST(SUM(CASE WHEN type = 'OUT' THEN quantity ELSE 0 END) AS INTEGER) as "outQty"
    FROM "StockMovement"
    ${dateCondition}
    GROUP BY "createdAt"::date
    ORDER BY "createdAt"::date ASC
  `;

  const movementTimeline = movementsByDayRaw.map((m) => ({
    date: m.date,
    in: m.inQty ?? 0,
    out: m.outQty ?? 0,
  }));

  const categoryDistributionRaw = await prisma.$queryRaw<
    Array<{ name: string; productsCount: number; totalValue: number }>
  >`
    SELECT 
      c.name, 
      CAST(COUNT(p.id) AS INTEGER) as "productsCount", 
      CAST(COALESCE(SUM(p.quantity * p.price), 0) AS NUMERIC) as "totalValue"
    FROM "Category" c
    LEFT JOIN "Product" p ON c.id = p."categoryId" AND p."deletedAt" IS NULL
    WHERE c."deletedAt" IS NULL
    GROUP BY c.id, c.name
  `;

  const categories = categoryDistributionRaw.map((cat) => ({
    name: cat.name,
    products: cat.productsCount ?? 0,
    value: Number(cat.totalValue ?? 0),
  }));

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
