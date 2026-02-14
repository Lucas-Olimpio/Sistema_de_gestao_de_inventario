"use client";

import { Bell, Search } from "lucide-react";
import { usePathname } from "next/navigation";

const pageTitles: Record<string, string> = {
  "/": "Dashboard",
  "/produtos": "Produtos",
  "/produtos/novo": "Novo Produto",
  "/categorias": "Categorias",
  "/movimentacoes": "Movimentações",
};

export default function Header() {
  const pathname = usePathname();

  const getTitle = () => {
    if (pageTitles[pathname]) return pageTitles[pathname];
    if (pathname.includes("/produtos/") && pathname.includes("/editar"))
      return "Editar Produto";
    return "InvenPro";
  };

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

      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        {/* Search */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            background: "var(--bg-input)",
            borderRadius: "var(--radius-md)",
            padding: "8px 14px",
            border: "1px solid var(--border-color)",
            minWidth: "240px",
          }}
        >
          <Search size={16} color="var(--text-muted)" />
          <input
            type="text"
            placeholder="Buscar..."
            style={{
              border: "none",
              background: "transparent",
              color: "var(--text-primary)",
              fontSize: "13px",
              outline: "none",
              width: "100%",
            }}
          />
        </div>

        {/* Notifications */}
        <button
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
          <span
            style={{
              position: "absolute",
              top: 6,
              right: 6,
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: "var(--accent-danger)",
            }}
          />
        </button>

        {/* Avatar */}
        <div
          style={{
            width: 38,
            height: 38,
            borderRadius: "var(--radius-md)",
            background:
              "linear-gradient(135deg, var(--accent-primary), #a855f7)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "14px",
            fontWeight: 700,
            color: "white",
            cursor: "pointer",
          }}
        >
          LO
        </div>
      </div>
    </header>
  );
}
