import { useQuery } from "@tanstack/react-query";
import { SalesOrder } from "@/lib/types";

export function useSalesOrders(status?: string) {
  return useQuery<SalesOrder[]>({
    queryKey: ["sales-orders", { status }],
    queryFn: async () => {
      const url = status
        ? `/api/sales-orders?status=${status}`
        : "/api/sales-orders";
      const res = await fetch(url);
      if (!res.ok) throw new Error("Erro ao buscar pedidos de venda");
      return res.json();
    },
  });
}
