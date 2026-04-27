import React from "react";

interface MiniSparklineProps {
  values: number[];
  color: string;
  width?: number;
  height?: number;
}

export default function MiniSparkline({
  values,
  color,
  width = 80,
  height = 30,
}: MiniSparklineProps) {
  if (values.length < 2) {
    // Draw a flat line for single / zero data
    const flat = values.length === 1 ? values[0] : 0;
    return (
      <svg width={width} height={height} style={{ display: "block" }}>
        <line
          x1={0}
          y1={height / 2}
          x2={width}
          y2={height / 2}
          stroke={color}
          strokeWidth={1.5}
          strokeOpacity={0.5}
        />
        {flat > 0 && (
          <circle
            cx={width / 2}
            cy={height / 2}
            r={2}
            fill={color}
          />
        )}
      </svg>
    );
  }

  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const pad = 3;
  const usableH = height - pad * 2;
  const usableW = width;

  const pts = values.map((v, i) => {
    const x = (i / (values.length - 1)) * usableW;
    const y = pad + usableH - ((v - min) / range) * usableH;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });

  const polylinePoints = pts.join(" ");
  // Closed path for fill: extend to bottom corners
  const areaPoints = `0,${height} ${polylinePoints} ${usableW},${height}`;

  const gradId = `spark-${color.replace("#", "")}`;

  return (
    <svg
      width={width}
      height={height}
      style={{ display: "block", overflow: "visible" }}
    >
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.3} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>
      {/* Area fill */}
      <polygon points={areaPoints} fill={`url(#${gradId})`} />
      {/* Line */}
      <polyline
        points={polylinePoints}
        fill="none"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Last value dot */}
      {(() => {
        const last = pts[pts.length - 1].split(",");
        return (
          <circle
            cx={parseFloat(last[0])}
            cy={parseFloat(last[1])}
            r={2.5}
            fill={color}
          />
        );
      })()}
    </svg>
  );
}
