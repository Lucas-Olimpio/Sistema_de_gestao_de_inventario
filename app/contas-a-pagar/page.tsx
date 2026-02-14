"use client";

import { useEffect, useState } from "react";
import { Wallet, CheckCircle } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";

interface Payable {
  id: string;
  amount: number;
  status: string;
  dueDate: string | null;
  paidAt: string | null;
  createdAt: string;
  purchaseOrder: {
    code: string;
    supplier: { name: string };
  };
}

export default function ContasAPagarPage() {
  const [payables, setPayables] = useState<Payable[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPayables = async () => {
    const res = await fetch("/api/accounts-payable");
    const data = await res.json();
    setPayables(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchPayables();
  }, []);

  const markAsPaid = async (id: string) => {
    if (!confirm("Confirmar pagamento desta conta?")) return;
    const res = await fetch("/api/accounts-payable", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    if (res.ok) {
      fetchPayables();
    } else {
      const data = await res.json();
      alert(data.error || "Erro ao marcar como pago");
    }
  };

  const totalPending = payables
    .filter((p) => p.status === "PENDENTE")
    .reduce((sum, p) => sum + p.amount, 0);

  const totalPaid = payables
    .filter((p) => p.status === "PAGO")
    .reduce((sum, p) => sum + p.amount, 0);

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
            Total Pendente
          </p>
          <p
            style={{
              fontSize: "24px",
              fontWeight: 700,
              color: "var(--accent-warning)",
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
            Total Pago
          </p>
          <p
            style={{
              fontSize: "24px",
              fontWeight: 700,
              color: "var(--accent-success)",
            }}
          >
            {formatCurrency(totalPaid)}
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
        ) : payables.length === 0 ? (
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
            <Wallet size={40} strokeWidth={1} />
            <p style={{ fontSize: "15px", fontWeight: 500 }}>
              Nenhuma conta a pagar registrada
            </p>
            <p style={{ fontSize: "12px" }}>
              As contas são geradas automaticamente ao confirmar o recebimento
              de uma ordem de compra.
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
                  "Ordem",
                  "Fornecedor",
                  "Valor",
                  "Status",
                  "Criado em",
                  "Pago em",
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
              {payables.map((p) => (
                <tr
                  key={p.id}
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
                    {p.purchaseOrder.code}
                  </td>
                  <td
                    style={{
                      padding: "14px 16px",
                      fontWeight: 600,
                      color: "var(--text-primary)",
                    }}
                  >
                    {p.purchaseOrder.supplier.name}
                  </td>
                  <td
                    style={{
                      padding: "14px 16px",
                      fontWeight: 700,
                      color: "var(--text-primary)",
                      fontSize: "14px",
                    }}
                  >
                    {formatCurrency(p.amount)}
                  </td>
                  <td style={{ padding: "14px 16px" }}>
                    <span
                      style={{
                        padding: "4px 10px",
                        borderRadius: "var(--radius-sm)",
                        background:
                          p.status === "PAGO"
                            ? "var(--accent-success-bg)"
                            : "var(--accent-warning-bg)",
                        color:
                          p.status === "PAGO"
                            ? "var(--accent-success)"
                            : "var(--accent-warning)",
                        fontSize: "11px",
                        fontWeight: 700,
                      }}
                    >
                      {p.status === "PAGO" ? "Pago" : "Pendente"}
                    </span>
                  </td>
                  <td
                    style={{
                      padding: "14px 16px",
                      color: "var(--text-muted)",
                      fontSize: "12px",
                    }}
                  >
                    {formatDate(p.createdAt)}
                  </td>
                  <td
                    style={{
                      padding: "14px 16px",
                      color: "var(--text-muted)",
                      fontSize: "12px",
                    }}
                  >
                    {p.paidAt ? formatDate(p.paidAt) : "—"}
                  </td>
                  <td style={{ padding: "14px 16px" }}>
                    {p.status === "PENDENTE" && (
                      <button
                        onClick={() => markAsPaid(p.id)}
                        title="Marcar como Pago"
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
                        Pagar
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
