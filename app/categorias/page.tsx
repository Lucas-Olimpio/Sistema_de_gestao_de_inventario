"use client";

import { useState } from "react";
import { Plus, Edit2, Trash2, Tags, Package } from "lucide-react";
import Modal from "../components/modal";
import PageHeader from "../components/page-header";
import DataTable, { Column } from "../components/data-table";
import ConfirmModal from "../components/confirm-modal";
import { useCategories } from "@/app/hooks/use-categories";
import { useQueryClient } from "@tanstack/react-query";

import { Category } from "@/lib/types";

export default function CategoriasPage() {
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ name: "", description: "" });

  const { data: categories = [], isLoading: loading } = useCategories();

  const openCreate = () => {
    setEditingCategory(null);
    setForm({ name: "", description: "" });
    setError("");
    setModalOpen(true);
  };

  const openEdit = (cat: Category) => {
    setEditingCategory(cat);
    setForm({ name: cat.name, description: cat.description || "" });
    setError("");
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const url = editingCategory
      ? `/api/categories/${editingCategory.id}`
      : "/api/categories";
    const method = editingCategory ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error);
      return;
    }

    setModalOpen(false);
    queryClient.invalidateQueries({ queryKey: ["categories"] });
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    const res = await fetch(`/api/categories/${deleteId}`, {
      method: "DELETE",
    });
    if (!res.ok) {
      const data = await res.json();
      alert(data.error);
    }
    setDeleteId(null);
    queryClient.invalidateQueries({ queryKey: ["categories"] });
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

  const columns: Column<Category>[] = [
    {
      header: "Nome",
      accessor: "name",
      cell: (cat) => (
        <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>
          {cat.name}
        </span>
      ),
    },
    {
      header: "Descrição",
      cell: (cat: Category) => (
        <span style={{ color: "var(--text-secondary)" }}>
          {cat.description || "—"}
        </span>
      ),
    },
    {
      header: "Produtos",
      cell: (cat) => (
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <Package size={14} color="var(--text-muted)" />
          <span style={{ color: "var(--text-secondary)", fontSize: "13px" }}>
            {cat._count?.products || 0} produto
            {(cat._count?.products || 0) !== 1 ? "s" : ""}
          </span>
        </div>
      ),
    },
    {
      header: "Ações",
      align: "right",
      cell: (cat) => (
        <div
          style={{ display: "flex", gap: "6px", justifyContent: "flex-end" }}
        >
          <button
            onClick={() => openEdit(cat)}
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
            <Edit2 size={14} />
          </button>
          <button
            onClick={() => setDeleteId(cat.id)}
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
        title="Categorias"
        subtitle={`Gerencie as categorias de produtos (${categories.length})`}
        icon={Tags}
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
            Nova Categoria
          </button>
        }
      />

      <DataTable
        data={categories}
        columns={columns}
        isLoading={loading}
        emptyMessage="Nenhuma categoria cadastrada"
      />

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingCategory ? "Editar Categoria" : "Nova Categoria"}
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
              placeholder="Ex: Eletrônicos"
              style={inputStyle}
            />
          </div>
          <div>
            <label style={labelStyle}>Descrição</label>
            <textarea
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
              placeholder="Descrição da categoria..."
              rows={3}
              style={{ ...inputStyle, resize: "vertical" }}
            />
          </div>
          <div
            style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}
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
              {editingCategory ? "Salvar" : "Criar"}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmModal
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Excluir Categoria"
        message="Se a categoria tiver produtos vinculados, não será possível excluí-la."
        isDestructive
        confirmText="Excluir"
      />
    </div>
  );
}
