import React, { useState } from "react";
import { AlertTriangle } from "lucide-react";

interface ReceiveItem {
  productId: string;
  productName: string;
  productSku: string;
  receivedQty: string;
}

interface ReceiveFormProps {
  items: ReceiveItem[];
  onConfirm: (formData: any) => Promise<void>;
  onCancel: () => void;
  error?: string;
}

export default function ReceiveForm({
  items: initialItems,
  onConfirm,
  onCancel,
  error,
}: ReceiveFormProps) {
  const [items, setItems] = useState<ReceiveItem[]>(initialItems);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      if (selectedFile.type === "application/pdf") {
        const url = URL.createObjectURL(selectedFile);
        setPreviewUrl(url);
      } else {
        setPreviewUrl(null);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const formData = new FormData();
    if (file) {
      formData.append("nfeFile", file);
    }
    formData.append("notes", notes);

    const itemsPayload = items.map((item) => ({
      productId: item.productId,
      receivedQty: parseInt(item.receivedQty) || 0,
      expectedQty: 0,
    }));
    formData.append("items", JSON.stringify(itemsPayload));

    await onConfirm(formData);
    setSaving(false);
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "8px 10px",
    borderRadius: "var(--radius-md)",
    border: "1px solid var(--border-color)",
    background: "var(--bg-input)",
    color: "var(--text-primary)",
    outline: "none",
    fontSize: "14px",
    fontWeight: 700,
    textAlign: "center",
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      {error && (
        <div
          style={{
            padding: "10px 14px",
            borderRadius: "var(--radius-md)",
            background: "var(--accent-danger-bg)",
            color: "var(--accent-danger)",
            fontSize: "13px",
            marginBottom: "16px",
          }}
        >
          {error}
        </div>
      )}

      <div style={{ display: "flex", gap: "20px" }}>
        {/* Left Side: Form */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            gap: "16px",
          }}
        >
          <div
            style={{
              padding: "10px 14px",
              borderRadius: "var(--radius-md)",
              background: "var(--accent-warning-bg)",
              color: "var(--accent-warning)",
              fontSize: "12px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <AlertTriangle size={16} />
            <span>
              <strong>Conferência Cega:</strong> Informe a quantidade recebida
              para cada item.
            </span>
          </div>

          <form
            onSubmit={handleSubmit}
            style={{ display: "flex", flexDirection: "column", gap: "12px" }}
          >
            <div
              style={{ display: "flex", flexDirection: "column", gap: "6px" }}
            >
              <label style={{ fontSize: "13px", fontWeight: 600 }}>
                Nota Fiscal (PDF)
              </label>
              <input
                type="file"
                accept="application/pdf"
                onChange={handleFileChange}
                style={{
                  fontSize: "13px",
                  padding: "8px",
                  border: "1px dashed var(--border-color)",
                  borderRadius: "var(--radius-md)",
                  cursor: "pointer",
                }}
              />
            </div>

            <div
              style={{ display: "flex", flexDirection: "column", gap: "6px" }}
            >
              <label style={{ fontSize: "13px", fontWeight: 600 }}>
                Observações
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Observações sobre o recebimento..."
                rows={2}
                style={{
                  ...inputStyle,
                  textAlign: "left",
                  fontWeight: 400,
                }}
              />
            </div>

            <div
              style={{
                borderTop: "1px solid var(--border-color)",
                margin: "8px 0",
              }}
            ></div>

            {items.map((item, i) => (
              <div
                key={item.productId}
                style={{
                  display: "grid",
                  gridTemplateColumns: "2fr 1fr",
                  gap: "12px",
                  alignItems: "center",
                  padding: "12px 14px",
                  background: "var(--bg-input)",
                  borderRadius: "var(--radius-md)",
                  border: "1px solid var(--border-color)",
                }}
              >
                <div>
                  <p
                    style={{
                      fontSize: "13px",
                      fontWeight: 600,
                      color: "var(--text-primary)",
                    }}
                  >
                    {item.productName}
                  </p>
                  <p
                    style={{
                      fontSize: "11px",
                      color: "var(--text-muted)",
                      fontFamily: "monospace",
                    }}
                  >
                    {item.productSku}
                  </p>
                </div>
                <input
                  required
                  type="number"
                  min="0"
                  value={item.receivedQty}
                  onChange={(e) => {
                    const updated = [...items];
                    updated[i] = {
                      ...updated[i],
                      receivedQty: e.target.value,
                    };
                    setItems(updated);
                  }}
                  placeholder="Qtd"
                  style={inputStyle}
                />
              </div>
            ))}

            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: "10px",
                marginTop: "8px",
              }}
            >
              <button
                type="button"
                onClick={onCancel}
                disabled={saving}
                style={{
                  padding: "9px 18px",
                  borderRadius: "var(--radius-md)",
                  border: "1px solid var(--border-color)",
                  background: "transparent",
                  color: "var(--text-secondary)",
                  fontSize: "13px",
                  cursor: "pointer",
                }}
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={saving}
                style={{
                  padding: "9px 18px",
                  borderRadius: "var(--radius-md)",
                  border: "none",
                  background: "var(--accent-success)",
                  color: "white",
                  fontSize: "13px",
                  fontWeight: 600,
                  cursor: saving ? "not-allowed" : "pointer",
                  opacity: saving ? 0.7 : 1,
                }}
              >
                {saving ? "Registrando..." : "Confirmar Recebimento"}
              </button>
            </div>
          </form>
        </div>

        {/* Right Side: Preview */}
        {previewUrl && (
          <div
            style={{
              flex: 1,
              minHeight: "400px",
              border: "1px solid var(--border-color)",
              borderRadius: "var(--radius-md)",
              overflow: "hidden",
            }}
          >
            <iframe
              src={previewUrl}
              title="NFe Preview"
              style={{ width: "100%", height: "100%", border: "none" }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
