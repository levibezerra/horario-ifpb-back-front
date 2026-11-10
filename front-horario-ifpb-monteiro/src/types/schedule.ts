import type { CategoriaAmbiente, DiaSemana, EntityId, StatusHorario } from "./api"

export type DayName = DiaSemana | "Segunda" | "Terça" | "Quarta" | "Quinta" | "Sexta"

export type ScheduleLesson = {
  id?: string
  className: string
  day: DayName
  start: string
  end: string
  subject: string
  rawSubject?: string
  teacher: string
  room?: string
  status?: StatusHorario
  needsReview?: boolean
}

export type Period = {
  code: string
  start: string
  end: string
  break?: boolean
}

export type Group = {
  group: string
  caption?: string
  items: Array<string | { id: string; label: string }>
}

export type TeacherProfile = {
  email?: string
  lattes?: string
}

/** Modo de consulta pública. */
export type ViewMode = "class" | "teacher" | "room"