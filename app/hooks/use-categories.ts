import { useQuery } from "@tanstack/react-query";
import { Category } from "@/lib/types";

export function useCategories() {
  return useQuery<Category[]>({
    queryKey: ["categories"],
    queryFn: async () => {
      const res = await fetch("/api/categories");
      if (!res.ok) throw new Error("Erro ao buscar categorias");
      return res.json();
    },
  });
}
