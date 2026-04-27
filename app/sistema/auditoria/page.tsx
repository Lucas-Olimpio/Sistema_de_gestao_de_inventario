import { Metadata } from "next";
import { auth } from "@/lib/auth";
import AuditoriaClient from "./auditoria-client";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Auditoria de Segurança | InvenPro",
};

export default async function AuditoriaPage() {
  const session = await auth();
  
  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/"); // Acesso Negado hard-level server side
  }

  return <AuditoriaClient isViewer={false} />;
}
