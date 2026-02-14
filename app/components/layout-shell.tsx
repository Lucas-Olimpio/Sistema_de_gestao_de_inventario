"use client";

import { useSidebar } from "./sidebar-context";

export default function LayoutShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const { collapsed } = useSidebar();

  return (
    <div
      style={{
        flex: 1,
        marginLeft: collapsed ? "72px" : "var(--sidebar-width)",
        display: "flex",
        flexDirection: "column",
        transition: "margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
      }}
    >
      {children}
    </div>
  );
}
