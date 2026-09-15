/**
 * Formatação e validação de dados brasileiros.
 *
 * Regra do projeto: telefone e documento são **guardados no banco só com
 * números**. A formatação bonitinha é feita na hora de mostrar na tela.
 * Assim a busca e a checagem de duplicidade funcionam, não importa se a
 * pessoa digitou "(11) 98888-7777" ou "11988887777".
 */

/** Tira tudo que não for número. */
export function apenasNumeros(valor: string): string {
  return valor.replace(/\D/g, "")
}

/** 11988887777 -> (11) 98888-7777 · 1133334444 -> (11) 3333-4444 */
export function formatarTelefone(telefone: string | null): string {
  if (!telefone) return ""
  const n = apenasNumeros(telefone)
  if (n.length === 11) return `(${n.slice(0, 2)}) ${n.slice(2, 7)}-${n.slice(7)}`
  if (n.length === 10) return `(${n.slice(0, 2)}) ${n.slice(2, 6)}-${n.slice(6)}`
  return telefone
}

/** 12345678909 -> 123.456.789-09 */
export function formatarCpf(documento: string | null): string {
  if (!documento) return ""
  const n = apenasNumeros(documento)
  if (n.length !== 11) return documento
  return `${n.slice(0, 3)}.${n.slice(3, 6)}.${n.slice(6, 9)}-${n.slice(9)}`
}

/**
 * Confere se um CPF é válido de verdade.
 *
 * O CPF tem 9 dígitos + 2 dígitos verificadores calculados a partir dos
 * primeiros. Isso pega erro de digitação: "111.111.111-11" tem 11 números,
 * mas não é um CPF válido.
 */
export function cpfValido(documento: string): boolean {
  const n = apenasNumeros(documento)

  if (n.length !== 11) return false
  // Sequências iguais (00000000000, 11111111111...) passariam na conta abaixo.
  if (/^(\d)\1{10}$/.test(n)) return false

  const digitoVerificador = (ateOndeContar: number): number => {
    let soma = 0
    let peso = ateOndeContar + 1
    for (let i = 0; i < ateOndeContar; i++) {
      soma += Number(n[i]) * peso
      peso--
    }
    const resto = (soma * 10) % 11
    return resto === 10 ? 0 : resto
  }

  return digitoVerificador(9) === Number(n[9]) && digitoVerificador(10) === Number(n[10])
}
