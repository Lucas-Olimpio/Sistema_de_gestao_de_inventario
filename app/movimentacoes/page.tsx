import { auth } from "@/lib/auth";
import MovimentacoesClient from "./movimentacoes-client";
import { redirect } from "next/navigation";

export default async function MovimentacoesPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const isViewer = session.user.role === "VISUALIZADOR";

  return <MovimentacoesClient isViewer={isViewer} />;
}
