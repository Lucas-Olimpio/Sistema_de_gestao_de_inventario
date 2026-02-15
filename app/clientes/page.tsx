"use client";

import { useState } from "react";
import { Plus, UserCheck, Pencil, Trash2, Search } from "lucide-react";
import Modal from "../components/modal";
import PageHeader from "../components/page-header";
import DataTable, { Column } from "../components/data-table";
import ConfirmModal from "../components/confirm-modal";
import CustomerForm from "./components/customer-form";
import { Customer } from "@/lib/types";
import { useCustomers } from "@/app/hooks/use-customers";

export default function ClientesPage() {
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | undefined>(
    undefined,
  );
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const {
    data: customers = [],
    isLoading,
    createCustomer,
    updateCustomer,
    deleteCustomer,
  } = useCustomers(search);

  const openCreate = () => {
    setEditingCustomer(undefined);
    setError("");
    setModalOpen(true);
  };

  const openEdit = (c: Customer) => {
    setEditingCustomer(c);
    setError("");
    setModalOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteCustomer.mutateAsync(deleteId);
      setDeleteId(null);
    } catch (err: any) {
      alert(err.message || "Erro ao excluir");
    }
  };

  const handleSubmit = async (data: Partial<Customer>) => {
    setError("");
    try {
      if (editingCustomer) {
        await updateCustomer.mutateAsync({ id: editingCustomer.id, data });
      } else {
        await createCustomer.mutateAsync(data);
      }
      setModalOpen(false);
    } catch (err: any) {
      setError(err.message || "Erro ao salvar");
    }
  };

  const isSaving = createCustomer.isPending || updateCustomer.isPending;

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
          {c._count?.salesOrders || 0}
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
        isLoading={isLoading}
        emptyMessage={
          search ? "Nenhum cliente encontrado" : "Nenhum cliente cadastrado"
        }
      />

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingCustomer ? "Editar Cliente" : "Novo Cliente"}
        maxWidth="520px"
      >
        <CustomerForm
          initialData={editingCustomer}
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
        title="Excluir Cliente"
        message="Tem certeza que deseja excluir este cliente?"
        isDestructive
        confirmText="Excluir"
      />
    </div>
  );
}
