"use client";

import { useEffect, useState } from "react";
import {
  ClipboardCheck,
  AlertTriangle,
  CheckCircle,
  Package,
} from "lucide-react";
import Modal from "../components/modal";
import { formatCurrency, formatDate } from "@/lib/utils";

interface POItem {
  id: string;
  productId: string;
  quantity: number;
  unitPrice: number;
  product: { name: string; sku: string };
}

interface PurchaseOrder {
  id: string;
  code: string;
  status: string;
  totalValue: number;
  supplier: { name: string };
  items: POItem[];
  createdAt: string;
}

interface ReceiveFormItem {
  productId: string;
  productName: string;
  productSku: string;
  receivedQty: string;
}

interface ReceiptResult {
  receipt: {
    items: Array<{
      productId: string;
      receivedQty: number;
      hasDivergence: boolean;
      product: { name: string; sku: string };
    }>;
  };
  divergences: Array<{
    productId: string;
    receivedQty: number;
    hasDivergence: boolean;
  }>;
}

export default function RecebimentoPage() {
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [receiveModalOpen, setReceiveModalOpen] = useState(false);
  const [resultModalOpen, setResultModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<PurchaseOrder | null>(
    null,
  );
  const [receiveItems, setReceiveItems] = useState<ReceiveFormItem[]>([]);
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<ReceiptResult | null>(null);
  const [error, setError] = useState("");

  const fetchOrders = async () => {
    // Fetch orders that are ready for receiving (EM_TRANSITO or APROVADA)
    const [res1, res2] = await Promise.all([
      fetch("/api/purchase-orders?status=EM_TRANSITO"),
      fetch("/api/purchase-orders?status=APROVADA"),
    ]);
    const [d1, d2] = await Promise.all([res1.json(), res2.json()]);
    setOrders([...d1, ...d2]);
    setLoading(false);
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const openReceive = (order: PurchaseOrder) => {
    setSelectedOrder(order);
    setError("");
    // Blind conference: we show the items but NOT the ordered quantity
    setReceiveItems(
      order.items.map((item) => ({
        productId: item.productId,
        productName: item.product.name,
        productSku: item.product.sku,
        receivedQty: "",
      })),
    );
    setReceiveModalOpen(true);
  };

  const handleReceive = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder) return;
    setSaving(true);
    setError("");

    const items = receiveItems.map((item) => ({
      productId: item.productId,
      receivedQty: parseInt(item.receivedQty) || 0,
    }));

    const res = await fetch("/api/goods-receipts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        purchaseOrderId: selectedOrder.id,
        notes: null,
        items,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      setResult({
        ...data,
        // Merge with PO items for comparison display
        poItems: selectedOrder.items,
      });
      setReceiveModalOpen(false);
      setResultModalOpen(true);
      fetchOrders();
    } else {
      const data = await res.json();
      setError(data.error || "Erro ao registrar recebimento");
    }
    setSaving(false);
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "10px 14px",
    borderRadius: "var(--radius-md)",
    border: "1px solid var(--border-color)",
    background: "var(--bg-input)",
    color: "var(--text-primary)",
    fontSize: "14px",
    outline: "none",
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* Toolbar */}
      <div>
        <p style={{ fontSize: "14px", color: "var(--text-secondary)" }}>
          Conferência cega de mercadorias — Registre o recebimento das ordens de
          compra
        </p>
      </div>

      {/* Orders ready for receiving */}
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
          <Package size={18} color="var(--accent-info)" />
          <h3
            style={{
              fontSize: "14px",
              fontWeight: 700,
              color: "var(--text-primary)",
            }}
          >
            Ordens Aguardando Recebimento
          </h3>
        </div>

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
        ) : orders.length === 0 ? (
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
            <ClipboardCheck size={40} strokeWidth={1} />
            <p style={{ fontSize: "15px", fontWeight: 500 }}>
              Nenhuma ordem aguardando recebimento
            </p>
          </div>
        ) : (
          <div style={{ padding: "8px 0" }}>
            {orders.map((order) => (
              <div
                key={order.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "14px 22px",
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
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      marginBottom: "4px",
                    }}
                  >
                    <span
                      style={{
                        fontFamily: "monospace",
                        fontWeight: 700,
                        color: "var(--accent-primary)",
                        fontSize: "14px",
                      }}
                    >
                      {order.code}
                    </span>
                    <span
                      style={{
                        padding: "3px 8px",
                        borderRadius: "var(--radius-sm)",
                        background:
                          order.status === "EM_TRANSITO"
                            ? "rgba(168, 85, 247, 0.1)"
                            : "var(--accent-info-bg)",
                        color:
                          order.status === "EM_TRANSITO"
                            ? "#a855f7"
                            : "var(--accent-info)",
                        fontSize: "10px",
                        fontWeight: 700,
                      }}
                    >
                      {order.status === "EM_TRANSITO"
                        ? "Em Trânsito"
                        : "Aprovada"}
                    </span>
                  </div>
                  <p
                    style={{
                      fontSize: "13px",
                      color: "var(--text-secondary)",
                    }}
                  >
                    {order.supplier.name} · {order.items.length} itens ·{" "}
                    {formatCurrency(order.totalValue)}
                  </p>
                  <p
                    style={{
                      fontSize: "11px",
                      color: "var(--text-muted)",
                      marginTop: "2px",
                    }}
                  >
                    Criada em {formatDate(order.createdAt)}
                  </p>
                </div>
                <button
                  onClick={() => openReceive(order)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "9px 16px",
                    borderRadius: "var(--radius-md)",
                    background: "var(--accent-success)",
                    color: "white",
                    fontSize: "13px",
                    fontWeight: 600,
                    border: "none",
                    cursor: "pointer",
                    boxShadow: "0 2px 8px rgba(34, 197, 94, 0.3)",
                  }}
                >
                  <ClipboardCheck size={16} />
                  Receber
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Blind Conference Modal */}
      <Modal
        isOpen={receiveModalOpen}
        onClose={() => setReceiveModalOpen(false)}
        title={`Conferência — ${selectedOrder?.code || ""}`}
        maxWidth="600px"
      >
        {error && (
          <div
            style={{
              padding: "10px 14px",
              borderRadius: "var(--radius-md)",
              background: "var(--accent-danger-bg)",
              color: "var(--accent-danger)",
              fontSize: "13px",
              marginBottom: "16px",
            }}
          >
            {error}
          </div>
        )}
        <div
          style={{
            padding: "10px 14px",
            borderRadius: "var(--radius-md)",
            background: "var(--accent-warning-bg)",
            color: "var(--accent-warning)",
            fontSize: "12px",
            marginBottom: "16px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <AlertTriangle size={16} />
          <span>
            <strong>Conferência Cega:</strong> Informe a quantidade recebida
            para cada item. A quantidade pedida será revelada após o registro.
          </span>
        </div>
        <form
          onSubmit={handleReceive}
          style={{ display: "flex", flexDirection: "column", gap: "12px" }}
        >
          {receiveItems.map((item, i) => (
            <div
              key={item.productId}
              style={{
                display: "grid",
                gridTemplateColumns: "2fr 1fr",
                gap: "12px",
                alignItems: "center",
                padding: "12px 14px",
                background: "var(--bg-input)",
                borderRadius: "var(--radius-md)",
                border: "1px solid var(--border-color)",
              }}
            >
              <div>
                <p
                  style={{
                    fontSize: "13px",
                    fontWeight: 600,
                    color: "var(--text-primary)",
                  }}
                >
                  {item.productName}
                </p>
                <p
                  style={{
                    fontSize: "11px",
                    color: "var(--text-muted)",
                    fontFamily: "monospace",
                  }}
                >
                  {item.productSku}
                </p>
              </div>
              <input
                required
                type="number"
                min="0"
                value={item.receivedQty}
                onChange={(e) => {
                  const updated = [...receiveItems];
                  updated[i] = {
                    ...updated[i],
                    receivedQty: e.target.value,
                  };
                  setReceiveItems(updated);
                }}
                placeholder="Qtd recebida"
                style={{
                  ...inputStyle,
                  padding: "8px 10px",
                  fontSize: "14px",
                  fontWeight: 700,
                  textAlign: "center",
                }}
              />
            </div>
          ))}
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              gap: "10px",
              marginTop: "8px",
            }}
          >
            <button
              type="button"
              onClick={() => setReceiveModalOpen(false)}
              style={{
                padding: "9px 18px",
                borderRadius: "var(--radius-md)",
                border: "1px solid var(--border-color)",
                background: "transparent",
                color: "var(--text-secondary)",
                fontSize: "13px",
                cursor: "pointer",
              }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              style={{
                padding: "9px 18px",
                borderRadius: "var(--radius-md)",
                border: "none",
                background: "var(--accent-success)",
                color: "white",
                fontSize: "13px",
                fontWeight: 600,
                cursor: saving ? "not-allowed" : "pointer",
                opacity: saving ? 0.7 : 1,
              }}
            >
              {saving ? "Registrando..." : "Confirmar Recebimento"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Result Modal */}
      <Modal
        isOpen={resultModalOpen}
        onClose={() => setResultModalOpen(false)}
        title="Resultado do Recebimento"
        maxWidth="600px"
      >
        {result && (
          <div
            style={{ display: "flex", flexDirection: "column", gap: "16px" }}
          >
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
                onClick={() => setResultModalOpen(false)}
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
        )}
      </Modal>
    </div>
  );
}
