import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import AuthLayout from "./components/auth-layout";
import Providers from "./providers";
import { Toaster } from "@/components/ui/sonner";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: {
    default: "InvenPro — Sistema de Gestão de Inventário",
    template: "%s | InvenPro",
  },
  description:
    "Sistema completo de gestão de inventário com controle de estoque, compras, vendas, contas a pagar e receber, e relatórios financeiros.",
  keywords: [
    "gestão de inventário",
    "controle de estoque",
    "ERP",
    "compras",
    "vendas",
    "contas a pagar",
    "contas a receber",
  ],
  openGraph: {
    title: "InvenPro — Sistema de Gestão de Inventário",
    description:
      "Gerencie seu estoque, compras, vendas e finanças em um único sistema.",
    type: "website",
    locale: "pt_BR",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body className={inter.variable}>
        <Providers>
          <AuthLayout>{children}</AuthLayout>
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
