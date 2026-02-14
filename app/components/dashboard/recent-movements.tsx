import React from "react";
import { ArrowUpRight, ArrowDownRight, ArrowDownUp } from "lucide-react";
import { DashboardData } from "@/lib/types";
import { formatDate } from "@/lib/utils";

interface RecentMovementsProps {
  movements: DashboardData["recentMovements"];
}

export default function RecentMovements({ movements }: RecentMovementsProps) {
  return (
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
        {movements.length === 0 ? (
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
          movements.slice(0, 6).map((mov) => (
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
    </div>
  );
}
