"use client";
import ErrorDisplay from "@/app/components/error-display";

export default function ContasPagarError({
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
      title="Erro nas Contas a Pagar"
      description="Não foi possível carregar as contas a pagar. Verifique a sua ligação e tente novamente."
    />
  );
}
