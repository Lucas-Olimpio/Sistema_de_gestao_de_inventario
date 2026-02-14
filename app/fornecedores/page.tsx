"use client";

import { useEffect, useState } from "react";
import { Plus, Users, Pencil, Trash2 } from "lucide-react";
import Modal from "../components/modal";
import PageHeader from "../components/page-header";
import DataTable, { Column } from "../components/data-table";
import ConfirmModal from "../components/confirm-modal";

interface Supplier {
  id: string;
  name: string;
  cnpj: string | null;
  email: string | null;
  phone: string | null;
  _count: { purchaseOrders: number };
}

export default function FornecedoresPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "",
    cnpj: "",
    email: "",
    phone: "",
  });

  const fetchSuppliers = async () => {
    const res = await fetch("/api/suppliers");
    const data = await res.json();
    setSuppliers(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const openCreate = () => {
    setEditingId(null);
    setForm({ name: "", cnpj: "", email: "", phone: "" });
    setError("");
    setModalOpen(true);
  };

  const openEdit = (s: Supplier) => {
    setEditingId(s.id);
    setForm({
      name: s.name,
      cnpj: s.cnpj || "",
      email: s.email || "",
      phone: s.phone || "",
    });
    setError("");
    setModalOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    const res = await fetch(`/api/suppliers/${deleteId}`, { method: "DELETE" });
    if (res.ok) {
      fetchSuppliers();
    } else {
      const data = await res.json();
      alert(data.error || "Erro ao excluir");
    }
    setDeleteId(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    const url = editingId ? `/api/suppliers/${editingId}` : "/api/suppliers";
    const method = editingId ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    if (res.ok) {
      setModalOpen(false);
      fetchSuppliers();
    } else {
      const data = await res.json();
      setError(data.error || "Erro ao salvar");
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

  const labelStyle: React.CSSProperties = {
    fontSize: "13px",
    fontWeight: 600,
    color: "var(--text-secondary)",
    marginBottom: "6px",
    display: "block",
  };

  const columns: Column<Supplier>[] = [
    {
      header: "Nome",
      accessor: "name",
      cell: (s) => (
        <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>
          {s.name}
        </span>
      ),
    },
    {
      header: "CNPJ",
      accessor: "cnpj",
      cell: (s) => (
        <span
          style={{
            color: "var(--text-muted)",
            fontFamily: "monospace",
            fontSize: "12px",
          }}
        >
          {s.cnpj || "—"}
        </span>
      ),
    },
    {
      header: "E-mail",
      accessor: "email",
      cell: (s) => (
        <span style={{ color: "var(--text-secondary)" }}>{s.email || "—"}</span>
      ),
    },
    {
      header: "Telefone",
      accessor: "phone",
      cell: (s) => (
        <span style={{ color: "var(--text-secondary)" }}>{s.phone || "—"}</span>
      ),
    },
    {
      header: "Pedidos",
      cell: (s) => (
        <span style={{ color: "var(--text-muted)" }}>
          {s._count.purchaseOrders}
        </span>
      ),
    },
    {
      header: "Ações",
      align: "right",
      cell: (s) => (
        <div
          style={{ display: "flex", gap: "6px", justifyContent: "flex-end" }}
        >
          <button
            onClick={() => openEdit(s)}
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
            <Pencil size={14} />
          </button>
          <button
            onClick={() => setDeleteId(s.id)}
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
        </div>
      ),
    },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      <PageHeader
        title="Fornecedores"
        subtitle="Gerencie os fornecedores do sistema"
        icon={Users}
        action={
          <button
            onClick={openCreate}
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
            Novo Fornecedor
          </button>
        }
      />

      <DataTable
        data={suppliers}
        columns={columns}
        isLoading={loading}
        emptyMessage="Nenhum fornecedor cadastrado"
      />

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingId ? "Editar Fornecedor" : "Novo Fornecedor"}
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
            <label style={labelStyle}>Nome *</label>
            <input
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Nome do fornecedor"
              style={inputStyle}
            />
          </div>
          <div>
            <label style={labelStyle}>CNPJ</label>
            <input
              value={form.cnpj}
              onChange={(e) => setForm({ ...form, cnpj: e.target.value })}
              placeholder="00.000.000/0000-00"
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
              {saving ? "Salvando..." : editingId ? "Salvar" : "Criar"}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmModal
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Excluir Fornecedor"
        message="Tem certeza que deseja excluir este fornecedor?"
        isDestructive
        confirmText="Excluir"
      />
    </div>
  );
}
