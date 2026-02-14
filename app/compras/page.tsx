"use client";

import { useEffect, useState } from "react";
import {
  Plus,
  ShoppingCart,
  Trash2,
  Check,
  Truck,
  XCircle,
} from "lucide-react";
import Modal from "../components/modal";
import { formatCurrency, formatDate } from "@/lib/utils";

interface Product {
  id: string;
  name: string;
  sku: string;
  price: number;
}

interface Supplier {
  id: string;
  name: string;
}

interface POItem {
  id: string;
  productId: string;
  quantity: number;
  unitPrice: number;
  receivedQty: number;
  product: { name: string; sku: string };
}

interface PurchaseOrder {
  id: string;
  code: string;
  status: string;
  totalValue: number;
  notes: string | null;
  createdAt: string;
  supplier: Supplier;
  items: POItem[];
}

const statusConfig: Record<
  string,
  { label: string; bg: string; color: string }
> = {
  PENDENTE: {
    label: "Pendente",
    bg: "var(--accent-warning-bg)",
    color: "var(--accent-warning)",
  },
  APROVADA: {
    label: "Aprovada",
    bg: "var(--accent-info-bg)",
    color: "var(--accent-info)",
  },
  EM_TRANSITO: {
    label: "Em Trânsito",
    bg: "rgba(168, 85, 247, 0.1)",
    color: "#a855f7",
  },
  RECEBIDA: {
    label: "Recebida",
    bg: "var(--accent-success-bg)",
    color: "var(--accent-success)",
  },
  CANCELADA: {
    label: "Cancelada",
    bg: "var(--accent-danger-bg)",
    color: "var(--accent-danger)",
  },
};

export default function ComprasPage() {
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [detailOrder, setDetailOrder] = useState<PurchaseOrder | null>(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [statusFilter, setStatusFilter] = useState("");

  const [form, setForm] = useState({
    supplierId: "",
    notes: "",
  });
  const [formItems, setFormItems] = useState<
    Array<{ productId: string; quantity: string; unitPrice: string }>
  >([{ productId: "", quantity: "", unitPrice: "" }]);

  const fetchOrders = async () => {
    const url = statusFilter
      ? `/api/purchase-orders?status=${statusFilter}`
      : "/api/purchase-orders";
    const res = await fetch(url);
    const data = await res.json();
    setOrders(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchOrders();
    fetch("/api/suppliers")
      .then((r) => r.json())
      .then(setSuppliers);
    fetch("/api/products")
      .then((r) => r.json())
      .then(setProducts);
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [statusFilter]);

  const addItem = () => {
    setFormItems([
      ...formItems,
      { productId: "", quantity: "", unitPrice: "" },
    ]);
  };

  const removeItem = (index: number) => {
    setFormItems(formItems.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: string, value: string) => {
    const updated = [...formItems];
    updated[index] = { ...updated[index], [field]: value };
    // Auto-fill unit price from product
    if (field === "productId" && value) {
      const product = products.find((p) => p.id === value);
      if (product) {
        updated[index].unitPrice = product.price.toString();
      }
    }
    setFormItems(updated);
  };

  const formTotal = formItems.reduce((sum, item) => {
    const qty = parseFloat(item.quantity) || 0;
    const price = parseFloat(item.unitPrice) || 0;
    return sum + qty * price;
  }, 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    const items = formItems
      .filter((i) => i.productId && i.quantity && i.unitPrice)
      .map((i) => ({
        productId: i.productId,
        quantity: parseInt(i.quantity),
        unitPrice: parseFloat(i.unitPrice),
      }));

    if (items.length === 0) {
      setError("Adicione pelo menos um item à ordem");
      setSaving(false);
      return;
    }

    const res = await fetch("/api/purchase-orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, items }),
    });

    if (res.ok) {
      setModalOpen(false);
      setForm({ supplierId: "", notes: "" });
      setFormItems([{ productId: "", quantity: "", unitPrice: "" }]);
      fetchOrders();
    } else {
      const data = await res.json();
      setError(data.error || "Erro ao criar ordem");
    }
    setSaving(false);
  };

  const updateStatus = async (id: string, status: string) => {
    const res = await fetch(`/api/purchase-orders/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      fetchOrders();
      setDetailOrder(null);
    } else {
      const data = await res.json();
      alert(data.error || "Erro ao atualizar status");
    }
  };

  const deleteOrder = async (id: string) => {
    if (!confirm("Excluir esta ordem de compra?")) return;
    const res = await fetch(`/api/purchase-orders/${id}`, {
      method: "DELETE",
    });
    if (res.ok) {
      fetchOrders();
    } else {
      const data = await res.json();
      alert(data.error || "Erro ao excluir");
    }
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

  const labelStyle: React.CSSProperties = {
    fontSize: "13px",
    fontWeight: 600,
    color: "var(--text-secondary)",
    marginBottom: "6px",
    display: "block",
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* Toolbar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <p style={{ fontSize: "14px", color: "var(--text-secondary)" }}>
            Ordens de Compra
          </p>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{
              ...inputStyle,
              width: "auto",
              padding: "6px 12px",
              fontSize: "12px",
              cursor: "pointer",
            }}
          >
            <option value="">Todos</option>
            <option value="PENDENTE">Pendente</option>
            <option value="APROVADA">Aprovada</option>
            <option value="EM_TRANSITO">Em Trânsito</option>
            <option value="RECEBIDA">Recebida</option>
            <option value="CANCELADA">Cancelada</option>
          </select>
        </div>
        <button
          onClick={() => {
            setError("");
            setForm({ supplierId: "", notes: "" });
            setFormItems([{ productId: "", quantity: "", unitPrice: "" }]);
            setModalOpen(true);
          }}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            padding: "10px 18px",
            borderRadius: "var(--radius-md)",
            background:
              "linear-gradient(135deg, var(--accent-primary), #a855f7)",
            color: "white",
            fontSize: "13px",
            fontWeight: 600,
            border: "none",
            cursor: "pointer",
            boxShadow: "0 2px 8px rgba(99, 102, 241, 0.3)",
          }}
        >
          <Plus size={18} />
          Nova Ordem de Compra
        </button>
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
            <ShoppingCart size={40} strokeWidth={1} />
            <p style={{ fontSize: "15px", fontWeight: 500 }}>
              Nenhuma ordem de compra encontrada
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
                  "Código",
                  "Fornecedor",
                  "Itens",
                  "Valor Total",
                  "Status",
                  "Data",
                  "Ações",
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
              {orders.map((order) => {
                const sc = statusConfig[order.status] || statusConfig.PENDENTE;
                return (
                  <tr
                    key={order.id}
                    style={{
                      borderBottom: "1px solid var(--border-color)",
                      transition: "background 0.2s",
                      cursor: "pointer",
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background =
                        "var(--bg-card-hover)")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.background = "transparent")
                    }
                    onClick={() => setDetailOrder(order)}
                  >
                    <td
                      style={{
                        padding: "14px 16px",
                        fontWeight: 700,
                        color: "var(--accent-primary)",
                        fontFamily: "monospace",
                      }}
                    >
                      {order.code}
                    </td>
                    <td
                      style={{
                        padding: "14px 16px",
                        fontWeight: 600,
                        color: "var(--text-primary)",
                      }}
                    >
                      {order.supplier.name}
                    </td>
                    <td
                      style={{
                        padding: "14px 16px",
                        color: "var(--text-muted)",
                      }}
                    >
                      {order.items.length}
                    </td>
                    <td
                      style={{
                        padding: "14px 16px",
                        fontWeight: 600,
                        color: "var(--text-primary)",
                      }}
                    >
                      {formatCurrency(order.totalValue)}
                    </td>
                    <td style={{ padding: "14px 16px" }}>
                      <span
                        style={{
                          padding: "4px 10px",
                          borderRadius: "var(--radius-sm)",
                          background: sc.bg,
                          color: sc.color,
                          fontSize: "11px",
                          fontWeight: 700,
                          letterSpacing: "0.02em",
                        }}
                      >
                        {sc.label}
                      </span>
                    </td>
                    <td
                      style={{
                        padding: "14px 16px",
                        color: "var(--text-muted)",
                        fontSize: "12px",
                      }}
                    >
                      {formatDate(order.createdAt)}
                    </td>
                    <td
                      style={{ padding: "14px 16px" }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div style={{ display: "flex", gap: "6px" }}>
                        {order.status === "PENDENTE" && (
                          <>
                            <button
                              onClick={() => updateStatus(order.id, "APROVADA")}
                              title="Aprovar"
                              style={{
                                width: 32,
                                height: 32,
                                borderRadius: "var(--radius-sm)",
                                border: "1px solid var(--border-color)",
                                background: "transparent",
                                color: "var(--accent-success)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                cursor: "pointer",
                              }}
                            >
                              <Check size={14} />
                            </button>
                            <button
                              onClick={() => deleteOrder(order.id)}
                              title="Excluir"
                              style={{
                                width: 32,
                                height: 32,
                                borderRadius: "var(--radius-sm)",
                                border: "1px solid var(--border-color)",
                                background: "transparent",
                                color: "var(--accent-danger)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                cursor: "pointer",
                              }}
                            >
                              <Trash2 size={14} />
                            </button>
                          </>
                        )}
                        {order.status === "APROVADA" && (
                          <button
                            onClick={() =>
                              updateStatus(order.id, "EM_TRANSITO")
                            }
                            title="Marcar Em Trânsito"
                            style={{
                              width: 32,
                              height: 32,
                              borderRadius: "var(--radius-sm)",
                              border: "1px solid var(--border-color)",
                              background: "transparent",
                              color: "#a855f7",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              cursor: "pointer",
                            }}
                          >
                            <Truck size={14} />
                          </button>
                        )}
                        {(order.status === "PENDENTE" ||
                          order.status === "APROVADA") && (
                          <button
                            onClick={() => updateStatus(order.id, "CANCELADA")}
                            title="Cancelar"
                            style={{
                              width: 32,
                              height: 32,
                              borderRadius: "var(--radius-sm)",
                              border: "1px solid var(--border-color)",
                              background: "transparent",
                              color: "var(--text-muted)",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              cursor: "pointer",
                            }}
                          >
                            <XCircle size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Detail Modal */}
      <Modal
        isOpen={!!detailOrder}
        onClose={() => setDetailOrder(null)}
        title={`Ordem ${detailOrder?.code || ""}`}
        maxWidth="640px"
      >
        {detailOrder && (
          <div
            style={{ display: "flex", flexDirection: "column", gap: "16px" }}
          >
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
                  {detailOrder.supplier.name}
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
                <span
                  style={{
                    padding: "4px 10px",
                    borderRadius: "var(--radius-sm)",
                    background:
                      statusConfig[detailOrder.status]?.bg ||
                      "var(--accent-warning-bg)",
                    color:
                      statusConfig[detailOrder.status]?.color ||
                      "var(--accent-warning)",
                    fontSize: "12px",
                    fontWeight: 700,
                  }}
                >
                  {statusConfig[detailOrder.status]?.label ||
                    detailOrder.status}
                </span>
              </div>
            </div>

            {detailOrder.notes && (
              <p
                style={{
                  fontSize: "13px",
                  color: "var(--text-secondary)",
                  padding: "10px 14px",
                  background: "var(--bg-input)",
                  borderRadius: "var(--radius-md)",
                }}
              >
                {detailOrder.notes}
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
                  {detailOrder.items.map((item) => (
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
                      {formatCurrency(detailOrder.totalValue)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )}
      </Modal>

      {/* Create PO Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Nova Ordem de Compra"
        maxWidth="700px"
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
        <form
          onSubmit={handleSubmit}
          style={{ display: "flex", flexDirection: "column", gap: "16px" }}
        >
          <div>
            <label style={labelStyle}>Fornecedor *</label>
            <select
              required
              value={form.supplierId}
              onChange={(e) => setForm({ ...form, supplierId: e.target.value })}
              style={{ ...inputStyle, cursor: "pointer" }}
            >
              <option value="">Selecione...</option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "8px",
              }}
            >
              <label style={{ ...labelStyle, marginBottom: 0 }}>Itens *</label>
              <button
                type="button"
                onClick={addItem}
                style={{
                  fontSize: "12px",
                  color: "var(--accent-primary)",
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  fontWeight: 600,
                }}
              >
                + Adicionar Item
              </button>
            </div>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "8px",
              }}
            >
              {formItems.map((item, i) => (
                <div
                  key={i}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "2fr 1fr 1fr auto",
                    gap: "8px",
                    alignItems: "center",
                  }}
                >
                  <select
                    required
                    value={item.productId}
                    onChange={(e) => updateItem(i, "productId", e.target.value)}
                    style={{
                      ...inputStyle,
                      padding: "8px 10px",
                      fontSize: "12px",
                      cursor: "pointer",
                    }}
                  >
                    <option value="">Produto...</option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.sku})
                      </option>
                    ))}
                  </select>
                  <input
                    required
                    type="number"
                    min="1"
                    value={item.quantity}
                    onChange={(e) => updateItem(i, "quantity", e.target.value)}
                    placeholder="Qtd"
                    style={{
                      ...inputStyle,
                      padding: "8px 10px",
                      fontSize: "12px",
                    }}
                  />
                  <input
                    required
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={item.unitPrice}
                    onChange={(e) => updateItem(i, "unitPrice", e.target.value)}
                    placeholder="Preço"
                    style={{
                      ...inputStyle,
                      padding: "8px 10px",
                      fontSize: "12px",
                    }}
                  />
                  {formItems.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeItem(i)}
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: "var(--radius-sm)",
                        border: "1px solid var(--border-color)",
                        background: "transparent",
                        color: "var(--accent-danger)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: "pointer",
                      }}
                    >
                      <Trash2 size={12} />
                    </button>
                  )}
                </div>
              ))}
            </div>
            {formTotal > 0 && (
              <p
                style={{
                  marginTop: "8px",
                  fontSize: "13px",
                  fontWeight: 600,
                  color: "var(--text-primary)",
                  textAlign: "right",
                }}
              >
                Total: {formatCurrency(formTotal)}
              </p>
            )}
          </div>

          <div>
            <label style={labelStyle}>Observações</label>
            <input
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="Observações opcionais..."
              style={inputStyle}
            />
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              gap: "10px",
              marginTop: "4px",
            }}
          >
            <button
              type="button"
              onClick={() => setModalOpen(false)}
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
                background:
                  "linear-gradient(135deg, var(--accent-primary), #a855f7)",
                color: "white",
                fontSize: "13px",
                fontWeight: 600,
                cursor: saving ? "not-allowed" : "pointer",
                opacity: saving ? 0.7 : 1,
              }}
            >
              {saving ? "Criando..." : "Criar Ordem"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
