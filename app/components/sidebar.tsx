"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import {
  LayoutDashboard,
  Package,
  Tags,
  ArrowLeftRight,
  ChevronLeft,
  ChevronRight,
  Users,
  ShoppingCart,
  ClipboardCheck,
  Wallet,
  UserCheck,
  ShoppingBag,
  HandCoins,
  Landmark,
  Shield,
  ShieldAlert,
  Settings2,
  Building2,
  PieChart,
  LogOut,
  X,
  LucideIcon,
} from "lucide-react";
import { useSidebar } from "./sidebar-context";

type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon | null;
  adminOnly?: boolean;
};

const navItems: NavItem[] = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/produtos", label: "Produtos", icon: Package },
  { href: "/categorias", label: "Categorias", icon: Tags },
  { href: "/movimentacoes", label: "Movimentações", icon: ArrowLeftRight },
  { href: "---compras", label: "COMPRAS", icon: null },
  { href: "/fornecedores", label: "Fornecedores", icon: Users },
  { href: "/compras", label: "Ordens de Compra", icon: ShoppingCart },
  { href: "/recebimento", label: "Recebimento", icon: ClipboardCheck },
  { href: "/contas-a-pagar", label: "Contas a Pagar", icon: Wallet },
  { href: "---vendas", label: "VENDAS", icon: null },
  { href: "/clientes", label: "Clientes", icon: UserCheck },
  { href: "/pedidos", label: "Pedidos de Venda", icon: ShoppingBag },
  { href: "/contas-a-receber", label: "Contas a Receber", icon: HandCoins },
  { href: "---financeiro", label: "FINANCEIRO", icon: null },
  { href: "/contas-bancarias", label: "Contas Bancárias", icon: Landmark },
  { href: "---sistema", label: "SISTEMA", icon: null },
  { href: "/sistema/relatorios", label: "Relatórios & BI", icon: PieChart },
  { href: "/sistema/armazens", label: "Armazéns", icon: Building2 },
  { href: "/usuarios", label: "Utilizadores", icon: Shield, adminOnly: true },
  { href: "/sistema/auditoria", label: "Auditoria", icon: ShieldAlert, adminOnly: true },
  { href: "/sistema/configuracoes", label: "Configurações", icon: Settings2, adminOnly: true },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { collapsed, toggle, mobileOpen, setMobileOpen, isMobile } =
    useSidebar();
  const { data: session } = useSession();

  const userRole = (session?.user as any)?.role || "VISUALIZADOR";
  const userName = session?.user?.name || "Utilizador";
  const userInitials = userName
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();

  const filteredItems = navItems.filter(
    (item) => !item.adminOnly || userRole === "ADMIN",
  );

  // On mobile, sidebar is hidden unless mobileOpen; on desktop, it's always shown
  const isVisible = isMobile ? mobileOpen : true;
  const sidebarCollapsed = isMobile ? false : collapsed;

  if (!isVisible) return null;

  return (
    <>
      {/* Mobile overlay backdrop */}
      {isMobile && mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0, 0, 0, 0.6)",
            backdropFilter: "blur(4px)",
            zIndex: 39,
            transition: "opacity 0.3s",
          }}
        />
      )}

      <aside
        style={{
          width: sidebarCollapsed ? "72px" : "var(--sidebar-width)",
          minHeight: "100vh",
          background: "var(--bg-secondary)",
          borderRight: "1px solid var(--border-color)",
          display: "flex",
          flexDirection: "column",
          transition: "width 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
          position: "fixed",
          left: 0,
          top: 0,
          zIndex: 40,
          overflow: "hidden",
        }}
      >
        {/* Logo */}
        <div
          style={{
            height: "var(--header-height)",
            display: "flex",
            alignItems: "center",
            padding: sidebarCollapsed ? "0 16px" : "0 20px",
            borderBottom: "1px solid var(--border-color)",
            gap: "12px",
            justifyContent: sidebarCollapsed ? "center" : "space-between",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
            }}
          >
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: "var(--radius-md)",
                background:
                  "linear-gradient(135deg, var(--accent-primary), #a855f7)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <Package size={20} color="white" />
            </div>
            {!sidebarCollapsed && (
              <div style={{ overflow: "hidden", whiteSpace: "nowrap" }}>
                <h1
                  style={{
                    fontSize: "16px",
                    fontWeight: 700,
                    color: "var(--text-primary)",
                    letterSpacing: "-0.02em",
                  }}
                >
                  InvenPro
                </h1>
                <p
                  style={{
                    fontSize: "11px",
                    color: "var(--text-muted)",
                    letterSpacing: "0.02em",
                  }}
                >
                  Gestão de Inventário
                </p>
              </div>
            )}
          </div>

          {/* Mobile close button */}
          {isMobile && (
            <button
              onClick={() => setMobileOpen(false)}
              style={{
                width: 28,
                height: 28,
                borderRadius: "var(--radius-sm)",
                border: "none",
                background: "transparent",
                color: "var(--text-muted)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
              }}
            >
              <X size={18} />
            </button>
          )}
        </div>

        {/* Navigation */}
        <nav
          style={{
            flex: 1,
            padding: "12px 8px",
            display: "flex",
            flexDirection: "column",
            gap: "4px",
            overflowY: "auto",
          }}
        >
          {filteredItems.map((item) => {
            // Render section separator
            if (item.href.startsWith("---")) {
              if (sidebarCollapsed) {
                return (
                  <div
                    key={item.label}
                    style={{
                      height: "1px",
                      background: "var(--border-color)",
                      margin: "8px 8px",
                    }}
                  />
                );
              }
              return (
                <div
                  key={item.label}
                  style={{
                    padding: "12px 12px 4px",
                    fontSize: "10px",
                    fontWeight: 700,
                    color: "var(--text-muted)",
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                  }}
                >
                  {item.label}
                </div>
              );
            }

            const isActive =
              pathname === item.href ||
              (item.href !== "/" && pathname.startsWith(item.href));
            const Icon = item.icon!;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => isMobile && setMobileOpen(false)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  padding: sidebarCollapsed ? "10px 0" : "10px 12px",
                  borderRadius: "var(--radius-md)",
                  textDecoration: "none",
                  fontSize: "14px",
                  fontWeight: isActive ? 600 : 400,
                  color: isActive
                    ? "var(--accent-primary-hover)"
                    : "var(--text-secondary)",
                  background: isActive
                    ? "var(--accent-primary-glow)"
                    : "transparent",
                  justifyContent: sidebarCollapsed ? "center" : "flex-start",
                  transition: "all 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = "var(--bg-card)";
                    e.currentTarget.style.color = "var(--text-primary)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = "transparent";
                    e.currentTarget.style.color = "var(--text-secondary)";
                  }
                }}
              >
                <Icon size={20} style={{ flexShrink: 0 }} />
                {!sidebarCollapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* User info + collapse toggle */}
        <div
          style={{
            padding: "12px 8px",
            borderTop: "1px solid var(--border-color)",
            display: "flex",
            flexDirection: "column",
            gap: "8px",
          }}
        >
          {/* User info */}
          {session?.user && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                padding: sidebarCollapsed ? "8px 0" : "8px 12px",
                justifyContent: sidebarCollapsed ? "center" : "flex-start",
              }}
            >
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: "var(--radius-md)",
                  background:
                    "linear-gradient(135deg, var(--accent-primary), #a855f7)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "12px",
                  fontWeight: 700,
                  color: "white",
                  flexShrink: 0,
                }}
              >
                {userInitials}
              </div>
              {!sidebarCollapsed && (
                <div style={{ overflow: "hidden", flex: 1, minWidth: 0 }}>
                  <p
                    style={{
                      fontSize: "13px",
                      fontWeight: 600,
                      color: "var(--text-primary)",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {userName}
                  </p>
                  <p
                    style={{
                      fontSize: "11px",
                      color: "var(--text-muted)",
                    }}
                  >
                    {userRole === "ADMIN"
                      ? "Admin"
                      : userRole === "OPERADOR"
                        ? "Operador"
                        : "Visualizador"}
                  </p>
                </div>
              )}
              {!sidebarCollapsed && (
                <button
                  onClick={() => signOut({ callbackUrl: "/login" })}
                  title="Sair"
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: "var(--radius-sm)",
                    border: "none",
                    background: "transparent",
                    color: "var(--text-muted)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    flexShrink: 0,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = "var(--accent-danger)";
                    e.currentTarget.style.background =
                      "var(--accent-danger-bg)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = "var(--text-muted)";
                    e.currentTarget.style.background = "transparent";
                  }}
                >
                  <LogOut size={14} />
                </button>
              )}
            </div>
          )}

          {/* Collapse toggle (desktop only) */}
          {!isMobile && (
            <button
              onClick={toggle}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                width: "100%",
                padding: "10px",
                borderRadius: "var(--radius-md)",
                border: "none",
                background: "transparent",
                color: "var(--text-muted)",
                cursor: "pointer",
                fontSize: "13px",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "var(--bg-card)";
                e.currentTarget.style.color = "var(--text-secondary)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent";
                e.currentTarget.style.color = "var(--text-muted)";
              }}
            >
              {collapsed ? (
                <ChevronRight size={18} />
              ) : (
                <ChevronLeft size={18} />
              )}
              {!collapsed && <span>Recolher</span>}
            </button>
          )}
        </div>
      </aside>
    </>
  );
}
