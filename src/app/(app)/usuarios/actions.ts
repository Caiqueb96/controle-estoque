"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { z } from "zod"
import { exigirPerfil } from "@/lib/auth"
import type { Perfil } from "@/lib/perfis"
import { createClient } from "@/lib/supabase/server"

export type EstadoFormulario = {
  erro?: string
  erros?: Record<string, string>
}

const PERFIS: [Perfil, ...Perfil[]] = ["admin", "almoxarife", "produtor", "campo"]

const esquemaUsuario = z.object({
  id: z.uuid("Usuário inválido."),
  nome: z.string().trim().min(2, "Informe o nome completo."),
  perfil: z.enum(PERFIS, "Escolha uma função válida."),
})

/**
 * Altera o nome e a função de quem já tem login.
 *
 * O nome fica na tabela `pessoa` e a função na tabela `usuario`, então são
 * duas atualizações. O e-mail e a senha não são mexidos aqui: eles pertencem
 * ao Supabase Auth.
 */
export async function salvarUsuario(
  _estadoAnterior: EstadoFormulario,
  formData: FormData
): Promise<EstadoFormulario> {
  // Só administrador mexe em usuários (PRD §5.5, "Gerenciar usuários").
  const admin = await exigirPerfil(["admin"])

  const resultado = esquemaUsuario.safeParse({
    id: formData.get("id") ?? "",
    nome: formData.get("nome") ?? "",
    perfil: formData.get("perfil") ?? "",
  })

  if (!resultado.success) {
    const erros: Record<string, string> = {}
    for (const problema of resultado.error.issues) {
      const campo = String(problema.path[0])
      erros[campo] ??= problema.message
    }
    return { erros }
  }

  const { id, nome, perfil } = resultado.data

  // Trava de segurança: sem isso, o único administrador poderia se rebaixar
  // e ninguém mais conseguiria gerenciar usuários.
  if (id === admin.id && perfil !== "admin") {
    return { erros: { perfil: "Você não pode tirar a sua própria função de administrador." } }
  }

  const supabase = await createClient()

  // Buscamos o pessoa_id no banco em vez de aceitar o que veio da tela.
  const { data: atual } = await supabase
    .from("usuario")
    .select("pessoa_id")
    .eq("id", id)
    .maybeSingle()

  const linha = atual as { pessoa_id: string } | null

  if (!linha) return { erro: "Usuário não encontrado." }

  const { error: erroPessoa } = await supabase
    .from("pessoa")
    .update({ nome })
    .eq("id", linha.pessoa_id)

  if (erroPessoa) return { erro: `Não foi possível salvar o nome: ${erroPessoa.message}` }

  const { error: erroUsuario } = await supabase
    .from("usuario")
    .update({ perfil })
    .eq("id", id)

  if (erroUsuario) return { erro: `Não foi possível salvar a função: ${erroUsuario.message}` }

  revalidatePath("/usuarios")
  revalidatePath("/pessoas")
  redirect("/usuarios")
}

/**
 * Libera ou bloqueia o acesso de alguém.
 *
 * Desativado, o login até existe no Supabase, mas o sistema barra a entrada
 * (ver `usuarioAtual` em src/lib/auth.ts) e o banco deixa de enxergar a
 * pessoa como usuário ativo nas regras de RLS.
 */
export async function alternarAtivoUsuario(id: string, novoValor: boolean) {
  const admin = await exigirPerfil(["admin"])

  if (id === admin.id && !novoValor) {
    throw new Error("Você não pode desativar o seu próprio acesso.")
  }

  const supabase = await createClient()
  const { error } = await supabase.from("usuario").update({ ativo: novoValor }).eq("id", id)

  if (error) throw new Error(`Não foi possível alterar o acesso: ${error.message}`)

  revalidatePath("/usuarios")
  revalidatePath(`/usuarios/${id}`)
}
