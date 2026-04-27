import React from "react";
import {
  Package,
  DollarSign,
  AlertTriangle,
  ArrowDownUp,
  TrendingUp,
  TrendingDown,
  Minus,
  Zap,
} from "lucide-react";
import StatsCard from "../stats-card";
import { DashboardData } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";
import AnimSection from "../anim-section";
import MiniSparkline from "./mini-sparkline";

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

/** Renders a coloured ↑↓ trend pill */
function TrendBadge({ pct }: { pct: number | null }) {
  if (pct === null) return null;

  const isPositive = pct >= 0;
  const isNeutral = pct === 0;

  const color = isNeutral
    ? "var(--text-muted)"
    : isPositive
      ? "var(--accent-success)"
      : "var(--accent-danger)";

  const bg = isNeutral
    ? "var(--bg-card-hover)"
    : isPositive
      ? "var(--accent-success-bg)"
      : "var(--accent-danger-bg)";

  const Icon = isNeutral ? Minus : isPositive ? TrendingUp : TrendingDown;

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "3px",
        fontSize: "11px",
        fontWeight: 700,
        color,
        background: bg,
        borderRadius: "999px",
        padding: "2px 8px",
        whiteSpace: "nowrap",
      }}
    >
      <Icon size={10} />
      {isPositive && pct !== 0 ? "+" : ""}
      {pct}%
    </span>
  );
}

/** Quick summary banner shown at the top */
function QuickSummary({ data }: { data: DashboardData }) {
  const pendingPO = data.purchaseOrdersByStatus["PENDENTE"] ?? 0;
  const pendingSO = data.salesOrdersByStatus["PENDENTE"] ?? 0;
  const lowStockCount = data.lowStockCount;

  const alerts: { emoji: string; text: string; color: string }[] = [];

  if (lowStockCount > 0) {
    alerts.push({
      emoji: "⚠️",
      text: `${lowStockCount} produto${lowStockCount > 1 ? "s" : ""} precisam de reposição`,
      color: "var(--accent-warning)",
    });
  }
  if (pendingPO > 0) {
    alerts.push({
      emoji: "🛒",
      text: `${pendingPO} ordem${pendingPO > 1 ? "s" : ""} de compra pendente${pendingPO > 1 ? "s" : ""}`,
      color: "var(--accent-info)",
    });
  }
  if (pendingSO > 0) {
    alerts.push({
      emoji: "🛍️",
      text: `${pendingSO} pedido${pendingSO > 1 ? "s" : ""} de venda pendente${pendingSO > 1 ? "s" : ""}`,
      color: "var(--accent-primary)",
    });
  }

  if (alerts.length === 0) {
    return (
      <div
        style={{
          background: "var(--accent-success-bg)",
          border: "1px solid var(--accent-success)",
          borderRadius: "var(--radius-lg)",
          padding: "12px 20px",
          display: "flex",
          alignItems: "center",
          gap: "10px",
          fontSize: "13px",
          color: "var(--accent-success)",
          fontWeight: 600,
        }}
      >
        <Zap size={16} />
        Tudo certo! Nenhum alerta pendente no momento.
      </div>
    );
  }

  return (
    <div
      style={{
        background: "linear-gradient(135deg, rgba(99,102,241,0.08) 0%, rgba(245,158,11,0.06) 100%)",
        border: "1px solid var(--border-color)",
        borderRadius: "var(--radius-lg)",
        padding: "14px 20px",
        display: "flex",
        alignItems: "center",
        flexWrap: "wrap",
        gap: "12px",
      }}
    >
      <span
        style={{
          fontSize: "11px",
          fontWeight: 700,
          color: "var(--text-muted)",
          textTransform: "uppercase",
          letterSpacing: "0.06em",
          whiteSpace: "nowrap",
        }}
      >
        Resumo rápido
      </span>
      <div
        style={{
          width: "1px",
          height: "16px",
          background: "var(--border-color)",
        }}
      />
      <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
        {alerts.map((a, i) => (
          <span
            key={i}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "5px",
              fontSize: "12px",
              fontWeight: 600,
              color: a.color,
              background: "var(--bg-card)",
              border: "1px solid var(--border-color)",
              borderRadius: "999px",
              padding: "4px 12px",
            }}
          >
            {a.emoji} {a.text}
          </span>
        ))}
      </div>
    </div>
  );
}

export default function KPISection({ data }: KPISectionProps) {
  const { kpiTrends, financialSparkline } = data;

  const purchasesSparkValues = financialSparkline.map((d) => d.purchases);
  const salesSparkValues = financialSparkline.map((d) => d.sales);
  const balanceSparkValues = financialSparkline.map(
    (d) => d.sales - d.purchases,
  );

  // Simple hook for card hover effect
  const handleMouseEnter = (e: React.MouseEvent<HTMLDivElement>) => {
    e.currentTarget.style.borderColor = "var(--border-hover)";
    e.currentTarget.style.boxShadow = "var(--shadow-md)";
  };
  const handleMouseLeave = (e: React.MouseEvent<HTMLDivElement>) => {
    e.currentTarget.style.borderColor = "var(--border-color)";
    e.currentTarget.style.boxShadow = "none";
  };
  const cardHover = { onMouseEnter: handleMouseEnter, onMouseLeave: handleMouseLeave };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Quick summary banner */}
      <AnimSection delay={60}>
        <QuickSummary data={data} />
      </AnimSection>

      {/* Basic KPI Stats */}
      <AnimSection delay={80}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
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
            trend={
              kpiTrends.movements !== null
                ? { value: kpiTrends.movements, label: "vs período anterior" }
                : undefined
            }
          />
        </div>
      </AnimSection>

      {/* Financial Overview */}
      <AnimSection delay={160}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "16px",
          }}
        >
          {/* Compras */}
          <div style={chartCardStyle} {...cardHover}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                marginBottom: "8px",
              }}
            >
              <p
                style={{
                  fontSize: "11px",
                  fontWeight: 600,
                  color: "var(--text-muted)",
                  textTransform: "uppercase",
                  letterSpacing: "0.04em",
                }}
              >
                💸 Compras (Custo)
              </p>
              <TrendBadge pct={kpiTrends.purchases} />
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "flex-end",
                justifyContent: "space-between",
                gap: "8px",
              }}
            >
              <div>
                <p
                  style={{
                    fontSize: "22px",
                    fontWeight: 700,
                    color: "var(--accent-danger)",
                  }}
                >
                  {formatCurrency(data.financials?.totalPayable ?? 0)}
                </p>
                <p
                  style={{
                    fontSize: "11px",
                    color: "var(--text-muted)",
                    marginTop: "4px",
                  }}
                >
                  Pago: {formatCurrency(data.financials?.totalPaid ?? 0)}
                </p>
              </div>
              <MiniSparkline
                values={purchasesSparkValues}
                color="#ef4444"
                width={72}
                height={32}
              />
            </div>
          </div>

          {/* Vendas */}
          <div style={chartCardStyle} {...cardHover}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                marginBottom: "8px",
              }}
            >
              <p
                style={{
                  fontSize: "11px",
                  fontWeight: 600,
                  color: "var(--text-muted)",
                  textTransform: "uppercase",
                  letterSpacing: "0.04em",
                }}
              >
                💰 Vendas (Receita)
              </p>
              <TrendBadge pct={kpiTrends.sales} />
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "flex-end",
                justifyContent: "space-between",
                gap: "8px",
              }}
            >
              <div>
                <p
                  style={{
                    fontSize: "22px",
                    fontWeight: 700,
                    color: "var(--accent-success)",
                  }}
                >
                  {formatCurrency(data.financials?.totalReceivable ?? 0)}
                </p>
                <p
                  style={{
                    fontSize: "11px",
                    color: "var(--text-muted)",
                    marginTop: "4px",
                  }}
                >
                  Recebido:{" "}
                  {formatCurrency(data.financials?.totalReceived ?? 0)}
                </p>
              </div>
              <MiniSparkline
                values={salesSparkValues}
                color="#22c55e"
                width={72}
                height={32}
              />
            </div>
          </div>

          {/* Saldo */}
          <div style={chartCardStyle} {...cardHover}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                marginBottom: "8px",
              }}
            >
              <p
                style={{
                  fontSize: "11px",
                  fontWeight: 600,
                  color: "var(--text-muted)",
                  textTransform: "uppercase",
                  letterSpacing: "0.04em",
                }}
              >
                📊 Saldo
              </p>
              <TrendBadge pct={kpiTrends.balance} />
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "flex-end",
                justifyContent: "space-between",
                gap: "8px",
              }}
            >
              <div>
                <p
                  style={{
                    fontSize: "22px",
                    fontWeight: 700,
                    color:
                      (data.financials?.balance ?? 0) >= 0
                        ? "var(--accent-success)"
                        : "var(--accent-danger)",
                  }}
                >
                  {(data.financials?.balance ?? 0) >= 0 ? "+" : ""}
                  {formatCurrency(data.financials?.balance ?? 0)}
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
              <MiniSparkline
                values={balanceSparkValues}
                color={
                  (data.financials?.balance ?? 0) >= 0 ? "#22c55e" : "#ef4444"
                }
                width={72}
                height={32}
              />
            </div>
          </div>
        </div>
      </AnimSection>
    </div>
  );
}
