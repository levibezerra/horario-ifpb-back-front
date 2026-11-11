/**
 * Gera uma cor pastel bem clara e suave de forma determinística a partir do nome da disciplina.
 * Usa HSL para garantir controle perfeito de saturação e luminosidade (tons pastéis).
 */
export const getDisciplinaColor = (nomeDisciplina?: string | null): string => {
  if (!nomeDisciplina || typeof nomeDisciplina !== "string") {
    return "#64748B" // Cor fallback (Slate Grey)
  }

  let hash = 0
  for (let i = 0; i < nomeDisciplina.length; i++) {
    hash = nomeDisciplina.charCodeAt(i) + ((hash << 5) - hash)
  }

  // Matiz (Hue) variando de 0 a 360 graus para dar cores diferentes por disciplina
  const h = Math.abs(hash) % 360
  
  // Saturação em 55% (não fica nem muito cinza, nem excessivamente chamativa)
  const s = 55
  
  // Luminosidade em 88% (garante um tom pastel bem claro, ideal para o texto escuro ler perfeitamente)
  const l = 88

  return `hsl(${h}, ${s}%, ${l}%)`
}

export default getDisciplinaColor