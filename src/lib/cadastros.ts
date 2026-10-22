import { createClient } from "@/lib/supabase/server"

/**
 * Cadastros simples do estoque: categorias e locais (PRD RF11, RF12).
 *
 * As duas tabelas têm o mesmo formato (nome, descrição, ativo), então um
 * só conjunto de funções e uma só tela atendem as duas.
 */
export type TabelaCadastro = "categoria" | "local"

export const TABELAS_CADASTRO: TabelaCadastro[] = ["categoria", "local"]

export type ItemCadastro = {
  id: string
  nome: string
  descricao: string | null
  ativo: boolean
}

/** Todos os registros da tabela, ativos primeiro e depois por nome. */
export async function listarCadastro(tabela: TabelaCadastro): Promise<ItemCadastro[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from(tabela)
    .select("id, nome, descricao, ativo")
    .order("ativo", { ascending: false })
    .order("nome")

  if (error) throw new Error(`Não foi possível listar (${tabela}): ${error.message}`)

  return (data ?? []) as ItemCadastro[]
}
