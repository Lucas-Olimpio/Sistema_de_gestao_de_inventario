import { useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { PeriodKey } from "@/lib/types";

export function useDashboardFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const period = (searchParams.get("period") as PeriodKey) || "30d";
  const [customFrom, setCustomFrom] = useState(searchParams.get("from") || "");
  const [customTo, setCustomTo] = useState(searchParams.get("to") || "");

  const updateCustomRange = useCallback(
    (from: string, to: string) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("period", "custom");
      if (from) params.set("from", from);
      if (to) params.set("to", to);

      if (from && to) {
        router.push(`?${params.toString()}`);
      }
    },
    [router, searchParams],
  );

  const handlePeriodChange = useCallback(
    (newPeriod: PeriodKey) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("period", newPeriod);

      if (newPeriod !== "custom") {
        params.delete("from");
        params.delete("to");
      }

      router.push(`?${params.toString()}`);
    },
    [router, searchParams],
  );

  const handleCustomFromChange = (val: string) => {
    setCustomFrom(val);
    if (period === "custom" && customTo) {
      updateCustomRange(val, customTo);
    }
  };

  const handleCustomToChange = (val: string) => {
    setCustomTo(val);
    if (period === "custom" && customFrom) {
      updateCustomRange(customFrom, val);
    }
  };

  return {
    period,
    customFrom,
    customTo,
    setPeriod: handlePeriodChange,
    setCustomFrom: handleCustomFromChange,
    setCustomTo: handleCustomToChange,
  };
}
