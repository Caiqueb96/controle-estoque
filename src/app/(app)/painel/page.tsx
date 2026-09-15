import type { Metadata } from "next"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { exigirUsuario, NOME_DO_PERFIL } from "@/lib/auth"

export const metadata: Metadata = {
  title: "Painel | Controle de Estoque",
}

// Proximas telas do MVP (PRD secao 11). Vao virar links conforme ficarem prontas.
const PROXIMAS_TELAS = [
  "Itens, categorias e locais",
  "Movimentacoes de estoque",
  "Eventos e reservas",
  "Checklist de saida e de retorno",
  "Fornecedores e sublocacoes",
  "Ocorrencias e cobranca",
  "Pessoas e usuarios",
]

export default async function PainelPage() {
  const usuario = await exigirUsuario()

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Ola, {usuario.nome}</h1>
        <p className="text-muted-foreground">
          Voce esta conectado como {NOME_DO_PERFIL[usuario.perfil].toLowerCase()}.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Em construcao</CardTitle>
          <CardDescription>
            O login e as permissoes ja funcionam. As telas do sistema entram a seguir.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="list-inside list-disc space-y-1 text-sm text-muted-foreground">
            {PROXIMAS_TELAS.map((tela) => (
              <li key={tela}>{tela}</li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
