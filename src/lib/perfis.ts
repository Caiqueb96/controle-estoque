/**
 * Perfis de acesso (PRD §5.5).
 *
 * Este arquivo é de propósito "burro": só tipos e textos, sem nenhuma
 * conexão com banco ou com o servidor. Assim ele pode ser usado tanto
 * pelas telas do servidor quanto pelas que rodam no navegador.
 *
 * Se estas constantes ficassem em `src/lib/auth.ts`, qualquer formulário
 * que as importasse arrastaria junto o cliente do Supabase de servidor
 * para dentro do navegador — e o build quebra.
 */

export type Perfil = "admin" | "almoxarife" | "produtor" | "campo"

export const NOME_DO_PERFIL: Record<Perfil, string> = {
  admin: "Administrador",
  almoxarife: "Almoxarife",
  produtor: "Produtor de eventos",
  campo: "Equipe de campo",
}

export const PERFIS = Object.keys(NOME_DO_PERFIL) as Perfil[]
