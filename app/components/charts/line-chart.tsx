"use client";

import { useState } from "react";

interface LineChartProps {
  data: Array<{
    label: string;
    values: number[];
  }>;
  series: Array<{ name: string; color: string }>;
  height?: number;
  formatValue?: (v: number) => string;
}

export default function LineChart({
  data,
  series,
  height = 220,
  formatValue = (v) => String(v),
}: LineChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

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

  const ticks = [0, 0.25, 0.5, 0.75, 1].map((pct) => ({
    pct,
    value: Math.round(maxVal * pct),
    label: formatValue(Math.round(maxVal * pct)),
  }));

  // SVG dimensions
  const yAxisWidth = 50;
  const svgPadding = { top: 8, right: 16, bottom: 0 };

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
                width: 12,
                height: 3,
                borderRadius: "2px",
                background: s.color,
              }}
            />
            {s.name}
          </div>
        ))}
      </div>

      {/* Chart container */}
      <div
        style={{ position: "relative" }}
        onMouseLeave={() => setHoveredIndex(null)}
      >
        <div style={{ display: "flex", gap: "0" }}>
          {/* Y-axis labels */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              height: chartH,
              paddingRight: "8px",
              flexShrink: 0,
              minWidth: "30px",
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

          {/* SVG Area */}
          <div style={{ flex: 1, position: "relative" }}>
            <svg
              width="100%"
              height={chartH}
              viewBox={`0 0 1000 ${chartH}`}
              preserveAspectRatio="none"
              style={{ overflow: "visible" }}
            >
              {/* Grid lines */}
              {ticks.map((t) => (
                <line
                  key={t.pct}
                  x1={0}
                  x2={1000}
                  y1={chartH - t.pct * chartH}
                  y2={chartH - t.pct * chartH}
                  stroke="var(--border-color)"
                  strokeWidth={1}
                  opacity={t.pct === 0 ? 0.6 : 0.2}
                  vectorEffect="non-scaling-stroke"
                />
              ))}

              {/* Lines for each series */}
              {series.map((s, si) => {
                const points = data.map((d, i) => {
                  const x =
                    data.length === 1 ? 500 : (i / (data.length - 1)) * 1000;
                  const y =
                    chartH -
                    (maxVal > 0 ? (d.values[si] / maxVal) * chartH : 0);
                  return { x, y };
                });

                // Area fill (gradient)
                const areaPath = `M ${points[0].x} ${points[0].y} ${points
                  .slice(1)
                  .map((p) => `L ${p.x} ${p.y}`)
                  .join(
                    " ",
                  )} L ${points[points.length - 1].x} ${chartH} L ${points[0].x} ${chartH} Z`;

                const linePath = `M ${points[0].x} ${points[0].y} ${points
                  .slice(1)
                  .map((p) => `L ${p.x} ${p.y}`)
                  .join(" ")}`;

                return (
                  <g key={si}>
                    {/* Area fill */}
                    <path d={areaPath} fill={s.color} opacity={0.08} />
                    {/* Main line */}
                    <path
                      d={linePath}
                      fill="none"
                      stroke={s.color}
                      strokeWidth={2.5}
                      vectorEffect="non-scaling-stroke"
                      strokeLinejoin="round"
                      strokeLinecap="round"
                    />
                    {/* Data points */}
                    {points.map((p, pi) => (
                      <circle
                        key={pi}
                        cx={p.x}
                        cy={p.y}
                        r={hoveredIndex === pi ? 5 : 3}
                        fill={s.color}
                        stroke="var(--bg-card)"
                        strokeWidth={2}
                        vectorEffect="non-scaling-stroke"
                        style={{ transition: "r 0.15s" }}
                      />
                    ))}
                  </g>
                );
              })}

              {/* Hover vertical line */}
              {hoveredIndex !== null && (
                <line
                  x1={
                    data.length === 1
                      ? 500
                      : (hoveredIndex / (data.length - 1)) * 1000
                  }
                  x2={
                    data.length === 1
                      ? 500
                      : (hoveredIndex / (data.length - 1)) * 1000
                  }
                  y1={0}
                  y2={chartH}
                  stroke="var(--text-muted)"
                  strokeWidth={1}
                  strokeDasharray="4 3"
                  vectorEffect="non-scaling-stroke"
                  opacity={0.5}
                />
              )}

              {/* Invisible hover zones */}
              {data.map((_, i) => {
                const segW = 1000 / data.length;
                return (
                  <rect
                    key={i}
                    x={
                      data.length === 1
                        ? 0
                        : (i / (data.length - 1)) * 1000 - segW / 2
                    }
                    y={0}
                    width={segW}
                    height={chartH}
                    fill="transparent"
                    onMouseEnter={() => setHoveredIndex(i)}
                  />
                );
              })}
            </svg>

            {/* X Labels (outside SVG to avoid scaling) */}
            <div
              style={{
                position: "relative",
                height: "20px",
                marginTop: "8px",
                width: "100%",
              }}
            >
              {(() => {
                const maxLabels = 6;
                const showAll = data.length <= maxLabels;
                const labels: { text: string; pct: number; index: number }[] =
                  [];

                if (showAll) {
                  return data.map((d, i) => (
                    <div
                      key={i}
                      style={{
                        position: "absolute",
                        left: `${(i / (data.length - 1)) * 100}%`,
                        transform: "translateX(-50%)",
                        textAlign: "center",
                        fontSize: "10px",
                        color: "var(--text-muted)",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {d.label}
                    </div>
                  ));
                }

                // Sample labels for large datasets
                const step = (data.length - 1) / (maxLabels - 1);
                for (let i = 0; i < maxLabels; i++) {
                  const index = Math.min(Math.round(i * step), data.length - 1);
                  // Avoid duplicates (e.g. if data.length < maxLabels, covered by showAll check effectively but good safeguard)
                  if (
                    labels.length > 0 &&
                    labels[labels.length - 1].index === index
                  ) {
                    continue;
                  }

                  labels.push({
                    text: data[index].label,
                    pct: (index / (data.length - 1)) * 100,
                    index,
                  });
                }

                return labels.map((l, i) => (
                  <div
                    key={i}
                    style={{
                      position: "absolute",
                      left: `${l.pct}%`,
                      transform: "translateX(-50%)",
                      textAlign: "center",
                      fontSize: "10px",
                      color: "var(--text-muted)",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {l.text}
                  </div>
                ));
              })()}
            </div>
          </div>
        </div>

        {/* Tooltip popover */}
        {hoveredIndex !== null &&
          (() => {
            const d = data[hoveredIndex];
            const xPct =
              data.length === 1 ? 50 : (hoveredIndex / (data.length - 1)) * 100;

            return (
              <div
                style={{
                  position: "absolute",
                  left: `calc(30px + ${xPct}% * 0.95)`,
                  top: "0",
                  transform: "translate(-50%, -10px)",
                  background: "var(--bg-card)",
                  border: "1px solid var(--border-color)",
                  borderRadius: "var(--radius-md)",
                  padding: "10px 14px",
                  boxShadow: "0 4px 16px rgba(0,0,0,0.4)",
                  zIndex: 50,
                  pointerEvents: "none",
                  whiteSpace: "nowrap",
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
                  {d.label}
                </p>
                {d.values.map((val, si) => (
                  <p
                    key={si}
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
                        width: 8,
                        height: 8,
                        borderRadius: "50%",
                        background: series[si]?.color,
                        flexShrink: 0,
                        display: "inline-block",
                      }}
                    />
                    {series[si]?.name}:{" "}
                    <strong style={{ color: "var(--text-primary)" }}>
                      {formatValue(val)}
                    </strong>
                  </p>
                ))}
              </div>
            );
          })()}
      </div>
    </div>
  );
}
