"use client";

import { useEffect, useState } from "react";
import { ClipboardCheck, Package } from "lucide-react";
import Modal from "../components/modal";
import PageHeader from "@/app/components/page-header";
import DataTable, { Column } from "@/app/components/data-table";
import ReceiveForm from "./components/receive-form";
import ReceiptResult from "./components/receipt-result";
import { PurchaseOrder } from "@/lib/types";
import { formatCurrency, formatDate } from "@/lib/utils";
import StatusBadge from "@/app/components/status-badge";

export default function RecebimentoPage() {
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [receiveModalOpen, setReceiveModalOpen] = useState(false);
  const [resultModalOpen, setResultModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<PurchaseOrder | null>(
    null,
  );
  const [receiveItems, setReceiveItems] = useState<any[]>([]);
  const [result, setResult] = useState<any | null>(null);
  const [error, setError] = useState("");

  const fetchOrders = async () => {
    // Fetch orders that are ready for receiving (EM_TRANSITO or APROVADA)
    const [res1, res2] = await Promise.all([
      fetch("/api/purchase-orders?status=EM_TRANSITO"),
      fetch("/api/purchase-orders?status=APROVADA"),
    ]);
    const [d1, d2] = await Promise.all([res1.json(), res2.json()]);
    setOrders([...d1, ...d2]);
    setLoading(false);
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const openReceive = (order: PurchaseOrder) => {
    setSelectedOrder(order);
    setError("");
    // Blind conference: we show the items but NOT the ordered quantity
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

  const handleConfirmReceive = async (items: any[]) => {
    if (!selectedOrder) return;
    setError("");

    const res = await fetch("/api/goods-receipts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        purchaseOrderId: selectedOrder.id,
        notes: null,
        items,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      setResult({
        ...data,
      });
      setReceiveModalOpen(false);
      setResultModalOpen(true);
      fetchOrders();
    } else {
      const data = await res.json();
      const erroMsg = data.error || "Erro ao registrar recebimento";
      setError(erroMsg);
      throw new Error(erroMsg);
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
