"use server"

import { redirect } from "next/navigation"
import { z } from "zod"
import { createClient } from "@/lib/supabase/server"

// O que a tela recebe de volta depois de tentar entrar.
export type EstadoLogin = { erro?: string }

const esquemaLogin = z.object({
  email: z.email("Informe um e-mail valido."),
  senha: z.string().min(1, "Informe a senha."),
})

/**
 * Server Action: roda no servidor quando o formulario de login e enviado.
 * A senha nunca passa pelo nosso codigo do navegador.
 */
export async function entrar(
  _estadoAnterior: EstadoLogin,
  formData: FormData
): Promise<EstadoLogin> {
  const campos = esquemaLogin.safeParse({
    email: formData.get("email"),
    senha: formData.get("senha"),
  })

  if (!campos.success) {
    return { erro: campos.error.issues[0].message }
  }

  const supabase = await createClient()

  const { data, error } = await supabase.auth.signInWithPassword({
    email: campos.data.email,
    password: campos.data.senha,
  })

  if (error || !data.user) {
    // Mensagem generica de proposito: nao revelamos se o e-mail existe.
    return { erro: "E-mail ou senha incorretos." }
  }

  // Ter login no Supabase nao basta: e preciso estar cadastrado e ativo
  // na nossa tabela `usuario`, com um perfil de acesso.
  const { data: cadastro } = await supabase
    .from("usuario")
    .select("ativo")
    .eq("id", data.user.id)
    .maybeSingle()

  const linha = cadastro as { ativo: boolean } | null

  if (!linha) {
    await supabase.auth.signOut()
    return { erro: "Seu acesso ainda nao foi liberado. Fale com o administrador." }
  }

  if (!linha.ativo) {
    await supabase.auth.signOut()
    return { erro: "Seu acesso esta desativado. Fale com o administrador." }
  }

  // redirect() precisa ficar fora de try/catch: ele funciona lancando um
  // erro especial que o Next.js intercepta para trocar de pagina.
  redirect("/painel")
}
