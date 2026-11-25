const GOLDEN_ANGLE = 137.50776405003785
const MIN_HUE_DISTANCE = 14

// Variações sutis dentro da faixa pastel para ampliar a distinção visual
// mantendo alto contraste com texto escuro
const PASTEL_TONES: ReadonlyArray<{ s: number; l: number }> = [
  { s: 68, l: 86 },
  { s: 60, l: 90 },
  { s: 72, l: 84 },
  { s: 58, l: 88 },
]

const assignedColors = new Map<string, string>()
const usedHues: number[] = []

function normalizeSubjectKey(name: string): string {
  return name
    .trim()
    .toLocaleLowerCase("pt-BR")
    .replace(/\s+/g, " ")
}

function hashString(value: string): number {
  let hash = 2166136261
  for (let i = 0; i < value.length; i++) {
    hash ^= value.charCodeAt(i)
    hash = Math.imul(hash, 16777619)
  }
  return hash >>> 0
}

function circularHueDistance(a: number, b: number): number {
  const diff = Math.abs(a - b) % 360
  return diff > 180 ? 360 - diff : diff
}

function pickDistinctHue(baseHue: number, index: number): number {
  let candidate = (baseHue + index * GOLDEN_ANGLE) % 360

  // Se o candidato estiver muito próximo de alguma cor já usada, avança no espectro
  for (let attempt = 0; attempt < 36; attempt++) {
    const tooClose = usedHues.some(
      (existing) => circularHueDistance(candidate, existing) < MIN_HUE_DISTANCE,
    )
    if (!tooClose) break
    candidate = (candidate + MIN_HUE_DISTANCE + 3) % 360
  }

  return Math.round(candidate)
}

/**
 * Gera uma cor pastel única e visualmente distinta para cada disciplina,
 * garantindo que duas disciplinas diferentes nunca recebam a mesma cor.
 */
export const getDisciplinaColor = (nomeDisciplina?: string | null): string => {
  if (!nomeDisciplina || typeof nomeDisciplina !== "string" || !nomeDisciplina.trim()) {
    return "hsl(215, 20%, 88%)" // Fallback pastel neutro
  }

  const key = normalizeSubjectKey(nomeDisciplina)
  const existing = assignedColors.get(key)
  if (existing) {
    return existing
  }

  const index = assignedColors.size
  const baseHue = hashString(key) % 360
  const h = pickDistinctHue(baseHue, index)
  const tone = PASTEL_TONES[index % PASTEL_TONES.length]

  const color = `hsl(${h}, ${tone.s}%, ${tone.l}%)`

  usedHues.push(h)
  assignedColors.set(key, color)

  return color
}

/**
 * Opcional: limpa o cache de cores atribuídas (ex.: ao trocar de semestre ou recarregar dados).
 */
export const resetDisciplinaColors = (): void => {
  assignedColors.clear()
  usedHues.length = 0
}

export default getDisciplinaColor