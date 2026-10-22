import { createClient } from "@/lib/supabase/server"

/**
 * Ajustes gerais do sistema (tabela `configuracao`, formato chave/valor).
 *
 * No banco tudo é texto, porque cada chave guarda um tipo diferente de
 * informação. Aqui convertemos para o tipo certo, para o resto do código
 * não precisar lembrar disso.
 */
export type Configuracoes = {
  /** Dias de folga entre o retorno de um evento e a saída para o próximo (PRD D2). */
  diasFolgaReserva: number
}

/** Valores usados se a linha não existir no banco. */
const PADRAO: Configuracoes = {
  diasFolgaReserva: 0,
}

export async function buscarConfiguracoes(): Promise<Configuracoes> {
  const supabase = await createClient()

  const { data, error } = await supabase.from("configuracao").select("chave, valor")

  if (error) throw new Error(`Não foi possível ler as configurações: ${error.message}`)

  const linhas = (data ?? []) as { chave: string; valor: string }[]
  const valor = (chave: string) => linhas.find((linha) => linha.chave === chave)?.valor

  const dias = Number(valor("dias_folga_reserva"))

  return {
    diasFolgaReserva: Number.isInteger(dias) && dias >= 0 ? dias : PADRAO.diasFolgaReserva,
  }
}
