import { Icon } from "@/components/Icon"
import type { ScheduleLesson } from "@/types/api"

type LessonModalProps = {
  lesson: ScheduleLesson
  onClose: () => void
  onViewTeacher: (teacher: string) => void
}

export function LessonModal({ lesson, onClose, onViewTeacher }: LessonModalProps) {
  return (
    <div className="modal-layer" role="dialog" aria-modal="true" aria-labelledby="lesson-title">
      <button className="modal-overlay" onClick={onClose} aria-label="Fechar detalhes" />
      <section className="lesson-modal">
        <div className="modal-top">
          <span><Icon name="book" /></span>
          <button onClick={onClose} aria-label="Fechar"><Icon name="x" /></button>
        </div>
        <p>DETALHES DA AULA</p>
        <h2 id="lesson-title">{lesson.subject}</h2>
        <div className="details">
          <div>
            <Icon name="teacher" />
            <span>
              <small>Professor</small>
              <strong>{lesson.teacher}</strong>
            </span>
          </div>
          <div>
            <Icon name="users" />
            <span>
              <small>Turma</small>
              <strong>{lesson.className}</strong>
            </span>
          </div>
          <div>
            <Icon name="book" />
            <span>
              <small>Dia</small>
              <strong>{lesson.day}</strong>
            </span>
          </div>
          <div>
            <Icon name="clock" />
            <span>
              <small>Horário</small>
              <strong>{lesson.start.substring(0, 5)}–{lesson.end.substring(0, 5)}</strong>
            </span>
          </div>
        </div>
        <button className="modal-action" onClick={() => onViewTeacher(lesson.teacher)}>
          Ver grade do professor <Icon name="chevron" size={17} />
        </button>
      </section>
    </div>
  )
}