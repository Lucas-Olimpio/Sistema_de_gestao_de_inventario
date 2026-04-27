import { Metadata } from "next";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import RelatoriosClient from "./relatorios-client";

export const metadata: Metadata = {
  title: "Inteligência e Relatórios | InvenPro",
};

export default async function RelatoriosPage() {
  const session = await auth();
  
  if (!session?.user || session.user.role === "VISUALIZADOR") {
    redirect("/"); // Acesso Negado server side. Visualizadores não analisam BI.
  }

  return <RelatoriosClient />;
}
