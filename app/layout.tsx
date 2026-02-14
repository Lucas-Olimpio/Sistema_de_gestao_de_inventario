import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Sidebar from "./components/sidebar";
import Header from "./components/header";
import { SidebarProvider } from "./components/sidebar-context";
import LayoutShell from "./components/layout-shell";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "InvenPro — Sistema de Gestão de Inventário",
  description: "Sistema completo de gestão e controle de inventário",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body className={inter.variable}>
        <SidebarProvider>
          <div style={{ display: "flex", minHeight: "100vh" }}>
            <Sidebar />
            <LayoutShell>
              <Header />
              <main style={{ flex: 1, padding: "24px 28px" }}>{children}</main>
            </LayoutShell>
          </div>
        </SidebarProvider>
      </body>
    </html>
  );
}
