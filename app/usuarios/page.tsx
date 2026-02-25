"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  Users,
  Plus,
  Shield,
  UserCheck,
  Eye,
  ToggleLeft,
  ToggleRight,
  KeyRound,
} from "lucide-react";
import PageHeader from "../components/page-header";
import AnimSection from "../components/anim-section";
import DataTable, { Column } from "../components/data-table";
import Modal from "../components/modal";
import { toast } from "sonner";

interface User {
  id: string;
  name: string;
  email: string;
  role: "ADMIN" | "OPERADOR" | "VISUALIZADOR";
  active: boolean;
  createdAt: string;
}

const roleBadges: Record<string, { label: string; color: string; bg: string }> =
  {
    ADMIN: {
      label: "Admin",
      color: "var(--accent-danger)",
      bg: "var(--accent-danger-bg)",
    },
    OPERADOR: {
      label: "Operador",
      color: "var(--accent-primary)",
      bg: "var(--accent-primary-glow)",
    },
    VISUALIZADOR: {
      label: "Visualizador",
      color: "var(--text-secondary)",
      bg: "var(--bg-card-hover)",
    },
  };

const roleIcons: Record<string, React.ReactNode> = {
  ADMIN: <Shield size={12} />,
  OPERADOR: <UserCheck size={12} />,
  VISUALIZADOR: <Eye size={12} />,
};

export default function UsuariosPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [resetPasswordId, setResetPasswordId] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState("");

  // Form state
  const [formName, setFormName] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formPassword, setFormPassword] = useState("");
  const [formRole, setFormRole] = useState("OPERADOR");
  const [formSubmitting, setFormSubmitting] = useState(false);

  // Redirect non-admins
  useEffect(() => {
    if (session && (session.user as any)?.role !== "ADMIN") {
      router.push("/");
    }
  }, [session, router]);

  const fetchUsers = async () => {
    try {
      const res = await fetch("/api/users");
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormSubmitting(true);
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formName,
          email: formEmail,
          password: formPassword,
          role: formRole,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success("Utilizador criado com sucesso");
        setIsModalOpen(false);
        setFormName("");
        setFormEmail("");
        setFormPassword("");
        setFormRole("OPERADOR");
        fetchUsers();
      } else {
        toast.error(data.error || "Erro ao criar utilizador");
      }
    } finally {
      setFormSubmitting(false);
    }
  };

  const toggleActive = async (user: User) => {
    const res = await fetch("/api/users", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: user.id, active: !user.active }),
    });
    if (res.ok) {
      toast.success(
        user.active ? "Utilizador desativado" : "Utilizador ativado",
      );
      fetchUsers();
    }
  };

  const changeRole = async (user: User, newRole: string) => {
    const res = await fetch("/api/users", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: user.id, role: newRole }),
    });
    if (res.ok) {
      toast.success("Role atualizado");
      fetchUsers();
    }
  };

  const handleResetPassword = async () => {
    if (!resetPasswordId || !newPassword) return;
    const res = await fetch("/api/users", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: resetPasswordId, password: newPassword }),
    });
    if (res.ok) {
      toast.success("Senha redefinida com sucesso");
      setResetPasswordId(null);
      setNewPassword("");
    } else {
      toast.error("Erro ao redefinir senha");
    }
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "10px 14px",
    borderRadius: "var(--radius-md)",
    border: "1px solid var(--border-color)",
    background: "var(--bg-input)",
    color: "var(--text-primary)",
    fontSize: "14px",
    outline: "none",
  };

  const columns: Column<User>[] = [
    {
      header: "Nome",
      cell: (u) => (
        <div>
          <p style={{ fontWeight: 600, color: "var(--text-primary)" }}>
            {u.name}
          </p>
          <p
            style={{
              fontSize: "12px",
              color: "var(--text-muted)",
              marginTop: "2px",
            }}
          >
            {u.email}
          </p>
        </div>
      ),
    },
    {
      header: "Role",
      cell: (u) => {
        const badge = roleBadges[u.role];
        return (
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <select
              value={u.role}
              onChange={(e) => changeRole(u, e.target.value)}
              disabled={u.id === session?.user?.id}
              style={{
                padding: "4px 8px",
                borderRadius: "var(--radius-sm)",
                background: badge.bg,
                color: badge.color,
                border: "none",
                fontSize: "12px",
                fontWeight: 600,
                cursor: u.id === session?.user?.id ? "not-allowed" : "pointer",
                opacity: u.id === session?.user?.id ? 0.6 : 1,
              }}
            >
              <option value="ADMIN">Admin</option>
              <option value="OPERADOR">Operador</option>
              <option value="VISUALIZADOR">Visualizador</option>
            </select>
          </div>
        );
      },
    },
    {
      header: "Status",
      cell: (u) => (
        <span
          style={{
            padding: "4px 10px",
            borderRadius: "var(--radius-sm)",
            background: u.active
              ? "var(--accent-success-bg)"
              : "var(--accent-danger-bg)",
            color: u.active ? "var(--accent-success)" : "var(--accent-danger)",
            fontSize: "12px",
            fontWeight: 600,
          }}
        >
          {u.active ? "Ativo" : "Inativo"}
        </span>
      ),
    },
    {
      header: "Ações",
      align: "right",
      cell: (u) => (
        <div
          style={{
            display: "flex",
            gap: "6px",
            justifyContent: "flex-end",
          }}
        >
          <button
            onClick={() => toggleActive(u)}
            disabled={u.id === session?.user?.id}
            title={u.active ? "Desativar" : "Ativar"}
            style={{
              width: 32,
              height: 32,
              borderRadius: "var(--radius-sm)",
              border: "1px solid var(--border-color)",
              background: "transparent",
              color: u.active ? "var(--accent-success)" : "var(--text-muted)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: u.id === session?.user?.id ? "not-allowed" : "pointer",
              opacity: u.id === session?.user?.id ? 0.4 : 1,
            }}
          >
            {u.active ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
          </button>
          <button
            onClick={() => {
              setResetPasswordId(u.id);
              setNewPassword("");
            }}
            title="Redefinir senha"
            style={{
              width: 32,
              height: 32,
              borderRadius: "var(--radius-sm)",
              border: "1px solid var(--border-color)",
              background: "transparent",
              color: "var(--accent-warning)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
            }}
          >
            <KeyRound size={14} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      <PageHeader
        title="Utilizadores"
        subtitle="Gerencie contas de acesso ao sistema"
        icon={Users}
        action={
          <button
            onClick={() => setIsModalOpen(true)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "10px 18px",
              borderRadius: "var(--radius-md)",
              background:
                "linear-gradient(135deg, var(--accent-primary), #a855f7)",
              color: "white",
              fontSize: "13px",
              fontWeight: 600,
              border: "none",
              cursor: "pointer",
            }}
          >
            <Plus size={18} />
            Novo Utilizador
          </button>
        }
      />

      <AnimSection delay={100}>
        <DataTable
          data={users}
          columns={columns}
          isLoading={loading}
          emptyMessage="Nenhum utilizador cadastrado"
        />
      </AnimSection>

      {/* Create User Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Novo Utilizador"
        maxWidth="480px"
      >
        <form
          onSubmit={handleCreate}
          style={{ display: "flex", flexDirection: "column", gap: "16px" }}
        >
          <div>
            <label
              style={{
                display: "block",
                fontSize: "13px",
                fontWeight: 600,
                color: "var(--text-secondary)",
                marginBottom: "6px",
              }}
            >
              Nome
            </label>
            <input
              type="text"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              required
              style={inputStyle}
            />
          </div>
          <div>
            <label
              style={{
                display: "block",
                fontSize: "13px",
                fontWeight: 600,
                color: "var(--text-secondary)",
                marginBottom: "6px",
              }}
            >
              Email
            </label>
            <input
              type="email"
              value={formEmail}
              onChange={(e) => setFormEmail(e.target.value)}
              required
              style={inputStyle}
            />
          </div>
          <div>
            <label
              style={{
                display: "block",
                fontSize: "13px",
                fontWeight: 600,
                color: "var(--text-secondary)",
                marginBottom: "6px",
              }}
            >
              Senha
            </label>
            <input
              type="password"
              value={formPassword}
              onChange={(e) => setFormPassword(e.target.value)}
              required
              minLength={6}
              style={inputStyle}
            />
          </div>
          <div>
            <label
              style={{
                display: "block",
                fontSize: "13px",
                fontWeight: 600,
                color: "var(--text-secondary)",
                marginBottom: "6px",
              }}
            >
              Role
            </label>
            <select
              value={formRole}
              onChange={(e) => setFormRole(e.target.value)}
              style={{ ...inputStyle, cursor: "pointer" }}
            >
              <option value="ADMIN">Admin</option>
              <option value="OPERADOR">Operador</option>
              <option value="VISUALIZADOR">Visualizador</option>
            </select>
          </div>
          <button
            type="submit"
            disabled={formSubmitting}
            style={{
              padding: "12px",
              borderRadius: "var(--radius-md)",
              background:
                "linear-gradient(135deg, var(--accent-primary), #a855f7)",
              color: "white",
              fontSize: "14px",
              fontWeight: 600,
              border: "none",
              cursor: formSubmitting ? "wait" : "pointer",
              opacity: formSubmitting ? 0.7 : 1,
            }}
          >
            {formSubmitting ? "Criando..." : "Criar Utilizador"}
          </button>
        </form>
      </Modal>

      {/* Reset Password Modal */}
      <Modal
        isOpen={!!resetPasswordId}
        onClose={() => setResetPasswordId(null)}
        title="Redefinir Senha"
        maxWidth="400px"
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div>
            <label
              style={{
                display: "block",
                fontSize: "13px",
                fontWeight: 600,
                color: "var(--text-secondary)",
                marginBottom: "6px",
              }}
            >
              Nova Senha
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              minLength={6}
              placeholder="Mínimo 6 caracteres"
              style={inputStyle}
            />
          </div>
          <button
            onClick={handleResetPassword}
            disabled={!newPassword || newPassword.length < 6}
            style={{
              padding: "12px",
              borderRadius: "var(--radius-md)",
              background: "var(--accent-warning)",
              color: "#000",
              fontSize: "14px",
              fontWeight: 600,
              border: "none",
              cursor: "pointer",
              opacity: !newPassword || newPassword.length < 6 ? 0.5 : 1,
            }}
          >
            Redefinir Senha
          </button>
        </div>
      </Modal>
    </div>
  );
}
