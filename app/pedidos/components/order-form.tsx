import React, { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Product, Customer } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";

interface OrderFormProps {
  customers: Customer[];
  products: Product[];
  onSubmit: (data: any) => Promise<void>;
  onCancel: () => void;
  error?: string;
}

export default function OrderForm({
  customers,
  products,
  onSubmit,
  onCancel,
  error,
}: OrderFormProps) {
  const [form, setForm] = useState({
    customerId: "",
    notes: "",
  });
  const [items, setItems] = useState<
    Array<{ productId: string; quantity: string; unitPrice: string }>
  >([{ productId: "", quantity: "", unitPrice: "" }]);
  const [saving, setSaving] = useState(false);

  const addItem = () => {
    setItems([...items, { productId: "", quantity: "", unitPrice: "" }]);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: string, value: string) => {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: value };
    // Auto-fill unit price from product
    if (field === "productId" && value) {
      const product = products.find((p) => p.id === value);
      if (product) {
        updated[index].unitPrice = (Number(product.price) / 100).toFixed(2);
      }
    }
    setItems(updated);
  };

  const formTotal = items.reduce((sum, item) => {
    const qty = parseFloat(item.quantity) || 0;
    const price = parseFloat(item.unitPrice) || 0;
    return sum + qty * price;
  }, 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await onSubmit({ ...form, items });
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
        <label style={labelStyle}>Cliente *</label>
        <select
          required
          value={form.customerId}
          onChange={(e) => setForm({ ...form, customerId: e.target.value })}
          style={{ ...inputStyle, cursor: "pointer" }}
        >
          <option value="">Selecione...</option>
          {customers.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
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
              display: "flex",
              alignItems: "center",
              gap: "4px",
              fontWeight: 600,
            }}
          >
            <Plus size={14} /> Adicionar Item
          </button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {items.map((item, index) => (
            <div
              key={index}
              style={{
                display: "grid",
                gridTemplateColumns: "2fr 1fr 1fr 30px",
                gap: "10px",
                alignItems: "flex-end",
              }}
            >
              <div>
                <select
                  required
                  value={item.productId}
                  onChange={(e) =>
                    updateItem(index, "productId", e.target.value)
                  }
                  style={{ ...inputStyle, cursor: "pointer" }}
                >
                  <option value="">Produto...</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <input
                  required
                  type="number"
                  min="1"
                  placeholder="Qtd"
                  value={item.quantity}
                  onChange={(e) =>
                    updateItem(index, "quantity", e.target.value)
                  }
                  style={inputStyle}
                />
              </div>
              <div>
                <input
                  required
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="Preço"
                  value={item.unitPrice}
                  onChange={(e) =>
                    updateItem(index, "unitPrice", e.target.value)
                  }
                  style={inputStyle}
                />
              </div>
              <button
                type="button"
                onClick={() => removeItem(index)}
                style={{
                  height: "40px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "var(--accent-danger)",
                  border: "1px solid var(--border-color)",
                  borderRadius: "var(--radius-md)",
                  background: "var(--bg-card)",
                  cursor: "pointer",
                }}
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      </div>

      <div
        style={{
          padding: "12px",
          background: "var(--bg-input)",
          borderRadius: "var(--radius-md)",
          textAlign: "right",
        }}
      >
        <span
          style={{
            fontSize: "13px",
            color: "var(--text-secondary)",
            marginRight: "8px",
          }}
        >
          Total Estimado:
        </span>
        <strong
          style={{
            fontSize: "16px",
            color: "var(--text-primary)",
          }}
        >
          {formatCurrency(formTotal)}
        </strong>
      </div>

      <div>
        <label style={labelStyle}>Observações</label>
        <textarea
          rows={3}
          value={form.notes}
          onChange={(e) => setForm({ ...form, notes: e.target.value })}
          style={{ ...inputStyle, resize: "vertical" }}
        />
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          gap: "10px",
          marginTop: "10px",
        }}
      >
        <button
          type="button"
          onClick={onCancel}
          disabled={saving}
          style={{
            padding: "10px 20px",
            borderRadius: "var(--radius-md)",
            border: "1px solid var(--border-color)",
            background: "transparent",
            color: "var(--text-primary)",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={saving}
          style={{
            padding: "10px 20px",
            borderRadius: "var(--radius-md)",
            background: "var(--accent-primary)",
            color: "white",
            border: "none",
            fontWeight: 600,
            cursor: "pointer",
            opacity: saving ? 0.7 : 1,
          }}
        >
          {saving ? "Salvando..." : "Criar Pedido"}
        </button>
      </div>
    </form>
  );
}
