import React from "react";
import { Package } from "lucide-react";

export interface Column<T> {
  header: string;
  accessor?: keyof T;
  cell?: (item: T) => React.ReactNode;
  width?: string | number;
  align?: "left" | "center" | "right";
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  onRowClick?: (item: T) => void;
  isLoading?: boolean;
  emptyMessage?: string;
  keyExtractor?: (item: T) => string;
}

export default function DataTable<T extends { id?: string }>({
  data,
  columns,
  onRowClick,
  isLoading,
  emptyMessage = "Nenhum registro encontrado",
  keyExtractor,
}: DataTableProps<T>) {
  if (isLoading) {
    return (
      <div
        style={{
          padding: "40px",
          textAlign: "center",
          color: "var(--text-muted)",
          background: "var(--bg-card)",
          borderRadius: "var(--radius-lg)",
          border: "1px solid var(--border-color)",
        }}
      >
        Carregando...
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div
        style={{
          padding: "60px 40px",
          textAlign: "center",
          color: "var(--text-muted)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "12px",
          background: "var(--bg-card)",
          borderRadius: "var(--radius-lg)",
          border: "1px solid var(--border-color)",
        }}
      >
        <Package size={40} strokeWidth={1} style={{ opacity: 0.5 }} />
        <p style={{ fontSize: "15px", fontWeight: 500 }}>{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div
      style={{
        background: "var(--bg-card)",
        borderRadius: "var(--radius-lg)",
        border: "1px solid var(--border-color)",
        overflow: "hidden",
      }}
    >
      <div style={{ overflowX: "auto" }}>
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
              {columns.map((col, i) => (
                <th
                  key={i}
                  style={{
                    padding: "12px 16px",
                    textAlign: col.align || "left",
                    fontWeight: 600,
                    color: "var(--text-secondary)",
                    fontSize: "12px",
                    textTransform: "uppercase",
                    letterSpacing: "0.04em",
                    width: col.width,
                    whiteSpace: "nowrap",
                  }}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((item, rowIndex) => (
              <tr
                key={
                  keyExtractor
                    ? keyExtractor(item)
                    : (item.id as string) || rowIndex
                }
                style={{
                  borderBottom: "1px solid var(--border-color)",
                  transition: "background 0.2s",
                  cursor: onRowClick ? "pointer" : "default",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = "var(--bg-card-hover)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = "transparent")
                }
                onClick={() => onRowClick && onRowClick(item)}
              >
                {columns.map((col, colIndex) => (
                  <td
                    key={colIndex}
                    style={{
                      padding: "14px 16px",
                      color: "var(--text-primary)",
                      textAlign: col.align || "left",
                    }}
                  >
                    {col.cell
                      ? col.cell(item)
                      : col.accessor
                        ? String(item[col.accessor])
                        : ""}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
