"use client";

import { useEffect, useState } from "react";
import DashboardSkeleton from "./components/dashboard-skeleton";
import PeriodFilter from "./components/dashboard/period-filter";
import KPISection from "./components/dashboard/kpi-section";
import ChartsSection from "./components/dashboard/charts-section";
import LowStockList from "./components/dashboard/low-stock-list";
import RecentMovements from "./components/dashboard/recent-movements";
import AnimSection from "./components/anim-section";
import { DashboardData, PeriodKey } from "@/lib/types";

function getDateRange(period: PeriodKey): { from: string; to: string } {
  const today = new Date();
  const to = today.toISOString().split("T")[0];

  switch (period) {
    case "today":
      return { from: to, to };
    case "7d": {
      const d = new Date();
      d.setDate(d.getDate() - 7);
      return { from: d.toISOString().split("T")[0], to };
    }
    case "30d": {
      const d = new Date();
      d.setDate(d.getDate() - 30);
      return { from: d.toISOString().split("T")[0], to };
    }
    case "12m": {
      const d = new Date();
      d.setFullYear(d.getFullYear() - 1);
      return { from: d.toISOString().split("T")[0], to };
    }
    default:
      return { from: to, to };
  }
}

function formatShortDate(dateStr: string) {
  const [, m, d] = dateStr.split("-");
  return `${d}/${m}`;
}

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<PeriodKey>("30d");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");

  useEffect(() => {
    setLoading(true);

    let from: string;
    let to: string;

    if (period === "custom") {
      if (!customFrom || !customTo) {
        setLoading(false);
        return;
      }
      from = customFrom;
      to = customTo;
    } else {
      const range = getDateRange(period);
      from = range.from;
      to = range.to;
    }

    fetch(`/api/dashboard?from=${from}&to=${to}`)
      .then((res) => res.json())
      .then((d) => {
        setData(d);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [period, customFrom, customTo]);

  if (loading && !data) {
    return <DashboardSkeleton />;
  }

  if (!data) return null;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "24px",
        opacity: loading ? 0.5 : 1,
        transition: "opacity 0.3s ease",
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
      <ChartsSection data={data} formatShortDate={formatShortDate} />

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
