"use client";

import { useEffect, useState } from "react";
import { HandCoins, CheckCircle } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";

interface Receivable {
  id: string;
  amount: number;
  status: string;
  dueDate: string | null;
  receivedAt: string | null;
  createdAt: string;
  salesOrder: {
    code: string;
    customer: { name: string };
  };
}

export default function ContasAReceberPage() {
  const [receivables, setReceivables] = useState<Receivable[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchReceivables = async () => {
    const res = await fetch("/api/accounts-receivable");
    const data = await res.json();
    setReceivables(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchReceivables();
  }, []);

  const markAsReceived = async (id: string) => {
    if (!confirm("Confirmar recebimento desta conta?")) return;
    const res = await fetch("/api/accounts-receivable", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    if (res.ok) {
      fetchReceivables();
    } else {
      const data = await res.json();
      alert(data.error || "Erro ao marcar como recebido");
    }
  };

  const totalPending = receivables
    .filter((r) => r.status === "PENDENTE")
    .reduce((sum, r) => sum + r.amount, 0);

  const totalReceived = receivables
    .filter((r) => r.status === "RECEBIDO")
    .reduce((sum, r) => sum + r.amount, 0);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* Stats */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "16px",
        }}
      >
        <div
          style={{
            background: "var(--bg-card)",
            borderRadius: "var(--radius-lg)",
            border: "1px solid var(--border-color)",
            padding: "20px 24px",
          }}
        >
          <p
            style={{
              fontSize: "12px",
              fontWeight: 600,
              color: "var(--text-muted)",
              textTransform: "uppercase",
              letterSpacing: "0.04em",
              marginBottom: "8px",
            }}
          >
            Total a Receber
          </p>
          <p
            style={{
              fontSize: "24px",
              fontWeight: 700,
              color: "var(--accent-info)",
            }}
          >
            {formatCurrency(totalPending)}
          </p>
        </div>
        <div
          style={{
            background: "var(--bg-card)",
            borderRadius: "var(--radius-lg)",
            border: "1px solid var(--border-color)",
            padding: "20px 24px",
          }}
        >
          <p
            style={{
              fontSize: "12px",
              fontWeight: 600,
              color: "var(--text-muted)",
              textTransform: "uppercase",
              letterSpacing: "0.04em",
              marginBottom: "8px",
            }}
          >
            Total Recebido
          </p>
          <p
            style={{
              fontSize: "24px",
              fontWeight: 700,
              color: "var(--accent-success)",
            }}
          >
            {formatCurrency(totalReceived)}
          </p>
        </div>
      </div>

      {/* Table */}
      <div
        style={{
          background: "var(--bg-card)",
          borderRadius: "var(--radius-lg)",
          border: "1px solid var(--border-color)",
          overflow: "hidden",
        }}
      >
        {loading ? (
          <div
            style={{
              padding: "40px",
              textAlign: "center",
              color: "var(--text-muted)",
            }}
          >
            Carregando...
          </div>
        ) : receivables.length === 0 ? (
          <div
            style={{
              padding: "60px 40px",
              textAlign: "center",
              color: "var(--text-muted)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "12px",
            }}
          >
            <HandCoins size={40} strokeWidth={1} />
            <p style={{ fontSize: "15px", fontWeight: 500 }}>
              Nenhuma conta a receber registrada
            </p>
            <p style={{ fontSize: "12px" }}>
              As contas são geradas automaticamente ao faturar um pedido de
              venda.
            </p>
          </div>
        ) : (
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: "13px",
            }}
          >
            <thead>
              <tr
                style={{
                  borderBottom: "1px solid var(--border-color)",
                  background: "var(--bg-input)",
                }}
              >
                {[
                  "Pedido",
                  "Cliente",
                  "Valor",
                  "Status",
                  "Criado em",
                  "Recebido em",
                  "Ação",
                ].map((h) => (
                  <th
                    key={h}
                    style={{
                      padding: "12px 16px",
                      textAlign: "left",
                      fontWeight: 600,
                      color: "var(--text-secondary)",
                      fontSize: "12px",
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
              {receivables.map((r) => (
                <tr
                  key={r.id}
                  style={{
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
                  <td
                    style={{
                      padding: "14px 16px",
                      fontWeight: 700,
                      color: "var(--accent-primary)",
                      fontFamily: "monospace",
                    }}
                  >
                    {r.salesOrder.code}
                  </td>
                  <td
                    style={{
                      padding: "14px 16px",
                      fontWeight: 600,
                      color: "var(--text-primary)",
                    }}
                  >
                    {r.salesOrder.customer.name}
                  </td>
                  <td
                    style={{
                      padding: "14px 16px",
                      fontWeight: 700,
                      color: "var(--text-primary)",
                      fontSize: "14px",
                    }}
                  >
                    {formatCurrency(r.amount)}
                  </td>
                  <td style={{ padding: "14px 16px" }}>
                    <span
                      style={{
                        padding: "4px 10px",
                        borderRadius: "var(--radius-sm)",
                        background:
                          r.status === "RECEBIDO"
                            ? "var(--accent-success-bg)"
                            : "var(--accent-info-bg)",
                        color:
                          r.status === "RECEBIDO"
                            ? "var(--accent-success)"
                            : "var(--accent-info)",
                        fontSize: "11px",
                        fontWeight: 700,
                      }}
                    >
                      {r.status === "RECEBIDO" ? "Recebido" : "Pendente"}
                    </span>
                  </td>
                  <td
                    style={{
                      padding: "14px 16px",
                      color: "var(--text-muted)",
                      fontSize: "12px",
                    }}
                  >
                    {formatDate(r.createdAt)}
                  </td>
                  <td
                    style={{
                      padding: "14px 16px",
                      color: "var(--text-muted)",
                      fontSize: "12px",
                    }}
                  >
                    {r.receivedAt ? formatDate(r.receivedAt) : "—"}
                  </td>
                  <td style={{ padding: "14px 16px" }}>
                    {r.status === "PENDENTE" && (
                      <button
                        onClick={() => markAsReceived(r.id)}
                        title="Marcar como Recebido"
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "6px",
                          padding: "6px 12px",
                          borderRadius: "var(--radius-sm)",
                          border: "1px solid var(--accent-success)",
                          background: "var(--accent-success-bg)",
                          color: "var(--accent-success)",
                          fontSize: "12px",
                          fontWeight: 600,
                          cursor: "pointer",
                        }}
                      >
                        <CheckCircle size={14} />
                        Receber
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
