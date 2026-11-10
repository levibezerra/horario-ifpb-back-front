import { Icon } from "@/components/Icon"
import type { ScheduleLesson, ViewMode } from "@/types"

type MobileSelectionProps = {
  mode: ViewMode
  selected: string
  onOpen: () => void
}

/** Seletor exibido no mobile para abrir o painel de filtros. */
export function MobileSelection({ mode, selected, onOpen }: MobileSelectionProps) {
  return (
    <div className="mobile-selection">
      <span>{mode === "class" ? "Turma" : mode === "teacher" ? "Professor" : "Ambiente"}</span>
      <button onClick={onOpen}>
        {selected}
        <Icon name="chevron" size={17} />
      </button>
    </div>
  )
}

type ScheduleHeadingProps = {
  mode: ViewMode
  selected: string
  course?: string
  lessons: ScheduleLesson[]
}

export function ScheduleHeading({
  mode,
  selected,
  course,
  lessons,
}: ScheduleHeadingProps) {
  const subjects = new Set(lessons.map((lesson) => lesson.subject)).size
  const classes = new Set(lessons.map((lesson) => lesson.className)).size

  return (
    <div className="schedule-heading">
      <div>
        <p>{mode === "class" ? "GRADE DA TURMA" : mode === "teacher" ? "GRADE DO PROFESSOR" : "HORÁRIOS DO AMBIENTE"}</p>
        <h1>{selected}</h1>
        <span>
          {mode === "teacher"
            ? "Horários e turmas da grade 2026.2"
            : mode === "room" ? "Aulas agendadas neste ambiente" : (course ?? "Dados conforme arquivo fornecido")}{" "}
          {mode !== "room" ? "· 2026.2" : ""}
        </span>
      </div>
      <div className="schedule-summary">
        <div>
          <Icon name="clock" />
          <span>
            <strong>{lessons.length}</strong>
            <small>blocos na semana</small>
          </span>
        </div>
        <div>
          <Icon name="book" />
          <span>
            <strong>{mode === "teacher" ? classes : mode === "room" ? classes : subjects}</strong>
            <small>{mode === "teacher" ? "turmas" : mode === "room" ? "turmas" : "disciplinas"}</small>
          </span>
        </div>
      </div>
    </div>
  )
}
