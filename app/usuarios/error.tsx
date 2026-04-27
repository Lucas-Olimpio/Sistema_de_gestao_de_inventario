"use client";
import ErrorDisplay from "@/app/components/error-display";

export default function UsuariosError({
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
      title="Erro nos Utilizadores"
      description="Não foi possível carregar os utilizadores. Verifique a sua ligação e tente novamente."
    />
  );
}
