"use client";

import { useEffect, useState } from "react";
import { Plus, ShoppingBag } from "lucide-react";
import Modal from "../components/modal";
import PageHeader from "@/app/components/page-header";
import OrderTable from "./components/order-table";
import OrderForm from "./components/order-form";
import OrderDetailModal from "./components/order-detail-modal";
import { Product, SalesOrder, Customer } from "@/lib/types";

export default function PedidosPage() {
  const [orders, setOrders] = useState<SalesOrder[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [detailOrder, setDetailOrder] = useState<SalesOrder | null>(null);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const fetchOrders = async () => {
    const url = statusFilter
      ? `/api/sales-orders?status=${statusFilter}`
      : "/api/sales-orders";
    const res = await fetch(url);
    const data = await res.json();
    setOrders(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchOrders();
    fetch("/api/customers")
      .then((r) => r.json())
      .then(setCustomers);
    fetch("/api/products")
      .then((r) => r.json())
      .then(setProducts);
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [statusFilter]);

  const handleSubmit = async (data: any) => {
    const items = data.items
      .filter((i: any) => i.productId && i.quantity && i.unitPrice)
      .map((i: any) => ({
        productId: i.productId,
        quantity: parseInt(i.quantity),
        unitPrice: parseFloat(i.unitPrice),
      }));

    if (items.length === 0) {
      setError("Adicione pelo menos um item ao pedido");
      return;
    }

    const res = await fetch("/api/sales-orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...data, items }),
    });

    if (res.ok) {
      setModalOpen(false);
      fetchOrders();
    } else {
      const resData = await res.json();
      setError(resData.error || "Erro ao criar pedido");
      throw new Error(resData.error);
    }
  };

  const updateStatus = async (id: string, status: string) => {
    const res = await fetch(`/api/sales-orders/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      fetchOrders();
      setDetailOrder(null);
    } else {
      const data = await res.json();
      alert(data.error || "Erro ao atualizar status");
    }
  };

  const deleteOrder = async (id: string) => {
    if (!confirm("Excluir este pedido de venda?")) return;
    const res = await fetch(`/api/sales-orders/${id}`, { method: "DELETE" });
    if (res.ok) {
      fetchOrders();
    } else {
      const data = await res.json();
      alert(data.error || "Erro ao excluir");
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      <PageHeader
        title="Pedidos de Venda"
        icon={ShoppingBag}
        action={
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{
                padding: "8px 12px",
                borderRadius: "var(--radius-md)",
                border: "1px solid var(--border-color)",
                background: "var(--bg-input)",
                color: "var(--text-primary)",
                fontSize: "13px",
                cursor: "pointer",
              }}
            >
              <option value="">Todos os status</option>
              <option value="PENDENTE">Pendente</option>
              <option value="APROVADA">Aprovada</option>
              <option value="FATURADA">Faturada</option>
              <option value="CANCELADA">Cancelada</option>
            </select>
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
              Novo Pedido
            </button>
          </div>
        }
      />

      <OrderTable
        orders={orders}
        loading={loading}
        onView={setDetailOrder}
        onUpdateStatus={updateStatus}
        onDelete={deleteOrder}
      />

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Novo Pedido de Venda"
        maxWidth="700px"
      >
        <OrderForm
          customers={customers}
          products={products}
          onSubmit={handleSubmit}
          onCancel={() => setModalOpen(false)}
          error={error}
        />
      </Modal>

      <OrderDetailModal
        order={detailOrder}
        onClose={() => setDetailOrder(null)}
      />
    </div>
  );
}
