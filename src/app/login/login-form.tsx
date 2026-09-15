"use client"

import { useActionState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { entrar, type EstadoLogin } from "./actions"

const estadoInicial: EstadoLogin = {}

export function LoginForm() {
  // useActionState liga o formulario a Server Action:
  //   estado     -> o que a action devolveu (mensagem de erro)
  //   acao       -> o que colocamos no `action` do <form>
  //   enviando   -> true enquanto o servidor processa
  const [estado, acao, enviando] = useActionState(entrar, estadoInicial)

  return (
    <form action={acao} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="email">E-mail</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="voce@empresa.com.br"
          required
          disabled={enviando}
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="senha">Senha</Label>
        <Input
          id="senha"
          name="senha"
          type="password"
          autoComplete="current-password"
          required
          disabled={enviando}
        />
      </div>

      {estado.erro && (
        <p
          role="alert"
          aria-live="polite"
          className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          {estado.erro}
        </p>
      )}

      <Button type="submit" className="w-full" disabled={enviando}>
        {enviando ? "Entrando..." : "Entrar"}
      </Button>
    </form>
  )
}
