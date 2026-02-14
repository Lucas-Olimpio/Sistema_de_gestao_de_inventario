import React from "react";
import { Package, DollarSign, AlertTriangle, ArrowDownUp } from "lucide-react";
import StatsCard from "../stats-card";
import { DashboardData } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";
import AnimSection from "../anim-section";

interface KPISectionProps {
  data: DashboardData;
}

const chartCardStyle: React.CSSProperties = {
  background: "var(--bg-card)",
  borderRadius: "var(--radius-lg)",
  border: "1px solid var(--border-color)",
  padding: "20px 24px",
  transition: "border-color 0.3s, box-shadow 0.3s",
  cursor: "default",
};

export default function KPISection({ data }: KPISectionProps) {
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
      {/* Basic Stats */}
      <AnimSection delay={80}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
            gap: "16px",
          }}
        >
          <StatsCard
            title="Total de Produtos"
            value={data.totalProducts}
            subtitle={`${data.totalQuantity} unidades em estoque`}
            icon={Package}
            color="primary"
          />
          <StatsCard
            title="Valor do Estoque"
            value={formatCurrency(data.totalValue)}
            subtitle={`${data.totalCategories} categorias`}
            icon={DollarSign}
            color="success"
          />
          <StatsCard
            title="Estoque Baixo"
            value={data.lowStockCount}
            subtitle="Produtos abaixo do mínimo"
            icon={AlertTriangle}
            color={data.lowStockCount > 0 ? "danger" : "success"}
          />
          <StatsCard
            title="Movimentações"
            value={data.totalIn + data.totalOut}
            subtitle={`${data.totalIn} entradas · ${data.totalOut} saídas`}
            icon={ArrowDownUp}
            color="info"
          />
        </div>
      </AnimSection>

      {/* Financial Overview */}
      <AnimSection delay={160}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: "16px",
          }}
        >
          <div style={chartCardStyle} {...cardHover}>
            <p
              style={{
                fontSize: "11px",
                fontWeight: 600,
                color: "var(--text-muted)",
                textTransform: "uppercase",
                letterSpacing: "0.04em",
                marginBottom: "8px",
              }}
            >
              💸 Compras (Custo)
            </p>
            <p
              style={{
                fontSize: "22px",
                fontWeight: 700,
                color: "var(--accent-danger)",
              }}
            >
              {formatCurrency(data.financials.totalPayable)}
            </p>
            <p
              style={{
                fontSize: "11px",
                color: "var(--text-muted)",
                marginTop: "4px",
              }}
            >
              Pago: {formatCurrency(data.financials.totalPaid)}
            </p>
          </div>
          <div style={chartCardStyle} {...cardHover}>
            <p
              style={{
                fontSize: "11px",
                fontWeight: 600,
                color: "var(--text-muted)",
                textTransform: "uppercase",
                letterSpacing: "0.04em",
                marginBottom: "8px",
              }}
            >
              💰 Vendas (Receita)
            </p>
            <p
              style={{
                fontSize: "22px",
                fontWeight: 700,
                color: "var(--accent-success)",
              }}
            >
              {formatCurrency(data.financials.totalReceivable)}
            </p>
            <p
              style={{
                fontSize: "11px",
                color: "var(--text-muted)",
                marginTop: "4px",
              }}
            >
              Recebido: {formatCurrency(data.financials.totalReceived)}
            </p>
          </div>
          <div style={chartCardStyle} {...cardHover}>
            <p
              style={{
                fontSize: "11px",
                fontWeight: 600,
                color: "var(--text-muted)",
                textTransform: "uppercase",
                letterSpacing: "0.04em",
                marginBottom: "8px",
              }}
            >
              📊 Saldo
            </p>
            <p
              style={{
                fontSize: "22px",
                fontWeight: 700,
                color:
                  data.financials.balance >= 0
                    ? "var(--accent-success)"
                    : "var(--accent-danger)",
              }}
            >
              {data.financials.balance >= 0 ? "+" : ""}
              {formatCurrency(data.financials.balance)}
            </p>
            <p
              style={{
                fontSize: "11px",
                color: "var(--text-muted)",
                marginTop: "4px",
              }}
            >
              Receita recebida - Custo pago
            </p>
          </div>
        </div>
      </AnimSection>
    </div>
  );
}
