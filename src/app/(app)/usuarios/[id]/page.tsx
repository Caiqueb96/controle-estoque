import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { exigirPerfil } from "@/lib/auth"
import { buscarUsuario } from "@/lib/usuarios"
import { alternarAtivoUsuario } from "../actions"
import { UsuarioForm } from "../usuario-form"

export const metadata: Metadata = {
  title: "Editar usuário | Controle de Estoque",
}

export default async function EditarUsuarioPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const admin = await exigirPerfil(["admin"])

  const { id } = await params
  const usuario = await buscarUsuario(id)

  if (!usuario) notFound()

  const ehVoce = usuario.id === admin.id
  const alternar = alternarAtivoUsuario.bind(null, usuario.id, !usuario.ativo)

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">{usuario.nome}</h1>
          <p className="flex items-center gap-2 text-muted-foreground">
            {usuario.email}
            {!usuario.ativo && <Badge variant="destructive">Bloqueado</Badge>}
          </p>
        </div>

        {/* Ninguém bloqueia o próprio acesso: seria uma porta trancada
            por dentro, sem chave do lado de fora. */}
        {!ehVoce && (
          <form action={alternar}>
            <Button type="submit" variant={usuario.ativo ? "outline" : "default"}>
              {usuario.ativo ? "Bloquear acesso" : "Liberar acesso"}
            </Button>
          </form>
        )}
      </div>

      <UsuarioForm usuario={usuario} />

      <p className="text-sm text-muted-foreground">
        Telefone, CPF e observações desta pessoa são editados na tela de{" "}
        <Link href={`/pessoas/${usuario.pessoaId}`} className="underline">
          Pessoas
        </Link>
        .
      </p>
    </div>
  )
}
