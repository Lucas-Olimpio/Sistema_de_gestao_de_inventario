"use client";
import ErrorDisplay from "@/app/components/error-display";

export default function ClientesError({
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
      title="Erro nos Clientes"
      description="Não foi possível carregar os clientes. Verifique a sua ligação e tente novamente."
    />
  );
}
