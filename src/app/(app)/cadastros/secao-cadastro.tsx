"use client"

import { useActionState, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import type { ItemCadastro, TabelaCadastro } from "@/lib/cadastros"
import { alternarAtivoCadastro, salvarCadastro, type EstadoFormulario } from "./actions"

const estadoInicial: EstadoFormulario = {}

function Erro({ mensagem }: { mensagem?: string }) {
  if (!mensagem) return null
  return (
    <p role="alert" className="text-sm text-destructive">
      {mensagem}
    </p>
  )
}

/**
 * Os campos de nome e descrição, usados tanto para cadastrar quanto para
 * editar. Depois de enviar, o React limpa o formulário sozinho; por isso
 * os valores voltam pelo `estado.valores` quando dá erro.
 */
function CamposCadastro({
  tabela,
  item,
  estado,
  enviando,
}: {
  tabela: TabelaCadastro
  item?: ItemCadastro
  estado: EstadoFormulario
  enviando: boolean
}) {
  return (
    <>
      <input type="hidden" name="tabela" value={tabela} />
      {item && <input type="hidden" name="id" value={item.id} />}
      <div className="flex min-w-40 flex-1 flex-col gap-1">
        <Input
          name="nome"
          aria-label="Nome"
          placeholder="Nome"
          defaultValue={estado.valores?.nome ?? item?.nome ?? ""}
          required
          disabled={enviando}
        />
        <Erro mensagem={estado.erros?.nome} />
      </div>
      <div className="flex min-w-40 flex-[2] flex-col gap-1">
        <Input
          name="descricao"
          aria-label="Descrição"
          placeholder="Descrição (opcional)"
          defaultValue={estado.valores?.descricao ?? item?.descricao ?? ""}
          disabled={enviando}
        />
        <Erro mensagem={estado.erros?.descricao} />
      </div>
    </>
  )
}

/** Uma linha da lista: mostra o nome e, ao clicar em Editar, vira formulário. */
function LinhaCadastro({ tabela, item }: { tabela: TabelaCadastro; item: ItemCadastro }) {
  const [editando, setEditando] = useState(false)

  // Ao salvar com sucesso, fecha o modo de edição.
  const [estado, acao, enviando] = useActionState(
    async (anterior: EstadoFormulario, formData: FormData) => {
      const novo = await salvarCadastro(anterior, formData)
      if (novo.salvo) setEditando(false)
      return novo
    },
    estadoInicial
  )

  // `bind` prepara a Server Action com os argumentos já preenchidos.
  const alternar = alternarAtivoCadastro.bind(null, tabela, item.id, !item.ativo)

  if (editando) {
    return (
      <li className="py-3">
        <form action={acao} className="flex flex-wrap items-start gap-2">
          <CamposCadastro tabela={tabela} item={item} estado={estado} enviando={enviando} />
          <Button type="submit" disabled={enviando}>
            {enviando ? "Salvando..." : "Salvar"}
          </Button>
          <Button type="button" variant="ghost" onClick={() => setEditando(false)}>
            Cancelar
          </Button>
        </form>
        <Erro mensagem={estado.erro} />
      </li>
    )
  }

  return (
    <li className="flex flex-wrap items-center justify-between gap-2 py-3">
      <div>
        <p className="flex items-center gap-2 font-medium">
          {item.nome}
          {!item.ativo && <Badge variant="destructive">Inativo</Badge>}
        </p>
        {item.descricao && <p className="text-sm text-muted-foreground">{item.descricao}</p>}
      </div>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={() => setEditando(true)}>
          Editar
        </Button>
        <form action={alternar}>
          <Button type="submit" variant="ghost" size="sm">
            {item.ativo ? "Desativar" : "Reativar"}
          </Button>
        </form>
      </div>
    </li>
  )
}

/** Uma seção da tela: formulário de "adicionar" em cima e a lista embaixo. */
export function SecaoCadastro({
  tabela,
  itens,
  podeEditar,
}: {
  tabela: TabelaCadastro
  itens: ItemCadastro[]
  podeEditar: boolean
}) {
  const [estado, acao, enviando] = useActionState(salvarCadastro, estadoInicial)

  return (
    <div className="flex flex-col gap-4">
      {podeEditar && (
        <form action={acao} className="flex flex-col gap-2">
          <div className="flex flex-wrap items-start gap-2">
            <CamposCadastro tabela={tabela} estado={estado} enviando={enviando} />
            <Button type="submit" disabled={enviando}>
              {enviando ? "Adicionando..." : "Adicionar"}
            </Button>
          </div>
          <Erro mensagem={estado.erro} />
        </form>
      )}

      {itens.length === 0 ? (
        <p className="rounded-md border border-dashed p-6 text-center text-muted-foreground">
          Nada cadastrado ainda.
        </p>
      ) : (
        <ul className="divide-y rounded-md border px-4">
          {itens.map((item) =>
            podeEditar ? (
              <LinhaCadastro key={item.id} tabela={tabela} item={item} />
            ) : (
              <li key={item.id} className="py-3">
                <p className="font-medium">{item.nome}</p>
                {item.descricao && (
                  <p className="text-sm text-muted-foreground">{item.descricao}</p>
                )}
              </li>
            )
          )}
        </ul>
      )}
    </div>
  )
}
