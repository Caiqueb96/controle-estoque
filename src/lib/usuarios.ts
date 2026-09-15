import type { Perfil } from "@/lib/perfis"
import { createClient } from "@/lib/supabase/server"

export type Usuario = {
  id: string
  email: string
  perfil: Perfil
  ativo: boolean
  pessoaId: string
  nome: string
  telefone: string | null
}

type DadosPessoa = { nome: string; telefone: string | null }

// A linha crua que volta do banco, antes de achatarmos os dados de pessoa.
//
// `pessoa` vem como objeto (é uma pessoa só por usuário), mas sem os tipos
// gerados do banco o Supabase não tem como saber disso e assume que pode ser
// uma lista. Por isso aceitamos os dois formatos aqui.
type LinhaUsuario = {
  id: string
  email: string
  perfil: Perfil
  ativo: boolean
  pessoa_id: string
  pessoa: DadosPessoa | DadosPessoa[] | null
}

const COLUNAS = "id, email, perfil, ativo, pessoa_id, pessoa (nome, telefone)"

/**
 * Junta as duas metades de um usuário numa coisa só:
 * o acesso (tabela `usuario`) e o cadastro humano (tabela `pessoa`).
 */
function achatar(linha: LinhaUsuario): Usuario {
  const pessoa = Array.isArray(linha.pessoa) ? linha.pessoa[0] : linha.pessoa

  return {
    id: linha.id,
    email: linha.email,
    perfil: linha.perfil,
    ativo: linha.ativo,
    pessoaId: linha.pessoa_id,
    nome: pessoa?.nome ?? linha.email,
    telefone: pessoa?.telefone ?? null,
  }
}

export async function listarUsuarios(): Promise<Usuario[]> {
  const supabase = await createClient()

  const { data, error } = await supabase.from("usuario").select(COLUNAS)

  if (error) throw new Error(`Não foi possível listar os usuários: ${error.message}`)

  // O nome mora na tabela `pessoa`, então a ordenação é feita aqui.
  // Com ~10 usuários (PRD D8) isso é de graça.
  return ((data ?? []) as LinhaUsuario[])
    .map(achatar)
    .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"))
}

export async function buscarUsuario(id: string): Promise<Usuario | null> {
  const supabase = await createClient()

  const { data } = await supabase.from("usuario").select(COLUNAS).eq("id", id).maybeSingle()

  return data ? achatar(data as LinhaUsuario) : null
}
