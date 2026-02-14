import React from "react";
import { AlertTriangle, CheckCircle } from "lucide-react";

interface ReceiptResultProps {
  result: {
    receipt: {
      items: Array<{
        productId: string;
        receivedQty: number;
        hasDivergence: boolean;
        product: { name: string; sku: string };
      }>;
    };
    divergences: Array<any>;
  };
  onClose: () => void;
}

export default function ReceiptResult({ result, onClose }: ReceiptResultProps) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      {result.divergences.length > 0 ? (
        <div
          style={{
            padding: "12px 16px",
            borderRadius: "var(--radius-md)",
            background: "var(--accent-warning-bg)",
            color: "var(--accent-warning)",
            fontSize: "13px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <AlertTriangle size={18} />
          <strong>
            {result.divergences.length} divergência(s) encontrada(s)!
          </strong>
        </div>
      ) : (
        <div
          style={{
            padding: "12px 16px",
            borderRadius: "var(--radius-md)",
            background: "var(--accent-success-bg)",
            color: "var(--accent-success)",
            fontSize: "13px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <CheckCircle size={18} />
          <strong>Recebimento confirmado sem divergências!</strong>
        </div>
      )}

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
              {["Produto", "Recebido", "Status"].map((h) => (
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
            {result.receipt.items.map((item) => (
              <tr
                key={item.productId}
                style={{
                  borderBottom: "1px solid var(--border-color)",
                  background: item.hasDivergence
                    ? "var(--accent-warning-bg)"
                    : "transparent",
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
                    fontWeight: 700,
                    color: "var(--text-primary)",
                    fontSize: "14px",
                  }}
                >
                  {item.receivedQty}
                </td>
                <td style={{ padding: "10px 14px" }}>
                  {item.hasDivergence ? (
                    <span
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                        color: "var(--accent-warning)",
                        fontWeight: 700,
                        fontSize: "12px",
                      }}
                    >
                      <AlertTriangle size={14} /> Divergência
                    </span>
                  ) : (
                    <span
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                        color: "var(--accent-success)",
                        fontWeight: 700,
                        fontSize: "12px",
                      }}
                    >
                      <CheckCircle size={14} /> OK
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p
        style={{
          fontSize: "12px",
          color: "var(--text-muted)",
          textAlign: "center",
        }}
      >
        O estoque foi atualizado e o registro de Contas a Pagar foi gerado
        automaticamente.
      </p>

      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <button
          onClick={onClose}
          style={{
            padding: "9px 18px",
            borderRadius: "var(--radius-md)",
            border: "none",
            background:
              "linear-gradient(135deg, var(--accent-primary), #a855f7)",
            color: "white",
            fontSize: "13px",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Fechar
        </button>
      </div>
    </div>
  );
}
