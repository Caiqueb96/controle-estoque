"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
import { exigirPerfil } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"

export type EstadoFormulario = {
  erro?: string
  erros?: Record<string, string>
  salvo?: boolean
}

const esquemaConfiguracoes = z.object({
  // `coerce` converte o texto do formulário ("2") em número (2) antes de validar.
  diasFolgaReserva: z.coerce
    .number("Informe um número.")
    .int("Use um número inteiro, sem vírgula.")
    .min(0, "Não pode ser negativo.")
    .max(30, "No máximo 30 dias."),
})

/** Salva os ajustes gerais. Só o administrador pode (PRD §5.5). */
export async function salvarConfiguracoes(
  _estadoAnterior: EstadoFormulario,
  formData: FormData
): Promise<EstadoFormulario> {
  await exigirPerfil(["admin"])

  const resultado = esquemaConfiguracoes.safeParse({
    diasFolgaReserva: formData.get("diasFolgaReserva") ?? "",
  })

  if (!resultado.success) {
    return { erros: { diasFolgaReserva: resultado.error.issues[0].message } }
  }

  const supabase = await createClient()

  // O `.select()` no fim pede de volta as linhas alteradas. Sem ele, se o
  // RLS barrasse a gravação, o Supabase responderia "ok" sem mudar nada.
  const { data, error } = await supabase
    .from("configuracao")
    .update({ valor: String(resultado.data.diasFolgaReserva) })
    .eq("chave", "dias_folga_reserva")
    .select("chave")

  if (error) return { erro: `Não foi possível salvar: ${error.message}` }
  if (!data?.length) return { erro: "Nada foi salvo. Confira se você tem permissão." }

  revalidatePath("/configuracoes")
  return { salvo: true }
}
