import type { Metadata } from "next"
import { exigirPerfil } from "@/lib/auth"
import { NovoUsuarioForm } from "../novo-usuario-form"

export const metadata: Metadata = {
  title: "Novo usuário | Controle de Estoque",
}

export default async function NovoUsuarioPage() {
  await exigirPerfil(["admin"])

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Novo usuário</h1>
        <p className="text-muted-foreground">
          Cria o login e o cadastro da pessoa de uma vez. Telefone e CPF podem
          ser completados depois, na tela de Pessoas.
        </p>
      </div>

      <NovoUsuarioForm />
    </div>
  )
}
