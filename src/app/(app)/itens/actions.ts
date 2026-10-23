"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { z } from "zod"
import { exigirPerfil } from "@/lib/auth"
import { lerMoeda } from "@/lib/formato"
import { createClient } from "@/lib/supabase/server"

// Quem pode cadastrar e editar itens (PRD §5.5).
const PERFIS_QUE_PODEM = ["admin", "almoxarife"] as const

const CAMPOS = [
  "nome",
  "descricao",
  "tipo",
  "categoriaId",
  "localId",
  "unidadeMedida",
  "estoqueMinimo",
  "valorReposicao",
] as const

export type ValoresItem = Record<(typeof CAMPOS)[number], string>

export type EstadoFormulario = {
  erro?: string
  erros?: Record<string, string>
  /** O que foi digitado, para não sumir da tela quando dá erro. */
  valores?: ValoresItem
}

const esquemaItem = z.object({
  nome: z.string().trim().min(2, "Informe um nome com pelo menos 2 letras.").max(80, "Nome longo demais."),
  descricao: z.string().trim().max(500, "Descrição longa demais."),
  tipo: z.enum(["equipamento", "consumo"], "Escolha o tipo."),
  categoriaId: z.uuid("Escolha a categoria."),
  // "" = sem local definido.
  localId: z.union([z.literal(""), z.uuid("Local inválido.")]),
  unidadeMedida: z.string().trim().min(1, "Informe a unidade (ex.: un).").max(20, "Unidade longa demais."),
  estoqueMinimo: z
    .string()
    .trim()
    .regex(/^\d*$/, "Use só números inteiros, sem vírgula.")
    .transform((v) => (v === "" ? 0 : Number(v))),
  valorReposicao: z
    .string()
    .trim()
    .transform((v) => (v === "" ? 0 : lerMoeda(v)))
    .refine((v) => !Number.isNaN(v), "Valor inválido. Exemplo: 1.250,00"),
})

/**
 * Cria ou atualiza um item.
 *
 * Repare que não existe campo de quantidade: o item nasce com 0 e a
 * quantidade só muda por movimentação (entrada, ajuste, baixa). O banco
 * também garante isso (ver supabase/sql/005).
 */
export async function salvarItem(
  _estadoAnterior: EstadoFormulario,
  formData: FormData
): Promise<EstadoFormulario> {
  await exigirPerfil([...PERFIS_QUE_PODEM])

  const id = (formData.get("id") as string | null)?.trim() || null
  const valores = Object.fromEntries(
    CAMPOS.map((campo) => [campo, String(formData.get(campo) ?? "")])
  ) as ValoresItem

  const resultado = esquemaItem.safeParse(valores)

  if (!resultado.success) {
    const erros: Record<string, string> = {}
    for (const problema of resultado.error.issues) {
      erros[String(problema.path[0])] ??= problema.message
    }
    return { erros, valores }
  }

  const d = resultado.data
  const dados = {
    nome: d.nome,
    descricao: d.descricao === "" ? null : d.descricao,
    tipo: d.tipo,
    categoria_id: d.categoriaId,
    local_id: d.localId === "" ? null : d.localId,
    unidade_medida: d.unidadeMedida,
    estoque_minimo: d.estoqueMinimo,
    valor_reposicao: d.valorReposicao,
  }

  const supabase = await createClient()

  const { error } = id
    ? await supabase.from("item").update(dados).eq("id", id)
    : await supabase.from("item").insert(dados)

  if (error) {
    // 23505 = nome repetido (índice único do supabase/sql/005).
    if (error.code === "23505") {
      return { erros: { nome: "Já existe um item com este nome." }, valores }
    }
    return { erro: `Não foi possível salvar: ${error.message}`, valores }
  }

  revalidatePath("/itens")
  redirect("/itens")
}

/**
 * Ativa ou desativa. Itens nunca são apagados: reservas e movimentações
 * antigas continuam apontando para eles.
 */
export async function alternarAtivoItem(id: string, novoValor: boolean) {
  await exigirPerfil([...PERFIS_QUE_PODEM])

  const supabase = await createClient()
  const { error } = await supabase.from("item").update({ ativo: novoValor }).eq("id", id)

  if (error) throw new Error(`Não foi possível alterar a situação: ${error.message}`)

  revalidatePath("/itens")
  revalidatePath(`/itens/${id}`)
}
