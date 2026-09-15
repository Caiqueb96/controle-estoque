import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

// Cliente do Supabase para Server Components, Server Actions e Route Handlers.
// Crie um novo cliente a cada requisição; não reaproveite entre requisições.
export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Server Components não podem gravar cookies. Pode ser ignorado,
            // pois o proxy (src/proxy.ts) já renova a sessão a cada requisição.
          }
        },
      },
    }
  )
}
