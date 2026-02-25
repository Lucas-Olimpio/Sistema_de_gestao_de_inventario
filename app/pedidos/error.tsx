"use client";
import ErrorDisplay from "@/app/components/error-display";

export default function PedidosError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <ErrorDisplay
      error={error}
      reset={reset}
      title="Erro nos Pedidos de Venda"
      description="Não foi possível carregar os pedidos. Verifique a sua ligação e tente novamente."
    />
  );
}
