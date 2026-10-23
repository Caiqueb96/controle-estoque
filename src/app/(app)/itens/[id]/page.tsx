import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { exigirPerfil } from "@/lib/auth"
import { listarCadastro } from "@/lib/cadastros"
import { buscarItem, NOME_DO_TIPO } from "@/lib/itens"
import { alternarAtivoItem } from "../actions"
import { ItemForm } from "../item-form"

export const metadata: Metadata = {
  title: "Editar item | Controle de Estoque",
}

export default async function EditarItemPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  await exigirPerfil(["admin", "almoxarife"])

  const { id } = await params
  const [item, categorias, locais] = await Promise.all([
    buscarItem(id),
    listarCadastro("categoria"),
    listarCadastro("local"),
  ])

  if (!item) notFound()

  const alternar = alternarAtivoItem.bind(null, item.id, !item.ativo)

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">{item.nome}</h1>
          <p className="flex items-center gap-2 text-muted-foreground">
            {NOME_DO_TIPO[item.tipo]} · {item.categoriaNome} · Em estoque:{" "}
            {item.qtdTotal} {item.unidadeMedida}
            {!item.ativo && <Badge variant="destructive">Inativo</Badge>}
          </p>
        </div>

        <form action={alternar}>
          <Button type="submit" variant={item.ativo ? "outline" : "default"}>
            {item.ativo ? "Desativar" : "Reativar"}
          </Button>
        </form>
      </div>

      {/* Desativados ficam de fora, menos o que o item já usa: senão o
          campo apareceria vazio e salvar trocaria a categoria sem querer. */}
      <ItemForm
        item={item}
        categorias={categorias.filter((c) => c.ativo || c.id === item.categoriaId)}
        locais={locais.filter((l) => l.ativo || l.id === item.localId)}
      />

      <p className="text-sm text-muted-foreground">
        A quantidade não se edita aqui: ela muda só por movimentação (entrada,
        ajuste ou baixa), para ficar registrado quem mudou e quando. Itens
        nunca são apagados, só desativados.
      </p>
    </div>
  )
}
