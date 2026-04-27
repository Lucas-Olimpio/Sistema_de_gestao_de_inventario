"use client";

import { useSidebar } from "./sidebar-context";

export default function LayoutShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const { collapsed, isMobile } = useSidebar();

  const marginLeft = isMobile ? "0" : collapsed ? "72px" : "var(--sidebar-width)";

  return (
    <div
      style={{
        flex: 1,
        marginLeft,
        display: "flex",
        flexDirection: "column",
        transition: "margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
      }}
    >
      {children}
    </div>
  );
}
