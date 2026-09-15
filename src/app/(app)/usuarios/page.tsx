import type { Metadata } from "next"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { exigirPerfil } from "@/lib/auth"
import { NOME_DO_PERFIL } from "@/lib/perfis"
import { formatarTelefone } from "@/lib/formato"
import { listarUsuarios } from "@/lib/usuarios"

export const metadata: Metadata = {
  title: "Usuários | Controle de Estoque",
}

export default async function UsuariosPage() {
  const admin = await exigirPerfil(["admin"])
  const usuarios = await listarUsuarios()

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Usuários</h1>
        <p className="text-muted-foreground">
          Quem tem login no sistema e o que cada um pode fazer.
        </p>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>E-mail</TableHead>
              <TableHead>Telefone</TableHead>
              <TableHead>Função</TableHead>
              <TableHead className="text-right">Acesso</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {usuarios.map((usuario) => (
              <TableRow key={usuario.id}>
                <TableCell className="font-medium">
                  <Link href={`/usuarios/${usuario.id}`} className="hover:underline">
                    {usuario.nome}
                  </Link>
                  {usuario.id === admin.id && (
                    <span className="ml-2 text-sm text-muted-foreground">(você)</span>
                  )}
                </TableCell>
                <TableCell>{usuario.email}</TableCell>
                <TableCell>{formatarTelefone(usuario.telefone) || "—"}</TableCell>
                <TableCell>
                  <Badge variant={usuario.perfil === "admin" ? "secondary" : "outline"}>
                    {NOME_DO_PERFIL[usuario.perfil]}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  {usuario.ativo ? (
                    <span className="text-muted-foreground">Liberado</span>
                  ) : (
                    <Badge variant="destructive">Bloqueado</Badge>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <p className="rounded-md border border-dashed px-4 py-3 text-sm text-muted-foreground">
        Para criar um login novo, por enquanto use o painel do Supabase
        (Authentication → Users) e depois o arquivo{" "}
        <code className="font-mono">supabase/sql/002_primeiro_admin.sql</code>.
        A criação direto por aqui entra no próximo passo.
      </p>
    </div>
  )
}
