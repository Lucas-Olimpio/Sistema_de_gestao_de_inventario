import React from "react";
import { Check, Trash2, FileText, XCircle, Eye } from "lucide-react";
import { SalesOrder } from "@/lib/types";
import { formatCurrency, formatDate } from "@/lib/utils";
import StatusBadge from "@/app/components/status-badge";
import DataTable, { Column } from "@/app/components/data-table";

interface OrderTableProps {
  orders: SalesOrder[];
  onView: (order: SalesOrder) => void;
  onUpdateStatus: (id: string, status: string) => void;
  onDelete: (id: string) => void;
  loading: boolean;
}

export default function OrderTable({
  orders,
  onView,
  onUpdateStatus,
  onDelete,
  loading,
}: OrderTableProps) {
  const columns: Column<SalesOrder>[] = [
    {
      header: "Código",
      accessor: "code",
      cell: (order) => (
        <span
          style={{
            fontWeight: 700,
            color: "var(--accent-primary)",
            fontFamily: "monospace",
          }}
        >
          {order.code}
        </span>
      ),
    },
    {
      header: "Cliente",
      cell: (order) => (
        <span style={{ fontWeight: 600 }}>{order.customer.name}</span>
      ),
    },
    {
      header: "Itens",
      cell: (order) => (
        <span style={{ color: "var(--text-muted)" }}>{order.items.length}</span>
      ),
    },
    {
      header: "Valor Total",
      cell: (order) => (
        <span style={{ fontWeight: 600 }}>
          {formatCurrency(order.totalValue)}
        </span>
      ),
    },
    {
      header: "Status",
      cell: (order) => <StatusBadge status={order.status} type="sales" />,
    },
    {
      header: "Data",
      cell: (order) => (
        <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>
          {formatDate(order.createdAt)}
        </span>
      ),
    },
    {
      header: "Ações",
      align: "right",
      cell: (order) => (
        <div
          style={{ display: "flex", gap: "6px", justifyContent: "flex-end" }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => onView(order)}
            title="Ver Detalhes"
            style={{
              width: 32,
              height: 32,
              borderRadius: "var(--radius-sm)",
              border: "1px solid var(--border-color)",
              background: "transparent",
              color: "var(--text-primary)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
            }}
          >
            <Eye size={14} />
          </button>

          {order.status === "PENDENTE" && (
            <>
              <button
                onClick={() => onUpdateStatus(order.id, "APROVADA")}
                title="Aprovar"
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: "var(--radius-sm)",
                  border: "1px solid var(--border-color)",
                  background: "transparent",
                  color: "var(--accent-success)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                }}
              >
                <Check size={14} />
              </button>
              <button
                onClick={() => onDelete(order.id)}
                title="Excluir"
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
            </>
          )}

          {order.status === "APROVADA" && (
            <>
              <button
                onClick={() => onUpdateStatus(order.id, "FATURADA")}
                title="Faturar (Baixa no estoque)"
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: "var(--radius-sm)",
                  border: "1px solid var(--border-color)",
                  background: "transparent",
                  color: "var(--accent-success)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                }}
              >
                <FileText size={14} />
              </button>
              <button
                onClick={() => onUpdateStatus(order.id, "CANCELADA")}
                title="Cancelar"
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: "var(--radius-sm)",
                  border: "1px solid var(--border-color)",
                  background: "transparent",
                  color: "var(--text-muted)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                }}
              >
                <XCircle size={14} />
              </button>
            </>
          )}

          {order.status === "PENDENTE" && (
            <button
              onClick={() => onUpdateStatus(order.id, "CANCELADA")}
              title="Cancelar"
              style={{
                width: 32,
                height: 32,
                borderRadius: "var(--radius-sm)",
                border: "1px solid var(--border-color)",
                background: "transparent",
                color: "var(--text-muted)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
              }}
            >
              <XCircle size={14} />
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <DataTable
      data={orders}
      columns={columns}
      isLoading={loading}
      onRowClick={onView}
      emptyMessage="Nenhum pedido de venda encontrado"
    />
  );
}
