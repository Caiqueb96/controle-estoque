import "server-only"
import { createClient } from "@supabase/supabase-js"

/**
 * Cliente do Supabase com a Secret key: um "chaveiro mestre".
 *
 * Ele IGNORA todas as regras de RLS e consegue criar e apagar logins
 * (auth.admin). Por isso:
 *  - só pode ser usado DEPOIS de `exigirPerfil(["admin"])`;
 *  - nunca pode chegar ao navegador. O `import "server-only"` acima faz o
 *    build quebrar se algum arquivo "use client" tentar importá-lo.
 *
 * A chave mora em SUPABASE_SECRET_KEY, sem o prefixo NEXT_PUBLIC_: variáveis
 * com esse prefixo são copiadas para o código que vai ao navegador.
 */
export function createAdminClient() {
  const chave = process.env.SUPABASE_SECRET_KEY

  if (!chave) {
    throw new Error(
      "Falta a variável SUPABASE_SECRET_KEY (.env.local no computador, Environment Variables na Vercel)."
    )
  }

  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, chave, {
    // Este cliente não representa ninguém logado: não guarda nem renova sessão.
    auth: { autoRefreshToken: false, persistSession: false },
  })
}
