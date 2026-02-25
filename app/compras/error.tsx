"use client";
import ErrorDisplay from "@/app/components/error-display";

export default function ComprasError({
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
      title="Erro nas Compras"
      description="Não foi possível carregar as ordens de compra. Verifique a sua ligação e tente novamente."
    />
  );
}
