import type { Metadata } from "next"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { exigirUsuario } from "@/lib/auth"
import { listarCadastro } from "@/lib/cadastros"
import { SecaoCadastro } from "./secao-cadastro"

export const metadata: Metadata = {
  title: "Categorias e locais | Controle de Estoque",
}

// Quem pode criar e editar (PRD §5.5). Os demais só consultam.
const PERFIS_QUE_PODEM = ["admin", "almoxarife"]

export default async function CadastrosPage() {
  const usuario = await exigirUsuario()
  const podeEditar = PERFIS_QUE_PODEM.includes(usuario.perfil)

  // As duas consultas saem juntas, em vez de uma esperar a outra.
  const [categorias, locais] = await Promise.all([
    listarCadastro("categoria"),
    listarCadastro("local"),
  ])

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Categorias e locais</h1>
        <p className="text-muted-foreground">
          Usados para organizar e encontrar os itens do estoque.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Categorias</CardTitle>
          <CardDescription>O tipo de item: Som, Luz, Mobiliário...</CardDescription>
        </CardHeader>
        <CardContent>
          <SecaoCadastro tabela="categoria" itens={categorias} podeEditar={podeEditar} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Locais de armazenagem</CardTitle>
          <CardDescription>Onde o item fica no depósito: prateleira A3, área de mobiliário...</CardDescription>
        </CardHeader>
        <CardContent>
          <SecaoCadastro tabela="local" itens={locais} podeEditar={podeEditar} />
        </CardContent>
      </Card>
    </div>
  )
}
