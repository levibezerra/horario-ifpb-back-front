import type { CategoriaAmbiente } from "@/types/api"

export const ROOM_CATEGORIES: {
  id: CategoriaAmbiente
  label: string
  caption: string
}[] = [
  { id: "SALA", label: "Salas de Aula", caption: "Espaços convencionais" },
  { id: "LABORATORIO", label: "Laboratórios", caption: "Espaços práticos e de informática" },
  { id: "AUDITORIO", label: "Auditórios", caption: "Espaços de eventos e palestras" },
  { id: "ESPORTIVO", label: "Espaços Esportivos", caption: "Quadras e ginásios" },
]

export function roomCategoryLabel(category?: CategoriaAmbiente): string {
  if (!category) return "Ambiente"
  return ROOM_CATEGORIES.find((item) => item.id === category)?.label || category
}