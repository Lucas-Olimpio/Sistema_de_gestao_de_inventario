"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  Filter,
  Package,
  AlertTriangle,
} from "lucide-react";
import { formatCurrency, formatDateShort } from "@/lib/utils";

interface Product {
  id: string;
  name: string;
  description: string;
  sku: string;
  price: number;
  quantity: number;
  minStock: number;
  categoryId: string;
  category: { id: string; name: string };
  createdAt: string;
  updatedAt: string;
}

interface Category {
  id: string;
  name: string;
}

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

  const handleDelete = async (id: string) => {
    await fetch(`/api/products/${id}`, { method: "DELETE" });
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

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* Toolbar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "12px",
          flexWrap: "wrap",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          {/* Search */}
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
              placeholder="Buscar por nome ou SKU..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                ...inputStyle,
                border: "none",
                background: "transparent",
                padding: "9px 0",
                minWidth: "240px",
              }}
            />
          </div>

          {/* Category filter */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
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
            boxShadow: "0 2px 8px rgba(99, 102, 241, 0.3)",
            transition: "all 0.2s ease",
          }}
        >
          <Plus size={18} />
          Novo Produto
        </Link>
      </div>

      {/* Table */}
      <div
        style={{
          background: "var(--bg-card)",
          borderRadius: "var(--radius-lg)",
          border: "1px solid var(--border-color)",
          overflow: "hidden",
        }}
      >
        {loading ? (
          <div
            style={{
              padding: "40px",
              textAlign: "center",
              color: "var(--text-muted)",
            }}
          >
            Carregando...
          </div>
        ) : products.length === 0 ? (
          <div
            style={{
              padding: "60px 40px",
              textAlign: "center",
              color: "var(--text-muted)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "12px",
            }}
          >
            <Package size={40} strokeWidth={1} />
            <p style={{ fontSize: "15px", fontWeight: 500 }}>
              Nenhum produto encontrado
            </p>
            <p style={{ fontSize: "13px" }}>
              {search || categoryFilter
                ? "Tente alterar os filtros"
                : "Comece adicionando seu primeiro produto"}
            </p>
          </div>
        ) : (
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: "13px",
            }}
          >
            <thead>
              <tr
                style={{
                  borderBottom: "1px solid var(--border-color)",
                  background: "var(--bg-input)",
                }}
              >
                {[
                  "Produto",
                  "SKU",
                  "Categoria",
                  "Preço",
                  "Estoque",
                  "Status",
                  "Atualizado",
                  "Ações",
                ].map((h) => (
                  <th
                    key={h}
                    style={{
                      padding: "12px 16px",
                      textAlign: "left",
                      fontWeight: 600,
                      color: "var(--text-secondary)",
                      fontSize: "12px",
                      textTransform: "uppercase",
                      letterSpacing: "0.04em",
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {products.map((product) => {
                const isLow = product.quantity <= product.minStock;
                return (
                  <tr
                    key={product.id}
                    style={{
                      borderBottom: "1px solid var(--border-color)",
                      transition: "background 0.2s",
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background =
                        "var(--bg-card-hover)")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.background = "transparent")
                    }
                  >
                    <td style={{ padding: "14px 16px" }}>
                      <div>
                        <p
                          style={{
                            fontWeight: 600,
                            color: "var(--text-primary)",
                          }}
                        >
                          {product.name}
                        </p>
                        {product.description && (
                          <p
                            style={{
                              fontSize: "12px",
                              color: "var(--text-muted)",
                              marginTop: "2px",
                              maxWidth: "200px",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {product.description}
                          </p>
                        )}
                      </div>
                    </td>
                    <td
                      style={{
                        padding: "14px 16px",
                        color: "var(--text-secondary)",
                        fontFamily: "monospace",
                        fontSize: "12px",
                      }}
                    >
                      {product.sku}
                    </td>
                    <td style={{ padding: "14px 16px" }}>
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
                        {product.category.name}
                      </span>
                    </td>
                    <td
                      style={{
                        padding: "14px 16px",
                        fontWeight: 600,
                        color: "var(--text-primary)",
                      }}
                    >
                      {formatCurrency(product.price)}
                    </td>
                    <td
                      style={{
                        padding: "14px 16px",
                        fontWeight: 600,
                        color: isLow
                          ? "var(--accent-warning)"
                          : "var(--text-primary)",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "6px",
                        }}
                      >
                        {isLow && (
                          <AlertTriangle
                            size={14}
                            color="var(--accent-warning)"
                          />
                        )}
                        {product.quantity}
                      </div>
                    </td>
                    <td style={{ padding: "14px 16px" }}>
                      <span
                        style={{
                          padding: "4px 10px",
                          borderRadius: "var(--radius-sm)",
                          fontSize: "12px",
                          fontWeight: 500,
                          ...(product.quantity === 0
                            ? {
                                background: "var(--accent-danger-bg)",
                                color: "var(--accent-danger)",
                              }
                            : isLow
                              ? {
                                  background: "var(--accent-warning-bg)",
                                  color: "var(--accent-warning)",
                                }
                              : {
                                  background: "var(--accent-success-bg)",
                                  color: "var(--accent-success)",
                                }),
                        }}
                      >
                        {product.quantity === 0
                          ? "Esgotado"
                          : isLow
                            ? "Baixo"
                            : "Normal"}
                      </span>
                    </td>
                    <td
                      style={{
                        padding: "14px 16px",
                        color: "var(--text-muted)",
                        fontSize: "12px",
                      }}
                    >
                      {formatDateShort(product.updatedAt)}
                    </td>
                    <td style={{ padding: "14px 16px" }}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "6px",
                        }}
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
                            transition: "all 0.2s",
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.borderColor =
                              "var(--accent-primary)";
                            e.currentTarget.style.color =
                              "var(--accent-primary)";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.borderColor =
                              "var(--border-color)";
                            e.currentTarget.style.color =
                              "var(--text-secondary)";
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
                            color: "var(--text-secondary)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            cursor: "pointer",
                            transition: "all 0.2s",
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.borderColor =
                              "var(--accent-danger)";
                            e.currentTarget.style.color =
                              "var(--accent-danger)";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.borderColor =
                              "var(--border-color)";
                            e.currentTarget.style.color =
                              "var(--text-secondary)";
                          }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Delete confirmation */}
      {deleteId && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 50,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(0,0,0,0.6)",
            backdropFilter: "blur(4px)",
          }}
          onClick={() => setDeleteId(null)}
        >
          <div
            style={{
              background: "var(--bg-card)",
              borderRadius: "var(--radius-lg)",
              border: "1px solid var(--border-color)",
              padding: "28px",
              maxWidth: "400px",
              textAlign: "center",
              boxShadow: "var(--shadow-lg)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: "50%",
                background: "var(--accent-danger-bg)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 16px",
              }}
            >
              <Trash2 size={24} color="var(--accent-danger)" />
            </div>
            <h3
              style={{
                fontSize: "16px",
                fontWeight: 700,
                color: "var(--text-primary)",
                marginBottom: "8px",
              }}
            >
              Excluir Produto
            </h3>
            <p
              style={{
                fontSize: "13px",
                color: "var(--text-secondary)",
                marginBottom: "20px",
              }}
            >
              Tem certeza que deseja excluir este produto? Esta ação não pode
              ser desfeita.
            </p>
            <div
              style={{
                display: "flex",
                gap: "10px",
                justifyContent: "center",
              }}
            >
              <button
                onClick={() => setDeleteId(null)}
                style={{
                  padding: "9px 20px",
                  borderRadius: "var(--radius-md)",
                  border: "1px solid var(--border-color)",
                  background: "transparent",
                  color: "var(--text-secondary)",
                  fontSize: "13px",
                  fontWeight: 500,
                  cursor: "pointer",
                }}
              >
                Cancelar
              </button>
              <button
                onClick={() => handleDelete(deleteId)}
                style={{
                  padding: "9px 20px",
                  borderRadius: "var(--radius-md)",
                  border: "none",
                  background: "var(--accent-danger)",
                  color: "white",
                  fontSize: "13px",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
