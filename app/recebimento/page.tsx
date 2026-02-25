"use client";

import { useState } from "react";
import { ClipboardCheck, Package } from "lucide-react";
import Modal from "../components/modal";
import PageHeader from "@/app/components/page-header";
import DataTable, { Column } from "@/app/components/data-table";
import ReceiveForm from "./components/receive-form";
import ReceiptResult from "./components/receipt-result";
import { PurchaseOrder } from "@/lib/types";
import { formatCurrency, formatDate } from "@/lib/utils";
import StatusBadge from "@/app/components/status-badge";

import { usePurchaseOrders } from "@/app/hooks/use-purchase-orders";
import { useQueryClient } from "@tanstack/react-query";

export default function RecebimentoPage() {
  const queryClient = useQueryClient();
  const [receiveModalOpen, setReceiveModalOpen] = useState(false);
  const [resultModalOpen, setResultModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<PurchaseOrder | null>(
    null,
  );
  const [receiveItems, setReceiveItems] = useState<any[]>([]);
  const [result, setResult] = useState<any | null>(null);
  const [error, setError] = useState("");

  const { data: transitOrders = [], isLoading: loadingTransit } =
    usePurchaseOrders("EM_TRANSITO");
  const { data: approvedOrders = [], isLoading: loadingApproved } =
    usePurchaseOrders("APROVADA");

  const orders = [...transitOrders, ...approvedOrders];
  const loading = loadingTransit || loadingApproved;

  const openReceive = (order: PurchaseOrder) => {
    setSelectedOrder(order);
    setError("");

    setReceiveItems(
      order.items.map((item) => ({
        productId: item.productId,
        productName: item.product.name,
        productSku: item.product.sku,
        receivedQty: "",
      })),
    );
    setReceiveModalOpen(true);
  };

  const handleConfirmReceive = async (formData: any) => {
    if (!selectedOrder) return;
    setError("");

    try {
      if (formData instanceof FormData) {
        formData.append("purchaseOrderId", selectedOrder.id);
      } else {
        console.error("Expected FormData");
        return;
      }

      const response = await fetch("/api/recebimento", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setResult({
          receipt: {
            id: result.data.id || "new",
            purchaseOrderId: selectedOrder.id,
            createdAt: new Date(),
          },
          divergences: [],
        });
        setReceiveModalOpen(false);
        setResultModalOpen(true);
        queryClient.invalidateQueries({ queryKey: ["purchase-orders"] });
        queryClient.invalidateQueries({ queryKey: ["products"] });
      } else {
        setError(
          result.error || result.message || "Erro ao registrar recebimento",
        );
      }
    } catch (e: any) {
      setError(e.message || "Erro inesperado");
    }
  };

  const columns: Column<PurchaseOrder>[] = [
    {
      header: "Código",
      accessor: "code",
      cell: (order) => (
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span
            style={{
              fontFamily: "monospace",
              fontWeight: 700,
              color: "var(--accent-primary)",
            }}
          >
            {order.code}
          </span>
          <StatusBadge status={order.status} type="purchase" />
        </div>
      ),
    },
    {
      header: "Fornecedor",
      cell: (order) => (
        <span style={{ fontWeight: 600 }}>{order.supplier.name}</span>
      ),
    },
    {
      header: "Detalhes",
      cell: (order) => (
        <span style={{ color: "var(--text-secondary)", fontSize: "13px" }}>
          {order.items.length} itens · {formatCurrency(order.totalValue)}
        </span>
      ),
    },
    {
      header: "Criada em",
      cell: (order) => (
        <span style={{ color: "var(--text-muted)", fontSize: "12px" }}>
          {formatDate(order.createdAt)}
        </span>
      ),
    },
    {
      header: "Ação",
      align: "right",
      cell: (order) => (
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <button
            onClick={() => openReceive(order)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "8px 14px",
              borderRadius: "var(--radius-md)",
              background: "var(--accent-success)",
              color: "white",
              fontSize: "12px",
              fontWeight: 600,
              border: "none",
              cursor: "pointer",
              boxShadow: "0 2px 8px rgba(34, 197, 94, 0.3)",
            }}
          >
            <ClipboardCheck size={16} />
            Receber
          </button>
        </div>
      ),
    },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      <PageHeader
        title="Recebimento de Mercadorias"
        subtitle="Conferência cega e entrada em estoque"
        icon={Package}
      />

      <DataTable
        data={orders}
        columns={columns}
        isLoading={loading}
        emptyMessage="Nenhuma ordem aguardando recebimento"
      />

      <Modal
        isOpen={receiveModalOpen}
        onClose={() => setReceiveModalOpen(false)}
        title={`Conferência — ${selectedOrder?.code || ""}`}
        maxWidth="600px"
      >
        <ReceiveForm
          items={receiveItems}
          onConfirm={handleConfirmReceive}
          onCancel={() => setReceiveModalOpen(false)}
          error={error}
        />
      </Modal>

      <Modal
        isOpen={resultModalOpen}
        onClose={() => setResultModalOpen(false)}
        title="Resultado do Recebimento"
        maxWidth="600px"
      >
        {result && (
          <ReceiptResult
            result={result}
            onClose={() => setResultModalOpen(false)}
          />
        )}
      </Modal>
    </div>
  );
}
