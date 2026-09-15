import type { Metadata } from "next"
import { exigirPerfil } from "@/lib/auth"
import { PessoaForm } from "../pessoa-form"

export const metadata: Metadata = {
  title: "Nova pessoa | Controle de Estoque",
}

export default async function NovaPessoaPage() {
  // Sem permissão, nem chega a ver o formulário.
  await exigirPerfil(["admin", "almoxarife", "produtor"])

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Nova pessoa</h1>
        <p className="text-muted-foreground">
          Cadastro de freelancer: pode ser responsável por itens, mas não tem
          login no sistema.
        </p>
      </div>

      <PessoaForm />
    </div>
  )
}
