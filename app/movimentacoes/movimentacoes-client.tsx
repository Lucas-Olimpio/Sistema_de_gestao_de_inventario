"use client";

import { useState } from "react";
import {
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  ArrowDownUp,
  Search,
  Calendar,
} from "lucide-react";
import Modal from "../components/modal";
import { formatDate } from "@/lib/utils";
import PageHeader from "../components/page-header";
import DataTable, { Column } from "../components/data-table";
import MovementForm from "./components/movement-form";
import ExportButton from "../components/export-button";
import { useMovements } from "@/app/hooks/use-movements";
import { useProducts } from "@/app/hooks/use-products";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Movement } from "@/lib/types";

export default function MovimentacoesClient({
  isViewer,
}: {
  isViewer: boolean;
}) {
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [error, setError] = useState("");

  // Filters
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [page, setPage] = useState(1);

  const { data, isLoading } = useMovements({
    page,
    limit: 20,
    search,
    type: typeFilter,
    dateFrom,
    dateTo,
  });

  const movements = data?.data || [];
  const meta = data?.meta;

  const { data: productsData } = useProducts({ limit: 100 });
  const products = productsData?.data || [];

  const handleSubmit = async (form: Record<string, unknown>) => {
    const res = await fetch("/api/movements", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    if (res.ok) {
      setModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ["movements"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.success("Movimentação criada com sucesso!");
    } else {
      const data = await res.json();
      setError(data.error || "Erro ao criar movimentação");
      throw new Error(data.error);
    }
  };

  const clearFilters = () => {
    setSearch("");
    setTypeFilter("");
    setDateFrom("");
    setDateTo("");
    setPage(1);
  };

  const hasFilters = search || typeFilter || dateFrom || dateTo;

  const columns: Column<Movement>[] = [
    {
      header: "Tipo",
      cell: (mov) => (
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: "var(--radius-sm)",
              background:
                mov.type === "IN"
                  ? "var(--accent-success-bg)"
                  : "var(--accent-danger-bg)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {mov.type === "IN" ? (
              <ArrowUpRight size={14} color="var(--accent-success)" />
            ) : (
              <ArrowDownRight size={14} color="var(--accent-danger)" />
            )}
          </div>
          <span
            style={{
              fontSize: "12px",
              fontWeight: 600,
              color:
                mov.type === "IN"
                  ? "var(--accent-success)"
                  : "var(--accent-danger)",
            }}
          >
            {mov.type === "IN" ? "Entrada" : "Saída"}
          </span>
        </div>
      ),
    },
    {
      header: "Produto",
      cell: (mov) => (
        <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>
          {mov.product.name}
        </span>
      ),
    },
    {
      header: "SKU",
      cell: (mov) => (
        <span
          style={{
            fontFamily: "monospace",
            color: "var(--text-muted)",
            fontSize: "12px",
          }}
        >
          {mov.product.sku}
        </span>
      ),
    },
    {
      header: "Quantidade",
      cell: (mov) => (
        <span
          style={{
            fontWeight: 700,
            color:
              mov.type === "IN"
                ? "var(--accent-success)"
                : "var(--accent-danger)",
          }}
        >
          {mov.type === "IN" ? "+" : "-"}
          {mov.quantity}
        </span>
      ),
    },
    {
      header: "Motivo",
      cell: (mov) => (
        <span style={{ color: "var(--text-secondary)" }}>
          {mov.reason || "—"}
        </span>
      ),
    },
    {
      header: "Data",
      cell: (mov) => (
        <span style={{ color: "var(--text-muted)", fontSize: "12px" }}>
          {formatDate(mov.createdAt)}
        </span>
      ),
    },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      <PageHeader
        title="Histórico de Movimentações"
        subtitle={meta ? `${meta.total} registro${meta.total !== 1 ? "s" : ""}` : ""}
        icon={ArrowDownUp}
        action={
          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            <ExportButton entity="movements" requireDates={true} />
            {!isViewer && (
              <button
                onClick={() => {
                  setError("");
                  setModalOpen(true);
                }}
                className="btn-primary"
              >
                <Plus size={18} />
                Nova Movimentação
              </button>
            )}
          </div>
        }
      />

      {/* Filter Bar */}
      <div
        style={{
          display: "flex",
          gap: "10px",
          alignItems: "center",
          flexWrap: "wrap",
          padding: "16px",
          background: "var(--bg-card)",
          borderRadius: "var(--radius-lg)",
          border: "1px solid var(--border-color)",
        }}
      >
        {/* Search */}
        <div className="search-box" style={{ flex: "1", minWidth: "180px" }}>
          <Search size={15} color="var(--text-muted)" />
          <input
            placeholder="Buscar produto ou SKU..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>

        {/* Type filter */}
        <select
          value={typeFilter}
          onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
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
          <option value="">Todos os tipos</option>
          <option value="IN">Entradas</option>
          <option value="OUT">Saídas</option>
        </select>

        {/* Date range */}
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <Calendar size={14} color="var(--text-muted)" />
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => { setDateFrom(e.target.value); setPage(1); }}
            style={{
              padding: "7px 10px",
              borderRadius: "var(--radius-md)",
              border: "1px solid var(--border-color)",
              background: "var(--bg-input)",
              color: "var(--text-primary)",
              fontSize: "12px",
              colorScheme: "dark",
            }}
          />
          <span style={{ color: "var(--text-muted)", fontSize: "12px" }}>até</span>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => { setDateTo(e.target.value); setPage(1); }}
            style={{
              padding: "7px 10px",
              borderRadius: "var(--radius-md)",
              border: "1px solid var(--border-color)",
              background: "var(--bg-input)",
              color: "var(--text-primary)",
              fontSize: "12px",
              colorScheme: "dark",
            }}
          />
        </div>

        {/* Clear */}
        {hasFilters && (
          <button
            onClick={clearFilters}
            className="btn-ghost"
            style={{ padding: "7px 12px", fontSize: "12px" }}
          >
            Limpar filtros
          </button>
        )}
      </div>

      <DataTable
        data={movements}
        columns={columns}
        isLoading={isLoading}
        emptyMessage={hasFilters ? "Nenhuma movimentação com esses filtros" : "Nenhuma movimentação registrada"}
      />

      {/* Pagination */}
      {meta && meta.totalPages > 1 && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "12px 16px",
            background: "var(--bg-card)",
            borderRadius: "var(--radius-lg)",
            border: "1px solid var(--border-color)",
          }}
        >
          <span style={{ fontSize: "13px", color: "var(--text-muted)" }}>
            Página {meta.page} de {meta.totalPages} — {meta.total} registros
          </span>
          <div style={{ display: "flex", gap: "6px" }}>
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="btn-ghost"
              style={{ padding: "6px 14px", fontSize: "12px" }}
            >
              ← Anterior
            </button>
            <button
              onClick={() => setPage((p) => Math.min(meta.totalPages, p + 1))}
              disabled={page === meta.totalPages}
              className="btn-ghost"
              style={{ padding: "6px 14px", fontSize: "12px" }}
            >
              Próxima →
            </button>
          </div>
        </div>
      )}

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Nova Movimentação"
        maxWidth="520px"
      >
        <MovementForm
          products={products}
          onSubmit={handleSubmit}
          onCancel={() => setModalOpen(false)}
          error={error}
        />
      </Modal>
    </div>
  );
}
