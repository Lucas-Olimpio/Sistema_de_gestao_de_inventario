"use client";
import ErrorDisplay from "@/app/components/error-display";

export default function FornecedoresError({
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
      title="Erro nos Fornecedores"
      description="Não foi possível carregar os fornecedores. Verifique a sua ligação e tente novamente."
    />
  );
}
