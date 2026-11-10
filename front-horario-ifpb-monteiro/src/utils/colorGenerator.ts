/**
 * Gera uma cor hexadecimal pastel de forma determinística a partir do nome da disciplina.
 * Garante que a mesma disciplina sempre tenha a mesma cor na grade e mantém
 * legibilidade ideal com texto escuro.
 */
export const getDisciplinaColor = (nomeDisciplina?: string | null): string => {
  if (!nomeDisciplina || typeof nomeDisciplina !== "string") {
    return "#64748B" // Cor fallback (Slate Grey)
  }

  let hash = 0
  for (let i = 0; i < nomeDisciplina.length; i++) {
    hash = nomeDisciplina.charCodeAt(i) + ((hash << 5) - hash)
  }

  // Gera componentes RGB na faixa de 130 a 230 para garantir tons pastel claros
  const r = Math.floor(Math.abs(Math.sin(hash + 1)) * 100 + 130)
  const g = Math.floor(Math.abs(Math.sin(hash + 2)) * 100 + 130)
  const b = Math.floor(Math.abs(Math.sin(hash + 3)) * 100 + 130)

  const toHex = (c: number) => c.toString(16).padStart(2, "0")

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`
}

export default getDisciplinaColor