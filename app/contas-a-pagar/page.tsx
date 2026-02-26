import { auth } from "@/lib/auth";
import ContasAPagarClient from "./contas-pagar-client";
import { redirect } from "next/navigation";

export default async function ContasAPagarPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const isViewer = session.user.role === "VISUALIZADOR";

  return <ContasAPagarClient isViewer={isViewer} />;
}
