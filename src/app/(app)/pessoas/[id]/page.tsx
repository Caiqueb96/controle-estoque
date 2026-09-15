import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { exigirPerfil } from "@/lib/auth"
import { buscarPessoa } from "@/lib/pessoas"
import { alternarAtivo } from "../actions"
import { PessoaForm } from "../pessoa-form"

export const metadata: Metadata = {
  title: "Editar pessoa | Controle de Estoque",
}

export default async function EditarPessoaPage({
  params,
}: {
  // No Next.js 16 os parâmetros da rota também chegam como Promise.
  params: Promise<{ id: string }>
}) {
  await exigirPerfil(["admin", "almoxarife", "produtor"])

  const { id } = await params
  const pessoa = await buscarPessoa(id)

  if (!pessoa) notFound()

  // `bind` prepara a Server Action com os argumentos já preenchidos,
  // então o <form> abaixo não precisa de nenhum campo escondido.
  const alternar = alternarAtivo.bind(null, pessoa.id, !pessoa.ativo)

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">{pessoa.nome}</h1>
          <p className="flex items-center gap-2 text-muted-foreground">
            {pessoa.tipo === "usuario" ? "Usuário do sistema" : "Freelancer"}
            {!pessoa.ativo && <Badge variant="destructive">Inativo</Badge>}
          </p>
        </div>

        <form action={alternar}>
          <Button type="submit" variant={pessoa.ativo ? "outline" : "default"}>
            {pessoa.ativo ? "Desativar" : "Reativar"}
          </Button>
        </form>
      </div>

      {pessoa.tipo === "usuario" && (
        <p className="rounded-md border border-dashed px-4 py-3 text-sm text-muted-foreground">
          Esta pessoa tem login no sistema. Desativá-la aqui não bloqueia o
          acesso: isso é feito na tela de Usuários.
        </p>
      )}

      <PessoaForm pessoa={pessoa} />

      <p className="text-sm text-muted-foreground">
        Pessoas nunca são apagadas, só desativadas — assim o histórico de
        ocorrências continua apontando para quem era o responsável.
      </p>
    </div>
  )
}
