"use client";

import { useEffect, useState } from "react";
import {
  Package,
  DollarSign,
  AlertTriangle,
  ArrowDownUp,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
} from "lucide-react";
import StatsCard from "./components/stats-card";
import DashboardSkeleton from "./components/dashboard-skeleton";
import BarChart from "./components/charts/bar-chart";
import LineChart from "./components/charts/line-chart";
import DonutChart from "./components/charts/donut-chart";
import HorizontalBarChart from "./components/charts/horizontal-bar-chart";
import { formatCurrency, formatDate } from "@/lib/utils";

/** Wrapper for staggered fade-in sections */
function AnimSection({
  delay,
  children,
}: {
  delay: number;
  children: React.ReactNode;
}) {
  return (
    <div className="fade-in-up" style={{ animationDelay: `${delay}ms` }}>
      {children}
    </div>
  );
}

/** Shared hover styles for chart card containers */
const chartCardStyle: React.CSSProperties = {
  background: "var(--bg-card)",
  borderRadius: "var(--radius-lg)",
  border: "1px solid var(--border-color)",
  padding: "20px 24px",
  transition: "border-color 0.3s, box-shadow 0.3s",
  cursor: "default",
};

function useCardHover() {
  return {
    onMouseEnter: (e: React.MouseEvent<HTMLDivElement>) => {
      e.currentTarget.style.borderColor = "var(--border-hover)";
      e.currentTarget.style.boxShadow = "var(--shadow-md)";
    },
    onMouseLeave: (e: React.MouseEvent<HTMLDivElement>) => {
      e.currentTarget.style.borderColor = "var(--border-color)";
      e.currentTarget.style.boxShadow = "none";
    },
  };
}

interface DashboardData {
  totalProducts: number;
  totalValue: number;
  totalQuantity: number;
  totalCategories: number;
  lowStock: Array<{
    id: string;
    name: string;
    sku: string;
    quantity: number;
    minStock: number;
    category: { name: string };
  }>;
  lowStockCount: number;
  recentMovements: Array<{
    id: string;
    type: string;
    quantity: number;
    reason: string;
    createdAt: string;
    product: { name: string; sku: string };
  }>;
  totalIn: number;
  totalOut: number;
  categories: Array<{ name: string; products: number; value: number }>;
  movementTimeline: Array<{ date: string; in: number; out: number }>;
  financials: {
    totalPayable: number;
    totalPaid: number;
    totalReceivable: number;
    totalReceived: number;
    balance: number;
  };
  purchaseOrdersByStatus: Record<string, number>;
  salesOrdersByStatus: Record<string, number>;
}

type PeriodKey = "today" | "7d" | "30d" | "12m" | "custom";

function getDateRange(period: PeriodKey): { from: string; to: string } {
  const today = new Date();
  const to = today.toISOString().split("T")[0];

  switch (period) {
    case "today":
      return { from: to, to };
    case "7d": {
      const d = new Date();
      d.setDate(d.getDate() - 7);
      return { from: d.toISOString().split("T")[0], to };
    }
    case "30d": {
      const d = new Date();
      d.setDate(d.getDate() - 30);
      return { from: d.toISOString().split("T")[0], to };
    }
    case "12m": {
      const d = new Date();
      d.setFullYear(d.getFullYear() - 1);
      return { from: d.toISOString().split("T")[0], to };
    }
    default:
      return { from: to, to };
  }
}

function formatShortDate(dateStr: string) {
  const [, m, d] = dateStr.split("-");
  return `${d}/${m}`;
}

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<PeriodKey>("30d");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const cardHover = useCardHover();

  useEffect(() => {
    setLoading(true);

    let from: string;
    let to: string;

    if (period === "custom") {
      if (!customFrom || !customTo) {
        setLoading(false);
        return;
      }
      from = customFrom;
      to = customTo;
    } else {
      const range = getDateRange(period);
      from = range.from;
      to = range.to;
    }

    fetch(`/api/dashboard?from=${from}&to=${to}`)
      .then((res) => res.json())
      .then((d) => {
        setData(d);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [period, customFrom, customTo]);

  if (loading && !data) {
    return <DashboardSkeleton />;
  }

  if (!data) return null;

  const periodButtons: Array<{ key: PeriodKey; label: string }> = [
    { key: "today", label: "Hoje" },
    { key: "7d", label: "7 dias" },
    { key: "30d", label: "30 dias" },
    { key: "12m", label: "12 meses" },
    { key: "custom", label: "Personalizado" },
  ];

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

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "24px",
        opacity: loading ? 0.5 : 1,
        transition: "opacity 0.3s ease",
      }}
    >
      {/* Period Filter */}
      <AnimSection delay={0}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            flexWrap: "wrap",
          }}
        >
          <Calendar size={16} color="var(--text-muted)" />
          <span
            style={{
              fontSize: "12px",
              color: "var(--text-muted)",
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.04em",
              marginRight: "4px",
            }}
          >
            Período:
          </span>
          {periodButtons.map((btn) => (
            <button
              key={btn.key}
              onClick={() => setPeriod(btn.key)}
              style={{
                padding: "6px 14px",
                borderRadius: "var(--radius-md)",
                border:
                  period === btn.key
                    ? "1px solid var(--accent-primary)"
                    : "1px solid var(--border-color)",
                background:
                  period === btn.key
                    ? "var(--accent-primary-glow)"
                    : "var(--bg-card)",
                color:
                  period === btn.key
                    ? "var(--accent-primary)"
                    : "var(--text-secondary)",
                fontSize: "12px",
                fontWeight: period === btn.key ? 600 : 500,
                cursor: "pointer",
                transition: "all 0.2s",
              }}
            >
              {btn.label}
            </button>
          ))}
          {period === "custom" && (
            <>
              <input
                type="date"
                value={customFrom}
                onChange={(e) => setCustomFrom(e.target.value)}
                style={{
                  padding: "5px 10px",
                  borderRadius: "var(--radius-md)",
                  border: "1px solid var(--border-color)",
                  background: "var(--bg-input)",
                  color: "var(--text-primary)",
                  fontSize: "12px",
                }}
              />
              <span style={{ color: "var(--text-muted)", fontSize: "12px" }}>
                até
              </span>
              <input
                type="date"
                value={customTo}
                onChange={(e) => setCustomTo(e.target.value)}
                style={{
                  padding: "5px 10px",
                  borderRadius: "var(--radius-md)",
                  border: "1px solid var(--border-color)",
                  background: "var(--bg-input)",
                  color: "var(--text-primary)",
                  fontSize: "12px",
                }}
              />
            </>
          )}
        </div>
      </AnimSection>

      {/* KPI Cards */}
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

      {/* Financial Overview Cards */}
      <AnimSection delay={160}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: "16px",
          }}
        >
          <div
            style={{
              ...chartCardStyle,
            }}
            {...cardHover}
          >
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
          <div
            style={{
              ...chartCardStyle,
            }}
            {...cardHover}
          >
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
          <div
            style={{
              ...chartCardStyle,
            }}
            {...cardHover}
          >
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

      {/* Movements Timeline Chart */}
      <AnimSection delay={240}>
        <div
          style={{
            ...chartCardStyle,
          }}
          {...cardHover}
        >
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
          <div
            style={{
              ...chartCardStyle,
            }}
            {...cardHover}
          >
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
          <div
            style={{
              ...chartCardStyle,
            }}
            {...cardHover}
          >
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
          <div
            style={{
              ...chartCardStyle,
            }}
            {...cardHover}
          >
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
          <div
            style={{
              ...chartCardStyle,
            }}
            {...cardHover}
          >
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

      {/* Low Stock + Recent Movements */}
      <AnimSection delay={480}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "16px",
          }}
        >
          {/* Low Stock Alert */}
          <div
            style={{
              background: "var(--bg-card)",
              borderRadius: "var(--radius-lg)",
              border: "1px solid var(--border-color)",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                padding: "18px 22px",
                borderBottom: "1px solid var(--border-color)",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <AlertTriangle size={18} color="var(--accent-warning)" />
              <h3
                style={{
                  fontSize: "14px",
                  fontWeight: 700,
                  color: "var(--text-primary)",
                }}
              >
                Produtos com Estoque Baixo
              </h3>
            </div>
            <div style={{ padding: "8px 0" }}>
              {data.lowStock.length === 0 ? (
                <p
                  style={{
                    padding: "20px 22px",
                    color: "var(--text-muted)",
                    fontSize: "13px",
                    textAlign: "center",
                  }}
                >
                  ✅ Todos os produtos estão com estoque adequado
                </p>
              ) : (
                data.lowStock.slice(0, 6).map((product) => (
                  <div
                    key={product.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "10px 22px",
                      borderBottom: "1px solid var(--border-color)",
                      transition: "background 0.2s",
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background =
                        "var(--bg-card-hover)")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.background = "transparent")
                    }
                  >
                    <div>
                      <p
                        style={{
                          fontSize: "13px",
                          fontWeight: 600,
                          color: "var(--text-primary)",
                        }}
                      >
                        {product.name}
                      </p>
                      <p
                        style={{
                          fontSize: "11px",
                          color: "var(--text-muted)",
                          marginTop: "2px",
                        }}
                      >
                        {product.sku} · {product.category.name}
                      </p>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <p
                        style={{
                          fontSize: "14px",
                          fontWeight: 700,
                          color:
                            product.quantity === 0
                              ? "var(--accent-danger)"
                              : "var(--accent-warning)",
                        }}
                      >
                        {product.quantity}
                      </p>
                      <p
                        style={{
                          fontSize: "11px",
                          color: "var(--text-muted)",
                        }}
                      >
                        min: {product.minStock}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Recent Movements */}
          <div
            style={{
              background: "var(--bg-card)",
              borderRadius: "var(--radius-lg)",
              border: "1px solid var(--border-color)",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                padding: "18px 22px",
                borderBottom: "1px solid var(--border-color)",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <ArrowDownUp size={18} color="var(--accent-info)" />
              <h3
                style={{
                  fontSize: "14px",
                  fontWeight: 700,
                  color: "var(--text-primary)",
                }}
              >
                Movimentações Recentes
              </h3>
            </div>
            <div style={{ padding: "8px 0" }}>
              {data.recentMovements.length === 0 ? (
                <p
                  style={{
                    padding: "20px 22px",
                    color: "var(--text-muted)",
                    fontSize: "13px",
                    textAlign: "center",
                  }}
                >
                  Sem movimentações no período
                </p>
              ) : (
                data.recentMovements.slice(0, 6).map((mov) => (
                  <div
                    key={mov.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "10px 22px",
                      borderBottom: "1px solid var(--border-color)",
                      transition: "background 0.2s",
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background =
                        "var(--bg-card-hover)")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.background = "transparent")
                    }
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                      }}
                    >
                      <div
                        style={{
                          width: 28,
                          height: 28,
                          borderRadius: "var(--radius-sm)",
                          background:
                            mov.type === "IN"
                              ? "var(--accent-success-bg)"
                              : "var(--accent-danger-bg)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        {mov.type === "IN" ? (
                          <ArrowUpRight
                            size={14}
                            color="var(--accent-success)"
                          />
                        ) : (
                          <ArrowDownRight
                            size={14}
                            color="var(--accent-danger)"
                          />
                        )}
                      </div>
                      <div>
                        <p
                          style={{
                            fontSize: "13px",
                            fontWeight: 600,
                            color: "var(--text-primary)",
                          }}
                        >
                          {mov.product.name}
                        </p>
                        <p
                          style={{
                            fontSize: "11px",
                            color: "var(--text-muted)",
                            marginTop: "2px",
                          }}
                        >
                          {mov.reason || "Sem motivo"}
                        </p>
                      </div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <p
                        style={{
                          fontSize: "13px",
                          fontWeight: 600,
                          color:
                            mov.type === "IN"
                              ? "var(--accent-success)"
                              : "var(--accent-danger)",
                        }}
                      >
                        {mov.type === "IN" ? "+" : "-"}
                        {mov.quantity}
                      </p>
                      <p
                        style={{
                          fontSize: "11px",
                          color: "var(--text-muted)",
                        }}
                      >
                        {formatDate(mov.createdAt)}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </AnimSection>
    </div>
  );
}
