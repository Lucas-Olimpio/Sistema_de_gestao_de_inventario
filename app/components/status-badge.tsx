import React from "react";

interface StatusBadgeProps {
  status: string;
  type?: "purchase" | "sales" | "financial" | "generic";
  customConfig?: Record<string, { label: string; bg: string; color: string }>;
}

const defaultConfig: Record<
  string,
  { label: string; bg: string; color: string }
> = {
  // Generic / Shared
  PENDENTE: {
    label: "Pendente",
    bg: "var(--accent-warning-bg)",
    color: "var(--accent-warning)",
  },
  CANCELADA: {
    label: "Cancelada",
    bg: "var(--accent-danger-bg)",
    color: "var(--accent-danger)",
  },
  // Purchase
  APROVADA: {
    label: "Aprovada",
    bg: "var(--accent-info-bg)",
    color: "var(--accent-info)",
  },
  EM_TRANSITO: {
    label: "Em Trânsito",
    bg: "rgba(168, 85, 247, 0.1)",
    color: "#a855f7",
  },
  RECEBIDA: {
    label: "Recebida",
    bg: "var(--accent-success-bg)",
    color: "var(--accent-success)",
  },
  // Sales
  FATURADA: {
    label: "Faturada",
    bg: "var(--accent-success-bg)",
    color: "var(--accent-success)",
  },
  // Financial
  PAGO: {
    label: "Pago",
    bg: "var(--accent-success-bg)",
    color: "var(--accent-success)",
  },
  RECEBIDO: {
    label: "Recebido",
    bg: "var(--accent-success-bg)",
    color: "var(--accent-success)",
  },
  // Inventory
  IN: {
    label: "Entrada",
    bg: "var(--accent-success-bg)",
    color: "var(--accent-success)",
  },
  OUT: {
    label: "Saída",
    bg: "var(--accent-danger-bg)",
    color: "var(--accent-danger)",
  },
};

export default function StatusBadge({
  status,
  customConfig,
}: StatusBadgeProps) {
  const config = customConfig || defaultConfig;
  const style = config[status] || {
    label: status,
    bg: "var(--bg-muted)",
    color: "var(--text-secondary)",
  };

  return (
    <span
      style={{
        padding: "4px 10px",
        borderRadius: "var(--radius-sm)",
        background: style.bg,
        color: style.color,
        fontSize: "11px",
        fontWeight: 700,
        letterSpacing: "0.02em",
        whiteSpace: "nowrap",
        textTransform: "uppercase",
      }}
    >
      {style.label}
    </span>
  );
}
