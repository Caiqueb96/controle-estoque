import { createClient } from "@/lib/supabase/server"
import { apenasNumeros } from "@/lib/formato"

export type TipoPessoa = "usuario" | "freelancer"

export type Pessoa = {
  id: string
  nome: string
  telefone: string | null
  documento: string | null
  tipo: TipoPessoa
  observacoes: string | null
  ativo: boolean
}

export type Situacao = "ativos" | "inativos" | "todos"

const COLUNAS = "id, nome, telefone, documento, tipo, observacoes, ativo"

/**
 * Lista pessoas, com busca por nome/telefone/documento.
 *
 * A busca ignora a formatação: procurando por "11988887777" ou por
 * "(11) 98888-7777" o resultado é o mesmo, porque o banco guarda só números.
 */
export async function listarPessoas(
  busca: string = "",
  situacao: Situacao = "ativos"
): Promise<Pessoa[]> {
  const supabase = await createClient()

  let consulta = supabase.from("pessoa").select(COLUNAS).order("nome")

  if (situacao !== "todos") {
    consulta = consulta.eq("ativo", situacao === "ativos")
  }

  // Caracteres como vírgula e parênteses têm significado especial na
  // linguagem de filtro do Supabase, então saem fora antes da busca.
  const termo = busca.trim().replace(/[,()%*\\]/g, "")

  if (termo) {
    const numeros = apenasNumeros(termo)
    const filtros = [`nome.ilike.%${termo}%`]
    if (numeros) {
      filtros.push(`telefone.ilike.%${numeros}%`, `documento.ilike.%${numeros}%`)
    }
    consulta = consulta.or(filtros.join(","))
  }

  const { data, error } = await consulta

  if (error) throw new Error(`Não foi possível listar as pessoas: ${error.message}`)

  return (data ?? []) as Pessoa[]
}

/** Uma pessoa pelo id, ou null se não existir (ou se o RLS não deixar ver). */
export async function buscarPessoa(id: string): Promise<Pessoa | null> {
  const supabase = await createClient()

  const { data } = await supabase
    .from("pessoa")
    .select(COLUNAS)
    .eq("id", id)
    .maybeSingle()

  return (data as Pessoa | null) ?? null
}
