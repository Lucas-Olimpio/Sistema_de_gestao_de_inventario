"use client";

import PeriodFilter from "./components/dashboard/period-filter";
import KPISection from "./components/dashboard/kpi-section";
import ChartsSection from "./components/dashboard/charts-section";
import LowStockList from "./components/dashboard/low-stock-list";
import RecentMovements from "./components/dashboard/recent-movements";
import AnimSection from "./components/anim-section";
import { DashboardData } from "@/lib/types";
import { useDashboardFilters } from "@/app/hooks/use-dashboard-filters";
import { formatDayMonth } from "@/lib/utils";

interface DashboardClientProps {
  data: DashboardData;
}

export default function DashboardClient({ data }: DashboardClientProps) {
  const {
    period,
    customFrom,
    customTo,
    setPeriod,
    setCustomFrom,
    setCustomTo,
  } = useDashboardFilters();

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "24px",
      }}
    >
      {/* Period Filter */}
      <AnimSection delay={0}>
        <PeriodFilter
          period={period}
          setPeriod={setPeriod}
          customFrom={customFrom}
          setCustomFrom={setCustomFrom}
          customTo={customTo}
          setCustomTo={setCustomTo}
        />
      </AnimSection>

      {/* KPI Cards & Financial Overview */}
      <KPISection data={data} />

      {/* Charts (Timeline + Finance + Categories + Orders) */}
      <ChartsSection data={data} formatShortDate={formatDayMonth} />

      {/* Lists (Low Stock + Recent Movements) */}
      <AnimSection delay={480}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "16px",
          }}
        >
          <LowStockList items={data.lowStock} />
          <RecentMovements movements={data.recentMovements} />
        </div>
      </AnimSection>
    </div>
  );
}
