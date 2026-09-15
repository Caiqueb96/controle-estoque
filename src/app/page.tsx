import { redirect } from "next/navigation"
import { usuarioAtual } from "@/lib/auth"

// A raiz do site nao tem conteudo proprio: manda para o painel ou para o login.
export default async function Home() {
  redirect((await usuarioAtual()) ? "/painel" : "/login")
}
