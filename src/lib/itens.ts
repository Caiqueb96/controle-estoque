import { createClient } from "@/lib/supabase/server"

/**
 * Itens do estoque (PRD RF10, RF14, RF15).
 *
 * A quantidade (`qtdTotal`) só é lida aqui, nunca gravada pelo cadastro:
 * ela muda apenas por movimentação (ver supabase/sql/005).
 */
export type TipoItem = "equipamento" | "consumo"

export const NOME_DO_TIPO: Record<TipoItem, string> = {
  equipamento: "Equipamento",
  consumo: "Consumo",
}

export type Item = {
  id: string
  nome: string
  descricao: string | null
  tipo: TipoItem
  categoriaId: string
  categoriaNome: string
  localId: string | null
  localNome: string | null
  unidadeMedida: string
  qtdTotal: number
  qtdManutencao: number
  estoqueMinimo: number
  valorReposicao: number
  ativo: boolean
}

export type SituacaoItem = "ativos" | "inativos" | "todos" | "abaixo"

export type FiltrosItens = {
  busca?: string
  categoriaId?: string
  localId?: string
  tipo?: TipoItem
  situacao?: SituacaoItem
}

// Sem os tipos gerados do banco, o Supabase acha que `categoria` e `local`
// podem vir como lista (ver nota em src/lib/usuarios.ts).
type Nome = { nome: string }
type LinhaItem = {
  id: string
  nome: string
  descricao: string | null
  tipo: TipoItem
  categoria_id: string
  local_id: string | null
  unidade_medida: string
  qtd_total: number
  qtd_manutencao: number
  estoque_minimo: number
  valor_reposicao: number | string
  ativo: boolean
  categoria: Nome | Nome[] | null
  local: Nome | Nome[] | null
}

const COLUNAS =
  "id, nome, descricao, tipo, categoria_id, local_id, unidade_medida, qtd_total, " +
  "qtd_manutencao, estoque_minimo, valor_reposicao, ativo, categoria (nome), local (nome)"

function umSo<T>(valor: T | T[] | null): T | null {
  return Array.isArray(valor) ? (valor[0] ?? null) : valor
}

function converter(linha: LinhaItem): Item {
  return {
    id: linha.id,
    nome: linha.nome,
    descricao: linha.descricao,
    tipo: linha.tipo,
    categoriaId: linha.categoria_id,
    categoriaNome: umSo(linha.categoria)?.nome ?? "—",
    localId: linha.local_id,
    localNome: umSo(linha.local)?.nome ?? null,
    unidadeMedida: linha.unidade_medida,
    qtdTotal: linha.qtd_total,
    qtdManutencao: linha.qtd_manutencao,
    estoqueMinimo: linha.estoque_minimo,
    // Colunas `numeric` chegam como texto para não perder centavos.
    valorReposicao: Number(linha.valor_reposicao),
    ativo: linha.ativo,
  }
}

/** Abaixo do mínimo: só conta se o mínimo foi definido (maior que zero). */
export function abaixoDoMinimo(item: Item): boolean {
  return item.estoqueMinimo > 0 && item.qtdTotal < item.estoqueMinimo
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/** Confere se um texto tem formato de id, antes de mandá-lo ao banco. */
export function pareceId(valor: string | undefined): valor is string {
  return !!valor && UUID.test(valor)
}

/** Lista itens com busca e filtros (RF14). */
export async function listarItens(filtros: FiltrosItens = {}): Promise<Item[]> {
  const { busca = "", categoriaId, localId, tipo, situacao = "ativos" } = filtros
  const supabase = await createClient()

  let consulta = supabase.from("item").select(COLUNAS).order("nome")

  if (situacao === "ativos" || situacao === "abaixo") consulta = consulta.eq("ativo", true)
  if (situacao === "inativos") consulta = consulta.eq("ativo", false)
  if (pareceId(categoriaId)) consulta = consulta.eq("categoria_id", categoriaId)
  if (pareceId(localId)) consulta = consulta.eq("local_id", localId)
  if (tipo) consulta = consulta.eq("tipo", tipo)

  // Mesmo cuidado da busca de pessoas: tira os caracteres especiais do filtro.
  const termo = busca.trim().replace(/[,()%*\\]/g, "")
  if (termo) consulta = consulta.or(`nome.ilike.%${termo}%,descricao.ilike.%${termo}%`)

  const { data, error } = await consulta

  if (error) throw new Error(`Não foi possível listar os itens: ${error.message}`)

  const itens = ((data ?? []) as unknown as LinhaItem[]).map(converter)

  // Comparar duas colunas (quantidade × mínimo) não dá no filtro do
  // Supabase; com ~50 itens (PRD D8), filtrar aqui é de graça.
  return situacao === "abaixo" ? itens.filter(abaixoDoMinimo) : itens
}

/** Um item pelo id, ou null se não existir. */
export async function buscarItem(id: string): Promise<Item | null> {
  if (!pareceId(id)) return null

  const supabase = await createClient()
  const { data } = await supabase.from("item").select(COLUNAS).eq("id", id).maybeSingle()

  return data ? converter(data as unknown as LinhaItem) : null
}
