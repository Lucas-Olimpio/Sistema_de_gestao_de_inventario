"use client";

import { useState } from "react";
import { Plus, ShoppingCart } from "lucide-react";
import { toast } from "sonner";
import { useSession } from "next-auth/react";
import Modal from "../components/modal";
import ConfirmModal from "../components/confirm-modal";
import PageHeader from "@/app/components/page-header";
import OrderTable from "./components/order-table";
import OrderForm from "./components/order-form";
import OrderDetailModal from "./components/order-detail-modal";
import { PurchaseOrder } from "@/lib/types";
import { usePurchaseOrders } from "@/app/hooks/use-purchase-orders";
import { useSuppliers } from "@/app/hooks/use-suppliers";
import { useProducts } from "@/app/hooks/use-products";
import { useQueryClient } from "@tanstack/react-query";

export default function ComprasPage() {
  const { data: session } = useSession();
  const isViewer = (session?.user as any)?.role === "VISUALIZADOR";
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [detailOrder, setDetailOrder] = useState<PurchaseOrder | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const { data: orders = [], isLoading } = usePurchaseOrders(statusFilter);
  const { data: suppliers = [] } = useSuppliers();
  const { data: productsData } = useProducts({ limit: 100 });
  const products = productsData?.data || [];

  const handleSubmit = async (data: Record<string, unknown>) => {
    const rawItems = data.items as Array<Record<string, string>>;
    const items = rawItems
      .filter((i) => i.productId && i.quantity && i.unitPrice)
      .map((i) => ({
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
      queryClient.invalidateQueries({ queryKey: ["purchase-orders"] });
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
      queryClient.invalidateQueries({ queryKey: ["purchase-orders"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      setDetailOrder(null);
      toast.success("Status atualizado com sucesso!");
    } else {
      const data = await res.json();
      toast.error(data.error || "Erro ao atualizar status");
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteId) return;
    const res = await fetch(`/api/purchase-orders/${deleteId}`, {
      method: "DELETE",
    });
    if (res.ok) {
      setDeleteId(null);
      queryClient.invalidateQueries({ queryKey: ["purchase-orders"] });
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
            {!isViewer && (
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
            )}
          </div>
        }
      />

      <OrderTable
        orders={orders}
        loading={isLoading}
        onView={setDetailOrder}
        onUpdateStatus={updateStatus}
        onDelete={(id) => setDeleteId(id)}
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

      <ConfirmModal
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDeleteConfirm}
        title="Excluir Ordem de Compra"
        message="Tem certeza que deseja excluir esta ordem? Esta ação não pode ser desfeita."
        isDestructive
        confirmText="Excluir"
      />
    </div>
  );
}
