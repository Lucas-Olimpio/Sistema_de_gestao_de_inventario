import { useQuery } from "@tanstack/react-query";
import { Customer } from "@/lib/types";

export function useCustomers(search?: string) {
  return useQuery<Customer[]>({
    queryKey: ["customers", { search }],
    queryFn: async () => {
      const url = search
        ? `/api/customers?search=${encodeURIComponent(search)}`
        : "/api/customers";
      const res = await fetch(url);
      if (!res.ok) throw new Error("Erro ao buscar clientes");
      return res.json();
    },
  });
}
