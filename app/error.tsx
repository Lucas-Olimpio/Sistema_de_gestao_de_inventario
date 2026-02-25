"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[GlobalError]", error);
  }, [error]);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "60vh",
        gap: "20px",
        padding: "40px",
        textAlign: "center",
      }}
    >
      <div
        style={{
          width: 64,
          height: 64,
          borderRadius: "var(--radius-lg)",
          background: "var(--accent-danger-bg)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <AlertTriangle size={32} color="var(--accent-danger)" />
      </div>

      <div>
        <h2
          style={{
            fontSize: "1.5rem",
            fontWeight: 600,
            color: "var(--text-primary)",
            marginBottom: "8px",
          }}
        >
          Algo correu mal
        </h2>
        <p
          style={{
            color: "var(--text-secondary)",
            fontSize: "0.95rem",
            maxWidth: "480px",
            lineHeight: 1.6,
          }}
        >
          Ocorreu um erro inesperado. A equipa técnica foi notificada. Pode
          tentar novamente ou voltar à página inicial.
        </p>
        {error.digest && (
          <p
            style={{
              color: "var(--text-muted)",
              fontSize: "0.8rem",
              marginTop: "8px",
              fontFamily: "monospace",
            }}
          >
            Código: {error.digest}
          </p>
        )}
      </div>

      <div style={{ display: "flex", gap: "12px", marginTop: "8px" }}>
        <button
          onClick={reset}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            padding: "10px 20px",
            borderRadius: "var(--radius-md)",
            background: "var(--accent-primary)",
            color: "#fff",
            border: "none",
            cursor: "pointer",
            fontSize: "0.9rem",
            fontWeight: 500,
          }}
        >
          <RefreshCw size={16} />
          Tentar novamente
        </button>
        <a
          href="/"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            padding: "10px 20px",
            borderRadius: "var(--radius-md)",
            background: "var(--bg-card)",
            color: "var(--text-primary)",
            border: "1px solid var(--border-color)",
            cursor: "pointer",
            fontSize: "0.9rem",
            fontWeight: 500,
            textDecoration: "none",
          }}
        >
          Voltar ao início
        </a>
      </div>
    </div>
  );
}
