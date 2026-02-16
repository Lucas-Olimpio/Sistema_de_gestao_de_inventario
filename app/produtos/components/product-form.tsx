"use client";

import { Save } from "lucide-react";
import Link from "next/link";
import { State } from "@/app/produtos/actions";
import { useEffect, useState } from "react";
import { Category } from "@/lib/types";
import { toast } from "sonner";

interface ProductFormProps {
  initialData?: {
    name: string;
    description: string;
    sku: string;
    price: string;
    quantity: string;
    minStock: string;
    categoryId: string;
  };
  categories: Category[];
  action: (payload: FormData) => void;
  state: State;
  isPending: boolean;
  submitLabel: string;
  onCancel: () => void; // Can be a function or we can use a Link if generic
}

export default function ProductForm({
  initialData,
  categories,
  action,
  state,
  isPending,
  submitLabel,
  onCancel,
}: ProductFormProps) {
  // We need local state to handle controlled inputs if we want to reset or manipulate them,
  // but for a simple server action form, we can rely on defaultValues if we don't need instant feedback.
  // However, the original code used controlled inputs. Let's stick to that for consistency and potential validtion.
  const [form, setForm] = useState({
    name: "",
    description: "",
    sku: "",
    price: "",
    quantity: "0",
    minStock: "5",
    categoryId: "",
  });

  useEffect(() => {
    useEffect(() => {
      if (initialData) {
        setForm({
          name: initialData.name,
          description: initialData.description || "",
          sku: initialData.sku,
          price: (Number(initialData.price) / 100).toFixed(2),
          quantity: initialData.quantity.toString(),
          minStock: initialData.minStock.toString(),
          categoryId: initialData.categoryId,
        });
      }
    }, [initialData]);
  }, [initialData]);

  useEffect(() => {
    if (state?.message) {
      if (state.errors) {
        toast.error(state.message);
      } else {
        toast.success(state.message);
      }
    } else if (state?.errors) {
      // Show first error found
      const firstError = Object.values(state.errors).flat()[0];
      toast.error(firstError || "Por favor, verifique os erros no formulário.");
    }
  }, [state]);

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

  const errorStyle: React.CSSProperties = {
    fontSize: "12px",
    color: "var(--accent-danger)",
    marginTop: "4px",
  };

  return (
    <form
      action={action}
      style={{ display: "flex", flexDirection: "column", gap: "18px" }}
    >
      <div>
        <label style={labelStyle} htmlFor="name">
          Nome *
        </label>
        <input
          id="name"
          name="name"
          required
          placeholder="Ex: Notebook Dell Inspiron"
          defaultValue={form.name} // changed to defaultValue to avoid controlled input issues with server actions if not strictly needed, but kept controlled for updates if valid. Actually sticking to controlled as per previous state.
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          style={inputStyle}
          onFocus={(e) =>
            (e.currentTarget.style.borderColor = "var(--accent-primary)")
          }
          onBlur={(e) =>
            (e.currentTarget.style.borderColor = "var(--border-color)")
          }
        />
        {state?.errors?.name && (
          <p style={errorStyle}>{state.errors.name[0]}</p>
        )}
      </div>

      <div>
        <label style={labelStyle} htmlFor="description">
          Descrição
        </label>
        <textarea
          id="description"
          name="description"
          placeholder="Descrição do produto..."
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          rows={3}
          style={{ ...inputStyle, resize: "vertical" }}
          onFocus={(e) =>
            (e.currentTarget.style.borderColor = "var(--accent-primary)")
          }
          onBlur={(e) =>
            (e.currentTarget.style.borderColor = "var(--border-color)")
          }
        />
        {state?.errors?.description && (
          <p style={errorStyle}>{state.errors.description[0]}</p>
        )}
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "16px",
        }}
      >
        <div>
          <label style={labelStyle} htmlFor="sku">
            SKU *
          </label>
          <input
            id="sku"
            name="sku"
            required
            placeholder="Ex: ELET-005"
            value={form.sku}
            onChange={(e) => setForm({ ...form, sku: e.target.value })}
            style={inputStyle}
            onFocus={(e) =>
              (e.currentTarget.style.borderColor = "var(--accent-primary)")
            }
            onBlur={(e) =>
              (e.currentTarget.style.borderColor = "var(--border-color)")
            }
          />
          {state?.errors?.sku && (
            <p style={errorStyle}>{state.errors.sku[0]}</p>
          )}
        </div>
        <div>
          <label style={labelStyle} htmlFor="categoryId">
            Categoria *
          </label>
          <select
            id="categoryId"
            name="categoryId"
            required
            value={form.categoryId}
            onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
            style={{ ...inputStyle, cursor: "pointer" }}
          >
            <option value="" disabled>
              Selecione...
            </option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          {state?.errors?.categoryId && (
            <p style={errorStyle}>{state.errors.categoryId[0]}</p>
          )}
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr",
          gap: "16px",
        }}
      >
        <div>
          <label style={labelStyle} htmlFor="price">
            Preço *
          </label>
          <input
            id="price"
            name="price"
            required
            type="number"
            step="0.01"
            min="0"
            placeholder="0.00"
            value={form.price}
            onChange={(e) => setForm({ ...form, price: e.target.value })}
            style={inputStyle}
            onFocus={(e) =>
              (e.currentTarget.style.borderColor = "var(--accent-primary)")
            }
            onBlur={(e) =>
              (e.currentTarget.style.borderColor = "var(--border-color)")
            }
          />
          {state?.errors?.price && (
            <p style={errorStyle}>{state.errors.price[0]}</p>
          )}
        </div>
        <div>
          <label style={labelStyle} htmlFor="quantity">
            Quantidade
          </label>
          <input
            id="quantity"
            name="quantity"
            type="number"
            min="0"
            value={form.quantity}
            onChange={(e) => setForm({ ...form, quantity: e.target.value })}
            style={inputStyle}
            onFocus={(e) =>
              (e.currentTarget.style.borderColor = "var(--accent-primary)")
            }
            onBlur={(e) =>
              (e.currentTarget.style.borderColor = "var(--border-color)")
            }
          />
          {state?.errors?.quantity && (
            <p style={errorStyle}>{state.errors.quantity[0]}</p>
          )}
        </div>
        <div>
          <label style={labelStyle} htmlFor="minStock">
            Estoque Mínimo
          </label>
          <input
            id="minStock"
            name="minStock"
            type="number"
            min="0"
            value={form.minStock}
            onChange={(e) => setForm({ ...form, minStock: e.target.value })}
            style={inputStyle}
            onFocus={(e) =>
              (e.currentTarget.style.borderColor = "var(--accent-primary)")
            }
            onBlur={(e) =>
              (e.currentTarget.style.borderColor = "var(--border-color)")
            }
          />
          {state?.errors?.minStock && (
            <p style={errorStyle}>{state.errors.minStock[0]}</p>
          )}
        </div>
      </div>

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
          onClick={onCancel}
          style={{
            padding: "10px 20px",
            borderRadius: "var(--radius-md)",
            border: "1px solid var(--border-color)",
            background: "transparent",
            color: "var(--text-secondary)",
            fontSize: "13px",
            fontWeight: 500,
            textDecoration: "none",
            display: "flex",
            alignItems: "center",
            cursor: "pointer",
          }}
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={isPending}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            padding: "10px 22px",
            borderRadius: "var(--radius-md)",
            border: "none",
            background:
              "linear-gradient(135deg, var(--accent-primary), #a855f7)",
            color: "white",
            fontSize: "13px",
            fontWeight: 600,
            cursor: isPending ? "not-allowed" : "pointer",
            opacity: isPending ? 0.7 : 1,
            boxShadow: "0 2px 10px rgba(124, 58, 237, 0.3)",
          }}
        >
          <Save size={16} />
          {isPending ? "Salvando..." : submitLabel}
        </button>
      </div>
    </form>
  );
}
