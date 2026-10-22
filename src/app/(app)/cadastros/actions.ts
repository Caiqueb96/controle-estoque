"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
import { exigirPerfil } from "@/lib/auth"
import { TABELAS_CADASTRO, type TabelaCadastro } from "@/lib/cadastros"
import { createClient } from "@/lib/supabase/server"

// Quem pode mexer em categorias e locais (PRD §5.5, "Cadastrar/editar itens").
const PERFIS_QUE_PODEM = ["admin", "almoxarife"] as const

export type EstadoFormulario = {
  erro?: string
  erros?: Record<string, string>
  /** O que foi digitado, para não sumir da tela quando dá erro. */
  valores?: { nome: string; descricao: string }
  salvo?: boolean
}

const esquemaCadastro = z.object({
  // O nome da tabela vem do formulário, então também é conferido: só as
  // duas tabelas permitidas passam. Sem isso, alguém poderia mandar outro
  // nome de tabela e tentar gravar onde não devia (o RLS barraria, mas é
  // melhor nem chegar lá).
  tabela: z.enum(["categoria", "local"]),
  nome: z.string().trim().min(2, "Informe um nome com pelo menos 2 letras.").max(60, "Nome longo demais."),
  descricao: z.string().trim().max(200, "Descrição longa demais."),
})

/**
 * Cria ou renomeia uma categoria ou um local.
 * Com `id` no formulário é edição; sem `id`, é cadastro novo.
 */
export async function salvarCadastro(
  _estadoAnterior: EstadoFormulario,
  formData: FormData
): Promise<EstadoFormulario> {
  await exigirPerfil([...PERFIS_QUE_PODEM])

  const id = (formData.get("id") as string | null)?.trim() || null
  const valores = {
    nome: String(formData.get("nome") ?? ""),
    descricao: String(formData.get("descricao") ?? ""),
  }

  const resultado = esquemaCadastro.safeParse({ ...valores, tabela: formData.get("tabela") })

  if (!resultado.success) {
    const erros: Record<string, string> = {}
    for (const problema of resultado.error.issues) {
      erros[String(problema.path[0])] ??= problema.message
    }
    return { erros, valores }
  }

  const { tabela, nome, descricao } = resultado.data
  const dados = { nome, descricao: descricao === "" ? null : descricao }

  const supabase = await createClient()

  const { error } = id
    ? await supabase.from(tabela).update(dados).eq("id", id)
    : await supabase.from(tabela).insert(dados)

  if (error) {
    // 23505 = nome repetido (índice único do supabase/sql/004).
    if (error.code === "23505") {
      return { erros: { nome: "Já existe um cadastro com este nome." }, valores }
    }
    return { erro: `Não foi possível salvar: ${error.message}`, valores }
  }

  revalidatePath("/cadastros")
  return { salvo: true }
}

/**
 * Ativa ou desativa. Não existe "apagar": itens antigos continuam
 * apontando para a categoria ou o local, mesmo depois de desativados.
 */
export async function alternarAtivoCadastro(tabela: TabelaCadastro, id: string, novoValor: boolean) {
  await exigirPerfil([...PERFIS_QUE_PODEM])

  if (!TABELAS_CADASTRO.includes(tabela)) throw new Error("Cadastro inválido.")

  const supabase = await createClient()
  const { error } = await supabase.from(tabela).update({ ativo: novoValor }).eq("id", id)

  if (error) throw new Error(`Não foi possível alterar a situação: ${error.message}`)

  revalidatePath("/cadastros")
}
