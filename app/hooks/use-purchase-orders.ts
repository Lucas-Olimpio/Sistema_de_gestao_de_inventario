import { useQuery } from "@tanstack/react-query";
import { PurchaseOrder } from "@/lib/types";

export function usePurchaseOrders(status?: string) {
  return useQuery<PurchaseOrder[]>({
    queryKey: ["purchase-orders", { status }],
    queryFn: async () => {
      const url = status
        ? `/api/purchase-orders?status=${status}`
        : "/api/purchase-orders";
      const res = await fetch(url);
      if (!res.ok) throw new Error("Erro ao buscar ordens de compra");
      return res.json();
    },
  });
}
