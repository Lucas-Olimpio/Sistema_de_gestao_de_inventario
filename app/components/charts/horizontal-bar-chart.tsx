"use client";

interface HorizontalBarChartProps {
  data: Array<{
    label: string;
    value: number;
    color: string;
  }>;
  formatValue?: (v: number) => string;
}

export default function HorizontalBarChart({
  data,
  formatValue = (v) => String(v),
}: HorizontalBarChartProps) {
  if (data.length === 0 || data.every((d) => d.value === 0)) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "var(--text-muted)",
          fontSize: "13px",
          padding: "30px",
        }}
      >
        Sem dados
      </div>
    );
  }

  const maxVal = Math.max(...data.map((d) => d.value), 1);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
      {data.map((d) => {
        const pct = maxVal > 0 ? (d.value / maxVal) * 100 : 0;
        return (
          <div key={d.label}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "4px",
              }}
            >
              <span
                style={{
                  fontSize: "12px",
                  color: "var(--text-secondary)",
                  fontWeight: 500,
                }}
              >
                {d.label}
              </span>
              <span
                style={{
                  fontSize: "12px",
                  fontWeight: 700,
                  color: "var(--text-primary)",
                }}
              >
                {formatValue(d.value)}
              </span>
            </div>
            <div
              style={{
                height: "8px",
                borderRadius: "4px",
                background: "var(--bg-input)",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  height: "100%",
                  width: `${pct}%`,
                  borderRadius: "4px",
                  background: d.color,
                  transition: "width 0.4s ease",
                  minWidth: d.value > 0 ? "4px" : "0",
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
