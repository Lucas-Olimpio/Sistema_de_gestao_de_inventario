"use client";

import { useState } from "react";
import { Download } from "lucide-react";

interface ExportButtonProps {
  /** Entity key matching the API route: products, payables, receivables, movements, customers, suppliers */
  entity: string;
  /** Label to display on the button */
  label?: string;
}

/**
 * Export button component. Triggers a file download from /api/export.
 * Supports CSV and XLSX formats via dropdown.
 */
export default function ExportButton({
  entity,
  label = "Exportar",
}: ExportButtonProps) {
  const [loading, setLoading] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const handleExport = async (format: "csv" | "xlsx") => {
    setLoading(true);
    setShowMenu(false);
    try {
      const res = await fetch(`/api/export?entity=${entity}&format=${format}`);
      if (!res.ok) throw new Error("Erro ao exportar");

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const ext = format === "xlsx" ? "xlsx" : "csv";
      a.download = `${entity}.${ext}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("[Export]", err);
      alert("Erro ao exportar dados. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ position: "relative", display: "inline-block" }}>
      <button
        onClick={() => setShowMenu(!showMenu)}
        disabled={loading}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "6px",
          padding: "8px 14px",
          borderRadius: "var(--radius-md)",
          background: "var(--bg-card)",
          color: "var(--text-primary)",
          border: "1px solid var(--border-color)",
          cursor: loading ? "wait" : "pointer",
          fontSize: "0.85rem",
          fontWeight: 500,
          opacity: loading ? 0.6 : 1,
        }}
      >
        <Download size={14} />
        {loading ? "Exportando..." : label}
      </button>

      {showMenu && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 4px)",
            right: 0,
            background: "var(--bg-card)",
            border: "1px solid var(--border-color)",
            borderRadius: "var(--radius-md)",
            boxShadow: "var(--shadow-md)",
            zIndex: 50,
            minWidth: "140px",
            overflow: "hidden",
          }}
        >
          <button
            onClick={() => handleExport("csv")}
            style={{
              display: "block",
              width: "100%",
              padding: "10px 14px",
              background: "transparent",
              color: "var(--text-primary)",
              border: "none",
              cursor: "pointer",
              fontSize: "0.85rem",
              textAlign: "left",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.background = "var(--bg-card-hover)")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.background = "transparent")
            }
          >
            📄 Exportar CSV
          </button>
          <button
            onClick={() => handleExport("xlsx")}
            style={{
              display: "block",
              width: "100%",
              padding: "10px 14px",
              background: "transparent",
              color: "var(--text-primary)",
              border: "none",
              cursor: "pointer",
              fontSize: "0.85rem",
              textAlign: "left",
              borderTop: "1px solid var(--border-color)",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.background = "var(--bg-card-hover)")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.background = "transparent")
            }
          >
            📊 Exportar Excel
          </button>
        </div>
      )}

      {/* Close menu on outside click */}
      {showMenu && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 40,
          }}
          onClick={() => setShowMenu(false)}
        />
      )}
    </div>
  );
}
