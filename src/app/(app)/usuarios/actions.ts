"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { z } from "zod"
import { exigirPerfil } from "@/lib/auth"
import type { Perfil } from "@/lib/perfis"
import { createAdminClient } from "@/lib/supabase/admin"
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

const esquemaNovoUsuario = z.object({
  nome: z.string().trim().min(2, "Informe o nome completo."),
  email: z.string().trim().toLowerCase().pipe(z.email("E-mail inválido.")),
  senha: z.string().min(8, "A senha precisa ter pelo menos 8 caracteres."),
  perfil: z.enum(PERFIS, "Escolha uma função válida."),
})

/** Transforma os problemas do Zod em { campo: mensagem } para a tela. */
function errosPorCampo(problemas: z.core.$ZodIssue[]): Record<string, string> {
  const erros: Record<string, string> = {}
  for (const problema of problemas) {
    const campo = String(problema.path[0])
    erros[campo] ??= problema.message
  }
  return erros
}

/**
 * Cria um login novo direto pelo sistema.
 *
 * São três gravações, em três lugares:
 *  1. o login (e-mail e senha) no Supabase Auth — exige a Secret key;
 *  2. a `pessoa` (o cadastro humano);
 *  3. o `usuario` (a função e o acesso), com o MESMO id do login.
 *
 * Não dá para pôr as três numa transação só, porque o Auth fica fora do
 * nosso banco. Então, se um passo falha, desfazemos à mão os anteriores.
 * Sem isso sobraria um login "órfão": entra no Supabase, mas o sistema
 * não reconhece, e o e-mail fica preso sem poder ser cadastrado de novo.
 */
export async function criarUsuario(
  _estadoAnterior: EstadoFormulario,
  formData: FormData
): Promise<EstadoFormulario> {
  // Primeiro a permissão: o cliente admin abaixo ignora o RLS.
  await exigirPerfil(["admin"])

  const resultado = esquemaNovoUsuario.safeParse({
    nome: formData.get("nome") ?? "",
    email: formData.get("email") ?? "",
    senha: formData.get("senha") ?? "",
    perfil: formData.get("perfil") ?? "",
  })

  if (!resultado.success) return { erros: errosPorCampo(resultado.error.issues) }

  const { nome, email, senha, perfil } = resultado.data

  // Passo 1: o login.
  const admin = createAdminClient()
  const { data: criado, error: erroLogin } = await admin.auth.admin.createUser({
    email,
    password: senha,
    // Já nasce confirmado: não depende de a pessoa abrir um e-mail.
    email_confirm: true,
  })

  if (erroLogin || !criado.user) {
    if (erroLogin?.code === "email_exists") {
      return { erros: { email: "Já existe um login com este e-mail." } }
    }
    if (erroLogin?.code === "weak_password") {
      return { erros: { senha: "Senha fraca demais. Misture letras e números." } }
    }
    return { erro: `Não foi possível criar o login: ${erroLogin?.message ?? "erro desconhecido"}` }
  }

  const authId = criado.user.id

  // Passos 2 e 3 usam o cliente normal: o RLS confere de novo que é admin.
  const supabase = await createClient()

  const { data: pessoa, error: erroPessoa } = await supabase
    .from("pessoa")
    .insert({ nome, tipo: "usuario" })
    .select("id")
    .single()

  if (erroPessoa || !pessoa) {
    await admin.auth.admin.deleteUser(authId) // desfaz o passo 1
    return { erro: `Não foi possível salvar o nome: ${erroPessoa?.message}` }
  }

  const pessoaId = (pessoa as { id: string }).id

  const { error: erroUsuario } = await supabase
    .from("usuario")
    .insert({ id: authId, pessoa_id: pessoaId, email, perfil, ativo: true })

  if (erroUsuario) {
    await supabase.from("pessoa").delete().eq("id", pessoaId) // desfaz o passo 2
    await admin.auth.admin.deleteUser(authId) // desfaz o passo 1
    return { erro: `Não foi possível salvar a função: ${erroUsuario.message}` }
  }

  revalidatePath("/usuarios")
  revalidatePath("/pessoas")
  redirect("/usuarios")
}

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

  if (!resultado.success) return { erros: errosPorCampo(resultado.error.issues) }

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
