"use client";

import { useState } from "react";
import { Download } from "lucide-react";

interface ExportButtonProps {
  /** Entity key matching the API route: products, payables, receivables, movements, customers, suppliers */
  entity: string;
  /** Label to display on the button */
  label?: string;
  /** Allow filtering by date (required for dense entities like movements) */
  requireDates?: boolean;
}

/**
 * Export button component. Triggers a file download from /api/export.
 * Supports CSV and XLSX formats via dropdown. Date filtering prevents Serverless OOM/Timeouts.
 */
export default function ExportButton({
  entity,
  label = "Exportar",
  requireDates = false,
}: ExportButtonProps) {
  const [loading, setLoading] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  // Date filters
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const handleExport = async (format: "csv" | "xlsx") => {
    if (requireDates && (!startDate || !endDate)) {
      alert("Por favor, selecione uma data de início e fim.");
      return;
    }

    if (requireDates) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      const diffTime = Math.abs(end.getTime() - start.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (start > end) {
        alert("A data de início não pode ser posterior à data de fim.");
        return;
      }

      if (diffDays > 93) {
        // ~3 months max
        alert(
          "Para garantir a estabilidade do sistema, a exportação está limitada a um período máximo de 3 meses por ficheiro.",
        );
        return;
      }
    }

    setLoading(true);
    setShowMenu(false);
    try {
      let url = `/api/export?entity=${entity}&format=${format}`;
      if (requireDates) {
        url += `&startDate=${startDate}&endDate=${endDate}`;
      }

      const res = await fetch(url);
      if (!res.ok) throw new Error("Erro ao exportar");

      const blob = await res.blob();
      const objectUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = objectUrl;
      const ext = format === "xlsx" ? "xlsx" : "csv";
      const dateSuffix = requireDates ? `_${startDate}_${endDate}` : "";
      a.download = `${entity}${dateSuffix}.${ext}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(objectUrl);
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
        {loading ? "A processar..." : label}
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
            minWidth: "250px",
            overflow: "hidden",
            padding: "16px",
          }}
        >
          {requireDates && (
            <div style={{ marginBottom: "16px" }}>
              <p
                style={{
                  fontSize: "0.8rem",
                  color: "var(--text-secondary)",
                  marginBottom: "8px",
                }}
              >
                Período de Extração (Max 3 meses):
              </p>
              <div
                style={{ display: "flex", gap: "8px", flexDirection: "column" }}
              >
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  style={{
                    padding: "6px 8px",
                    borderRadius: "4px",
                    border: "1px solid var(--border-color)",
                    background: "var(--bg-body)",
                    color: "var(--text-primary)",
                    fontSize: "0.85rem",
                  }}
                />
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  style={{
                    padding: "6px 8px",
                    borderRadius: "4px",
                    border: "1px solid var(--border-color)",
                    background: "var(--bg-body)",
                    color: "var(--text-primary)",
                    fontSize: "0.85rem",
                  }}
                />
              </div>
              <hr
                style={{ margin: "12px 0", borderColor: "var(--border-color)" }}
              />
            </div>
          )}

          <button
            onClick={() => handleExport("csv")}
            style={{
              display: "block",
              width: "100%",
              padding: "10px 14px",
              background: "var(--primary-color)",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              fontSize: "0.85rem",
              textAlign: "center",
              marginBottom: "8px",
            }}
          >
            📄 Exportar CSV (Recomendado)
          </button>

          <button
            onClick={() => handleExport("xlsx")}
            style={{
              display: "block",
              width: "100%",
              padding: "10px 14px",
              background: "transparent",
              color: "var(--text-primary)",
              border: "1px solid var(--border-color)",
              borderRadius: "4px",
              cursor: "pointer",
              fontSize: "0.85rem",
              textAlign: "center",
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
