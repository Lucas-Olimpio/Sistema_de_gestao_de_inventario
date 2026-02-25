"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface ErrorDisplayProps {
  error: Error & { digest?: string };
  reset: () => void;
  title?: string;
  description?: string;
}

/**
 * Reusable error display component for route-level error boundaries.
 * Uses the app's design system CSS variables.
 */
export default function ErrorDisplay({
  error,
  reset,
  title = "Erro ao carregar página",
  description = "Ocorreu um erro ao carregar esta secção. Tente novamente.",
}: ErrorDisplayProps) {
  useEffect(() => {
    console.error("[ErrorBoundary]", error);
  }, [error]);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "40vh",
        gap: "16px",
        padding: "32px",
        textAlign: "center",
      }}
    >
      <div
        style={{
          width: 52,
          height: 52,
          borderRadius: "var(--radius-md)",
          background: "var(--accent-danger-bg)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <AlertTriangle size={24} color="var(--accent-danger)" />
      </div>

      <div>
        <h3
          style={{
            fontSize: "1.15rem",
            fontWeight: 600,
            color: "var(--text-primary)",
            marginBottom: "6px",
          }}
        >
          {title}
        </h3>
        <p
          style={{
            color: "var(--text-secondary)",
            fontSize: "0.9rem",
            maxWidth: "420px",
            lineHeight: 1.5,
          }}
        >
          {description}
        </p>
      </div>

      <button
        onClick={reset}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "8px",
          padding: "8px 18px",
          borderRadius: "var(--radius-md)",
          background: "var(--accent-primary)",
          color: "#fff",
          border: "none",
          cursor: "pointer",
          fontSize: "0.85rem",
          fontWeight: 500,
          marginTop: "4px",
        }}
      >
        <RefreshCw size={14} />
        Tentar novamente
      </button>
    </div>
  );
}
