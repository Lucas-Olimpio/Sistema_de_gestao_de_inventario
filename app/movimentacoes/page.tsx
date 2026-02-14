"use client";

import { useEffect, useState } from "react";
import { Plus, ArrowUpRight, ArrowDownRight, ArrowDownUp } from "lucide-react";
import Modal from "../components/modal";
import { formatDate } from "@/lib/utils";

interface Product {
  id: string;
  name: string;
  sku: string;
  quantity: number;
}

interface Movement {
  id: string;
  type: string;
  quantity: number;
  reason: string | null;
  createdAt: string;
  product: { name: string; sku: string };
}

export default function MovimentacoesPage() {
  const [movements, setMovements] = useState<Movement[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    productId: "",
    type: "IN",
    quantity: "",
    reason: "",
  });

  const fetchMovements = async () => {
    const res = await fetch("/api/movements");
    const data = await res.json();
    setMovements(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchMovements();
    fetch("/api/products")
      .then((r) => r.json())
      .then(setProducts);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    const res = await fetch("/api/movements", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    if (res.ok) {
      setModalOpen(false);
      setForm({ productId: "", type: "IN", quantity: "", reason: "" });
      fetchMovements();
      // Refresh products to get updated quantities
      fetch("/api/products")
        .then((r) => r.json())
        .then(setProducts);
    } else {
      const data = await res.json();
      setError(data.error || "Erro ao criar movimentação");
    }
    setSaving(false);
  };

  const selectedProduct = products.find((p) => p.id === form.productId);

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "10px 14px",
    borderRadius: "var(--radius-md)",
    border: "1px solid var(--border-color)",
    background: "var(--bg-input)",
    color: "var(--text-primary)",
    fontSize: "14px",
    outline: "none",
    transition: "border-color 0.2s",
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
        <p style={{ fontSize: "14px", color: "var(--text-secondary)" }}>
          Histórico de movimentações de estoque
        </p>
        <button
          onClick={() => {
            setError("");
            setForm({ productId: "", type: "IN", quantity: "", reason: "" });
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
          Nova Movimentação
        </button>
      </div>

      {/* Movements list */}
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
        ) : movements.length === 0 ? (
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
            <ArrowDownUp size={40} strokeWidth={1} />
            <p style={{ fontSize: "15px", fontWeight: 500 }}>
              Nenhuma movimentação registrada
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
                {["Tipo", "Produto", "SKU", "Quantidade", "Motivo", "Data"].map(
                  (h) => (
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
                  ),
                )}
              </tr>
            </thead>
            <tbody>
              {movements.map((mov) => (
                <tr
                  key={mov.id}
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
                  <td style={{ padding: "14px 16px" }}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
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
                          <ArrowUpRight
                            size={14}
                            color="var(--accent-success)"
                          />
                        ) : (
                          <ArrowDownRight
                            size={14}
                            color="var(--accent-danger)"
                          />
                        )}
                      </div>
                      <span
                        style={{
                          fontSize: "12px",
                          fontWeight: 600,
                          color:
                            mov.type === "IN"
                              ? "var(--accent-success)"
                              : "var(--accent-danger)",
                        }}
                      >
                        {mov.type === "IN" ? "Entrada" : "Saída"}
                      </span>
                    </div>
                  </td>
                  <td
                    style={{
                      padding: "14px 16px",
                      fontWeight: 600,
                      color: "var(--text-primary)",
                    }}
                  >
                    {mov.product.name}
                  </td>
                  <td
                    style={{
                      padding: "14px 16px",
                      color: "var(--text-muted)",
                      fontFamily: "monospace",
                      fontSize: "12px",
                    }}
                  >
                    {mov.product.sku}
                  </td>
                  <td
                    style={{
                      padding: "14px 16px",
                      fontWeight: 700,
                      color:
                        mov.type === "IN"
                          ? "var(--accent-success)"
                          : "var(--accent-danger)",
                    }}
                  >
                    {mov.type === "IN" ? "+" : "-"}
                    {mov.quantity}
                  </td>
                  <td
                    style={{
                      padding: "14px 16px",
                      color: "var(--text-secondary)",
                    }}
                  >
                    {mov.reason || "—"}
                  </td>
                  <td
                    style={{
                      padding: "14px 16px",
                      color: "var(--text-muted)",
                      fontSize: "12px",
                    }}
                  >
                    {formatDate(mov.createdAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* New Movement Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Nova Movimentação"
        maxWidth="520px"
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
            <label style={labelStyle}>Produto *</label>
            <select
              required
              value={form.productId}
              onChange={(e) => setForm({ ...form, productId: e.target.value })}
              style={{ ...inputStyle, cursor: "pointer" }}
            >
              <option value="">Selecione um produto...</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.sku}) — Estoque: {p.quantity}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={labelStyle}>Tipo *</label>
            <div style={{ display: "flex", gap: "10px" }}>
              <button
                type="button"
                onClick={() => setForm({ ...form, type: "IN" })}
                style={{
                  flex: 1,
                  padding: "12px",
                  borderRadius: "var(--radius-md)",
                  border: `2px solid ${
                    form.type === "IN"
                      ? "var(--accent-success)"
                      : "var(--border-color)"
                  }`,
                  background:
                    form.type === "IN"
                      ? "var(--accent-success-bg)"
                      : "transparent",
                  color:
                    form.type === "IN"
                      ? "var(--accent-success)"
                      : "var(--text-secondary)",
                  fontSize: "14px",
                  fontWeight: 600,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  transition: "all 0.2s",
                }}
              >
                <ArrowUpRight size={18} />
                Entrada
              </button>
              <button
                type="button"
                onClick={() => setForm({ ...form, type: "OUT" })}
                style={{
                  flex: 1,
                  padding: "12px",
                  borderRadius: "var(--radius-md)",
                  border: `2px solid ${
                    form.type === "OUT"
                      ? "var(--accent-danger)"
                      : "var(--border-color)"
                  }`,
                  background:
                    form.type === "OUT"
                      ? "var(--accent-danger-bg)"
                      : "transparent",
                  color:
                    form.type === "OUT"
                      ? "var(--accent-danger)"
                      : "var(--text-secondary)",
                  fontSize: "14px",
                  fontWeight: 600,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  transition: "all 0.2s",
                }}
              >
                <ArrowDownRight size={18} />
                Saída
              </button>
            </div>
          </div>

          <div>
            <label style={labelStyle}>
              Quantidade *
              {selectedProduct && form.type === "OUT" && (
                <span
                  style={{
                    fontWeight: 400,
                    color: "var(--text-muted)",
                    marginLeft: "8px",
                  }}
                >
                  (Disponível: {selectedProduct.quantity})
                </span>
              )}
            </label>
            <input
              required
              type="number"
              min="1"
              max={
                form.type === "OUT" && selectedProduct
                  ? selectedProduct.quantity
                  : undefined
              }
              value={form.quantity}
              onChange={(e) => setForm({ ...form, quantity: e.target.value })}
              placeholder="0"
              style={inputStyle}
              onFocus={(e) =>
                (e.currentTarget.style.borderColor = "var(--accent-primary)")
              }
              onBlur={(e) =>
                (e.currentTarget.style.borderColor = "var(--border-color)")
              }
            />
          </div>

          <div>
            <label style={labelStyle}>Motivo</label>
            <input
              value={form.reason}
              onChange={(e) => setForm({ ...form, reason: e.target.value })}
              placeholder="Ex: Compra do fornecedor, Venda online..."
              style={inputStyle}
              onFocus={(e) =>
                (e.currentTarget.style.borderColor = "var(--accent-primary)")
              }
              onBlur={(e) =>
                (e.currentTarget.style.borderColor = "var(--border-color)")
              }
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
                  form.type === "IN"
                    ? "var(--accent-success)"
                    : "var(--accent-danger)",
                color: "white",
                fontSize: "13px",
                fontWeight: 600,
                cursor: saving ? "not-allowed" : "pointer",
                opacity: saving ? 0.7 : 1,
              }}
            >
              {saving
                ? "Registrando..."
                : form.type === "IN"
                  ? "Registrar Entrada"
                  : "Registrar Saída"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
