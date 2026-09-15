import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

// Rotas que podem ser abertas sem estar logado.
const ROTAS_PUBLICAS = ["/login", "/auth"]

// Renova a sessão do usuário (cookies de login) antes de cada requisição
// e barra quem não está logado antes mesmo da página carregar.
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet, headers) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
          Object.entries(headers).forEach(([key, value]) =>
            response.headers.set(key, value)
          )
        },
      },
    }
  )

  // Não coloque código entre createServerClient e getClaims: isso pode
  // causar logouts aleatórios difíceis de depurar.
  const { data } = await supabase.auth.getClaims()

  // Checagem rápida, só olhando o cookie: serve para evitar carregar a
  // página à toa. A checagem de verdade (perfil, conta ativa) é feita em
  // cada página pelo `exigirUsuario()` de src/lib/auth.ts.
  const caminho = request.nextUrl.pathname
  const ehRotaPublica = ROTAS_PUBLICAS.some((rota) => caminho.startsWith(rota))

  if (!data?.claims && !ehRotaPublica) {
    const url = request.nextUrl.clone()
    url.pathname = "/login"
    return NextResponse.redirect(url)
  }

  return response
}
