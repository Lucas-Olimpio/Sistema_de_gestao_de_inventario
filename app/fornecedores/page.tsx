"use client";

import { useState } from "react";
import { Plus, Users, Pencil, Trash2 } from "lucide-react";
import Modal from "../components/modal";
import PageHeader from "../components/page-header";
import DataTable, { Column } from "../components/data-table";
import ConfirmModal from "../components/confirm-modal";
import SupplierForm from "./components/supplier-form";
import { Supplier } from "@/lib/types";
import { useSuppliers } from "@/app/hooks/use-suppliers";

export default function FornecedoresPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | undefined>(
    undefined,
  );
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const {
    data: suppliers = [],
    isLoading,
    createSupplier,
    updateSupplier,
    deleteSupplier,
  } = useSuppliers();

  const openCreate = () => {
    setEditingSupplier(undefined);
    setError("");
    setModalOpen(true);
  };

  const openEdit = (s: Supplier) => {
    setEditingSupplier(s);
    setError("");
    setModalOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteSupplier.mutateAsync(deleteId);
      setDeleteId(null);
    } catch (err: any) {
      alert(err.message || "Erro ao excluir");
    }
  };

  const handleSubmit = async (data: Partial<Supplier>) => {
    setError("");
    try {
      if (editingSupplier) {
        await updateSupplier.mutateAsync({ id: editingSupplier.id, data });
      } else {
        await createSupplier.mutateAsync(data);
      }
      setModalOpen(false);
    } catch (err: any) {
      setError(err.message || "Erro ao salvar");
    }
  };

  const isSaving = createSupplier.isPending || updateSupplier.isPending;

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
          {s._count?.purchaseOrders || 0}
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
        isLoading={isLoading}
        emptyMessage="Nenhum fornecedor cadastrado"
      />

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingSupplier ? "Editar Fornecedor" : "Novo Fornecedor"}
        maxWidth="520px"
      >
        <SupplierForm
          initialData={editingSupplier}
          onSubmit={handleSubmit}
          onCancel={() => setModalOpen(false)}
          isLoading={isSaving}
          error={error}
        />
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
