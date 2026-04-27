"use client";

import { useState, useEffect } from "react";
import { BarChart3, PieChart, TrendingUp, Calendar as CalendarIcon, DollarSign, PackageOpen } from "lucide-react";
import PageHeader from "@/app/components/page-header";
import AnimSection from "@/app/components/anim-section";
import DataTable, { Column } from "@/app/components/data-table";

interface ABCItem {
  id: string;
  name: string;
  sku: string;
  qty: number;
  revenue: number;
  classification: "A" | "B" | "C";
  percentual: string;
}

interface DRE {
  receitaBruta: number;
  custoProdutos: number;
  lucroBruto: number;
  despesas: number;
  lucroLiquido: number;
  margemLucro: number;
}

export default function RelatoriosClient() {
  const [activeTab, setActiveTab] = useState<"DRE" | "ABC">("DRE");
  const [loading, setLoading] = useState(true);
  const [abcData, setAbcData] = useState<ABCItem[]>([]);
  const [dreData, setDreData] = useState<DRE | null>(null);

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === "ABC") {
        const r = await fetch("/api/reports/abc-curve");
        if (r.ok) {
          const d = await r.json();
          setAbcData(d.data);
        }
      } else {
        const r = await fetch("/api/reports/dre");
        if (r.ok) setDreData(await r.json());
      }
    } finally {
      setLoading(false);
    }
  };

  const formatBRL = (val: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(val);

  const abcColumns: Column<ABCItem>[] = [
    { header: "Classe", cell: (r) => (
        <span className="badge" style={{
          background: r.classification === "A" ? "var(--accent-success-bg)" : r.classification === "B" ? "var(--accent-warning-bg)" : "var(--accent-danger-bg)",
          color: r.classification === "A" ? "var(--accent-success)" : r.classification === "B" ? "var(--accent-warning)" : "var(--accent-danger)"
        }}>
          Classe {r.classification}
        </span>
    )},
    { header: "Produto", cell: (r) => <div className="font-medium" style={{ color: "var(--text-primary)" }}>{r.name}</div> },
    { header: "Vendas (Qtd)", cell: (r) => r.qty },
    { header: "Faturamento Bruto", cell: (r) => <span style={{ fontWeight: 600, color: "var(--text-success)" }}>{formatBRL(r.revenue)}</span> },
    { header: "Impacto no Total (%)", cell: (r) => r.percentual + "%" },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      <PageHeader
        title="Relatórios & Business Intelligence"
        subtitle="Analise métricas profundas, curvas ABC de saída e DRE contábil."
        icon={BarChart3}
      />

      <div style={{ display: "flex", gap: "8px", borderBottom: "1px solid var(--border-color)", paddingBottom: "12px" }}>
        <button
          onClick={() => setActiveTab("DRE")}
          className={`btn-ghost ${activeTab === "DRE" ? "active-tab" : ""}`}
          style={{
            padding: "8px 16px",
            background: activeTab === "DRE" ? "var(--bg-card)" : "transparent",
            color: activeTab === "DRE" ? "var(--text-primary)" : "var(--text-secondary)",
            border: activeTab === "DRE" ? "1px solid var(--border-color)" : "1px solid transparent",
            borderBottom: activeTab === "DRE" ? "none" : "",
            marginBottom: activeTab === "DRE" ? "-13px" : "0",
            borderTopLeftRadius: "6px",
            borderTopRightRadius: "6px"
          }}
        >
          <TrendingUp size={16} /> DRE Operacional
        </button>
        <button
          onClick={() => setActiveTab("ABC")}
          className={`btn-ghost ${activeTab === "ABC" ? "active-tab" : ""}`}
          style={{
            padding: "8px 16px",
            background: activeTab === "ABC" ? "var(--bg-card)" : "transparent",
            color: activeTab === "ABC" ? "var(--text-primary)" : "var(--text-secondary)",
            border: activeTab === "ABC" ? "1px solid var(--border-color)" : "1px solid transparent",
            borderBottom: activeTab === "ABC" ? "none" : "",
            marginBottom: activeTab === "ABC" ? "-13px" : "0",
            borderTopLeftRadius: "6px",
            borderTopRightRadius: "6px"
          }}
        >
          <PieChart size={16} /> Curva ABC (Produtos)
        </button>
      </div>

      <AnimSection delay={100}>
        {loading ? (
          <div className="p-8 text-center text-gray-500">Compilando relatório... Isso pode levar alguns segundos.</div>
        ) : (
          <>
            {activeTab === "DRE" && dreData && (
              <div style={{ display: "grid", gap: "16px", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))" }}>
                <div className="card" style={{ padding: "24px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", color: "var(--text-muted)", marginBottom: "16px" }}>
                    <span style={{ fontSize: "14px", fontWeight: 600 }}>1. Receitas Brutas</span>
                    <DollarSign size={20} />
                  </div>
                  <h2 style={{ fontSize: "28px", fontWeight: 700, color: "var(--text-primary)" }}>{formatBRL(dreData.receitaBruta)}</h2>
                  <p style={{ fontSize: "12px", color: "var(--text-secondary)", marginTop: "4px" }}>Total de vendas faturadas</p>
                </div>

                <div className="card" style={{ padding: "24px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", color: "var(--text-muted)", marginBottom: "16px" }}>
                    <span style={{ fontSize: "14px", fontWeight: 600 }}>2. CMV (Custos)</span>
                    <PackageOpen size={20} />
                  </div>
                  <h2 style={{ fontSize: "28px", fontWeight: 700, color: "var(--accent-danger)" }}>- {formatBRL(dreData.custoProdutos)}</h2>
                  <p style={{ fontSize: "12px", color: "var(--text-secondary)", marginTop: "4px" }}>Valor global investido em pedidos recebidos</p>
                </div>

                <div className="card" style={{ padding: "24px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", color: "var(--text-muted)", marginBottom: "16px" }}>
                    <span style={{ fontSize: "14px", fontWeight: 600 }}>3. Despesas Fixas</span>
                    <CalendarIcon size={20} />
                  </div>
                  <h2 style={{ fontSize: "28px", fontWeight: 700, color: "var(--accent-warning)" }}>- {formatBRL(dreData.despesas)}</h2>
                  <p style={{ fontSize: "12px", color: "var(--text-secondary)", marginTop: "4px" }}>Transações de saída que não são devidas a fornecedores</p>
                </div>

                <div className="card" style={{ padding: "24px", background: "var(--accent-primary-bg)", border: "1px solid var(--accent-primary)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", color: "var(--text-primary)", marginBottom: "16px" }}>
                    <span style={{ fontSize: "14px", fontWeight: 600 }}>LUCRO LÍQUIDO</span>
                    <TrendingUp size={20} />
                  </div>
                  <h2 style={{ fontSize: "32px", fontWeight: 800, color: dreData.lucroLiquido >= 0 ? "var(--accent-success)" : "var(--accent-danger)" }}>
                    {formatBRL(dreData.lucroLiquido)}
                  </h2>
                  <p style={{ fontSize: "13px", color: "var(--text-secondary)", marginTop: "8px", fontWeight: 500 }}>
                    Margem de Lucro Bruta / Liquidez: <b style={{ color: "var(--text-primary)" }}>{dreData.margemLucro.toFixed(2)}%</b>
                  </p>
                </div>
              </div>
            )}

            {activeTab === "ABC" && (
              <>
                <div style={{ display: "flex", gap: "16px", marginBottom: "20px" }}>
                  <div className="card" style={{ flex: 1, padding: "16px" }}>
                    <h4 style={{ fontSize: "12px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "1px", fontWeight: 700 }}>Curva A</h4>
                    <p style={{ fontSize: "14px", color: "var(--text-secondary)", marginTop: "4px" }}>Representa os produtos mais importantes, compondo <b>~80%</b> de toda a receita da empresa.</p>
                  </div>
                  <div className="card" style={{ flex: 1, padding: "16px" }}>
                    <h4 style={{ fontSize: "12px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "1px", fontWeight: 700 }}>Curva B & C</h4>
                    <p style={{ fontSize: "14px", color: "var(--text-secondary)", marginTop: "4px" }}>B representa os próximos 15%. C são as caudas (produtos de prateleira parada e lucro infímo).</p>
                  </div>
                </div>
                <DataTable data={abcData} columns={abcColumns} isLoading={loading} />
              </>
            )}
          </>
        )}
      </AnimSection>
    </div>
  );
}
