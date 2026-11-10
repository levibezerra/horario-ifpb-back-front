import type { CategoriaAmbiente, DiaSemana, EntityId, StatusHorario } from "./api"

export type EntityKind = "classes" | "subjects" | "teachers" | "rooms"

export type RoomCategory = CategoriaAmbiente | "SALAS" | "LABORATORIOS" | "AUDITORIO" | "ESPORTIVO"

export type EntityRecord = {
  id: EntityId | string
  name: string
  detail?: string
  email?: string
  lattesUrl?: string
  lattes?: string
  courses?: string[]
  cursosIds?: EntityId[]
  category?: RoomCategory
  categoria?: CategoriaAmbiente
  cursoId?: EntityId
}

export type EntityForm = {
  name: string
  detail: string
  email: string
  lattes: string
  courses: string[]
  category: CategoriaAmbiente | ""
}

export type AdminSchedule = {
  id: EntityId | string
  className: string
  subject: string
  teacher: string
  room: string
  roomId?: EntityId | null
  day: DiaSemana
  start: string
  end: string
  status: StatusHorario
  publishedAt?: string
}