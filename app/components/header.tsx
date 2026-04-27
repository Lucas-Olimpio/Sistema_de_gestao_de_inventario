"use client";

import { Bell, LogOut, ChevronDown, AlertTriangle, ShoppingCart, ShoppingBag, Menu } from "lucide-react";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { useSidebar } from "./sidebar-context";

const pageTitles: Record<string, string> = {
  "/": "Dashboard",
  "/produtos": "Produtos",
  "/produtos/novo": "Novo Produto",
  "/categorias": "Categorias",
  "/movimentacoes": "Movimentações",
  "/fornecedores": "Fornecedores",
  "/compras": "Ordens de Compra",
  "/recebimento": "Recebimento",
  "/contas-a-pagar": "Contas a Pagar",
  "/clientes": "Clientes",
  "/pedidos": "Pedidos de Venda",
  "/contas-a-receber": "Contas a Receber",
  "/contas-bancarias": "Contas Bancárias",
  "/usuarios": "Utilizadores",
};

interface NotificationItem {
  id: string;
  icon: typeof AlertTriangle;
  title: string;
  description: string;
  color: string;
  href: string;
}

export default function Header() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const { isMobile, setMobileOpen } = useSidebar();
  const [menuOpen, setMenuOpen] = useState(false);
  const [notiOpen, setNotiOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const menuRef = useRef<HTMLDivElement>(null);
  const notiRef = useRef<HTMLDivElement>(null);

  const userName = session?.user?.name || "Utilizador";
  const userRole = (session?.user as any)?.role || "";
  const userInitials = userName
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();

  const roleLabels: Record<string, string> = {
    ADMIN: "Admin",
    OPERADOR: "Operador",
    VISUALIZADOR: "Visualizador",
  };

  const getTitle = () => {
    if (pageTitles[pathname]) return pageTitles[pathname];
    if (pathname.includes("/produtos/") && pathname.includes("/editar"))
      return "Editar Produto";
    return "InvenPro";
  };

  // Fetch real notification data
  const fetchNotifications = useCallback(async () => {
    try {
      const items: NotificationItem[] = [];

      // Check low stock products
      const prodRes = await fetch("/api/products?limit=100");
      const prodData = await prodRes.json();
      const products = prodData?.data || [];
      const lowStock = products.filter(
        (p: any) => p.quantity <= (p.minStock ?? 0),
      );
      if (lowStock.length > 0) {
        items.push({
          id: "low-stock",
          icon: AlertTriangle,
          title: `${lowStock.length} produto${lowStock.length > 1 ? "s" : ""} com estoque baixo`,
          description: lowStock
            .slice(0, 3)
            .map((p: any) => p.name)
            .join(", "),
          color: "var(--accent-warning)",
          href: "/produtos",
        });
      }

      // Check pending purchase orders
      const poRes = await fetch("/api/purchase-orders?status=PENDENTE");
      const poData = await poRes.json();
      const pendingPO = Array.isArray(poData) ? poData : [];
      if (pendingPO.length > 0) {
        items.push({
          id: "pending-po",
          icon: ShoppingCart,
          title: `${pendingPO.length} ordem${pendingPO.length > 1 ? "s" : ""} de compra pendente${pendingPO.length > 1 ? "s" : ""}`,
          description: "Aguardando aprovação",
          color: "var(--accent-info)",
          href: "/compras",
        });
      }

      // Check pending sales orders
      const soRes = await fetch("/api/sales-orders?status=PENDENTE");
      const soData = await soRes.json();
      const pendingSO = Array.isArray(soData) ? soData : [];
      if (pendingSO.length > 0) {
        items.push({
          id: "pending-so",
          icon: ShoppingBag,
          title: `${pendingSO.length} pedido${pendingSO.length > 1 ? "s" : ""} de venda pendente${pendingSO.length > 1 ? "s" : ""}`,
          description: "Aguardando processamento",
          color: "var(--accent-primary)",
          href: "/pedidos",
        });
      }

      setNotifications(items);
    } catch {
      // Silently fail — notifications are non-critical
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
    // Refresh every 60 seconds
    const interval = setInterval(fetchNotifications, 60_000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  // Close menus on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
      if (notiRef.current && !notiRef.current.contains(e.target as Node)) {
        setNotiOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const notifCount = notifications.length;

  return (
    <header
      style={{
        height: "var(--header-height)",
        borderBottom: "1px solid var(--border-color)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 28px",
        background: "var(--bg-secondary)",
        backdropFilter: "blur(12px)",
        position: "sticky",
        top: 0,
        zIndex: 30,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        {/* Mobile hamburger */}
        {isMobile && (
          <button
            onClick={() => setMobileOpen(true)}
            style={{
              width: 38,
              height: 38,
              borderRadius: "var(--radius-md)",
              border: "1px solid var(--border-color)",
              background: "var(--bg-input)",
              color: "var(--text-secondary)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
            }}
          >
            <Menu size={18} />
          </button>
        )}
        <h2
          style={{
            fontSize: "20px",
            fontWeight: 700,
            color: "var(--text-primary)",
            letterSpacing: "-0.02em",
          }}
        >
          {getTitle()}
        </h2>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        {/* Notifications */}
        <div ref={notiRef} style={{ position: "relative" }}>
          <button
            onClick={() => setNotiOpen(!notiOpen)}
            style={{
              width: 38,
              height: 38,
              borderRadius: "var(--radius-md)",
              border: "1px solid var(--border-color)",
              background: "var(--bg-input)",
              color: "var(--text-secondary)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              position: "relative",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "var(--border-hover)";
              e.currentTarget.style.color = "var(--text-primary)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "var(--border-color)";
              e.currentTarget.style.color = "var(--text-secondary)";
            }}
          >
            <Bell size={18} />
            {notifCount > 0 && (
              <span
                style={{
                  position: "absolute",
                  top: 4,
                  right: 4,
                  minWidth: 16,
                  height: 16,
                  borderRadius: "50%",
                  background: "var(--accent-danger)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "9px",
                  fontWeight: 700,
                  color: "white",
                  padding: "0 4px",
                }}
              >
                {notifCount}
              </span>
            )}
          </button>

          {notiOpen && (
            <div
              style={{
                position: "absolute",
                right: 0,
                top: "calc(100% + 8px)",
                width: "340px",
                background: "var(--bg-card)",
                border: "1px solid var(--border-color)",
                borderRadius: "var(--radius-md)",
                boxShadow: "var(--shadow-lg)",
                zIndex: 50,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  padding: "12px 16px",
                  borderBottom: "1px solid var(--border-color)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <p
                  style={{
                    fontSize: "13px",
                    fontWeight: 700,
                    color: "var(--text-primary)",
                  }}
                >
                  Notificações
                </p>
                {notifCount > 0 && (
                  <span
                    style={{
                      fontSize: "11px",
                      fontWeight: 600,
                      color: "var(--accent-danger)",
                      background: "var(--accent-danger-bg)",
                      padding: "2px 8px",
                      borderRadius: "999px",
                    }}
                  >
                    {notifCount} alerta{notifCount > 1 ? "s" : ""}
                  </span>
                )}
              </div>

              {notifications.length === 0 ? (
                <div
                  style={{
                    padding: "24px 16px",
                    textAlign: "center",
                    color: "var(--text-muted)",
                    fontSize: "13px",
                  }}
                >
                  ✅ Nenhum alerta no momento
                </div>
              ) : (
                <div style={{ maxHeight: "280px", overflowY: "auto" }}>
                  {notifications.map((n) => {
                    const Icon = n.icon;
                    return (
                      <Link
                        key={n.id}
                        href={n.href}
                        onClick={() => setNotiOpen(false)}
                        style={{
                          display: "flex",
                          alignItems: "flex-start",
                          gap: "10px",
                          padding: "12px 16px",
                          borderBottom: "1px solid var(--border-color)",
                          textDecoration: "none",
                          transition: "background 0.2s",
                        }}
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.background =
                            "var(--bg-card-hover)")
                        }
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.background = "transparent")
                        }
                      >
                        <div
                          style={{
                            width: 28,
                            height: 28,
                            borderRadius: "var(--radius-sm)",
                            background: `color-mix(in srgb, ${n.color} 12%, transparent)`,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0,
                            marginTop: "2px",
                          }}
                        >
                          <Icon size={14} color={n.color} />
                        </div>
                        <div>
                          <p
                            style={{
                              fontSize: "12px",
                              fontWeight: 600,
                              color: "var(--text-primary)",
                              lineHeight: 1.4,
                            }}
                          >
                            {n.title}
                          </p>
                          <p
                            style={{
                              fontSize: "11px",
                              color: "var(--text-muted)",
                              marginTop: "2px",
                              lineHeight: 1.3,
                            }}
                          >
                            {n.description}
                          </p>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* User Avatar & Dropdown */}
        <div ref={menuRef} style={{ position: "relative" }}>
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "4px 8px 4px 4px",
              borderRadius: "var(--radius-md)",
              border: "1px solid var(--border-color)",
              background: "var(--bg-input)",
              cursor: "pointer",
              color: "var(--text-primary)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "var(--border-hover)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "var(--border-color)";
            }}
          >
            <div
              style={{
                width: 30,
                height: 30,
                borderRadius: "var(--radius-sm)",
                background:
                  "linear-gradient(135deg, var(--accent-primary), #a855f7)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "12px",
                fontWeight: 700,
                color: "white",
              }}
            >
              {userInitials}
            </div>
            <ChevronDown size={14} color="var(--text-muted)" />
          </button>

          {menuOpen && (
            <div
              style={{
                position: "absolute",
                right: 0,
                top: "calc(100% + 8px)",
                minWidth: "200px",
                background: "var(--bg-card)",
                border: "1px solid var(--border-color)",
                borderRadius: "var(--radius-md)",
                boxShadow: "var(--shadow-lg)",
                padding: "8px",
                zIndex: 50,
              }}
            >
              {/* User info */}
              <div
                style={{
                  padding: "8px 10px",
                  borderBottom: "1px solid var(--border-color)",
                  marginBottom: "4px",
                }}
              >
                <p
                  style={{
                    fontSize: "13px",
                    fontWeight: 600,
                    color: "var(--text-primary)",
                  }}
                >
                  {userName}
                </p>
                <p
                  style={{
                    fontSize: "11px",
                    color: "var(--text-muted)",
                    marginTop: "2px",
                  }}
                >
                  {session?.user?.email}
                </p>
                <span
                  style={{
                    display: "inline-block",
                    marginTop: "6px",
                    padding: "2px 8px",
                    borderRadius: "var(--radius-sm)",
                    background: "var(--accent-primary-glow)",
                    color: "var(--accent-primary)",
                    fontSize: "10px",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                  }}
                >
                  {roleLabels[userRole] || userRole}
                </span>
              </div>

              {/* Logout */}
              <button
                onClick={() => signOut({ callbackUrl: "/login" })}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  width: "100%",
                  padding: "8px 10px",
                  borderRadius: "var(--radius-sm)",
                  border: "none",
                  background: "transparent",
                  color: "var(--accent-danger)",
                  fontSize: "13px",
                  cursor: "pointer",
                  textAlign: "left",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "var(--accent-danger-bg)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "transparent";
                }}
              >
                <LogOut size={14} />
                Sair
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
