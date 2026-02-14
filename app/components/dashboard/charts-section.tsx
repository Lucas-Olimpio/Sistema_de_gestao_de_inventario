import React from "react";
import BarChart from "../charts/bar-chart";
import LineChart from "../charts/line-chart";
import DonutChart from "../charts/donut-chart";
import HorizontalBarChart from "../charts/horizontal-bar-chart";
import { DashboardData } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";
import AnimSection from "../anim-section";

interface ChartsSectionProps {
  data: DashboardData;
  formatShortDate: (date: string) => string;
}

const chartCardStyle: React.CSSProperties = {
  background: "var(--bg-card)",
  borderRadius: "var(--radius-lg)",
  border: "1px solid var(--border-color)",
  padding: "20px 24px",
  transition: "border-color 0.3s, box-shadow 0.3s",
  cursor: "default",
};

export default function ChartsSection({
  data,
  formatShortDate,
}: ChartsSectionProps) {
  const catColors = [
    "#6366f1",
    "#22c55e",
    "#f59e0b",
    "#ef4444",
    "#3b82f6",
    "#a855f7",
    "#ec4899",
    "#14b8a6",
  ];

  const poStatusLabels: Record<string, string> = {
    PENDENTE: "Pendente",
    APROVADA: "Aprovada",
    EM_TRANSITO: "Em Trânsito",
    RECEBIDA: "Recebida",
    CANCELADA: "Cancelada",
  };

  const soStatusLabels: Record<string, string> = {
    PENDENTE: "Pendente",
    APROVADA: "Aprovada",
    FATURADA: "Faturada",
    CANCELADA: "Cancelada",
  };

  const statusColors: Record<string, string> = {
    PENDENTE: "#f59e0b",
    APROVADA: "#3b82f6",
    EM_TRANSITO: "#a855f7",
    RECEBIDA: "#22c55e",
    FATURADA: "#22c55e",
    CANCELADA: "#ef4444",
  };

  // Simple hook for card hover effect
  const handleMouseEnter = (e: React.MouseEvent<HTMLDivElement>) => {
    e.currentTarget.style.borderColor = "var(--border-hover)";
    e.currentTarget.style.boxShadow = "var(--shadow-md)";
  };

  const handleMouseLeave = (e: React.MouseEvent<HTMLDivElement>) => {
    e.currentTarget.style.borderColor = "var(--border-color)";
    e.currentTarget.style.boxShadow = "none";
  };

  const cardHover = {
    onMouseEnter: handleMouseEnter,
    onMouseLeave: handleMouseLeave,
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Movements Timeline Chart */}
      <AnimSection delay={240}>
        <div style={chartCardStyle} {...cardHover}>
          <h3
            style={{
              fontSize: "14px",
              fontWeight: 700,
              color: "var(--text-primary)",
              marginBottom: "16px",
            }}
          >
            Movimentações de Estoque
          </h3>
          <LineChart
            data={data.movementTimeline.map((d) => ({
              label: formatShortDate(d.date),
              values: [d.in, d.out],
            }))}
            series={[
              { name: "Entradas", color: "#22c55e" },
              { name: "Saídas", color: "#ef4444" },
            ]}
            height={220}
          />
        </div>
      </AnimSection>

      {/* Charts Grid: Financial + Category */}
      <AnimSection delay={320}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "16px",
          }}
        >
          {/* Financial Chart */}
          <div style={chartCardStyle} {...cardHover}>
            <h3
              style={{
                fontSize: "14px",
                fontWeight: 700,
                color: "var(--text-primary)",
                marginBottom: "16px",
              }}
            >
              Compras vs Vendas
            </h3>
            <BarChart
              data={[
                {
                  label: "Total",
                  values: [
                    data.financials.totalPayable,
                    data.financials.totalReceivable,
                  ],
                },
                {
                  label: "Quitado",
                  values: [
                    data.financials.totalPaid,
                    data.financials.totalReceived,
                  ],
                },
              ]}
              series={[
                { name: "Compras", color: "#ef4444" },
                { name: "Vendas", color: "#22c55e" },
              ]}
              height={200}
              formatValue={(v) => formatCurrency(v)}
            />
          </div>

          {/* Category Donut */}
          <div style={chartCardStyle} {...cardHover}>
            <h3
              style={{
                fontSize: "14px",
                fontWeight: 700,
                color: "var(--text-primary)",
                marginBottom: "16px",
              }}
            >
              Distribuição por Categoria
            </h3>
            <DonutChart
              data={data.categories.map((c, i) => ({
                label: c.name,
                value: c.products,
                color: catColors[i % catColors.length],
              }))}
            />
          </div>
        </div>
      </AnimSection>

      {/* Orders by Status */}
      <AnimSection delay={400}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "16px",
          }}
        >
          <div style={chartCardStyle} {...cardHover}>
            <h3
              style={{
                fontSize: "14px",
                fontWeight: 700,
                color: "var(--text-primary)",
                marginBottom: "16px",
              }}
            >
              🛒 Ordens de Compra
            </h3>
            <HorizontalBarChart
              data={Object.entries(poStatusLabels).map(([key, label]) => ({
                label,
                value: data.purchaseOrdersByStatus[key] || 0,
                color: statusColors[key] || "#6366f1",
              }))}
            />
          </div>
          <div style={chartCardStyle} {...cardHover}>
            <h3
              style={{
                fontSize: "14px",
                fontWeight: 700,
                color: "var(--text-primary)",
                marginBottom: "16px",
              }}
            >
              🛍️ Pedidos de Venda
            </h3>
            <HorizontalBarChart
              data={Object.entries(soStatusLabels).map(([key, label]) => ({
                label,
                value: data.salesOrdersByStatus[key] || 0,
                color: statusColors[key] || "#6366f1",
              }))}
            />
          </div>
        </div>
      </AnimSection>
    </div>
  );
}
