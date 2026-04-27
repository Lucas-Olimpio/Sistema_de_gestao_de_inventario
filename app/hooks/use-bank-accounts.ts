import { useQuery } from "@tanstack/react-query";
import { BankAccount, Transaction } from "@/lib/types";

export function useBankAccounts() {
  return useQuery<BankAccount[]>({
    queryKey: ["bank-accounts"],
    queryFn: async () => {
      const res = await fetch("/api/bank-accounts");
      if (!res.ok) throw new Error("Erro ao buscar contas bancárias");
      return res.json();
    },
  });
}

export function useBankAccountTransactions(accountId: string) {
  return useQuery<Transaction[]>({
    queryKey: ["bank-account-transactions", accountId],
    queryFn: async () => {
      const res = await fetch(`/api/bank-accounts/${accountId}`);
      if (!res.ok) throw new Error("Erro ao buscar transações");
      const data = await res.json();
      return data.transactions || [];
    },
    enabled: !!accountId,
  });
}
