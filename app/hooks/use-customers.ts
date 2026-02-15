import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Customer } from "@/lib/types";

export function useCustomers(search?: string) {
  const queryClient = useQueryClient();

  const query = useQuery<Customer[]>({
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

  const createCustomer = useMutation({
    mutationFn: async (data: Partial<Customer>) => {
      const res = await fetch("/api/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Erro ao criar cliente");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
    },
  });

  const updateCustomer = useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: Partial<Customer>;
    }) => {
      const res = await fetch(`/api/customers/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Erro ao atualizar cliente");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
    },
  });

  const deleteCustomer = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/customers/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Erro ao excluir cliente");
      }
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
    },
  });

  return {
    ...query,
    createCustomer,
    updateCustomer,
    deleteCustomer,
  };
}
