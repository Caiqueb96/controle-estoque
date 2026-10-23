"use client"

import Link from "next/link"
import { useActionState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import type { ItemCadastro } from "@/lib/cadastros"
import { moedaParaCampo } from "@/lib/formato"
import type { Item } from "@/lib/itens"
import { salvarItem, type EstadoFormulario, type ValoresItem } from "./actions"

const estadoInicial: EstadoFormulario = {}

// Sugestões que aparecem ao digitar a unidade; dá para escrever outra.
const UNIDADES = ["un", "par", "jogo", "caixa", "pacote", "rolo", "m", "kg", "L"]

const CLASSE_SELECT =
  "h-9 rounded-md border border-input bg-transparent px-3 text-sm shadow-xs disabled:opacity-50"

function Erro({ mensagem }: { mensagem?: string }) {
  if (!mensagem) return null
  return (
    <p role="alert" className="text-sm text-destructive">
      {mensagem}
    </p>
  )
}

/** Os valores iniciais dos campos, a partir do item salvo (na edição). */
function valoresDoItem(item?: Item): ValoresItem {
  return {
    nome: item?.nome ?? "",
    descricao: item?.descricao ?? "",
    tipo: item?.tipo ?? "equipamento",
    categoriaId: item?.categoriaId ?? "",
    localId: item?.localId ?? "",
    unidadeMedida: item?.unidadeMedida ?? "un",
    estoqueMinimo: item ? String(item.estoqueMinimo) : "",
    valorReposicao: item ? moedaParaCampo(item.valorReposicao) : "",
  }
}

/** O mesmo formulário serve para cadastrar e para editar. */
export function ItemForm({
  item,
  categorias,
  locais,
}: {
  item?: Item
  categorias: ItemCadastro[]
  locais: ItemCadastro[]
}) {
  const [estado, acao, enviando] = useActionState(salvarItem, estadoInicial)

  // Depois de um erro, mostra o que foi digitado; senão, o que está salvo.
  const v = estado.valores ?? valoresDoItem(item)

  return (
    // `key` muda a cada tentativa: obriga o React a redesenhar os campos
    // com os valores devolvidos, em vez de manter os antigos.
    <form key={JSON.stringify(v)} action={acao} className="flex max-w-2xl flex-col gap-5">
      {item && <input type="hidden" name="id" value={item.id} />}

      <div className="flex flex-col gap-2">
        <Label htmlFor="nome">Nome *</Label>
        <Input
          id="nome"
          name="nome"
          defaultValue={v.nome}
          placeholder="Ex.: Cadeira Tiffany branca"
          required
          disabled={enviando}
        />
        <Erro mensagem={estado.erros?.nome} />
      </div>

      <fieldset className="flex flex-col gap-2" disabled={enviando}>
        <legend className="mb-2 text-sm font-medium">Tipo *</legend>
        <div className="flex flex-wrap gap-6 text-sm">
          <label className="flex items-center gap-2">
            <input type="radio" name="tipo" value="equipamento" defaultChecked={v.tipo === "equipamento"} />
            Equipamento <span className="text-muted-foreground">(sai e volta)</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="radio" name="tipo" value="consumo" defaultChecked={v.tipo === "consumo"} />
            Consumo <span className="text-muted-foreground">(é gasto no evento)</span>
          </label>
        </div>
        <Erro mensagem={estado.erros?.tipo} />
      </fieldset>

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor="categoriaId">Categoria *</Label>
          <select
            id="categoriaId"
            name="categoriaId"
            defaultValue={v.categoriaId}
            required
            disabled={enviando}
            className={CLASSE_SELECT}
          >
            <option value="">Escolha...</option>
            {categorias.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nome}
                {!c.ativo && " (inativa)"}
              </option>
            ))}
          </select>
          <Erro mensagem={estado.erros?.categoriaId} />
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="localId">Local de armazenagem</Label>
          <select
            id="localId"
            name="localId"
            defaultValue={v.localId}
            disabled={enviando}
            className={CLASSE_SELECT}
          >
            <option value="">Sem local definido</option>
            {locais.map((l) => (
              <option key={l.id} value={l.id}>
                {l.nome}
                {!l.ativo && " (inativo)"}
              </option>
            ))}
          </select>
          <Erro mensagem={estado.erros?.localId} />
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-3">
        <div className="flex flex-col gap-2">
          <Label htmlFor="unidadeMedida">Unidade *</Label>
          <Input
            id="unidadeMedida"
            name="unidadeMedida"
            list="unidades"
            defaultValue={v.unidadeMedida}
            required
            disabled={enviando}
          />
          <datalist id="unidades">
            {UNIDADES.map((u) => (
              <option key={u} value={u} />
            ))}
          </datalist>
          <Erro mensagem={estado.erros?.unidadeMedida} />
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="estoqueMinimo">Estoque mínimo</Label>
          <Input
            id="estoqueMinimo"
            name="estoqueMinimo"
            inputMode="numeric"
            defaultValue={v.estoqueMinimo}
            placeholder="0"
            disabled={enviando}
          />
          <Erro mensagem={estado.erros?.estoqueMinimo} />
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="valorReposicao">Valor de reposição (R$)</Label>
          <Input
            id="valorReposicao"
            name="valorReposicao"
            inputMode="decimal"
            defaultValue={v.valorReposicao}
            placeholder="0,00"
            disabled={enviando}
          />
          <Erro mensagem={estado.erros?.valorReposicao} />
        </div>
      </div>

      <p className="-mt-2 text-sm text-muted-foreground">
        Valor de reposição é o preço de <strong>uma unidade</strong>. Ele vira o
        valor sugerido quando o item volta avariado ou se perde.
      </p>

      <div className="flex flex-col gap-2">
        <Label htmlFor="descricao">Descrição</Label>
        <Textarea
          id="descricao"
          name="descricao"
          rows={3}
          defaultValue={v.descricao}
          placeholder="Cor, tamanho, marca, observações..."
          disabled={enviando}
        />
        <Erro mensagem={estado.erros?.descricao} />
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
        <Button variant="outline" nativeButton={false} render={<Link href="/itens" />}>
          Cancelar
        </Button>
      </div>
    </form>
  )
}
