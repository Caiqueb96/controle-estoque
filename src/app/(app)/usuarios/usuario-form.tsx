"use client"

import Link from "next/link"
import { useActionState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { NOME_DO_PERFIL, PERFIS } from "@/lib/perfis"
import type { Usuario } from "@/lib/usuarios"
import { salvarUsuario, type EstadoFormulario } from "./actions"

const estadoInicial: EstadoFormulario = {}

function Erro({ mensagem }: { mensagem?: string }) {
  if (!mensagem) return null
  return (
    <p role="alert" className="text-sm text-destructive">
      {mensagem}
    </p>
  )
}

export function UsuarioForm({ usuario }: { usuario: Usuario }) {
  const [estado, acao, enviando] = useActionState(salvarUsuario, estadoInicial)

  return (
    <form action={acao} className="flex max-w-xl flex-col gap-5">
      <input type="hidden" name="id" value={usuario.id} />

      <div className="flex flex-col gap-2">
        <Label htmlFor="email">E-mail de acesso</Label>
        <Input id="email" value={usuario.email} disabled readOnly />
        <p className="text-sm text-muted-foreground">
          O e-mail e a senha ficam no sistema de login do Supabase e não são
          alterados por aqui.
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="nome">Nome *</Label>
        <Input
          id="nome"
          name="nome"
          defaultValue={usuario.nome}
          required
          disabled={enviando}
        />
        <Erro mensagem={estado.erros?.nome} />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="perfil">Função *</Label>
        <select
          id="perfil"
          name="perfil"
          defaultValue={usuario.perfil}
          disabled={enviando}
          className="h-9 rounded-md border border-input bg-transparent px-3 text-sm shadow-xs"
        >
          {PERFIS.map((perfil) => (
            <option key={perfil} value={perfil}>
              {NOME_DO_PERFIL[perfil]}
            </option>
          ))}
        </select>
        <Erro mensagem={estado.erros?.perfil} />
        <p className="text-sm text-muted-foreground">
          A função define o que a pessoa pode fazer no sistema.
        </p>
      </div>

      {estado.erro && (
        <p
          role="alert"
          className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          {estado.erro}
        </p>
      )}

      <div className="flex gap-3">
        <Button type="submit" disabled={enviando}>
          {enviando ? "Salvando..." : "Salvar"}
        </Button>
        <Button variant="outline" render={<Link href="/usuarios" />}>
          Cancelar
        </Button>
      </div>
    </form>
  )
}
