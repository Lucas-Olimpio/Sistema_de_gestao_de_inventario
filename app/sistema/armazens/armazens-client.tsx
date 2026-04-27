"use client";

import { useState, useEffect } from "react";
import { Copy, Plus, Building2, MapPin } from "lucide-react";
import PageHeader from "@/app/components/page-header";
import AnimSection from "@/app/components/anim-section";
import DataTable, { Column } from "@/app/components/data-table";
import Modal from "@/app/components/modal";
import { toast } from "sonner";
import { formatDate } from "@/lib/utils";

interface Warehouse {
  id: string;
  name: string;
  location: string | null;
  isActive: boolean;
  createdAt: string;
  _count?: { stocks: number };
}

export default function ArmazensClient({ isViewer }: { isViewer: boolean }) {
  const [armazens, setArmazens] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");

  const fetchWarehouses = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/warehouses");
      if (res.ok) setArmazens(await res.json());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWarehouses();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/warehouses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, location }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      toast.success("Armazém criado com sucesso!");
      setShowModal(false);
      setName("");
      setLocation("");
      fetchWarehouses();
    } catch (err: any) {
      toast.error(err.message || "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  };

  const columns: Column<Warehouse>[] = [
    {
      header: "Nome do Armazém",
      cell: (w) => (
        <div className="flex items-center gap-2 font-medium" style={{ color: "var(--text-primary)" }}>
          <Building2 size={16} color="var(--accent-primary)" /> {w.name}
        </div>
      ),
    },
    {
      header: "Localização Física",
      cell: (w) => (
        <div className="flex items-center gap-2 text-sm" style={{ color: "var(--text-secondary)" }}>
          <MapPin size={14} color="var(--text-muted)" /> {w.location || "Não informada"}
        </div>
      ),
    },
    {
      header: "Status",
      cell: (w) => (
        <span className="badge" style={{ background: w.isActive ? "var(--accent-success-bg)" : "var(--accent-danger-bg)", color: w.isActive ? "var(--accent-success)" : "var(--accent-danger)" }}>
          {w.isActive ? "Ativo" : "Inativo"}
        </span>
      ),
    },
    {
      header: "Produtos Cadastrados",
      cell: (w) => <span className="text-sm font-medium">{w._count?.stocks || 0} variações</span>,
    },
    {
      header: "Criado em",
      cell: (w) => <span className="text-sm text-gray-500">{formatDate(w.createdAt)}</span>,
    },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      <PageHeader
        title="Controle de Armazéns"
        subtitle="Gerencie seus locais de estoque, estoques centrais e galpões"
        icon={Building2}
        action={
          !isViewer && (
            <button className="btn-primary" onClick={() => setShowModal(true)}>
              <Plus size={18} /> Novo Armazém
            </button>
          )
        }
      />

      <AnimSection delay={100}>
        <DataTable
          data={armazens}
          columns={columns}
          isLoading={loading}
          emptyMessage="Nenhum armazém cadastrado ainda."
        />
      </AnimSection>

      <Modal maxWidth="450px" isOpen={showModal} onClose={() => !saving && setShowModal(false)} title="Novo Armazém">
        <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div>
            <label className="label">Nome da Filial/Armazém *</label>
            <input
              required
              className="input-base"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Galpão Principal SP"
            />
          </div>
          <div>
            <label className="label">Localização ou Endereço</label>
            <input
              className="input-base"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Ex: Rua A, 123"
            />
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "16px" }}>
            <button type="button" className="btn-ghost" onClick={() => setShowModal(false)} disabled={saving}>
              Cancelar
            </button>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? "Salvando..." : "Salvar Armazém"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
