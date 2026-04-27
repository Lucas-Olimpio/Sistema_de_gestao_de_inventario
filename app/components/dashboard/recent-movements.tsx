import React from "react";
import {
  ArrowUpRight,
  ArrowDownRight,
  ArrowDownUp,
  ArrowRight,
} from "lucide-react";
import { DashboardData } from "@/lib/types";
import { formatDate } from "@/lib/utils";
import Link from "next/link";

interface RecentMovementsProps {
  movements: DashboardData["recentMovements"];
}

export default function RecentMovements({ movements }: RecentMovementsProps) {
  const shown = movements.slice(0, 6);
  const hasMore = movements.length > 6;

  return (
    <div
      style={{
        background: "var(--bg-card)",
        borderRadius: "var(--radius-lg)",
        border: "1px solid var(--border-color)",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "18px 22px",
          borderBottom: "1px solid var(--border-color)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
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
        {movements.length > 0 && (
          <Link
            href="/movimentacoes"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "4px",
              fontSize: "12px",
              fontWeight: 600,
              color: "var(--accent-info)",
              textDecoration: "none",
              opacity: 0.85,
              transition: "opacity 0.2s",
            }}
            onMouseEnter={(e) =>
              ((e.currentTarget as HTMLElement).style.opacity = "1")
            }
            onMouseLeave={(e) =>
              ((e.currentTarget as HTMLElement).style.opacity = "0.85")
            }
          >
            Ver todas <ArrowRight size={12} />
          </Link>
        )}
      </div>

      {/* Rows */}
      <div style={{ padding: "8px 0", flex: 1 }}>
        {shown.length === 0 ? (
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
          shown.map((mov) => (
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
                (e.currentTarget.style.background = "var(--bg-card-hover)")
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
                    flexShrink: 0,
                  }}
                >
                  {mov.type === "IN" ? (
                    <ArrowUpRight size={14} color="var(--accent-success)" />
                  ) : (
                    <ArrowDownRight size={14} color="var(--accent-danger)" />
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
                  {formatDate(mov.createdAt).split("/").slice(0, 2).join("/")}
                </p>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer "ver mais" when truncated */}
      {hasMore && (
        <Link
          href="/movimentacoes"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "6px",
            padding: "12px",
            fontSize: "12px",
            fontWeight: 600,
            color: "var(--text-muted)",
            textDecoration: "none",
            borderTop: "1px solid var(--border-color)",
            transition: "color 0.2s, background 0.2s",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.color = "var(--accent-info)";
            (e.currentTarget as HTMLElement).style.background =
              "var(--bg-card-hover)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.color = "var(--text-muted)";
            (e.currentTarget as HTMLElement).style.background = "transparent";
          }}
        >
          Ver todas as movimentações <ArrowRight size={12} />
        </Link>
      )}
    </div>
  );
}
