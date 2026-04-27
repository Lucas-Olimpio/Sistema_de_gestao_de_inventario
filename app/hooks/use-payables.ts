import { useQuery } from "@tanstack/react-query";
import { Payable } from "@/lib/types";

interface UsePayablesParams {
  status?: string;
  search?: string;
}

export function usePayables({ status = "", search = "" }: UsePayablesParams = {}) {
  return useQuery<Payable[]>({
    queryKey: ["payables", { status, search }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (status) params.append("status", status);
      if (search) params.append("search", search);

      const res = await fetch(`/api/accounts-payable?${params.toString()}`);
      if (!res.ok) throw new Error("Erro ao buscar contas a pagar");
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    },
  });
}
