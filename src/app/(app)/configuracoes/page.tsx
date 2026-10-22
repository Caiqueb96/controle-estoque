import type { Metadata } from "next"
import { exigirPerfil } from "@/lib/auth"
import { buscarConfiguracoes } from "@/lib/configuracao"
import { ConfiguracoesForm } from "./configuracoes-form"

export const metadata: Metadata = {
  title: "Configurações | Controle de Estoque",
}

export default async function ConfiguracoesPage() {
  await exigirPerfil(["admin"])

  const configuracoes = await buscarConfiguracoes()

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Configurações</h1>
        <p className="text-muted-foreground">Ajustes gerais que valem para todo o sistema.</p>
      </div>

      <ConfiguracoesForm configuracoes={configuracoes} />
    </div>
  )
}
