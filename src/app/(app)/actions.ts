"use server"

import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"

/** Encerra a sessao e volta para a tela de login. */
export async function sair() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect("/login")
}
