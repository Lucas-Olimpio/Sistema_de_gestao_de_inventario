"use client";

import { useState } from "react";

interface DonutChartProps {
  data: Array<{
    label: string;
    value: number;
    color: string;
  }>;
  size?: number;
  formatValue?: (v: number) => string;
}

export default function DonutChart({
  data,
  size = 160,
  formatValue = (v) => String(v),
}: DonutChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const total = data.reduce((sum, d) => sum + d.value, 0);
  if (total === 0) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "var(--text-muted)",
          fontSize: "13px",
          padding: "40px",
        }}
      >
        Sem dados
      </div>
    );
  }

  const radius = size / 2;
  const strokeWidth = size * 0.18;
  const innerRadius = radius - strokeWidth;
  const circumference = 2 * Math.PI * innerRadius;

  let cumulativeOffset = 0;
  const segments = data.map((d) => {
    const pct = d.value / total;
    const segment = {
      ...d,
      pct,
      dashLength: pct * circumference,
      dashGap: circumference - pct * circumference,
      offset: -cumulativeOffset * circumference,
    };
    cumulativeOffset += pct;
    return segment;
  });

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "24px",
        flexWrap: "wrap",
        justifyContent: "center",
      }}
    >
      {/* Donut + Popover container */}
      <div
        style={{
          position: "relative",
          width: size,
          flexShrink: 0,
        }}
      >
        {/* Popover tooltip — above the donut */}
        {hoveredIndex !== null && (
          <div
            style={{
              position: "absolute",
              left: "50%",
              top: "-8px",
              transform: "translate(-50%, -100%)",
              background: "var(--bg-card)",
              border: "1px solid var(--border-color)",
              borderRadius: "var(--radius-md)",
              padding: "10px 14px",
              boxShadow: "0 4px 16px rgba(0,0,0,0.4)",
              zIndex: 50,
              pointerEvents: "none",
              whiteSpace: "nowrap",
              textAlign: "center",
            }}
          >
            <p
              style={{
                fontSize: "13px",
                fontWeight: 600,
                color: "var(--text-primary)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
              }}
            >
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "2px",
                  background: segments[hoveredIndex].color,
                  display: "inline-block",
                }}
              />
              {segments[hoveredIndex].label}
            </p>
            <p
              style={{
                fontSize: "12px",
                color: "var(--text-muted)",
                marginTop: "4px",
              }}
            >
              {segments[hoveredIndex].value} produtos (
              {(segments[hoveredIndex].pct * 100).toFixed(1)}%)
            </p>
          </div>
        )}

        {/* SVG Donut */}
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          {segments.map((seg, i) => (
            <circle
              key={i}
              cx={radius}
              cy={radius}
              r={innerRadius}
              fill="none"
              stroke={seg.color}
              strokeWidth={hoveredIndex === i ? strokeWidth + 4 : strokeWidth}
              strokeDasharray={`${seg.dashLength} ${seg.dashGap}`}
              strokeDashoffset={seg.offset}
              transform={`rotate(-90 ${radius} ${radius})`}
              style={{
                transition: "stroke-width 0.2s ease",
                cursor: "pointer",
              }}
              onMouseEnter={() => setHoveredIndex(i)}
              onMouseLeave={() => setHoveredIndex(null)}
            />
          ))}
        </svg>

        {/* Center text */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            pointerEvents: "none",
          }}
        >
          {hoveredIndex !== null ? (
            <>
              <span
                style={{
                  fontSize: "18px",
                  fontWeight: 700,
                  color: segments[hoveredIndex].color,
                }}
              >
                {segments[hoveredIndex].value}
              </span>
              <span
                style={{
                  fontSize: "9px",
                  color: "var(--text-muted)",
                  textTransform: "uppercase",
                  letterSpacing: "0.04em",
                }}
              >
                {segments[hoveredIndex].label}
              </span>
            </>
          ) : (
            <>
              <span
                style={{
                  fontSize: "20px",
                  fontWeight: 700,
                  color: "var(--text-primary)",
                }}
              >
                {total}
              </span>
              <span
                style={{
                  fontSize: "9px",
                  color: "var(--text-muted)",
                  textTransform: "uppercase",
                  letterSpacing: "0.04em",
                }}
              >
                Total
              </span>
            </>
          )}
        </div>
      </div>

      {/* Legend */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "8px",
          minWidth: "120px",
        }}
      >
        {segments.map((d, i) => {
          const pct = (d.pct * 100).toFixed(0);
          return (
            <div
              key={d.label}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                fontSize: "12px",
                cursor: "pointer",
                padding: "2px 4px",
                borderRadius: "4px",
                background:
                  hoveredIndex === i ? "var(--bg-input)" : "transparent",
                transition: "background 0.15s",
              }}
              onMouseEnter={() => setHoveredIndex(i)}
              onMouseLeave={() => setHoveredIndex(null)}
            >
              <div
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: "2px",
                  background: d.color,
                  flexShrink: 0,
                }}
              />
              <span
                style={{
                  color: "var(--text-secondary)",
                  flex: 1,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {d.label}
              </span>
              <span
                style={{
                  fontWeight: 600,
                  color: "var(--text-primary)",
                  whiteSpace: "nowrap",
                }}
              >
                {d.value}{" "}
                <span style={{ color: "var(--text-muted)", fontWeight: 400 }}>
                  ({pct}%)
                </span>
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
