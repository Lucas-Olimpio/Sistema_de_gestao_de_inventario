import { Metadata } from "next";
import { auth } from "@/lib/auth";
import ArmazensClient from "./armazens-client";

export const metadata: Metadata = {
  title: "Integração Logística | InvenPro",
};

export default async function ArmazensPage() {
  const session = await auth();
  const isViewer = session?.user?.role === "VISUALIZADOR";

  return <ArmazensClient isViewer={isViewer} />;
}
