"use client";

import { useState } from "react";
import { Plus, ShoppingBag } from "lucide-react";
import { toast } from "sonner";
import Modal from "../components/modal";
import PageHeader from "@/app/components/page-header";
import OrderTable from "./components/order-table";
import OrderForm from "./components/order-form";
import OrderDetailModal from "./components/order-detail-modal";
import { useSalesOrders } from "@/app/hooks/use-sales-orders";
import { useCustomers } from "@/app/hooks/use-customers";
import { useProducts } from "@/app/hooks/use-products";
import { SalesOrder } from "@/lib/types";
import { useQueryClient } from "@tanstack/react-query";

export default function PedidosPage() {
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [detailOrder, setDetailOrder] = useState<SalesOrder | null>(null);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  // Hooks
  const { data: orders = [], isLoading: loadingOrders } =
    useSalesOrders(statusFilter);
  const { data: customers = [] } = useCustomers();
  // For dropdowns, we might want all products or allow search.
  // For now, let's fetch a reasonably large limit or implement searching in the dropdown later.
  // The original code fetched /api/products without pagination?
  // Checking original: fetch("/api/products") -> likely filtered by whatever default or all.
  // Our useProducts defaults to limit 10. We might need a "fetchAll" or higher limit.
  // Let's assume for now 100 is enough for dropdowns or we need a specific 'list' endpoint.
  // For now I'll use a large limit.
  const { data: productsData } = useProducts({ limit: 100 });
  const products = productsData?.data || [];

  const handleSubmit = async (data: any) => {
    const items = data.items
      .filter((i: any) => i.productId && i.quantity && i.unitPrice)
      .map((i: any) => ({
        productId: i.productId,
        quantity: parseInt(i.quantity),
        unitPrice: parseFloat(i.unitPrice),
      }));

    if (items.length === 0) {
      toast.error("Adicione pelo menos um item ao pedido");
      return;
    }

    const res = await fetch("/api/sales-orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...data, items }),
    });

    if (res.ok) {
      setModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ["sales-orders"] });
      toast.success("Pedido de venda criado com sucesso!");
    } else {
      const resData = await res.json();
      toast.error(resData.error || "Erro ao criar pedido");
    }
  };

  const updateStatus = async (id: string, status: string) => {
    const res = await fetch(`/api/sales-orders/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      queryClient.invalidateQueries({ queryKey: ["sales-orders"] });
      queryClient.invalidateQueries({ queryKey: ["products"] }); // Stock update
      setDetailOrder(null);
      toast.success("Status atualizado com sucesso!");
    } else {
      const data = await res.json();
      toast.error(data.error || "Erro ao atualizar status");
    }
  };

  const deleteOrder = async (id: string) => {
    if (!confirm("Excluir este pedido de venda?")) return;
    const res = await fetch(`/api/sales-orders/${id}`, { method: "DELETE" });
    if (res.ok) {
      queryClient.invalidateQueries({ queryKey: ["sales-orders"] });
      toast.success("Pedido excluído com sucesso!");
    } else {
      const data = await res.json();
      toast.error(data.error || "Erro ao excluir");
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
        loading={loadingOrders}
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
