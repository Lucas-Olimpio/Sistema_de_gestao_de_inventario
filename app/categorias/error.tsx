"use client";
import ErrorDisplay from "@/app/components/error-display";

export default function CategoriasError({
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
      title="Erro nas Categorias"
      description="Não foi possível carregar as categorias. Verifique a sua ligação e tente novamente."
    />
  );
}
