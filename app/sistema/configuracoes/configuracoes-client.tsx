"use client";

import { useState, useEffect } from "react";
import { Save, Settings2, Image as ImageIcon } from "lucide-react";
import PageHeader from "@/app/components/page-header";
import { toast } from "sonner";
import AnimSection from "@/app/components/anim-section";

interface SystemSettings {
  id: string;
  companyName: string;
  cnpj: string | null;
  logoUrl: string | null;
  defaultCurrency: string;
  timezone: string;
}

export default function ConfigClient() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<SystemSettings | null>(null);

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((data) => {
        setSettings(data);
        setLoading(false);
      });
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    if (!settings) return;
    setSettings({ ...settings, [e.target.name]: e.target.value });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;
    
    setSaving(true);
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      
      if (!res.ok) throw new Error((await res.json()).error);
      
      toast.success("Configurações salvas com sucesso!");
    } catch (err: any) {
      toast.error(err.message || "Erro ao salvar configurações");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-gray-500">Carregando configurações...</div>;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px", maxWidth: "800px" }}>
      <PageHeader
        title="Configurações do Sistema"
        subtitle="Gerencie dados globais da sua empresa e preferências de sistema"
        icon={Settings2}
      />

      <AnimSection delay={100}>
        <form onSubmit={handleSave} className="card" style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          
          <div style={{ display: "grid", gap: "16px", gridTemplateColumns: "1fr 1fr" }}>
            <div style={{ gridColumn: "1 / -1" }}>
              <h3 style={{ fontSize: "16px", fontWeight: 600, color: "var(--text-primary)", marginBottom: "8px" }}>
                Identidade da Empresa
              </h3>
              <div className="divider" style={{ margin: "8px 0 16px 0" }} />
            </div>

            <div>
              <label className="label">Razão Social / Nome Fantasia *</label>
              <input
                required
                name="companyName"
                value={settings?.companyName || ""}
                onChange={handleChange}
                className="input-base"
                placeholder="Ex: Minha Empresa LTDA"
              />
            </div>

            <div>
              <label className="label">CNPJ (Opcional)</label>
              <input
                name="cnpj"
                value={settings?.cnpj || ""}
                onChange={handleChange}
                className="input-base"
                placeholder="00.000.000/0000-00"
              />
            </div>

            <div style={{ gridColumn: "1 / -1" }}>
              <label className="label">URL do Logo (Opcional)</label>
              <div className="flex-gap-2">
                <input
                  name="logoUrl"
                  value={settings?.logoUrl || ""}
                  onChange={handleChange}
                  className="input-base"
                  placeholder="https://..."
                />
                {settings?.logoUrl && (
                  <img src={settings.logoUrl} alt="Logo" style={{ height: "36px", width: "36px", objectFit: "contain", borderRadius: "4px", background: "#fff" }} />
                )}
              </div>
            </div>

            <div style={{ gridColumn: "1 / -1", marginTop: "16px" }}>
              <h3 style={{ fontSize: "16px", fontWeight: 600, color: "var(--text-primary)", marginBottom: "8px" }}>
                Preferências Regionais
              </h3>
              <div className="divider" style={{ margin: "8px 0 16px 0" }} />
            </div>

            <div>
              <label className="label">Moeda Padrão</label>
              <select name="defaultCurrency" value={settings?.defaultCurrency || "BRL"} onChange={handleChange} className="input-base" style={{ cursor: "pointer" }}>
                <option value="BRL">BRL (Real Brasileiro: R$)</option>
                <option value="USD">USD (Dólar Americano: $)</option>
                <option value="EUR">EUR (Euro: €)</option>
              </select>
            </div>

            <div>
              <label className="label">Fuso Horário (Timezone)</label>
              <select name="timezone" value={settings?.timezone || "America/Sao_Paulo"} onChange={handleChange} className="input-base" style={{ cursor: "pointer" }}>
                <option value="America/Sao_Paulo">América/São Paulo (BRT)</option>
                <option value="America/Manaus">América/Manaus (AMT)</option>
                <option value="UTC">UTC Padrão Global</option>
              </select>
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "16px" }}>
            <button type="submit" disabled={saving} className="btn-primary">
              <Save size={18} />
              {saving ? "Salvando..." : "Salvar Configurações"}
            </button>
          </div>
        </form>
      </AnimSection>
    </div>
  );
}
