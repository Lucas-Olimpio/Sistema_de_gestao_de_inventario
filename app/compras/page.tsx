"use client";

import { useEffect, useState } from "react";
import { Plus, ShoppingCart } from "lucide-react";
import { toast } from "sonner";
import Modal from "../components/modal";
import PageHeader from "@/app/components/page-header";
import OrderTable from "./components/order-table";
import OrderForm from "./components/order-form";
import OrderDetailModal from "./components/order-detail-modal";
import { Product, PurchaseOrder, Supplier } from "@/lib/types";

export default function ComprasPage() {
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [detailOrder, setDetailOrder] = useState<PurchaseOrder | null>(null);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const fetchOrders = async () => {
    const url = statusFilter
      ? `/api/purchase-orders?status=${statusFilter}`
      : "/api/purchase-orders";
    const res = await fetch(url);
    const data = await res.json();
    setOrders(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchOrders();
    fetch("/api/suppliers")
      .then((r) => r.json())
      .then(setSuppliers);
    fetch("/api/products")
      .then((r) => r.json())
      .then(setProducts);
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [statusFilter]);

  const handleSubmit = async (data: any) => {
    // Basic validation
    const items = data.items
      .filter((i: any) => i.productId && i.quantity && i.unitPrice)
      .map((i: any) => ({
        productId: i.productId,
        quantity: parseInt(i.quantity),
        unitPrice: parseFloat(i.unitPrice),
      }));

    if (items.length === 0) {
      toast.error("Adicione pelo menos um item à ordem");
      return;
    }

    const res = await fetch("/api/purchase-orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...data, items }),
    });

    if (res.ok) {
      setModalOpen(false);
      fetchOrders();
      toast.success("Ordem de compra criada com sucesso!");
    } else {
      const resData = await res.json();
      toast.error(resData.error || "Erro ao criar ordem");
    }
  };

  const updateStatus = async (id: string, status: string) => {
    const res = await fetch(`/api/purchase-orders/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      fetchOrders();
      setDetailOrder(null);
      toast.success("Status atualizado com sucesso!");
    } else {
      const data = await res.json();
      toast.error(data.error || "Erro ao atualizar status");
    }
  };

  const deleteOrder = async (id: string) => {
    if (!confirm("Excluir esta ordem de compra?")) return;
    const res = await fetch(`/api/purchase-orders/${id}`, {
      method: "DELETE",
    });
    if (res.ok) {
      fetchOrders();
      toast.success("Ordem excluída com sucesso!");
    } else {
      const data = await res.json();
      toast.error(data.error || "Erro ao excluir");
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      <PageHeader
        title="Ordens de Compra"
        icon={ShoppingCart}
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
              <option value="EM_TRANSITO">Em Trânsito</option>
              <option value="RECEBIDA">Recebida</option>
              <option value="CANCELADA">Cancelada</option>
            </select>
            <button
              onClick={() => {
                setError("");
                setModalOpen(true);
              }}
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
                border: "none",
                cursor: "pointer",
              }}
            >
              <Plus size={18} />
              Nova Ordem
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
        title="Nova Ordem de Compra"
        maxWidth="700px"
      >
        <OrderForm
          suppliers={suppliers}
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
