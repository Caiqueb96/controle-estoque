import { cache } from "react"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"

// Perfis de acesso do sistema (PRD secao 5.5).
export type Perfil = "admin" | "almoxarife" | "produtor" | "campo"

export type UsuarioLogado = {
  id: string
  email: string
  nome: string
  perfil: Perfil
}

// Formato da linha que vem do banco na consulta abaixo.
type LinhaUsuario = {
  id: string
  email: string
  perfil: Perfil
  ativo: boolean
  pessoa: { nome: string } | null
}

/**
 * Quem esta logado agora, ou null.
 *
 * Duas checagens acontecem aqui:
 *  1. O Supabase confirma que o cookie de sessao e valido (auth.getUser).
 *  2. Buscamos a linha em `usuario` para saber o perfil. Se a pessoa tem
 *     login mas nao esta cadastrada aqui (ou foi desativada), ela nao entra.
 *
 * `cache` faz a consulta rodar uma vez so por requisicao, mesmo que varias
 * telas chamem esta funcao.
 */
export const usuarioAtual = cache(async (): Promise<UsuarioLogado | null> => {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const { data } = await supabase
    .from("usuario")
    .select("id, email, perfil, ativo, pessoa (nome)")
    .eq("id", user.id)
    .maybeSingle()

  const linha = data as LinhaUsuario | null

  if (!linha || !linha.ativo) return null

  return {
    id: linha.id,
    email: linha.email,
    nome: linha.pessoa?.nome ?? linha.email,
    perfil: linha.perfil,
  }
})

/**
 * Igual a `usuarioAtual`, mas manda para o login quem nao tem acesso.
 * Use em toda pagina ou Server Action que exige estar logado.
 */
export async function exigirUsuario(): Promise<UsuarioLogado> {
  const usuario = await usuarioAtual()
  if (!usuario) redirect("/login")
  return usuario
}

/**
 * Exige estar logado E ter um dos perfis informados.
 * Ex.: await exigirPerfil(["admin", "almoxarife"])
 */
export async function exigirPerfil(perfis: Perfil[]): Promise<UsuarioLogado> {
  const usuario = await exigirUsuario()
  if (!perfis.includes(usuario.perfil)) redirect("/painel?erro=sem-permissao")
  return usuario
}

// Nome legivel do perfil, para mostrar na tela.
export const NOME_DO_PERFIL: Record<Perfil, string> = {
  admin: "Administrador",
  almoxarife: "Almoxarife",
  produtor: "Produtor de eventos",
  campo: "Equipe de campo",
}
