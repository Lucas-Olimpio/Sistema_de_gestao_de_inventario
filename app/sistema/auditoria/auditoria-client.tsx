"use client";

import { useState, useEffect } from "react";
import { ShieldAlert, Search, RefreshCw, UserCircle2 } from "lucide-react";
import PageHeader from "@/app/components/page-header";
import AnimSection from "@/app/components/anim-section";
import DataTable, { Column } from "@/app/components/data-table";
import { formatDate } from "@/lib/utils";
import Modal from "@/app/components/modal";

interface AuditLog {
  id: string;
  action: string;
  entity: string;
  entityId: string;
  oldData?: string;
  newData?: string;
  createdAt: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
}

const RenderPayload = ({ payloadString }: { payloadString?: string }) => {
  if (!payloadString) return <div style={{ fontSize: "13px", color: "var(--text-muted)", fontStyle: "italic" }}>Nenhum dado registrado.</div>;
  
  try {
    const obj = JSON.parse(payloadString);
    if (!obj || Object.keys(obj).length === 0) return <div style={{ fontSize: "13px", color: "var(--text-muted)", fontStyle: "italic" }}>Dados vazios ou formato desconhecido.</div>;

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "10px", width: "100%" }}>
        {Object.entries(obj).map(([key, val]) => {
          let displayVal = val;
          if (typeof val === "object") displayVal = JSON.stringify(val);
          if (val === null) displayVal = "null";
          if (val === "") displayVal = '""';
          
          return (
            <div key={key} style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "12px", paddingBottom: "6px", borderBottom: "1px solid var(--border-color)", borderBottomStyle: "dashed" }}>
              <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>{key}</span>
              <span style={{ fontSize: "13px", color: "var(--text-primary)", textAlign: "right", wordBreak: "break-word", fontWeight: 500 }}>{String(displayVal)}</span>
            </div>
          );
        })}
      </div>
    );
  } catch(e) {
    return <div style={{ fontSize: "13px", color: "var(--text-muted)", wordBreak: "break-word" }}>{payloadString}</div>;
  }
};

export default function AuditoriaClient({ isViewer }: { isViewer: boolean }) {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("");
  const [entityFilter, setEntityFilter] = useState("");
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({ total: 0, totalPages: 1 });
  
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: page.toString(), limit: "20" });
      if (search) params.append("search", search);
      if (actionFilter) params.append("action", actionFilter);
      if (entityFilter) params.append("entity", entityFilter);

      const res = await fetch(`/api/audit-logs?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setLogs(data.data || []);
        if (data.meta) setMeta(data.meta);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [page, search, actionFilter, entityFilter]);

  const clearFilters = () => {
    setSearch("");
    setActionFilter("");
    setEntityFilter("");
    setPage(1);
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case "CREATE": return "var(--accent-success)";
      case "UPDATE": return "var(--accent-warning)";
      case "DELETE": return "var(--accent-danger)";
      default: return "var(--text-secondary)";
    }
  };

  const getActionBg = (action: string) => {
    switch (action) {
      case "CREATE": return "var(--accent-success-bg)";
      case "UPDATE": return "var(--accent-warning-bg)";
      case "DELETE": return "var(--accent-danger-bg)";
      default: return "var(--bg-card-hover)";
    }
  };

  const columns: Column<AuditLog>[] = [
    {
      header: "Ação",
      cell: (log) => (
        <span className="badge" style={{ background: getActionBg(log.action), color: getActionColor(log.action) }}>
          {log.action}
        </span>
      ),
    },
    {
      header: "Entidade (Tabela)",
      cell: (log) => <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>{log.entity}</span>,
    },
    {
      header: "ID Interno",
      cell: (log) => <span className="truncate" style={{ maxWidth: 120, fontFamily: "monospace", color: "var(--text-muted)", fontSize: "12px" }}>{log.entityId}</span>,
    },
    {
      header: "Usuário",
      cell: (log) => (
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <UserCircle2 size={16} color="var(--text-muted)" />
          <span style={{ fontSize: "13px", color: "var(--text-secondary)" }}>{log.user?.name || "Sistema"}</span>
        </div>
      ),
    },
    {
      header: "Data",
      cell: (log) => <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>{formatDate(log.createdAt)}</span>,
    },
    {
      header: "Detalhes",
      align: "right",
      cell: (log) => (
        <button className="btn-ghost" style={{ padding: "4px 8px", fontSize: "11px" }} onClick={() => setSelectedLog(log)}>
          Ver Payload
        </button>
      ),
    },
  ];

  if (isViewer) {
    return <div className="p-8 text-center text-gray-500">Acesso negado. Requer permissão ADMIN.</div>;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      <PageHeader
        title="Auditoria de Segurança"
        subtitle={`Rastreamento das atividades dos usuários no sistema (${meta.total} registros)`}
        icon={ShieldAlert}
        action={
          <button className="btn-ghost" onClick={fetchLogs}>
            <RefreshCw size={16} /> Atualizar
          </button>
        }
      />

      <AnimSection delay={100}>
        <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap", padding: "16px", background: "var(--bg-card)", border: "1px solid var(--border-color)", borderRadius: "var(--radius-lg)", marginBottom: "16px" }}>
          <div className="search-box" style={{ flex: 1, minWidth: "180px" }}>
            <Search size={15} color="var(--text-muted)" />
            <input placeholder="Procurar por ID ou Usuário..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
          </div>

          <select value={actionFilter} onChange={(e) => { setActionFilter(e.target.value); setPage(1); }} className="input-base" style={{ width: "auto" }}>
            <option value="">Todas as ações</option>
            <option value="CREATE">CREATE</option>
            <option value="UPDATE">UPDATE</option>
            <option value="DELETE">DELETE</option>
          </select>

          <select value={entityFilter} onChange={(e) => { setEntityFilter(e.target.value); setPage(1); }} className="input-base" style={{ width: "auto" }}>
            <option value="">Todas as Tabelas</option>
            <option value="Product">Produto</option>
            <option value="SalesOrder">Pedidos (SO)</option>
            <option value="PurchaseOrder">Compras (PO)</option>
            <option value="StockMovement">Movimentação</option>
            <option value="User">Usuários</option>
          </select>

          {(search || actionFilter || entityFilter) && (
            <button className="btn-ghost" style={{ padding: "7px 12px", fontSize: "12px" }} onClick={clearFilters}>Limpar</button>
          )}
        </div>

        <DataTable
          data={logs}
          columns={columns}
          isLoading={loading}
          emptyMessage="Nenhum log encontrado para estes filtros."
        />

        {meta.totalPages > 1 && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", background: "var(--bg-card)", borderRadius: "var(--radius-lg)", border: "1px solid var(--border-color)", marginTop: "16px" }}>
            <span style={{ fontSize: "13px", color: "var(--text-muted)" }}>Página {page} de {meta.totalPages}</span>
            <div style={{ display: "flex", gap: "6px" }}>
              <button disabled={page === 1} className="btn-ghost" onClick={() => setPage(p => p - 1)}>Anterior</button>
              <button disabled={page === meta.totalPages} className="btn-ghost" onClick={() => setPage(p => p + 1)}>Próxima</button>
            </div>
          </div>
        )}
      </AnimSection>

      <Modal maxWidth="800px" isOpen={!!selectedLog} onClose={() => setSelectedLog(null)} title={`Detalhes do Registro`}>
        {selectedLog && (
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
              <div className="card" style={{ padding: "16px" }}>
                <span className="label">Autor da Ação</span>
                <div style={{ color: "var(--text-primary)", fontSize: "14px", fontWeight: 500, marginTop: "4px" }}>
                  {selectedLog.user?.name || "Sistema Integrado"} <br/>
                  <span style={{ color: "var(--text-muted)", fontSize: "12px", fontWeight: 400 }}>{selectedLog.user?.email || "N/A"}</span>
                </div>
              </div>
              <div className="card" style={{ padding: "16px" }}>
                <span className="label">Data e Hora</span>
                <div style={{ color: "var(--text-primary)", fontSize: "14px", fontWeight: 500, marginTop: "4px" }}>
                  {new Date(selectedLog.createdAt).toLocaleString("pt-BR")}
                </div>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", alignItems: "start" }}>
              <div className="card" style={{ padding: "0" }}>
                <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--border-color)", background: "var(--bg-secondary)", borderTopLeftRadius: "var(--radius-lg)", borderTopRightRadius: "var(--radius-lg)" }}>
                  <span style={{ fontSize: "12px", fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase" }}>Estado Anterior</span>
                </div>
                <div style={{ padding: "16px" }}>
                  <RenderPayload payloadString={selectedLog.oldData} />
                </div>
              </div>
              
              <div className="card" style={{ padding: "0", border: "1px solid var(--border-color)", boxShadow: "0 0 0 1px var(--accent-primary-bg)" }}>
                <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--border-color)", background: "var(--accent-primary-bg)", borderTopLeftRadius: "var(--radius-lg)", borderTopRightRadius: "var(--radius-lg)" }}>
                  <span style={{ fontSize: "12px", fontWeight: 700, color: "var(--accent-primary)", textTransform: "uppercase" }}>Novo Estado</span>
                </div>
                <div style={{ padding: "16px" }}>
                  <RenderPayload payloadString={selectedLog.newData} />
                </div>
              </div>
            </div>
            {/* The "Fechar Visualização" button was intentionally removed as it is redundant to the X */}
          </div>
        )}
      </Modal>
    </div>
  );
}
