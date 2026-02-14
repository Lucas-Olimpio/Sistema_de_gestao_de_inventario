import React, { useState } from "react";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";

interface Product {
  id: string;
  name: string;
  sku: string;
  quantity: number;
}

interface MovementFormProps {
  products: Product[];
  onSubmit: (data: any) => Promise<void>;
  onCancel: () => void;
  error?: string;
}

export default function MovementForm({
  products,
  onSubmit,
  onCancel,
  error,
}: MovementFormProps) {
  const [form, setForm] = useState({
    productId: "",
    type: "IN",
    quantity: "",
    reason: "",
  });
  const [saving, setSaving] = useState(false);

  const selectedProduct = products.find((p) => p.id === form.productId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await onSubmit(form);
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
    <form
      onSubmit={handleSubmit}
      style={{ display: "flex", flexDirection: "column", gap: "16px" }}
    >
      {error && (
        <div
          style={{
            padding: "10px 14px",
            borderRadius: "var(--radius-md)",
            background: "var(--accent-danger-bg)",
            color: "var(--accent-danger)",
            fontSize: "13px",
          }}
        >
          {error}
        </div>
      )}

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
                form.type === "IN" ? "var(--accent-success-bg)" : "transparent",
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
                form.type === "OUT" ? "var(--accent-danger-bg)" : "transparent",
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
        />
      </div>

      <div>
        <label style={labelStyle}>Motivo</label>
        <input
          value={form.reason}
          onChange={(e) => setForm({ ...form, reason: e.target.value })}
          placeholder="Ex: Compra do fornecedor, Venda online..."
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
          onClick={onCancel}
          disabled={saving}
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
  );
}
