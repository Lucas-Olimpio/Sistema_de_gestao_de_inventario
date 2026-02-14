"use client";

import { useEffect, useState } from "react";
import { Plus, UserCheck, Pencil, Trash2, Search } from "lucide-react";
import Modal from "../components/modal";
import PageHeader from "../components/page-header";
import DataTable, { Column } from "../components/data-table";
import ConfirmModal from "../components/confirm-modal";

interface Customer {
  id: string;
  name: string;
  cpfCnpj: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  _count: { salesOrders: number };
}

export default function ClientesPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "",
    cpfCnpj: "",
    email: "",
    phone: "",
    address: "",
  });

  const fetchCustomers = async () => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    const res = await fetch(`/api/customers?${params}`);
    const data = await res.json();
    setCustomers(data);
    setLoading(false);
  };

  useEffect(() => {
    const timer = setTimeout(fetchCustomers, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const openCreate = () => {
    setEditingId(null);
    setForm({ name: "", cpfCnpj: "", email: "", phone: "", address: "" });
    setError("");
    setModalOpen(true);
  };

  const openEdit = (c: Customer) => {
    setEditingId(c.id);
    setForm({
      name: c.name,
      cpfCnpj: c.cpfCnpj || "",
      email: c.email || "",
      phone: c.phone || "",
      address: c.address || "",
    });
    setError("");
    setModalOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    const res = await fetch(`/api/customers/${deleteId}`, { method: "DELETE" });
    if (res.ok) {
      fetchCustomers();
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

    const url = editingId ? `/api/customers/${editingId}` : "/api/customers";
    const method = editingId ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    if (res.ok) {
      setModalOpen(false);
      fetchCustomers();
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

  const columns: Column<Customer>[] = [
    {
      header: "Nome",
      accessor: "name",
      cell: (c) => (
        <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>
          {c.name}
        </span>
      ),
    },
    {
      header: "CPF/CNPJ",
      accessor: "cpfCnpj",
      cell: (c) => (
        <span
          style={{
            color: "var(--text-muted)",
            fontFamily: "monospace",
            fontSize: "12px",
          }}
        >
          {c.cpfCnpj || "—"}
        </span>
      ),
    },
    {
      header: "E-mail",
      accessor: "email",
      cell: (c) => (
        <span style={{ color: "var(--text-secondary)" }}>{c.email || "—"}</span>
      ),
    },
    {
      header: "Telefone",
      accessor: "phone",
      cell: (c) => (
        <span style={{ color: "var(--text-secondary)" }}>{c.phone || "—"}</span>
      ),
    },
    {
      header: "Pedidos",
      cell: (c) => (
        <span style={{ color: "var(--text-muted)" }}>
          {c._count.salesOrders}
        </span>
      ),
    },
    {
      header: "Ações",
      align: "right",
      cell: (c) => (
        <div
          style={{ display: "flex", gap: "6px", justifyContent: "flex-end" }}
        >
          <button
            onClick={() => openEdit(c)}
            style={{
              width: 32,
              height: 32,
              borderRadius: "var(--radius-sm)",
              border: "1px solid var(--border-color)",
              background: "transparent",
              color: "var(--text-secondary)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
            }}
          >
            <Pencil size={14} />
          </button>
          <button
            onClick={() => setDeleteId(c.id)}
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
        title="Clientes"
        icon={UserCheck}
        action={
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              flexWrap: "wrap",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                background: "var(--bg-input)",
                borderRadius: "var(--radius-md)",
                padding: "0 14px",
                border: "1px solid var(--border-color)",
              }}
            >
              <Search size={16} color="var(--text-muted)" />
              <input
                type="text"
                placeholder="Buscar..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{
                  padding: "9px 0",
                  border: "none",
                  background: "transparent",
                  color: "var(--text-primary)",
                  fontSize: "13px",
                  outline: "none",
                  minWidth: "200px",
                }}
              />
            </div>
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
              Novo Cliente
            </button>
          </div>
        }
      />

      <DataTable
        data={customers}
        columns={columns}
        isLoading={loading}
        emptyMessage={
          search ? "Nenhum cliente encontrado" : "Nenhum cliente cadastrado"
        }
      />

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingId ? "Editar Cliente" : "Novo Cliente"}
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
        title="Excluir Cliente"
        message="Tem certeza que deseja excluir este cliente?"
        isDestructive
        confirmText="Excluir"
      />
    </div>
  );
}
