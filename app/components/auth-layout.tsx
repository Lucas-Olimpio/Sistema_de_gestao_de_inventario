"use client";

import { usePathname } from "next/navigation";
import Sidebar from "./sidebar";
import Header from "./header";
import { SidebarProvider } from "./sidebar-context";
import LayoutShell from "./layout-shell";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  // Login page uses its own layout without sidebar/header
  if (pathname === "/login") {
    return <>{children}</>;
  }

  return (
    <SidebarProvider>
      <div style={{ display: "flex", minHeight: "100vh" }}>
        <Sidebar />
        <LayoutShell>
          <Header />
          <main style={{ flex: 1, padding: "24px 28px" }}>{children}</main>
        </LayoutShell>
      </div>
    </SidebarProvider>
  );
}
