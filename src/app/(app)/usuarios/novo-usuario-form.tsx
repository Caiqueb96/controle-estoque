"use client"

import Link from "next/link"
import { useActionState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { NOME_DO_PERFIL, PERFIS } from "@/lib/perfis"
import { criarUsuario, type EstadoFormulario } from "./actions"

const estadoInicial: EstadoFormulario = {}

function Erro({ mensagem }: { mensagem?: string }) {
  if (!mensagem) return null
  return (
    <p role="alert" className="text-sm text-destructive">
      {mensagem}
    </p>
  )
}

export function NovoUsuarioForm() {
  const [estado, acao, enviando] = useActionState(criarUsuario, estadoInicial)

  return (
    <form action={acao} className="flex max-w-xl flex-col gap-5">
      <div className="flex flex-col gap-2">
        <Label htmlFor="nome">Nome *</Label>
        <Input id="nome" name="nome" required disabled={enviando} />
        <Erro mensagem={estado.erros?.nome} />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="email">E-mail de acesso *</Label>
        <Input id="email" name="email" type="email" required disabled={enviando} />
        <Erro mensagem={estado.erros?.email} />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="senha">Senha inicial *</Label>
        <Input
          id="senha"
          name="senha"
          type="password"
          minLength={8}
          autoComplete="new-password"
          required
          disabled={enviando}
        />
        <Erro mensagem={estado.erros?.senha} />
        <p className="text-sm text-muted-foreground">
          Mínimo de 8 caracteres. Passe a senha para a pessoa por um canal
          seguro.
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="perfil">Função *</Label>
        <select
          id="perfil"
          name="perfil"
          defaultValue="campo"
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
          {enviando ? "Criando..." : "Criar usuário"}
        </Button>
        <Button variant="outline" nativeButton={false} render={<Link href="/usuarios" />}>
          Cancelar
        </Button>
      </div>
    </form>
  )
}
