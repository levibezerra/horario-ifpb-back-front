import { Icon } from "@/components/Icon"
import type { ProfessorDTO, ScheduleLesson } from "@/types/api"
import { initials } from "@/services/scheduleService"

type ProfessorCardProps = {
  name: string
  lessons: ScheduleLesson[]
  professorData?: ProfessorDTO
}

const byPtBr = (a: string, b: string) => a.localeCompare(b, "pt-BR")

export function ProfessorCard({ name, lessons, professorData }: ProfessorCardProps) {
  const subjects = [...new Set(lessons.map((lesson) => lesson.subject))].sort(byPtBr)
  const classes = [...new Set(lessons.map((lesson) => lesson.className))].sort(byPtBr)
  const courses = professorData?.cursosNomes || []

  return (
    <section className="context-card teacher-profile">
      <div className="teacher-profile-header">
        <div className="teacher-profile-identity">
          <p>PROFESSOR SELECIONADO</p>
          <h2>{name}</h2>
          <span>Atuação registrada na grade acadêmica</span>
        </div>
        <span className="profile-avatar" aria-label={`Iniciais de ${name}`}>
          {initials(name)}
        </span>
      </div>
      <div className="teacher-profile-stats">
        <span>
          <Icon name="users" size={18} />
          <span>
            <strong>{classes.length}</strong>
            <small>{classes.length === 1 ? "turma" : "turmas"}</small>
          </span>
        </span>
        <span>
          <Icon name="book" size={18} />
          <span>
            <strong>{subjects.length}</strong>
            <small>{subjects.length === 1 ? "disciplina" : "disciplinas"}</small>
          </span>
        </span>
        <span>
          <Icon name="clock" size={18} />
          <span>
            <strong>{lessons.length}</strong>
            <small>blocos semanais</small>
          </span>
        </span>
      </div>
      <div className="teacher-profile-details">
        <div>
          <small>DISCIPLINAS RELACIONADAS</small>
          <div className="profile-tags">
            {subjects.map((subject) => (
              <span key={subject}>{subject}</span>
            ))}
          </div>
        </div>
        <div>
          <small>CURSOS COM AULAS NA GRADE</small>
          <div className="profile-tags course-tags">
            {courses.map((course) => (
              <span key={course}>{course}</span>
            ))}
          </div>
        </div>
        <div className="teacher-classes">
          <small>TURMAS</small>
          <span>{classes.join(" · ")}</span>
        </div>
        <div className="teacher-contact-grid">
          <div className="teacher-contact-item">
            <span className="teacher-contact-icon">
              <Icon name="mail" size={18} />
            </span>
            <span className="teacher-contact-copy">
              <small>E-MAIL ACADÊMICO</small>
              {professorData?.email ? (
                <a href={`mailto:${professorData.email}`}>{professorData.email}</a>
              ) : (
                <span>E-mail não informado</span>
              )}
            </span>
          </div>
          <div className="teacher-contact-item">
            <span className="teacher-contact-icon">
              <Icon name="external" size={18} />
            </span>
            <span className="teacher-contact-copy">
              <small>CURRÍCULO LATTES</small>
              {professorData?.lattesUrl ? (
                <a href={professorData.lattesUrl} target="_blank" rel="noreferrer">
                  Acessar Currículo Lattes
                </a>
              ) : (
                <span>Currículo Lattes não informado</span>
              )}
            </span>
          </div>
        </div>
      </div>
    </section>
  )
}