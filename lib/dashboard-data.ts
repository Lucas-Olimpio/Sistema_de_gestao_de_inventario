import { prisma } from "@/lib/prisma";
import { DashboardData } from "@/lib/types";
import { Prisma } from "@prisma/client";

/** Returns % change rounded to 1dp, or null if there is no previous data */
function calcTrend(current: number, previous: number): number | null {
  if (previous === 0) return null;
  return Math.round(((current - previous) / previous) * 100);
}

/** Given a current [from, to] window, returns the same-duration window just before it */
function previousPeriod(
  from: string,
  to: string,
): { prevFrom: string; prevTo: string } {
  const start = new Date(from);
  const end = new Date(to);
  const durationMs = end.getTime() - start.getTime() + 86_400_000; // inclusive
  const prevTo = new Date(start.getTime() - 1);
  const prevFrom = new Date(prevTo.getTime() - durationMs + 1);
  return {
    prevFrom: prevFrom.toISOString().split("T")[0],
    prevTo: prevTo.toISOString().split("T")[0],
  };
}

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

  // ─── Previous-period comparison (for KPI trend arrows) ──────────────────────
  let kpiTrends: DashboardData["kpiTrends"] = {
    movements: null,
    purchases: null,
    sales: null,
    balance: null,
  };
  let financialSparkline: DashboardData["financialSparkline"] = [];

  if (from && to) {
    const { prevFrom, prevTo } = previousPeriod(from, to);
    const prevDateFilter = {
      createdAt: {
        gte: new Date(prevFrom),
        lte: new Date(prevTo + "T23:59:59.999Z"),
      },
    };

    const [prevIn, prevOut, prevPayables, prevReceivables] = await Promise.all([
      prisma.stockMovement.aggregate({
        where: { ...prevDateFilter, type: "IN" },
        _sum: { quantity: true },
      }),
      prisma.stockMovement.aggregate({
        where: { ...prevDateFilter, type: "OUT" },
        _sum: { quantity: true },
      }),
      prisma.accountsPayable.groupBy({
        by: ["status"],
        where: prevDateFilter,
        _sum: { amount: true },
      }),
      prisma.accountsReceivable.groupBy({
        by: ["status"],
        where: prevDateFilter,
        _sum: { amount: true },
      }),
    ]);

    const prevTotalMov =
      (prevIn._sum.quantity ?? 0) + (prevOut._sum.quantity ?? 0);
    const prevTotalPayable = prevPayables.reduce(
      (a, c) => a + Number(c._sum.amount ?? 0),
      0,
    );
    const prevTotalReceivable = prevReceivables.reduce(
      (a, c) => a + Number(c._sum.amount ?? 0),
      0,
    );
    const prevTotalPaid = prevPayables
      .filter((p) => p.status === "PAGO")
      .reduce((a, c) => a + Number(c._sum.amount ?? 0), 0);
    const prevTotalReceived = prevReceivables
      .filter((r) => r.status === "RECEBIDO")
      .reduce((a, c) => a + Number(c._sum.amount ?? 0), 0);
    const prevBalance = prevTotalReceived - prevTotalPaid;

    kpiTrends = {
      movements: calcTrend(totalIn + totalOut, prevTotalMov),
      purchases: calcTrend(totalPayable, prevTotalPayable),
      sales: calcTrend(totalReceivable, prevTotalReceivable),
      balance: calcTrend(
        totalReceived - totalPaid,
        prevBalance,
      ),
    };

    // ── Financial sparkline: payables + receivables per-day ──────────────────
    let spkCondition = Prisma.sql`WHERE 1=1`;
    const spkStart = new Date(from);
    const spkEnd = new Date(to);
    spkEnd.setUTCHours(23, 59, 59, 999);
    spkCondition = Prisma.sql`WHERE "createdAt" >= ${spkStart.toISOString()}::timestamptz AND "createdAt" <= ${spkEnd.toISOString()}::timestamptz`;

    const [paySparkRaw, recSparkRaw] = await Promise.all([
      prisma.$queryRaw<Array<{ date: string; total: number }>>`
        SELECT TO_CHAR("createdAt"::date, 'YYYY-MM-DD') as date,
               CAST(COALESCE(SUM(amount), 0) AS NUMERIC) as total
        FROM "AccountsPayable"
        ${spkCondition}
        GROUP BY "createdAt"::date
        ORDER BY "createdAt"::date ASC
      `,
      prisma.$queryRaw<Array<{ date: string; total: number }>>`
        SELECT TO_CHAR("createdAt"::date, 'YYYY-MM-DD') as date,
               CAST(COALESCE(SUM(amount), 0) AS NUMERIC) as total
        FROM "AccountsReceivable"
        ${spkCondition}
        GROUP BY "createdAt"::date
        ORDER BY "createdAt"::date ASC
      `,
    ]);

    // Merge into unified date array
    const spkMap = new Map<string, { purchases: number; sales: number }>();
    paySparkRaw.forEach((r) => {
      const e = spkMap.get(r.date) ?? { purchases: 0, sales: 0 };
      e.purchases = Number(r.total);
      spkMap.set(r.date, e);
    });
    recSparkRaw.forEach((r) => {
      const e = spkMap.get(r.date) ?? { purchases: 0, sales: 0 };
      e.sales = Number(r.total);
      spkMap.set(r.date, e);
    });
    financialSparkline = Array.from(spkMap.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, v]) => ({ date, ...v }));
  }

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
    purchaseOrdersByStatus,
    salesOrdersByStatus,
    kpiTrends,
    financialSparkline,
  };
}

