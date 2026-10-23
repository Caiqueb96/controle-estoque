import type { Metadata } from "next"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { exigirPerfil } from "@/lib/auth"
import { listarCadastro } from "@/lib/cadastros"
import { formatarMoeda } from "@/lib/formato"
import {
  abaixoDoMinimo,
  listarItens,
  NOME_DO_TIPO,
  type SituacaoItem,
  type TipoItem,
} from "@/lib/itens"

export const metadata: Metadata = {
  title: "Itens | Controle de Estoque",
}

// Quem cadastra e edita (PRD §5.5). O produtor só consulta. A equipe de
// campo verá os itens pelo evento (Fase 4), não por esta lista.
const PERFIS_QUE_VEEM = ["admin", "almoxarife", "produtor"] as const
const PERFIS_QUE_EDITAM = ["admin", "almoxarife"]

const SITUACOES: { valor: SituacaoItem; rotulo: string }[] = [
  { valor: "ativos", rotulo: "Ativos" },
  { valor: "abaixo", rotulo: "Abaixo do mínimo" },
  { valor: "inativos", rotulo: "Inativos" },
  { valor: "todos", rotulo: "Todos" },
]

const CLASSE_SELECT = "h-9 rounded-md border border-input bg-transparent px-3 text-sm shadow-xs"

export default async function ItensPage({
  searchParams,
}: {
  searchParams: Promise<{
    busca?: string
    categoria?: string
    local?: string
    tipo?: string
    situacao?: string
  }>
}) {
  const usuario = await exigirPerfil([...PERFIS_QUE_VEEM])
  const { busca = "", categoria = "", local = "", tipo = "", situacao = "ativos" } =
    await searchParams

  const situacaoValida: SituacaoItem = SITUACOES.some((s) => s.valor === situacao)
    ? (situacao as SituacaoItem)
    : "ativos"
  const tipoValido = tipo in NOME_DO_TIPO ? (tipo as TipoItem) : undefined

  const [itens, categorias, locais] = await Promise.all([
    listarItens({
      busca,
      categoriaId: categoria,
      localId: local,
      tipo: tipoValido,
      situacao: situacaoValida,
    }),
    listarCadastro("categoria"),
    listarCadastro("local"),
  ])

  const podeEditar = PERFIS_QUE_EDITAM.includes(usuario.perfil)

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Itens</h1>
          <p className="text-muted-foreground">
            Equipamentos e materiais de consumo do estoque.
          </p>
        </div>
        {podeEditar && (
          <Button nativeButton={false} render={<Link href="/itens/novo" />}>
            Novo item
          </Button>
        )}
      </div>

      {/* Mesmo esquema da tela de Pessoas: os filtros vão para a URL. */}
      <form method="get" className="flex flex-wrap items-end gap-3">
        <div className="flex min-w-52 flex-1 flex-col gap-2">
          <label htmlFor="busca" className="text-sm font-medium">
            Buscar
          </label>
          <Input id="busca" name="busca" defaultValue={busca} placeholder="Nome ou descrição" />
        </div>
        <div className="flex flex-col gap-2">
          <label htmlFor="categoria" className="text-sm font-medium">
            Categoria
          </label>
          <select id="categoria" name="categoria" defaultValue={categoria} className={CLASSE_SELECT}>
            <option value="">Todas</option>
            {categorias.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nome}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-2">
          <label htmlFor="local" className="text-sm font-medium">
            Local
          </label>
          <select id="local" name="local" defaultValue={local} className={CLASSE_SELECT}>
            <option value="">Todos</option>
            {locais.map((l) => (
              <option key={l.id} value={l.id}>
                {l.nome}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-2">
          <label htmlFor="tipo" className="text-sm font-medium">
            Tipo
          </label>
          <select id="tipo" name="tipo" defaultValue={tipoValido ?? ""} className={CLASSE_SELECT}>
            <option value="">Todos</option>
            <option value="equipamento">Equipamento</option>
            <option value="consumo">Consumo</option>
          </select>
        </div>
        <div className="flex flex-col gap-2">
          <label htmlFor="situacao" className="text-sm font-medium">
            Situação
          </label>
          <select
            id="situacao"
            name="situacao"
            defaultValue={situacaoValida}
            className={CLASSE_SELECT}
          >
            {SITUACOES.map((s) => (
              <option key={s.valor} value={s.valor}>
                {s.rotulo}
              </option>
            ))}
          </select>
        </div>
        <Button type="submit" variant="outline">
          Filtrar
        </Button>
      </form>

      {itens.length === 0 ? (
        <p className="rounded-md border border-dashed p-8 text-center text-muted-foreground">
          Nenhum item encontrado.
        </p>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Local</TableHead>
                <TableHead className="text-right">Em estoque</TableHead>
                <TableHead className="text-right">Reposição</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {itens.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">
                    {podeEditar ? (
                      <Link href={`/itens/${item.id}`} className="hover:underline">
                        {item.nome}
                      </Link>
                    ) : (
                      item.nome
                    )}
                    {!item.ativo && (
                      <Badge variant="destructive" className="ml-2">
                        Inativo
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>{item.categoriaNome}</TableCell>
                  <TableCell>
                    <Badge variant={item.tipo === "equipamento" ? "secondary" : "outline"}>
                      {NOME_DO_TIPO[item.tipo]}
                    </Badge>
                  </TableCell>
                  <TableCell>{item.localNome ?? "—"}</TableCell>
                  <TableCell className="text-right">
                    {item.qtdTotal} {item.unidadeMedida}
                    {abaixoDoMinimo(item) && (
                      <Badge variant="destructive" className="ml-2">
                        Abaixo do mínimo ({item.estoqueMinimo})
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatarMoeda(item.valorReposicao)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <p className="text-sm text-muted-foreground">
        {itens.length} {itens.length === 1 ? "item encontrado" : "itens encontrados"}.
      </p>
    </div>
  )
}
