import { Metadata } from "next";
import ConfigClient from "./configuracoes-client";

export const metadata: Metadata = {
  title: "Configurações Globais | InvenPro",
};

export default function ConfiguracoesPage() {
  return <ConfigClient />;
}
