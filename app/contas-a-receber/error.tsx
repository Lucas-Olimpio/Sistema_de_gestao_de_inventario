"use client";
import ErrorDisplay from "@/app/components/error-display";

export default function ContasReceberError({
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
      title="Erro nas Contas a Receber"
      description="Não foi possível carregar as contas a receber. Verifique a sua ligação e tente novamente."
    />
  );
}
