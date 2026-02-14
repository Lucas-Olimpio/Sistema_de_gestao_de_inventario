"use client";

import { useEffect, useState } from "react";
import { HandCoins, CheckCircle } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import PageHeader from "../components/page-header";
import StatsCard from "../components/stats-card";
import AnimSection from "../components/anim-section";
import DataTable, { Column } from "../components/data-table";
import StatusBadge from "../components/status-badge";
import { Receivable } from "@/lib/types";

export default function ContasAReceberPage() {
  const [receivables, setReceivables] = useState<Receivable[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchReceivables = async () => {
    const res = await fetch("/api/accounts-receivable");
    const data = await res.json();
    setReceivables(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchReceivables();
  }, []);

  const markAsReceived = async (id: string) => {
    if (!confirm("Confirmar recebimento desta conta?")) return;
    const res = await fetch("/api/accounts-receivable", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    if (res.ok) {
      fetchReceivables();
    } else {
      const data = await res.json();
      alert(data.error || "Erro ao marcar como recebido");
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
        r.status === "PENDENTE" && (
          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <button
              onClick={() => markAsReceived(r.id)}
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
        <DataTable
          data={receivables}
          columns={columns}
          isLoading={loading}
          emptyMessage="Nenhuma conta a receber registrada"
        />
      </AnimSection>
    </div>
  );
}
