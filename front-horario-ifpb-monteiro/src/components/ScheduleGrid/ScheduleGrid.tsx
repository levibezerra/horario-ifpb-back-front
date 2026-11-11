import { useMemo, useState } from "react"
import { Icon } from "@/components/Icon"
import { useNavigate } from "react-router-dom"
import { professorPath } from "@/routes/paths"
import type { ScheduleLesson, ViewMode } from "@/types/api"
import {
  ALL_PERIODS,
  DAYS,
  getBreakTitle,
  overlaps,
  toMinutes,
} from "@/services/scheduleService"
import { getDisciplinaColor } from "@/utils/colorGenerator"
import { LessonModal } from "./LessonModal"

type ScheduleGridProps = {
  lessons: ScheduleLesson[]
  mode: ViewMode
  label: string
  showEmptyPeriods?: boolean
}

export function ScheduleGrid({
  lessons,
  mode,
  label,
  showEmptyPeriods = false,
}: ScheduleGridProps) {
  const navigate = useNavigate()
  const [selectedLesson, setSelectedLesson] = useState<ScheduleLesson | null>(null)

  const periods = useMemo(() => {
    const hasDaytimeClasses = lessons.some(
      (lesson) => toMinutes(lesson.start) < toMinutes("18:30"),
    )
    const hasNightClasses = lessons.some(
      (lesson) => toMinutes(lesson.start) >= toMinutes("18:30"),
    )

    if (showEmptyPeriods && !lessons.length)
      return ALL_PERIODS.filter((period) => !period.break)

    return ALL_PERIODS.filter((period) => {
      if (period.break) {
        if (
          period.start === "08:40" ||
          period.start === "12:20" ||
          period.start === "15:30"
        ) {
          return hasDaytimeClasses
        }
        if (period.start === "20:10") return hasNightClasses
        return false
      }
      return lessons.some((lesson) => overlaps(lesson, period.start, period.end))
    })
  }, [lessons, showEmptyPeriods])

  const emptyDays = DAYS.filter(
    (day) => !lessons.some((lesson) => lesson.day === day),
  )

  return (
    <>
      {emptyDays.length > 0 && (
        <div className="empty-days-notice">
          <Icon name="info" size={16} />
          <span>
            Sem aula cadastrada em: <strong>{emptyDays.join(", ")}</strong>.
          </span>
        </div>
      )}
      <div className="grid-help">
        <Icon name="info" size={16} />
        <span>Selecione uma aula para ver seus detalhes.</span>
        <span className="legend">
          <i className="occupied" /> Aula <i className="break-legend" /> Intervalo <i className="free" /> Sem aula
        </span>
      </div>

      <div className="schedule-scroll">
        <div className="schedule-grid" role="table" aria-label={`Grade semanal de ${label}`}>
          <div className="grid-header time-header" role="columnheader">
            <Icon name="clock" size={17} />
            <span>Horário</span>
          </div>
          {DAYS.map((day) => (
            <div className="grid-header" role="columnheader" key={day}>
              {day}
            </div>
          ))}
          {periods.map((period) => (
            <div className="schedule-row" role="row" key={period.code}>
              <div className={period.break ? "time-cell break-time" : "time-cell"} role="rowheader">
                <strong>{period.code}</strong>
                <span>{period.start}–{period.end}</span>
              </div>
              {DAYS.map((day) => {
                if (period.break)
                  return (
                    <div className="grid-cell break-cell" role="cell" key={`${period.code}-${day}`}>
                      <div className="break-block">
                        <Icon name="clock" size={15} />
                        <strong>{getBreakTitle(period.start)}</strong>
                        <span>{period.start}–{period.end}</span>
                      </div>
                    </div>
                  )
                const cellLessons = lessons.filter(
                  (lesson) => lesson.day === day && overlaps(lesson, period.start, period.end),
                )
                return (
                  <div className="grid-cell" role="cell" key={`${period.code}-${day}`}>
                    {cellLessons.length ? (
                      cellLessons.map((lesson) => (
                        <button
                          className="lesson-block"
                          style={{ backgroundColor: getDisciplinaColor(lesson.subject) }}
                          onClick={() => setSelectedLesson(lesson)}
                          key={`${lesson.className}-${lesson.day}-${lesson.start}-${lesson.subject}`}
                        >
                          <strong>{lesson.subject}</strong>
                          <span>{lesson.teacher}</span>
                          <small>
                            <Icon name={mode === "teacher" ? "users" : "clock"} size={13} />
                            {mode === "teacher"
                              ? `${lesson.className}${lesson.room ? ` · ${lesson.room}` : ""}`
                              : mode === "room"
                                ? lesson.className
                                : `${period.start}-${period.end}${lesson.room ? ` · ${lesson.room}` : ""}`}
                          </small>
                        </button>
                      ))
                    ) : (
                      <div className="free-slot" aria-label={mode === "room" ? "Ambiente livre" : "Sem aula cadastrada"}>
                        {mode !== "room" && <span>Sem aula cadastrada</span>}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      </div>

      {selectedLesson && (
        <LessonModal
          lesson={selectedLesson}
          onClose={() => setSelectedLesson(null)}
          onViewTeacher={(teacher) => {
            setSelectedLesson(null)
            navigate(professorPath(teacher))
          }}
        />
      )}
    </>
  )
}