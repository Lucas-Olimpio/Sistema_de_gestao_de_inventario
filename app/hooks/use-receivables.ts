import { useQuery } from "@tanstack/react-query";
import { Receivable } from "@/lib/types";

interface UseReceivablesParams {
  status?: string;
  search?: string;
}

export function useReceivables({ status = "", search = "" }: UseReceivablesParams = {}) {
  return useQuery<Receivable[]>({
    queryKey: ["receivables", { status, search }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (status) params.append("status", status);
      if (search) params.append("search", search);

      const res = await fetch(`/api/accounts-receivable?${params.toString()}`);
      if (!res.ok) throw new Error("Erro ao buscar contas a receber");
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    },
  });
}
