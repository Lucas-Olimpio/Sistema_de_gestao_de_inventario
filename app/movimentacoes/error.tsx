"use client";
import ErrorDisplay from "@/app/components/error-display";

export default function MovimentacoesError({
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
      title="Erro nas Movimentações"
      description="Não foi possível carregar as movimentações. Verifique a sua ligação e tente novamente."
    />
  );
}
