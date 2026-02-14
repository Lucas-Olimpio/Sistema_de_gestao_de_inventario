"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Search, Edit2, Trash2, Filter, Package } from "lucide-react";
import { formatCurrency, formatDateShort } from "@/lib/utils";
import PageHeader from "../components/page-header";
import DataTable, { Column } from "../components/data-table";
import ConfirmModal from "../components/confirm-modal";
import StatusBadge from "../components/status-badge";
import { Product, Category } from "@/lib/types";

export default function ProdutosPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const fetchProducts = async () => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (categoryFilter) params.set("categoryId", categoryFilter);

    const res = await fetch(`/api/products?${params}`);
    const data = await res.json();
    setProducts(data);
    setLoading(false);
  };

  useEffect(() => {
    fetch("/api/categories")
      .then((r) => r.json())
      .then(setCategories);
  }, []);

  useEffect(() => {
    const timer = setTimeout(fetchProducts, 300);
    return () => clearTimeout(timer);
  }, [search, categoryFilter]);

  const handleDelete = async () => {
    if (!deleteId) return;
    await fetch(`/api/products/${deleteId}`, { method: "DELETE" });
    setDeleteId(null);
    fetchProducts();
  };

  const inputStyle: React.CSSProperties = {
    padding: "9px 14px",
    borderRadius: "var(--radius-md)",
    border: "1px solid var(--border-color)",
    background: "var(--bg-input)",
    color: "var(--text-primary)",
    fontSize: "13px",
    outline: "none",
  };

  const columns: Column<Product>[] = [
    {
      header: "Produto",
      accessor: "name",
      cell: (product) => (
        <div>
          <p style={{ fontWeight: 600, color: "var(--text-primary)" }}>
            {product.name}
          </p>
          {(product.quantity || 0) <= (product.minStock || 0) && (
            <span
              style={{
                fontSize: "11px",
                color: "var(--accent-warning)",
                fontWeight: 600,
              }}
            >
              Estoque Baixo
            </span>
          )}
        </div>
      ),
    },
    {
      header: "SKU",
      accessor: "sku",
      cell: (product) => (
        <span
          style={{
            fontFamily: "monospace",
            color: "var(--text-secondary)",
            fontSize: "12px",
          }}
        >
          {product.sku}
        </span>
      ),
    },
    {
      header: "Categoria",
      cell: (product) => (
        <span
          style={{
            padding: "4px 10px",
            borderRadius: "var(--radius-sm)",
            background: "var(--accent-primary-glow)",
            color: "var(--accent-primary-hover)",
            fontSize: "12px",
            fontWeight: 500,
          }}
        >
          {product.category?.name || "Sem Categoria"}
        </span>
      ),
    },
    {
      header: "Preço",
      accessor: "price",
      cell: (product) => formatCurrency(product.price),
    },
    {
      header: "Estoque",
      accessor: "quantity",
      cell: (product) => (
        <span
          style={{
            fontWeight: 600,
            color:
              (product.quantity || 0) <= (product.minStock || 0)
                ? "var(--accent-warning)"
                : "var(--text-primary)",
          }}
        >
          {product.quantity}
        </span>
      ),
    },
    {
      header: "Atualizado",
      cell: (product) => (
        <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>
          {product.updatedAt ? formatDateShort(product.updatedAt) : "-"}
        </span>
      ),
    },
    {
      header: "Ações",
      align: "right",
      cell: (product) => (
        <div
          style={{ display: "flex", gap: "6px", justifyContent: "flex-end" }}
        >
          <Link
            href={`/produtos/${product.id}/editar`}
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
              textDecoration: "none",
            }}
          >
            <Edit2 size={14} />
          </Link>
          <button
            onClick={() => setDeleteId(product.id)}
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
        title="Produtos"
        icon={Package}
        action={
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              flexWrap: "wrap",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
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
                    ...inputStyle,
                    border: "none",
                    background: "transparent",
                    padding: "9px 0",
                    width: "200px",
                  }}
                />
              </div>

              <div
                style={{ display: "flex", alignItems: "center", gap: "6px" }}
              >
                <Filter size={16} color="var(--text-muted)" />
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  style={{
                    ...inputStyle,
                    cursor: "pointer",
                    minWidth: "160px",
                  }}
                >
                  <option value="">Todas categorias</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <Link
              href="/produtos/novo"
              className="accent-button"
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
                textDecoration: "none",
                border: "none",
                cursor: "pointer",
              }}
            >
              <Plus size={18} />
              Novo Produto
            </Link>
          </div>
        }
      />

      <DataTable
        data={products}
        columns={columns}
        isLoading={loading}
        emptyMessage="Nenhum produto encontrado"
      />

      <ConfirmModal
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Excluir Produto"
        message="Tem certeza que deseja excluir este produto? Esta ação não pode ser desfeita."
        isDestructive
        confirmText="Excluir"
      />
    </div>
  );
}
