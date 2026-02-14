"use client";

import { useEffect, useState } from "react";
import { Plus, ArrowUpRight, ArrowDownRight, ArrowDownUp } from "lucide-react";
import Modal from "../components/modal";
import { formatDate } from "@/lib/utils";
import PageHeader from "../components/page-header";
import DataTable, { Column } from "../components/data-table";
import MovementForm from "./components/movement-form";

interface Product {
  id: string;
  name: string;
  sku: string;
  quantity: number;
}

interface Movement {
  id: string;
  type: string;
  quantity: number;
  reason: string | null;
  createdAt: string;
  product: { name: string; sku: string };
}

export default function MovimentacoesPage() {
  const [movements, setMovements] = useState<Movement[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [error, setError] = useState("");

  const fetchMovements = async () => {
    const res = await fetch("/api/movements");
    const data = await res.json();
    setMovements(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchMovements();
    fetch("/api/products")
      .then((r) => r.json())
      .then(setProducts);
  }, []);

  const handleSubmit = async (form: any) => {
    const res = await fetch("/api/movements", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    if (res.ok) {
      setModalOpen(false);
      fetchMovements();
      // Refresh products to get updated quantities
      fetch("/api/products")
        .then((r) => r.json())
        .then(setProducts);
    } else {
      const data = await res.json();
      setError(data.error || "Erro ao criar movimentação");
      throw new Error(data.error);
    }
  };

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
      accessor: "reason",
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
        subtitle="Entradas e saídas de estoque"
        icon={ArrowDownUp}
        action={
          <button
            onClick={() => {
              setError("");
              setModalOpen(true);
            }}
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
            Nova Movimentação
          </button>
        }
      />

      <DataTable
        data={movements}
        columns={columns}
        isLoading={loading}
        emptyMessage="Nenhuma movimentação registrada"
      />

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
