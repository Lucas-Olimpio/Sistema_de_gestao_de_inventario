import React from "react";
import { Calendar } from "lucide-react";
import { PeriodKey } from "@/lib/types";

interface PeriodFilterProps {
  period: PeriodKey;
  setPeriod: (period: PeriodKey) => void;
  customFrom: string;
  setCustomFrom: (date: string) => void;
  customTo: string;
  setCustomTo: (date: string) => void;
}

export default function PeriodFilter({
  period,
  setPeriod,
  customFrom,
  setCustomFrom,
  customTo,
  setCustomTo,
}: PeriodFilterProps) {
  const periodButtons: Array<{ key: PeriodKey; label: string }> = [
    { key: "today", label: "Hoje" },
    { key: "7d", label: "7 dias" },
    { key: "30d", label: "30 dias" },
    { key: "12m", label: "12 meses" },
    { key: "custom", label: "Personalizado" },
  ];

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "8px",
        flexWrap: "wrap",
      }}
    >
      <Calendar size={16} color="var(--text-muted)" />
      <span
        style={{
          fontSize: "12px",
          color: "var(--text-muted)",
          fontWeight: 600,
          textTransform: "uppercase",
          letterSpacing: "0.04em",
          marginRight: "4px",
        }}
      >
        Período:
      </span>
      {periodButtons.map((btn) => (
        <button
          key={btn.key}
          onClick={() => setPeriod(btn.key)}
          style={{
            padding: "6px 14px",
            borderRadius: "var(--radius-md)",
            border:
              period === btn.key
                ? "1px solid var(--accent-primary)"
                : "1px solid var(--border-color)",
            background:
              period === btn.key
                ? "var(--accent-primary-glow)"
                : "var(--bg-card)",
            color:
              period === btn.key
                ? "var(--accent-primary)"
                : "var(--text-secondary)",
            fontSize: "12px",
            fontWeight: period === btn.key ? 600 : 500,
            cursor: "pointer",
            transition: "all 0.2s",
          }}
        >
          {btn.label}
        </button>
      ))}
      {period === "custom" && (
        <>
          <input
            type="date"
            value={customFrom}
            onChange={(e) => setCustomFrom(e.target.value)}
            style={{
              padding: "5px 10px",
              borderRadius: "var(--radius-md)",
              border: "1px solid var(--border-color)",
              background: "var(--bg-input)",
              color: "var(--text-primary)",
              fontSize: "12px",
            }}
          />
          <span style={{ color: "var(--text-muted)", fontSize: "12px" }}>
            até
          </span>
          <input
            type="date"
            value={customTo}
            onChange={(e) => setCustomTo(e.target.value)}
            style={{
              padding: "5px 10px",
              borderRadius: "var(--radius-md)",
              border: "1px solid var(--border-color)",
              background: "var(--bg-input)",
              color: "var(--text-primary)",
              fontSize: "12px",
            }}
          />
        </>
      )}
    </div>
  );
}
