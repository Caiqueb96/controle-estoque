"use client"

import Link from "next/link"
import { useActionState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { formatarCpf, formatarTelefone } from "@/lib/formato"
import type { Pessoa } from "@/lib/pessoas"
import { salvarPessoa, type EstadoFormulario } from "./actions"

const estadoInicial: EstadoFormulario = {}

// Mostra a mensagem de erro logo abaixo do campo a que ela pertence.
function Erro({ mensagem }: { mensagem?: string }) {
  if (!mensagem) return null
  return (
    <p role="alert" className="text-sm text-destructive">
      {mensagem}
    </p>
  )
}

/** O mesmo formulário serve para cadastrar e para editar. */
export function PessoaForm({ pessoa }: { pessoa?: Pessoa }) {
  const [estado, acao, enviando] = useActionState(salvarPessoa, estadoInicial)

  return (
    <form action={acao} className="flex max-w-xl flex-col gap-5">
      {/* Na edição, o id viaja escondido para a Server Action saber
          que é para atualizar, e não criar outra pessoa. */}
      {pessoa && <input type="hidden" name="id" value={pessoa.id} />}

      <div className="flex flex-col gap-2">
        <Label htmlFor="nome">Nome *</Label>
        <Input
          id="nome"
          name="nome"
          defaultValue={pessoa?.nome ?? ""}
          placeholder="Nome completo"
          required
          disabled={enviando}
        />
        <Erro mensagem={estado.erros?.nome} />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor="telefone">Telefone</Label>
          <Input
            id="telefone"
            name="telefone"
            type="tel"
            inputMode="tel"
            defaultValue={formatarTelefone(pessoa?.telefone ?? null)}
            placeholder="(11) 98888-7777"
            disabled={enviando}
          />
          <Erro mensagem={estado.erros?.telefone} />
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="documento">CPF</Label>
          <Input
            id="documento"
            name="documento"
            inputMode="numeric"
            defaultValue={formatarCpf(pessoa?.documento ?? null)}
            placeholder="123.456.789-09"
            disabled={enviando}
          />
          <Erro mensagem={estado.erros?.documento} />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="observacoes">Observações</Label>
        <Textarea
          id="observacoes"
          name="observacoes"
          rows={3}
          defaultValue={pessoa?.observacoes ?? ""}
          placeholder="Função, empresa, como foi contratado..."
          disabled={enviando}
        />
        <Erro mensagem={estado.erros?.observacoes} />
      </div>

      <p className="text-sm text-muted-foreground">
        Pode digitar com ou sem pontuação: o sistema guarda só os números.
      </p>

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
        <Button variant="outline" render={<Link href="/pessoas" />}>
          Cancelar
        </Button>
      </div>
    </form>
  )
}
