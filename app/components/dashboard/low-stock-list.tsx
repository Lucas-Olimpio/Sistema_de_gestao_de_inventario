import React from "react";
import { AlertTriangle } from "lucide-react";
import { DashboardData } from "@/lib/types";

interface LowStockListProps {
  items: DashboardData["lowStock"];
}

export default function LowStockList({ items }: LowStockListProps) {
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
        {items.length === 0 ? (
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
          items.slice(0, 6).map((product) => (
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
                (e.currentTarget.style.background = "var(--bg-card-hover)")
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
  );
}
