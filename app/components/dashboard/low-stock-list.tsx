import React from "react";
import { AlertTriangle, ArrowRight } from "lucide-react";
import { DashboardData } from "@/lib/types";
import Link from "next/link";

interface LowStockListProps {
  items: DashboardData["lowStock"];
}

export default function LowStockList({ items }: LowStockListProps) {
  const shown = items.slice(0, 6);
  const hasMore = items.length > 6;

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
        {items.length > 0 && (
          <Link
            href="/produtos"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "4px",
              fontSize: "12px",
              fontWeight: 600,
              color: "var(--accent-warning)",
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
            Ver todos <ArrowRight size={12} />
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
            ✅ Todos os produtos estão com estoque adequado
          </p>
        ) : (
          shown.map((product) => (
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

      {/* Footer "ver mais" when truncated */}
      {hasMore && (
        <Link
          href="/produtos"
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
            (e.currentTarget as HTMLElement).style.color =
              "var(--accent-warning)";
            (e.currentTarget as HTMLElement).style.background =
              "var(--bg-card-hover)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.color = "var(--text-muted)";
            (e.currentTarget as HTMLElement).style.background = "transparent";
          }}
        >
          Ver todos os {items.length} produtos <ArrowRight size={12} />
        </Link>
      )}
    </div>
  );
}
