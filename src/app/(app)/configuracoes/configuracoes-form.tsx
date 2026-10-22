"use client"

import { useActionState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { Configuracoes } from "@/lib/configuracao"
import { salvarConfiguracoes, type EstadoFormulario } from "./actions"

const estadoInicial: EstadoFormulario = {}

export function ConfiguracoesForm({ configuracoes }: { configuracoes: Configuracoes }) {
  const [estado, acao, enviando] = useActionState(salvarConfiguracoes, estadoInicial)

  return (
    <form action={acao} className="flex max-w-xl flex-col gap-5">
      <div className="flex flex-col gap-2">
        <Label htmlFor="diasFolgaReserva">Dias de folga entre eventos</Label>
        <Input
          id="diasFolgaReserva"
          name="diasFolgaReserva"
          type="number"
          min={0}
          max={30}
          step={1}
          defaultValue={configuracoes.diasFolgaReserva}
          disabled={enviando}
          className="w-32"
        />
        {estado.erros?.diasFolgaReserva && (
          <p role="alert" className="text-sm text-destructive">
            {estado.erros.diasFolgaReserva}
          </p>
        )}
        <p className="text-sm text-muted-foreground">
          Depois que um item volta de um evento, quantos dias ele fica parado
          (para limpeza, conferência ou conserto) antes de poder ser reservado
          para o próximo. Com 0, o item pode sair no mesmo dia em que voltou.
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

      {estado.salvo && !enviando && (
        <p role="status" className="text-sm text-green-700 dark:text-green-400">
          Configurações salvas.
        </p>
      )}

      <div>
        <Button type="submit" disabled={enviando}>
          {enviando ? "Salvando..." : "Salvar"}
        </Button>
      </div>
    </form>
  )
}
