"use client";

import { useState } from "react";
import { HandCoins, CheckCircle, Search } from "lucide-react";
import { toast } from "sonner";
import { formatCurrency, formatDate } from "@/lib/utils";
import PageHeader from "../components/page-header";
import StatsCard from "../components/stats-card";
import AnimSection from "../components/anim-section";
import DataTable, { Column } from "../components/data-table";
import StatusBadge from "../components/status-badge";
import ConfirmModal from "../components/confirm-modal";
import { Receivable } from "@/lib/types";
import ExportButton from "../components/export-button";
import { useReceivables } from "@/app/hooks/use-receivables";
import { useQueryClient } from "@tanstack/react-query";

export default function ContasAReceberClient({
  isViewer,
}: {
  isViewer: boolean;
}) {
  const queryClient = useQueryClient();
  const [receiveConfirmId, setReceiveConfirmId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const { data: receivables = [], isLoading } = useReceivables({ status: statusFilter, search });

  const handleReceiveConfirm = async () => {
    if (!receiveConfirmId) return;
    const res = await fetch("/api/accounts-receivable", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: receiveConfirmId }),
    });
    if (res.ok) {
      setReceiveConfirmId(null);
      queryClient.invalidateQueries({ queryKey: ["receivables"] });
      toast.success("Conta marcada como recebida!");
    } else {
      const data = await res.json();
      toast.error(data.error || "Erro ao marcar como recebido");
    }
  };

  const totalPending = receivables
    .filter((r) => r.status === "PENDENTE")
    .reduce((sum, r) => sum + r.amount, 0);

  const totalReceived = receivables
    .filter((r) => r.status === "RECEBIDO")
    .reduce((sum, r) => sum + r.amount, 0);

  const columns: Column<Receivable>[] = [
    {
      header: "Pedido",
      cell: (r) => (
        <span
          style={{
            fontWeight: 700,
            color: "var(--accent-primary)",
            fontFamily: "monospace",
          }}
        >
          {r.salesOrder?.code || "-"}
        </span>
      ),
    },
    {
      header: "Cliente",
      cell: (r) => (
        <span style={{ fontWeight: 600 }}>
          {r.salesOrder?.customer?.name || r.customer?.name || "-"}
        </span>
      ),
    },
    {
      header: "Valor",
      accessor: "amount",
      cell: (r) => (
        <span style={{ fontWeight: 700 }}>{formatCurrency(r.amount)}</span>
      ),
    },
    {
      header: "Status",
      cell: (r) => <StatusBadge status={r.status} type="financial" />,
    },
    {
      header: "Criado em",
      cell: (r) => (
        <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>
          {formatDate(r.createdAt)}
        </span>
      ),
    },
    {
      header: "Recebido em",
      cell: (r) => (
        <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>
          {r.receivedAt ? formatDate(r.receivedAt) : "—"}
        </span>
      ),
    },
    {
      header: "Ação",
      align: "right",
      cell: (r) =>
        r.status === "PENDENTE" &&
        !isViewer && (
          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <button
              onClick={() => setReceiveConfirmId(r.id)}
              title="Marcar como Recebido"
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
              Receber
            </button>
          </div>
        ),
    },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      <PageHeader
        title="Contas a Receber"
        subtitle="Gerencie recebimentos de vendas"
        icon={HandCoins}
        action={<ExportButton entity="receivables" label="Exportar" />}
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
            title="Total a Receber"
            value={formatCurrency(totalPending)}
            icon={HandCoins}
            color="info"
          />
          <StatsCard
            title="Total Recebido"
            value={formatCurrency(totalReceived)}
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
            <input placeholder="Buscar cliente..." value={search} onChange={(e) => setSearch(e.target.value)} />
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
            <option value="RECEBIDO">Recebido</option>
          </select>
          {(search || statusFilter) && (
            <button className="btn-ghost" style={{ padding: "7px 12px", fontSize: "12px" }} onClick={() => { setSearch(""); setStatusFilter(""); }}>
              Limpar
            </button>
          )}
        </div>
        <DataTable
          data={receivables}
          columns={columns}
          isLoading={isLoading}
          emptyMessage="Nenhuma conta a receber registrada"
        />
      </AnimSection>

      <ConfirmModal
        isOpen={!!receiveConfirmId}
        onClose={() => setReceiveConfirmId(null)}
        onConfirm={handleReceiveConfirm}
        title="Confirmar Recebimento"
        message="Tem certeza que deseja marcar esta conta como recebida?"
        confirmText="Confirmar Recebimento"
      />
    </div>
  );
}
