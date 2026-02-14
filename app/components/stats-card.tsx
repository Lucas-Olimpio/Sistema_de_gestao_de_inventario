import { LucideIcon } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: { value: number; label: string };
  color: "primary" | "success" | "danger" | "warning" | "info";
}

const colorMap = {
  primary: {
    bg: "var(--accent-primary-glow)",
    text: "var(--accent-primary-hover)",
  },
  success: {
    bg: "var(--accent-success-bg)",
    text: "var(--accent-success)",
  },
  danger: {
    bg: "var(--accent-danger-bg)",
    text: "var(--accent-danger)",
  },
  warning: {
    bg: "var(--accent-warning-bg)",
    text: "var(--accent-warning)",
  },
  info: {
    bg: "var(--accent-info-bg)",
    text: "var(--accent-info)",
  },
};

export default function StatsCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  color,
}: StatsCardProps) {
  const colors = colorMap[color];

  return (
    <div
      style={{
        background: "var(--bg-card)",
        borderRadius: "var(--radius-lg)",
        border: "1px solid var(--border-color)",
        padding: "22px",
        display: "flex",
        flexDirection: "column",
        gap: "14px",
        transition: "all 0.3s ease",
        cursor: "default",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = "var(--border-hover)";
        e.currentTarget.style.transform = "translateY(-2px)";
        e.currentTarget.style.boxShadow = "var(--shadow-md)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "var(--border-color)";
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = "none";
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <p
          style={{
            fontSize: "13px",
            fontWeight: 500,
            color: "var(--text-secondary)",
            textTransform: "uppercase",
            letterSpacing: "0.04em",
          }}
        >
          {title}
        </p>
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: "var(--radius-md)",
            background: colors.bg,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Icon size={20} color={colors.text} />
        </div>
      </div>
      <div>
        <p
          style={{
            fontSize: "28px",
            fontWeight: 700,
            color: "var(--text-primary)",
            letterSpacing: "-0.03em",
            lineHeight: 1.1,
          }}
        >
          {value}
        </p>
        {subtitle && (
          <p
            style={{
              fontSize: "12px",
              color: "var(--text-muted)",
              marginTop: "4px",
            }}
          >
            {subtitle}
          </p>
        )}
      </div>
      {trend && (
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <span
            style={{
              fontSize: "13px",
              fontWeight: 600,
              color:
                trend.value >= 0
                  ? "var(--accent-success)"
                  : "var(--accent-danger)",
            }}
          >
            {trend.value >= 0 ? "+" : ""}
            {trend.value}%
          </span>
          <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>
            {trend.label}
          </span>
        </div>
      )}
    </div>
  );
}
