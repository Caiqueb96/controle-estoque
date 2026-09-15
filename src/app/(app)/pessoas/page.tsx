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
import { exigirUsuario } from "@/lib/auth"
import { formatarCpf, formatarTelefone } from "@/lib/formato"
import { listarPessoas, type Situacao } from "@/lib/pessoas"

export const metadata: Metadata = {
  title: "Pessoas | Controle de Estoque",
}

const PERFIS_QUE_PODEM = ["admin", "almoxarife", "produtor"]

const SITUACOES: { valor: Situacao; rotulo: string }[] = [
  { valor: "ativos", rotulo: "Ativos" },
  { valor: "inativos", rotulo: "Inativos" },
  { valor: "todos", rotulo: "Todos" },
]

export default async function PessoasPage({
  searchParams,
}: {
  // No Next.js 16 os parâmetros da URL chegam como Promise: precisam de await.
  searchParams: Promise<{ busca?: string; situacao?: string }>
}) {
  const usuario = await exigirUsuario()
  const { busca = "", situacao = "ativos" } = await searchParams

  const situacaoValida: Situacao = SITUACOES.some((s) => s.valor === situacao)
    ? (situacao as Situacao)
    : "ativos"

  const pessoas = await listarPessoas(busca, situacaoValida)
  const podeEditar = PERFIS_QUE_PODEM.includes(usuario.perfil)

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Pessoas</h1>
          <p className="text-muted-foreground">
            Quem pode ser responsável por itens: usuários do sistema e freelancers.
          </p>
        </div>
        {podeEditar && (
          <Button render={<Link href="/pessoas/nova" />}>Nova pessoa</Button>
        )}
      </div>

      {/* Formulário de busca sem JavaScript: method="get" joga os campos
          na URL (ex.: /pessoas?busca=joao&situacao=todos) e a página
          recarrega já filtrada. Simples e funciona até se o JS falhar. */}
      <form method="get" className="flex flex-wrap items-end gap-3">
        <div className="flex min-w-60 flex-1 flex-col gap-2">
          <label htmlFor="busca" className="text-sm font-medium">
            Buscar
          </label>
          <Input
            id="busca"
            name="busca"
            defaultValue={busca}
            placeholder="Nome, telefone ou CPF"
          />
        </div>
        <div className="flex flex-col gap-2">
          <label htmlFor="situacao" className="text-sm font-medium">
            Situação
          </label>
          <select
            id="situacao"
            name="situacao"
            defaultValue={situacaoValida}
            className="h-9 rounded-md border border-input bg-transparent px-3 text-sm shadow-xs"
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

      {pessoas.length === 0 ? (
        <p className="rounded-md border border-dashed p-8 text-center text-muted-foreground">
          {busca
            ? `Nenhuma pessoa encontrada para "${busca}".`
            : "Nenhuma pessoa cadastrada ainda."}
        </p>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Telefone</TableHead>
                <TableHead>CPF</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead className="text-right">Situação</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pessoas.map((pessoa) => (
                <TableRow key={pessoa.id}>
                  <TableCell className="font-medium">
                    {podeEditar ? (
                      <Link href={`/pessoas/${pessoa.id}`} className="hover:underline">
                        {pessoa.nome}
                      </Link>
                    ) : (
                      pessoa.nome
                    )}
                  </TableCell>
                  <TableCell>{formatarTelefone(pessoa.telefone) || "—"}</TableCell>
                  <TableCell>{formatarCpf(pessoa.documento) || "—"}</TableCell>
                  <TableCell>
                    <Badge variant={pessoa.tipo === "usuario" ? "secondary" : "outline"}>
                      {pessoa.tipo === "usuario" ? "Usuário do sistema" : "Freelancer"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {pessoa.ativo ? (
                      <span className="text-muted-foreground">Ativo</span>
                    ) : (
                      <Badge variant="destructive">Inativo</Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <p className="text-sm text-muted-foreground">
        {pessoas.length} {pessoas.length === 1 ? "pessoa encontrada" : "pessoas encontradas"}.
      </p>
    </div>
  )
}
