import type { DiaSemana, Period, ScheduleLesson } from "@/types/api"

export const DAYS: DiaSemana[] = ["SEGUNDA", "TERCA", "QUARTA", "QUINTA", "SEXTA"]

export const ALL_PERIODS: Period[] = [
  { code: "M1", start: "07:00", end: "07:50" },
  { code: "M2", start: "07:50", end: "08:40" },
  { code: "INTERVALO", start: "08:40", end: "09:00", break: true },
  { code: "M3", start: "09:00", end: "09:50" },
  { code: "M4", start: "09:50", end: "10:40" },
  { code: "M5", start: "10:40", end: "11:30" },
  { code: "M6", start: "11:30", end: "12:20" },
  { code: "ALMOÇO", start: "12:20", end: "13:00", break: true },
  { code: "T1", start: "13:00", end: "13:50" },
  { code: "T2", start: "13:50", end: "14:40" },
  { code: "T3", start: "14:40", end: "15:30" },
  { code: "T4", start: "15:40", end: "16:30" },
  { code: "T5", start: "16:30", end: "17:20" },
  { code: "T6", start: "17:20", end: "18:10" },
  { code: "N1", start: "18:30", end: "19:20" },
  { code: "N2", start: "19:20", end: "20:10" },
  { code: "JANTAR", start: "20:10", end: "20:30", break: true },
  { code: "N3", start: "20:30", end: "21:20" },
  { code: "N4", start: "21:20", end: "22:10" },
]

export function toMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map(Number)
  return hours * 60 + minutes
}

export function overlaps(lesson: ScheduleLesson, start: string, end: string): boolean {
  return (
    toMinutes(lesson.start) < toMinutes(end) &&
    toMinutes(lesson.end) > toMinutes(start)
  )
}

export function getBreakTitle(start: string): string {
  switch (start) {
    case "08:40":
      return "Intervalo para o lanche"
    case "12:20":
      return "Pausa para o almoço"
    case "20:10":
      return "Pausa para o jantar"
    default:
      return "Intervalo"
  }
}

export function initials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase()
}