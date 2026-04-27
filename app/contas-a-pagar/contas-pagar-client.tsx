"use client";

import { useState } from "react";
import { Wallet, CheckCircle, Search } from "lucide-react";
import { toast } from "sonner";
import { formatCurrency, formatDate } from "@/lib/utils";
import PageHeader from "../components/page-header";
import StatsCard from "../components/stats-card";
import AnimSection from "../components/anim-section";
import DataTable, { Column } from "../components/data-table";
import StatusBadge from "../components/status-badge";
import ConfirmModal from "../components/confirm-modal";
import { Payable } from "@/lib/types";
import ExportButton from "../components/export-button";
import { usePayables } from "@/app/hooks/use-payables";
import { useQueryClient } from "@tanstack/react-query";

export default function ContasAPagarClient({
  isViewer,
}: {
  isViewer: boolean;
}) {
  const queryClient = useQueryClient();
  const [payConfirmId, setPayConfirmId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const { data: payables = [], isLoading } = usePayables({ status: statusFilter, search });

  const handlePayConfirm = async () => {
    if (!payConfirmId) return;
    const res = await fetch("/api/accounts-payable", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: payConfirmId }),
    });
    if (res.ok) {
      setPayConfirmId(null);
      queryClient.invalidateQueries({ queryKey: ["payables"] });
      toast.success("Conta marcada como paga!");
    } else {
      const data = await res.json();
      toast.error(data.error || "Erro ao marcar como pago");
    }
  };

  const totalPending = payables
    .filter((p) => p.status === "PENDENTE")
    .reduce((sum, p) => sum + p.amount, 0);

  const totalPaid = payables
    .filter((p) => p.status === "PAGO")
    .reduce((sum, p) => sum + p.amount, 0);

  const columns: Column<Payable>[] = [
    {
      header: "Ordem",
      cell: (p) => (
        <span
          style={{
            fontWeight: 700,
            color: "var(--accent-primary)",
            fontFamily: "monospace",
          }}
        >
          {p.purchaseOrder?.code || "-"}
        </span>
      ),
    },
    {
      header: "Fornecedor",
      cell: (p) => (
        <span style={{ fontWeight: 600 }}>
          {p.purchaseOrder?.supplier?.name || p.supplier?.name || "-"}
        </span>
      ),
    },
    {
      header: "Valor",
      accessor: "amount",
      cell: (p) => (
        <span style={{ fontWeight: 700 }}>{formatCurrency(p.amount)}</span>
      ),
    },
    {
      header: "Status",
      cell: (p) => <StatusBadge status={p.status} type="financial" />,
    },
    {
      header: "Criado em",
      cell: (p) => (
        <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>
          {formatDate(p.createdAt)}
        </span>
      ),
    },
    {
      header: "Pago em",
      cell: (p) => (
        <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>
          {p.paidAt ? formatDate(p.paidAt) : "—"}
        </span>
      ),
    },
    {
      header: "Ação",
      align: "right",
      cell: (p) =>
        p.status === "PENDENTE" &&
        !isViewer && (
          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <button
              onClick={() => setPayConfirmId(p.id)}
              title="Marcar como Pago"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                padding: "6px 12px",
                borderRadius: "var(--radius-sm)",
                border: "1px solid var(--accent-success)",
                background: "var(--accent-success-bg)",
                color: "var(--accent-success)",
                fontSize: "12px",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              <CheckCircle size={14} />
              Pagar
            </button>
          </div>
        ),
    },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      <PageHeader
        title="Contas a Pagar"
        subtitle="Gerencie pagamentos a fornecedores"
        icon={Wallet}
        action={<ExportButton entity="payables" label="Exportar" />}
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
            title="Total Pendente"
            value={formatCurrency(totalPending)}
            icon={Wallet}
            color="warning"
          />
          <StatsCard
            title="Total Pago"
            value={formatCurrency(totalPaid)}
            icon={CheckCircle}
            color="success"
          />
        </div>
      </AnimSection>

      <AnimSection delay={200}>
        {/* Filter bar */}
        <div
          style={{
            display: "flex",
            gap: "10px",
            alignItems: "center",
            flexWrap: "wrap",
            marginBottom: "16px",
          }}
        >
          <div className="search-box" style={{ flex: 1, minWidth: "180px" }}>
            <Search size={15} color="var(--text-muted)" />
            <input placeholder="Buscar fornecedor..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{
              padding: "9px 12px",
              borderRadius: "var(--radius-md)",
              border: "1px solid var(--border-color)",
              background: "var(--bg-input)",
              color: "var(--text-primary)",
              fontSize: "13px",
              cursor: "pointer",
            }}
          >
            <option value="">Todos os status</option>
            <option value="PENDENTE">Pendente</option>
            <option value="PAGO">Pago</option>
          </select>
          {(search || statusFilter) && (
            <button className="btn-ghost" style={{ padding: "7px 12px", fontSize: "12px" }} onClick={() => { setSearch(""); setStatusFilter(""); }}>
              Limpar
            </button>
          )}
        </div>
        <DataTable
          data={payables}
          columns={columns}
          isLoading={isLoading}
          emptyMessage="Nenhuma conta a pagar registrada"
        />
      </AnimSection>

      <ConfirmModal
        isOpen={!!payConfirmId}
        onClose={() => setPayConfirmId(null)}
        onConfirm={handlePayConfirm}
        title="Confirmar Pagamento"
        message="Tem certeza que deseja marcar esta conta como paga?"
        confirmText="Confirmar Pagamento"
      />
    </div>
  );
}
