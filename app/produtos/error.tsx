"use client";
import ErrorDisplay from "@/app/components/error-display";

export default function ProdutosError({
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
      title="Erro nos Produtos"
      description="Não foi possível carregar os produtos. Verifique a sua ligação e tente novamente."
    />
  );
}
