"use client";

import { useEffect, useState } from "react";
import { Landmark, Plus, Pencil, Trash2 } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { useSession } from "next-auth/react";
import PageHeader from "../components/page-header";
import StatsCard from "../components/stats-card";
import AnimSection from "../components/anim-section";
import DataTable, { Column } from "../components/data-table";
import Modal from "../components/modal";
import ConfirmModal from "../components/confirm-modal";
import { BankAccount } from "@/lib/types";

export default function ContasBancariasPage() {
  const { data: session } = useSession();
  const userRole = (session?.user as any)?.role || "VISUALIZADOR";
  const isViewer = userRole === "VISUALIZADOR";
  const isAdmin = userRole === "ADMIN";

  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editAccount, setEditAccount] = useState<BankAccount | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<BankAccount | null>(null);

  // Form state
  const [formName, setFormName] = useState("");
  const [formBankName, setFormBankName] = useState("");
  const [formAccountNumber, setFormAccountNumber] = useState("");
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchAccounts = async () => {
    try {
      const res = await fetch("/api/bank-accounts");
      const data = await res.json();
      setAccounts(Array.isArray(data) ? data : []);
    } catch {
      setAccounts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  const openCreate = () => {
    setEditAccount(null);
    setFormName("");
    setFormBankName("");
    setFormAccountNumber("");
    setFormError("");
    setModalOpen(true);
  };

  const openEdit = (account: BankAccount) => {
    setEditAccount(account);
    setFormName(account.name);
    setFormBankName(account.bankName || "");
    setFormAccountNumber(account.accountNumber || "");
    setFormError("");
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      setFormError("Nome da conta é obrigatório");
      return;
    }

    setSaving(true);
    setFormError("");

    try {
      const payload = {
        name: formName,
        bankName: formBankName || null,
        accountNumber: formAccountNumber || null,
      };

      const url = editAccount
        ? `/api/bank-accounts/${editAccount.id}`
        : "/api/bank-accounts";
      const method = editAccount ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setModalOpen(false);
        fetchAccounts();
      } else {
        const data = await res.json();
        setFormError(data.error || "Erro ao salvar conta bancária");
      }
    } catch {
      setFormError("Erro inesperado ao salvar");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      const res = await fetch(`/api/bank-accounts/${deleteTarget.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        fetchAccounts();
      } else {
        const data = await res.json();
        alert(data.error || "Erro ao excluir");
      }
    } catch {
      alert("Erro inesperado ao excluir");
    } finally {
      setDeleteTarget(null);
    }
  };

  const totalBalance = accounts.reduce((sum, a) => sum + a.currentBalance, 0);

  const columns: Column<BankAccount>[] = [
    {
      header: "Nome",
      accessor: "name",
      cell: (a) => (
        <span style={{ fontWeight: 700, color: "var(--accent-primary)" }}>
          {a.name}
        </span>
      ),
    },
    {
      header: "Banco",
      cell: (a) => <span style={{ fontWeight: 600 }}>{a.bankName || "—"}</span>,
    },
    {
      header: "Nº Conta",
      cell: (a) => (
        <span
          style={{
            fontFamily: "monospace",
            fontSize: "13px",
            color: "var(--text-secondary)",
          }}
        >
          {a.accountNumber || "—"}
        </span>
      ),
    },
    {
      header: "Saldo Atual",
      cell: (a) => (
        <span
          style={{
            fontWeight: 700,
            color:
              a.currentBalance >= 0
                ? "var(--accent-success)"
                : "var(--accent-danger)",
          }}
        >
          {formatCurrency(a.currentBalance)}
        </span>
      ),
    },
    {
      header: "Transações",
      cell: (a) => (
        <span style={{ fontSize: "13px", color: "var(--text-muted)" }}>
          {a._count?.transactions ?? 0}
        </span>
      ),
    },
    {
      header: "Ações",
      align: "right",
      cell: (a) =>
        !isViewer && (
          <div
            style={{ display: "flex", justifyContent: "flex-end", gap: "6px" }}
          >
            <button
              onClick={() => openEdit(a)}
              title="Editar"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "4px",
                padding: "6px 10px",
                borderRadius: "var(--radius-sm)",
                border: "1px solid var(--border-color)",
                background: "var(--bg-card)",
                color: "var(--text-secondary)",
                fontSize: "12px",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              <Pencil size={13} />
              Editar
            </button>
            {isAdmin && (
              <button
                onClick={() => setDeleteTarget(a)}
                title="Excluir"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                  padding: "6px 10px",
                  borderRadius: "var(--radius-sm)",
                  border: "1px solid var(--accent-danger)",
                  background: "var(--accent-danger-bg)",
                  color: "var(--accent-danger)",
                  fontSize: "12px",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                <Trash2 size={13} />
              </button>
            )}
          </div>
        ),
    },
  ];

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
    display: "block",
    fontSize: "13px",
    fontWeight: 600,
    color: "var(--text-secondary)",
    marginBottom: "6px",
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      <PageHeader
        title="Contas Bancárias"
        subtitle="Gerencie suas contas bancárias"
        icon={Landmark}
        action={
          !isViewer ? (
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
              }}
            >
              <Plus size={18} />
              Nova Conta
            </button>
          ) : undefined
        }
      />

      <AnimSection delay={100}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
            gap: "16px",
          }}
        >
          <StatsCard
            title="Total de Contas"
            value={String(accounts.length)}
            icon={Landmark}
            color="info"
          />
          <StatsCard
            title="Saldo Total"
            value={formatCurrency(totalBalance)}
            icon={Landmark}
            color={totalBalance >= 0 ? "success" : "danger"}
          />
        </div>
      </AnimSection>

      <AnimSection delay={200}>
        <DataTable
          data={accounts}
          columns={columns}
          isLoading={loading}
          emptyMessage="Nenhuma conta bancária cadastrada"
        />
      </AnimSection>

      {/* Create / Edit Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editAccount ? "Editar Conta Bancária" : "Nova Conta Bancária"}
        maxWidth="480px"
      >
        <form onSubmit={handleSubmit}>
          {formError && (
            <div
              style={{
                padding: "10px 14px",
                borderRadius: "var(--radius-md)",
                background: "var(--accent-danger-bg)",
                border: "1px solid rgba(239, 68, 68, 0.2)",
                marginBottom: "16px",
                fontSize: "13px",
                color: "var(--accent-danger)",
              }}
            >
              {formError}
            </div>
          )}

          <div style={{ marginBottom: "16px" }}>
            <label htmlFor="bank-name" style={labelStyle}>
              Nome da Conta *
            </label>
            <input
              id="bank-name"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              placeholder="Ex: Conta Principal"
              required
              autoFocus
              style={inputStyle}
            />
          </div>

          <div style={{ marginBottom: "16px" }}>
            <label htmlFor="bank-institution" style={labelStyle}>
              Banco
            </label>
            <input
              id="bank-institution"
              value={formBankName}
              onChange={(e) => setFormBankName(e.target.value)}
              placeholder="Ex: Banco do Brasil"
              style={inputStyle}
            />
          </div>

          <div style={{ marginBottom: "24px" }}>
            <label htmlFor="bank-account-number" style={labelStyle}>
              Número da Conta
            </label>
            <input
              id="bank-account-number"
              value={formAccountNumber}
              onChange={(e) => setFormAccountNumber(e.target.value)}
              placeholder="Ex: 12345-6"
              style={inputStyle}
            />
          </div>

          <div
            style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}
          >
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              style={{
                padding: "10px 18px",
                borderRadius: "var(--radius-md)",
                border: "1px solid var(--border-color)",
                background: "var(--bg-card)",
                color: "var(--text-secondary)",
                fontSize: "13px",
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
                padding: "10px 18px",
                borderRadius: "var(--radius-md)",
                border: "none",
                background:
                  "linear-gradient(135deg, var(--accent-primary), #a855f7)",
                color: "white",
                fontSize: "13px",
                fontWeight: 600,
                cursor: saving ? "wait" : "pointer",
                opacity: saving ? 0.7 : 1,
              }}
            >
              {saving ? "Salvando..." : editAccount ? "Salvar" : "Criar Conta"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Excluir Conta Bancária"
        message={`Tem certeza que deseja excluir a conta "${deleteTarget?.name}"? Esta ação não pode ser desfeita.`}
        confirmText="Excluir"
        isDestructive
      />
    </div>
  );
}
