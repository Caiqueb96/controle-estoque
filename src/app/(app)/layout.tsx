import type { ReactNode } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { exigirUsuario } from "@/lib/auth"
import { NOME_DO_PERFIL, type Perfil } from "@/lib/perfis"
import { sair } from "./actions"

// Menu do topo. Vai crescendo conforme as telas ficam prontas.
// `perfis` ausente = todo mundo ve o item.
const MENU: { href: string; rotulo: string; perfis?: Perfil[] }[] = [
  { href: "/painel", rotulo: "Painel" },
  { href: "/pessoas", rotulo: "Pessoas" },
  { href: "/usuarios", rotulo: "Usuários", perfis: ["admin"] },
]

/**
 * Layout da area logada.
 *
 * A pasta `(app)` entre parenteses e um "grupo de rotas": ela organiza os
 * arquivos sem aparecer no endereco. Ou seja, `(app)/painel/page.tsx`
 * responde em /painel, e toda pagina dentro do grupo herda esta protecao.
 */
export default async function AppLayout({ children }: { children: ReactNode }) {
  const usuario = await exigirUsuario()

  return (
    <div className="flex min-h-svh flex-col">
      <header className="border-b bg-background">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-6 py-3">
          <div className="flex items-center gap-6">
            <Link href="/painel" className="font-semibold">
              Controle de Estoque
            </Link>
            <nav className="flex items-center gap-4 text-sm">
              {MENU.filter(
                (item) => !item.perfis || item.perfis.includes(usuario.perfil)
              ).map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="text-muted-foreground hover:text-foreground"
                >
                  {item.rotulo}
                </Link>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right text-sm leading-tight">
              <div className="font-medium">{usuario.nome}</div>
              <div className="text-muted-foreground">
                {NOME_DO_PERFIL[usuario.perfil]}
              </div>
            </div>
            <form action={sair}>
              <Button type="submit" variant="outline" size="sm">
                Sair
              </Button>
            </form>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-8">{children}</main>
    </div>
  )
}
