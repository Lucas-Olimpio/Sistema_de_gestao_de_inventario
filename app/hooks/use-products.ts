import { useQuery } from "@tanstack/react-query";
import { Product, PaginatedResponse } from "@/lib/types";

interface UseProductsParams {
  page?: number;
  limit?: number;
  search?: string;
  categoryId?: string;
}

export function useProducts({
  page = 1,
  limit = 10,
  search = "",
  categoryId = "",
}: UseProductsParams) {
  return useQuery<PaginatedResponse<Product>>({
    queryKey: ["products", { page, limit, search, categoryId }],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });
      if (search) params.append("search", search);
      if (categoryId) params.append("categoryId", categoryId);

      const res = await fetch(`/api/products?${params.toString()}`);
      if (!res.ok) throw new Error("Erro ao buscar produtos");
      return res.json();
    },
    placeholderData: (previousData) => previousData, // Keep previous data while fetching new page
  });
}

export function useProduct(id: string) {
  return useQuery<Product>({
    queryKey: ["product", id],
    queryFn: async () => {
      const res = await fetch(`/api/products/${id}`);
      if (!res.ok) throw new Error("Erro ao buscar produto");
      return res.json();
    },
    enabled: !!id,
  });
}
