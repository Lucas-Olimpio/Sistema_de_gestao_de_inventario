"use client";
import ErrorDisplay from "@/app/components/error-display";

export default function RecebimentoError({
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
      title="Erro no Recebimento"
      description="Não foi possível carregar a secção de recebimento. Verifique a sua ligação e tente novamente."
    />
  );
}
