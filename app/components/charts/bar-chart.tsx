"use client";

import { useState } from "react";

interface BarChartProps {
  data: Array<{
    label: string;
    values: number[];
  }>;
  series: Array<{ name: string; color: string }>;
  height?: number;
  formatValue?: (v: number) => string;
}

export default function BarChart({
  data,
  series,
  height = 220,
  formatValue = (v) => String(v),
}: BarChartProps) {
  const [tooltip, setTooltip] = useState<{
    x: number;
    y: number;
    content: string[];
    label: string;
  } | null>(null);

  if (data.length === 0) {
    return (
      <div
        style={{
          height,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "var(--text-muted)",
          fontSize: "13px",
        }}
      >
        Sem dados para o período
      </div>
    );
  }

  const allValues = data.flatMap((d) => d.values);
  const maxVal = Math.max(...allValues, 1);

  const chartH = height - 52;

  const barGroupWidth = 100 / data.length;
  const barWidth =
    series.length > 1 ? barGroupWidth * 0.35 : barGroupWidth * 0.5;
  const gap = series.length > 1 ? barGroupWidth * 0.05 : 0;

  // Y-axis tick values
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((pct) => ({
    pct,
    value: Math.round(maxVal * pct),
    label: formatValue(Math.round(maxVal * pct)),
  }));

  return (
    <div>
      {/* Legend */}
      <div
        style={{
          display: "flex",
          gap: "16px",
          marginBottom: "12px",
          justifyContent: "flex-end",
        }}
      >
        {series.map((s) => (
          <div
            key={s.name}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              fontSize: "11px",
              color: "var(--text-secondary)",
            }}
          >
            <div
              style={{
                width: 8,
                height: 8,
                borderRadius: "2px",
                background: s.color,
              }}
            />
            {s.name}
          </div>
        ))}
      </div>

      {/* Chart area */}
      <div
        style={{
          display: "flex",
          gap: "0",
          position: "relative",
        }}
        onMouseLeave={() => setTooltip(null)}
      >
        {/* Y-axis labels */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            height: chartH,
            paddingRight: "8px",
            flexShrink: 0,
          }}
        >
          {ticks
            .slice()
            .reverse()
            .map((t) => (
              <span
                key={t.pct}
                style={{
                  fontSize: "10px",
                  color: "var(--text-muted)",
                  whiteSpace: "nowrap",
                  lineHeight: "1",
                  textAlign: "right",
                }}
              >
                {t.label}
              </span>
            ))}
        </div>

        {/* Bars area */}
        <div style={{ flex: 1, position: "relative" }}>
          {/* Grid lines */}
          {ticks.map((t) => (
            <div
              key={t.pct}
              style={{
                position: "absolute",
                left: 0,
                right: 0,
                bottom: `${t.pct * 100}%`,
                height: "1px",
                background: "var(--border-color)",
                opacity: t.pct === 0 ? 0.6 : 0.2,
              }}
            />
          ))}

          {/* Bars */}
          <div
            style={{
              display: "flex",
              alignItems: "flex-end",
              height: chartH,
              position: "relative",
            }}
          >
            {data.map((d, i) => (
              <div
                key={i}
                style={{
                  flex: 1,
                  display: "flex",
                  alignItems: "flex-end",
                  justifyContent: "center",
                  gap: `${gap}%`,
                  height: "100%",
                  position: "relative",
                  cursor: "pointer",
                }}
                onMouseEnter={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const parentRect =
                    e.currentTarget.parentElement?.parentElement?.parentElement?.getBoundingClientRect();
                  if (parentRect) {
                    setTooltip({
                      x: rect.left - parentRect.left + rect.width / 2,
                      y: rect.top - parentRect.top - 10,
                      label: d.label,
                      content: d.values.map(
                        (val, si) => `${series[si]?.name}: ${formatValue(val)}`,
                      ),
                    });
                  }
                }}
              >
                {d.values.map((val, si) => {
                  const barH = maxVal > 0 ? (val / maxVal) * 100 : 0;
                  return (
                    <div
                      key={si}
                      style={{
                        width: `${barWidth}%`,
                        maxWidth: "40px",
                        height: `${barH}%`,
                        minHeight: val > 0 ? "3px" : "0",
                        background: series[si]?.color || "#6366f1",
                        borderRadius: "3px 3px 0 0",
                        transition: "height 0.3s ease, opacity 0.15s",
                      }}
                    />
                  );
                })}
              </div>
            ))}
          </div>

          {/* X Labels */}
          <div style={{ display: "flex", marginTop: "8px" }}>
            {data.map((d, i) => (
              <div
                key={i}
                style={{
                  flex: 1,
                  textAlign: "center",
                  fontSize: "10px",
                  color: "var(--text-muted)",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  padding: "0 2px",
                }}
              >
                {d.label}
              </div>
            ))}
          </div>
        </div>

        {/* Tooltip popover */}
        {tooltip && (
          <div
            style={{
              position: "absolute",
              left: tooltip.x,
              top: tooltip.y,
              transform: "translate(-50%, -100%)",
              background: "var(--bg-card)",
              border: "1px solid var(--border-color)",
              borderRadius: "var(--radius-md)",
              padding: "10px 14px",
              boxShadow: "0 4px 16px rgba(0,0,0,0.4)",
              zIndex: 50,
              pointerEvents: "none",
            }}
          >
            <p
              style={{
                fontSize: "13px",
                fontWeight: 700,
                color: "var(--text-primary)",
                marginBottom: "6px",
              }}
            >
              {tooltip.label}
            </p>
            {tooltip.content.map((line, i) => (
              <p
                key={i}
                style={{
                  fontSize: "13px",
                  color: "var(--text-secondary)",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  lineHeight: "1.8",
                }}
              >
                <span
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: "1px",
                    background: series[i]?.color,
                    flexShrink: 0,
                    display: "inline-block",
                  }}
                />
                {line}
              </p>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
