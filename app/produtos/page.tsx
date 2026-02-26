import { auth } from "@/lib/auth";
import ProdutosClient from "./produtos-client";
import { redirect } from "next/navigation";

export default async function ProdutosPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const isViewer = session.user.role === "VISUALIZADOR";

  return <ProdutosClient isViewer={isViewer} />;
}
