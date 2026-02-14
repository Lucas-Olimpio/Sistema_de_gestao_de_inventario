import { useQuery } from "@tanstack/react-query";
import { Supplier } from "@/lib/types";

export function useSuppliers() {
  return useQuery<Supplier[]>({
    queryKey: ["suppliers"],
    queryFn: async () => {
      const res = await fetch("/api/suppliers");
      if (!res.ok) throw new Error("Erro ao buscar fornecedores");
      return res.json();
    },
  });
}
