import type { Metadata } from "next"
import { exigirPerfil } from "@/lib/auth"
import { listarCadastro } from "@/lib/cadastros"
import { ItemForm } from "../item-form"

export const metadata: Metadata = {
  title: "Novo item | Controle de Estoque",
}

export default async function NovoItemPage() {
  await exigirPerfil(["admin", "almoxarife"])

  const [categorias, locais] = await Promise.all([
    listarCadastro("categoria"),
    listarCadastro("local"),
  ])

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Novo item</h1>
        <p className="text-muted-foreground">
          O item começa com quantidade 0. Depois de salvar, registre uma
          entrada para dizer quantos existem no estoque.
        </p>
      </div>

      {/* Categorias e locais desativados não aparecem para itens novos. */}
      <ItemForm
        categorias={categorias.filter((c) => c.ativo)}
        locais={locais.filter((l) => l.ativo)}
      />
    </div>
  )
}
