import { useState, useEffect } from "react";
import { Customer } from "@/lib/types";

interface CustomerFormProps {
  initialData?: Customer;
  onSubmit: (data: Partial<Customer>) => Promise<void>;
  onCancel: () => void;
  isLoading: boolean;
  error?: string;
}

export default function CustomerForm({
  initialData,
  onSubmit,
  onCancel,
  isLoading,
  error,
}: CustomerFormProps) {
  const [form, setForm] = useState({
    name: "",
    cpfCnpj: "",
    email: "",
    phone: "",
    address: "",
  });

  useEffect(() => {
    if (initialData) {
      setForm({
        name: initialData.name,
        cpfCnpj: initialData.cpfCnpj || "",
        email: initialData.email || "",
        phone: initialData.phone || "",
        address: initialData.address || "",
      });
    } else {
      setForm({ name: "", cpfCnpj: "", email: "", phone: "", address: "" });
    }
  }, [initialData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(form);
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
        <label style={labelStyle}>Nome *</label>
        <input
          required
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          placeholder="Nome do cliente"
          style={inputStyle}
        />
      </div>

      <div>
        <label style={labelStyle}>CPF / CNPJ</label>
        <input
          value={form.cpfCnpj}
          onChange={(e) => setForm({ ...form, cpfCnpj: e.target.value })}
          placeholder="000.000.000-00 ou 00.000.000/0000-00"
          style={inputStyle}
        />
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "12px",
        }}
      >
        <div>
          <label style={labelStyle}>E-mail</label>
          <input
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            placeholder="email@exemplo.com"
            style={inputStyle}
          />
        </div>
        <div>
          <label style={labelStyle}>Telefone</label>
          <input
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            placeholder="(11) 99999-9999"
            style={inputStyle}
          />
        </div>
      </div>

      <div>
        <label style={labelStyle}>Endereço</label>
        <input
          value={form.address}
          onChange={(e) => setForm({ ...form, address: e.target.value })}
          placeholder="Rua, número, cidade..."
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
          disabled={isLoading}
          style={{
            padding: "9px 18px",
            borderRadius: "var(--radius-md)",
            border: "none",
            background:
              "linear-gradient(135deg, var(--accent-primary), #a855f7)",
            color: "white",
            fontSize: "13px",
            fontWeight: 600,
            cursor: isLoading ? "not-allowed" : "pointer",
            opacity: isLoading ? 0.7 : 1,
          }}
        >
          {isLoading ? "Salvando..." : initialData ? "Salvar" : "Criar"}
        </button>
      </div>
    </form>
  );
}
