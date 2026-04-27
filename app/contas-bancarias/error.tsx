"use client";
import ErrorDisplay from "@/app/components/error-display";

export default function ContasBancariasError({
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
      title="Erro nas Contas Bancárias"
      description="Não foi possível carregar as contas bancárias. Verifique a sua ligação e tente novamente."
    />
  );
}
