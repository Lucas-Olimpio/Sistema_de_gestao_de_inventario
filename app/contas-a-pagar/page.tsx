"use client";

import { useEffect, useState } from "react";
import { Wallet, CheckCircle } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import PageHeader from "../components/page-header";
import StatsCard from "../components/stats-card";
import AnimSection from "../components/anim-section";
import DataTable, { Column } from "../components/data-table";
import StatusBadge from "../components/status-badge";
import { Payable } from "@/lib/types";

export default function ContasAPagarPage() {
  const [payables, setPayables] = useState<Payable[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPayables = async () => {
    const res = await fetch("/api/accounts-payable");
    const data = await res.json();
    setPayables(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchPayables();
  }, []);

  const markAsPaid = async (id: string) => {
    if (!confirm("Confirmar pagamento desta conta?")) return;
    const res = await fetch("/api/accounts-payable", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    if (res.ok) {
      fetchPayables();
    } else {
      const data = await res.json();
      alert(data.error || "Erro ao marcar como pago");
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
        p.status === "PENDENTE" && (
          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <button
              onClick={() => markAsPaid(p.id)}
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
        <DataTable
          data={payables}
          columns={columns}
          isLoading={loading}
          emptyMessage="Nenhuma conta a pagar registrada"
        />
      </AnimSection>
    </div>
  );
}
