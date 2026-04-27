import { useQuery } from "@tanstack/react-query";
import { Movement, PaginatedResponse } from "@/lib/types";

interface UseMovementsParams {
  page?: number;
  limit?: number;
  search?: string;
  type?: string;
  dateFrom?: string;
  dateTo?: string;
}

export function useMovements({
  page = 1,
  limit = 20,
  search = "",
  type = "",
  dateFrom = "",
  dateTo = "",
}: UseMovementsParams = {}) {
  return useQuery<PaginatedResponse<Movement>>({
    queryKey: ["movements", { page, limit, search, type, dateFrom, dateTo }],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });
      if (search) params.append("search", search);
      if (type) params.append("type", type);
      if (dateFrom) params.append("dateFrom", dateFrom);
      if (dateTo) params.append("dateTo", dateTo);

      const res = await fetch(`/api/movements?${params.toString()}`);
      if (!res.ok) throw new Error("Erro ao buscar movimentações");
      return res.json();
    },
    placeholderData: (prev) => prev,
  });
}
