import React from "react";
import Modal from "@/app/components/modal";
import { PurchaseOrder } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";
import StatusBadge from "@/app/components/status-badge";

interface OrderDetailModalProps {
  order: PurchaseOrder | null;
  onClose: () => void;
}

export default function OrderDetailModal({
  order,
  onClose,
}: OrderDetailModalProps) {
  if (!order) return null;

  return (
    <Modal
      isOpen={!!order}
      onClose={onClose}
      title={`Ordem ${order.code || ""}`}
      maxWidth="640px"
    >
      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "12px",
          }}
        >
          <div>
            <p
              style={{
                fontSize: "11px",
                color: "var(--text-muted)",
                textTransform: "uppercase",
                letterSpacing: "0.04em",
                marginBottom: "4px",
              }}
            >
              Fornecedor
            </p>
            <p
              style={{
                fontSize: "14px",
                fontWeight: 600,
                color: "var(--text-primary)",
              }}
            >
              {order.supplier.name}
            </p>
          </div>
          <div>
            <p
              style={{
                fontSize: "11px",
                color: "var(--text-muted)",
                textTransform: "uppercase",
                letterSpacing: "0.04em",
                marginBottom: "4px",
              }}
            >
              Status
            </p>
            <StatusBadge status={order.status} type="purchase" />
          </div>
        </div>

        {order.notes && (
          <p
            style={{
              fontSize: "13px",
              color: "var(--text-secondary)",
              padding: "10px 14px",
              background: "var(--bg-input)",
              borderRadius: "var(--radius-md)",
            }}
          >
            {order.notes}
          </p>
        )}

        {/* Items table */}
        <div
          style={{
            border: "1px solid var(--border-color)",
            borderRadius: "var(--radius-md)",
            overflow: "hidden",
          }}
        >
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: "12px",
            }}
          >
            <thead>
              <tr
                style={{
                  background: "var(--bg-input)",
                  borderBottom: "1px solid var(--border-color)",
                }}
              >
                {["Produto", "Qtd", "Preço Unit.", "Subtotal"].map((h) => (
                  <th
                    key={h}
                    style={{
                      padding: "10px 14px",
                      textAlign: "left",
                      fontWeight: 600,
                      color: "var(--text-secondary)",
                      textTransform: "uppercase",
                      letterSpacing: "0.04em",
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {order.items.map((item) => (
                <tr
                  key={item.id}
                  style={{
                    borderBottom: "1px solid var(--border-color)",
                  }}
                >
                  <td
                    style={{
                      padding: "10px 14px",
                      fontWeight: 600,
                      color: "var(--text-primary)",
                    }}
                  >
                    {item.product.name}
                    <span
                      style={{
                        display: "block",
                        fontSize: "11px",
                        color: "var(--text-muted)",
                        fontWeight: 400,
                      }}
                    >
                      {item.product.sku}
                    </span>
                  </td>
                  <td
                    style={{
                      padding: "10px 14px",
                      color: "var(--text-primary)",
                    }}
                  >
                    {item.quantity}
                  </td>
                  <td
                    style={{
                      padding: "10px 14px",
                      color: "var(--text-secondary)",
                    }}
                  >
                    {formatCurrency(item.unitPrice)}
                  </td>
                  <td
                    style={{
                      padding: "10px 14px",
                      fontWeight: 600,
                      color: "var(--text-primary)",
                    }}
                  >
                    {formatCurrency(item.quantity * item.unitPrice)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr style={{ background: "var(--bg-input)" }}>
                <td
                  colSpan={3}
                  style={{
                    padding: "10px 14px",
                    fontWeight: 700,
                    color: "var(--text-primary)",
                    textAlign: "right",
                  }}
                >
                  Total:
                </td>
                <td
                  style={{
                    padding: "10px 14px",
                    fontWeight: 700,
                    color: "var(--accent-primary)",
                    fontSize: "14px",
                  }}
                >
                  {formatCurrency(order.totalValue)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </Modal>
  );
}
