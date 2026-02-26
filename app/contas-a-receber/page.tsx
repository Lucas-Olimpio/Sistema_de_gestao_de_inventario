import { auth } from "@/lib/auth";
import ContasAReceberClient from "./contas-receber-client";
import { redirect } from "next/navigation";

export default async function ContasAReceberPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const isViewer = session.user.role === "VISUALIZADOR";

  return <ContasAReceberClient isViewer={isViewer} />;
}
