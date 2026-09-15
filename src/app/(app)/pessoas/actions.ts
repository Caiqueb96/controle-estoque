"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { z } from "zod"
import { exigirPerfil } from "@/lib/auth"
import { apenasNumeros, cpfValido } from "@/lib/formato"
import { createClient } from "@/lib/supabase/server"

// Quem pode mexer no cadastro de pessoas (PRD §5.5, "Cadastrar freelancer").
const PERFIS_QUE_PODEM = ["admin", "almoxarife", "produtor"] as const

export type EstadoFormulario = {
  erro?: string
  erros?: Record<string, string>
}

const esquemaPessoa = z.object({
  nome: z.string().trim().min(2, "Informe o nome completo."),

  // Guardamos só os números; "" quer dizer "não preenchido".
  telefone: z
    .string()
    .trim()
    .transform(apenasNumeros)
    .refine(
      (v) => v === "" || v.length === 10 || v.length === 11,
      "Telefone deve ter DDD + 8 ou 9 dígitos."
    ),

  documento: z
    .string()
    .trim()
    .transform(apenasNumeros)
    .refine((v) => v === "" || cpfValido(v), "CPF inválido."),

  observacoes: z.string().trim(),
})

/** Texto vazio vira NULL no banco, para não confundir com "preenchido em branco". */
function ouNulo(valor: string): string | null {
  return valor === "" ? null : valor
}

/**
 * Cria ou atualiza uma pessoa.
 *
 * Se vier um `id` no formulário, é edição; se não, é cadastro novo.
 * Toda pessoa criada por aqui é `freelancer`: pessoas do tipo `usuario`
 * nascem junto com o login, na tela de Usuários.
 */
export async function salvarPessoa(
  _estadoAnterior: EstadoFormulario,
  formData: FormData
): Promise<EstadoFormulario> {
  // Permissão conferida no servidor, antes de qualquer escrita.
  await exigirPerfil([...PERFIS_QUE_PODEM])

  const id = (formData.get("id") as string | null)?.trim() || null

  const resultado = esquemaPessoa.safeParse({
    nome: formData.get("nome") ?? "",
    telefone: formData.get("telefone") ?? "",
    documento: formData.get("documento") ?? "",
    observacoes: formData.get("observacoes") ?? "",
  })

  if (!resultado.success) {
    const erros: Record<string, string> = {}
    for (const problema of resultado.error.issues) {
      const campo = String(problema.path[0])
      erros[campo] ??= problema.message
    }
    return { erros }
  }

  const dados = {
    nome: resultado.data.nome,
    telefone: ouNulo(resultado.data.telefone),
    documento: ouNulo(resultado.data.documento),
    observacoes: ouNulo(resultado.data.observacoes),
  }

  const supabase = await createClient()

  const { error } = id
    ? await supabase.from("pessoa").update(dados).eq("id", id)
    : await supabase.from("pessoa").insert({ ...dados, tipo: "freelancer" })

  if (error) {
    // 23505 = violação de índice único (ver supabase/sql/003).
    if (error.code === "23505") {
      return { erros: { documento: "Já existe uma pessoa cadastrada com este CPF." } }
    }
    return { erro: `Não foi possível salvar: ${error.message}` }
  }

  // Limpa o cache da listagem para a pessoa nova aparecer na hora.
  revalidatePath("/pessoas")
  redirect("/pessoas")
}

/**
 * Ativa ou desativa uma pessoa.
 *
 * Nunca apagamos: o histórico de ocorrências precisa continuar apontando
 * para ela (RF83). Desativada, ela só some das listas de seleção.
 */
export async function alternarAtivo(id: string, novoValor: boolean) {
  await exigirPerfil([...PERFIS_QUE_PODEM])

  const supabase = await createClient()
  const { error } = await supabase.from("pessoa").update({ ativo: novoValor }).eq("id", id)

  if (error) throw new Error(`Não foi possível alterar a situação: ${error.message}`)

  revalidatePath("/pessoas")
  revalidatePath(`/pessoas/${id}`)
}
