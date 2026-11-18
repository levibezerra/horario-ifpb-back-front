import { useEffect, useMemo, useState } from "react"
import { Icon } from "@/components/Icon"
import { useNavigate } from "react-router-dom"
import { ROUTES } from "@/routes/paths"
import {
  API_ENDPOINTS,
  StatusCalendarioAcademico,
  TipoCalendarioAcademico,
  type HorarioDTO,
  type ProfessorDTO,
  type TurmaDTO,
} from "@/types/api"
import { api } from "@/services/api"
import "./inicio.css"

type AcademicCalendarItem = {
  id: number
  titulo: string
  nomeArquivo: string
  status: StatusCalendarioAcademico
  tipo?: TipoCalendarioAcademico
}

const ACADEMIC_CALENDARS_ENDPOINT = API_ENDPOINTS.calendariosAcademicos

function compareNaturalPtBr(a: string, b: string) {
  return a.localeCompare(b, "pt-BR", { numeric: true, sensitivity: "base" })
}

function normalizeText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
}

function resolveCalendarType(item: any): TipoCalendarioAcademico | undefined {
  const rawType = String(item.tipo || item.modalidade || "").toUpperCase()
  if (rawType === TipoCalendarioAcademico.SUPERIOR) return TipoCalendarioAcademico.SUPERIOR
  if (rawType === TipoCalendarioAcademico.INTEGRADO) return TipoCalendarioAcademico.INTEGRADO

  const norm = normalizeText(item.titulo || item.nome || "")
  if (norm.includes("superior")) return TipoCalendarioAcademico.SUPERIOR
  if (norm.includes("integrado")) return TipoCalendarioAcademico.INTEGRADO
  return undefined
}

function resolveCalendarStatus(item: any): StatusCalendarioAcademico {
  const rawStatus = String(item.status || "").toUpperCase()
  if (rawStatus === StatusCalendarioAcademico.PUBLICADO || item.publicado === true) {
    return StatusCalendarioAcademico.PUBLICADO
  }
  return StatusCalendarioAcademico.RASCUNHO
}

export default function Inicio() {
  const navigate = useNavigate()
  const [classes, setClasses] = useState<TurmaDTO[]>([])
  const [teachers, setTeachers] = useState<ProfessorDTO[]>([])
  const [schedules, setSchedules] = useState<HorarioDTO[]>([])
  const [calendars, setCalendars] = useState<AcademicCalendarItem[]>([])

  useEffect(() => {
    async function loadPublicData() {
      try {
        const [resClasses, resTeachers, resSchedules, resCalendars] = await Promise.all([
          api.get<TurmaDTO[]>(API_ENDPOINTS.turmas),
          api.get<ProfessorDTO[]>(API_ENDPOINTS.professores),
          api.get<HorarioDTO[]>(API_ENDPOINTS.horarios),
          api
            .get(`${ACADEMIC_CALENDARS_ENDPOINT}/publicos`)
            .catch(() => api.get(ACADEMIC_CALENDARS_ENDPOINT))
            .catch(() => ({ data: [] })),
        ])

        setClasses(resClasses.data)
        setTeachers(resTeachers.data)
        setSchedules(resSchedules.data.filter((h) => h.status === "PUBLICADO"))

        const rawCalendars = Array.isArray(resCalendars.data)
          ? resCalendars.data
          : resCalendars.data
          ? [resCalendars.data]
          : []

        const publishedCalendars: AcademicCalendarItem[] = rawCalendars
          .map((item: any) => ({
            id: Number(item.id),
            titulo: item.titulo || item.nome || "Calendário Acadêmico",
            nomeArquivo: item.nomeArquivo || item.arquivoNome || "calendario-academico.pdf",
            status: resolveCalendarStatus(item),
            tipo: resolveCalendarType(item),
          }))
          .filter((item) => item.status === StatusCalendarioAcademico.PUBLICADO)

        setCalendars(publishedCalendars)
      } catch (err) {
        console.error("Erro ao carregar dados públicos", err)
      }
    }
    loadPublicData()
  }, [])

  const superiorCalendars = useMemo(
    () => calendars.filter((c) => c.tipo === TipoCalendarioAcademico.SUPERIOR),
    [calendars],
  )

  const integradoCalendars = useMemo(
    () => calendars.filter((c) => c.tipo === TipoCalendarioAcademico.INTEGRADO),
    [calendars],
  )

  const sortedClasses = useMemo(() => {
    return [...classes].sort((a, b) => {
      const courseA = a.cursoNome || "Outros Cursos"
      const courseB = b.cursoNome || "Outros Cursos"
      const courseDiff = compareNaturalPtBr(courseA, courseB)
      if (courseDiff !== 0) return courseDiff
      return compareNaturalPtBr(a.nome, b.nome)
    })
  }, [classes])

  const courses = useMemo(() => {
    const list = classes.map((c) => c.cursoNome).filter((name): name is string => Boolean(name))
    return [...new Set(list)].sort(compareNaturalPtBr)
  }, [classes])

  const sortedTeachers = useMemo(
    () => [...teachers].sort((a, b) => compareNaturalPtBr(a.nome, b.nome)),
    [teachers],
  )

  const [selectedClassId, setSelectedClassId] = useState<string>("")
  const [selectedCourse, setSelectedCourse] = useState<string>("")
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>("")
  const [selectedSuperiorCalendarId, setSelectedSuperiorCalendarId] = useState<string>("")
  const [selectedIntegradoCalendarId, setSelectedIntegradoCalendarId] = useState<string>("")

  useEffect(() => {
    if (sortedClasses.length > 0 && !selectedClassId) setSelectedClassId(String(sortedClasses[0].id))
    if (courses.length > 0 && !selectedCourse) setSelectedCourse(courses[0])
    if (sortedTeachers.length > 0 && !selectedTeacherId)
      setSelectedTeacherId(String(sortedTeachers[0].id))
  }, [sortedClasses, courses, sortedTeachers])

  useEffect(() => {
    if (superiorCalendars.length === 0) {
      setSelectedSuperiorCalendarId("")
    } else if (!superiorCalendars.some((c) => String(c.id) === selectedSuperiorCalendarId)) {
      setSelectedSuperiorCalendarId(String(superiorCalendars[0].id))
    }

    if (integradoCalendars.length === 0) {
      setSelectedIntegradoCalendarId("")
    } else if (!integradoCalendars.some((c) => String(c.id) === selectedIntegradoCalendarId)) {
      setSelectedIntegradoCalendarId(String(integradoCalendars[0].id))
    }
  }, [superiorCalendars, integradoCalendars])

  function preview(
    type: "turma" | "curso" | "campus" | "professor" | "professores" | "calendario",
    value = "",
    calendarTitle = "",
  ) {
    const params = new URLSearchParams({ tipo: type })
    if (value) params.set("valor", value)
    if (calendarTitle) params.set("titulo", calendarTitle)

    navigate(`${ROUTES.printSchedules}?${params.toString()}`, {
      state: {
        sortedClasses,
        sortedTeachers,
        courses,
        calendarTitle,
      },
    })
  }

  const currentSuperiorCalendar = superiorCalendars.find(
    (c) => String(c.id) === selectedSuperiorCalendarId,
  )
  const currentIntegradoCalendar = integradoCalendars.find(
    (c) => String(c.id) === selectedIntegradoCalendarId,
  )

  return (
    <main className="home-main">
      <section className="home-surface home-intro">
        <div className="home-heading">
          <p>CENTRAL DE DOCUMENTOS · 2026.2</p>
          <h1>Horários acadêmicos do Campus Monteiro</h1>
          <span>
            Consulte a grade na tela ou prepare um documento por turma, curso, professor ou para
            todo o campus.
          </span>
        </div>
      </section>

      <section className="download-hub">
        <div className="hub-heading">
          <div>
            <p>HORÁRIOS DE TURMAS</p>
            <h2>Documentos por organização acadêmica</h2>
          </div>
          <span className="hub-icon">
            <Icon name="users" size={22} />
          </span>
        </div>
        <div className="hub-grid">
          <article className="hub-card">
            <span className="option-number">01</span>
            <div>
              <h3>Turma individual</h3>
              <p>Selecione uma turma de qualquer curso ou período.</p>
            </div>
            <label>
              <span>Turma</span>
              <select
                value={selectedClassId}
                onChange={(event) => setSelectedClassId(event.target.value)}
              >
                {sortedClasses.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.cursoNome ? `${item.nome} — ${item.cursoNome}` : item.nome}
                  </option>
                ))}
              </select>
            </label>
            <button onClick={() => preview("turma", selectedClassId)} disabled={!selectedClassId}>
              Acessar PDF <Icon name="chevron" size={16} />
            </button>
          </article>

          <article className="hub-card">
            <span className="option-number">02</span>
            <div>
              <h3>Curso completo</h3>
              <p>Reúne todas as turmas e períodos vinculados ao curso.</p>
            </div>
            <label>
              <span>Curso</span>
              <select
                value={selectedCourse}
                onChange={(event) => setSelectedCourse(event.target.value)}
              >
                {courses.map((course) => (
                  <option key={course} value={course}>
                    {course}
                  </option>
                ))}
              </select>
            </label>
            <button onClick={() => preview("curso", selectedCourse)} disabled={!selectedCourse}>
              Acessar PDF <Icon name="chevron" size={16} />
            </button>
          </article>

          <article className="hub-card">
            <span className="option-number">03</span>
            <div>
              <h3>Campus completo</h3>
              <p>Todos os cursos, turmas e períodos em um único documento organizado.</p>
            </div>
            <div className="campus-document-info">
              <Icon name="book" size={18} />
              <span>
                <strong>Grade acadêmica geral</strong>
                <small>IFPB Campus Monteiro</small>
              </span>
            </div>
            <button onClick={() => preview("campus")}>
              Acessar PDF <Icon name="chevron" size={16} />
            </button>
          </article>
        </div>
      </section>

      <section className="download-hub teacher-hub">
        <div className="hub-heading">
          <div>
            <p>HORÁRIOS DE PROFESSORES</p>
            <h2>Documentos do corpo docente</h2>
          </div>
          <span className="hub-icon">
            <Icon name="teacher" size={22} />
          </span>
        </div>
        <div className="hub-grid teacher-download-grid">
          <article className="hub-card">
            <span className="option-number">01</span>
            <div>
              <h3>Professor individual</h3>
              <p>Aulas, turmas, disciplinas, horários e ambientes do docente.</p>
            </div>
            <label>
              <span>Professor</span>
              <select
                value={selectedTeacherId}
                onChange={(event) => setSelectedTeacherId(event.target.value)}
              >
                {sortedTeachers.map((teacher) => (
                  <option key={teacher.id} value={teacher.id}>
                    {teacher.nome}
                  </option>
                ))}
              </select>
            </label>
            <button
              onClick={() => preview("professor", selectedTeacherId)}
              disabled={!selectedTeacherId}
            >
              Acessar PDF <Icon name="chevron" size={16} />
            </button>
          </article>

          <article className="hub-card">
            <span className="option-number">02</span>
            <div>
              <h3>Todos os professores</h3>
              <p>Horários semanais completos, separados e identificados por professor.</p>
            </div>
            <div className="campus-document-info">
              <Icon name="teacher" size={18} />
              <span>
                <strong>{sortedTeachers.length} professores</strong>
                <small>Com aulas cadastradas na grade</small>
              </span>
            </div>
            <button onClick={() => preview("professores")}>
              Acessar PDF <Icon name="chevron" size={16} />
            </button>
          </article>
        </div>
      </section>

      <section className="download-hub teacher-hub">
        <div className="hub-heading">
          <div>
            <p>CALENDÁRIO ACADÊMICO</p>
            <h2>Calendários oficiais do ano letivo</h2>
          </div>
          <span className="hub-icon">
            <Icon name="book" size={22} />
          </span>
        </div>
        <div className="hub-grid teacher-download-grid">
          <article className="hub-card">
            <span className="option-number">01</span>
            <div>
              <h3>Calendário Acadêmico - Superiores</h3>
              <p>Datas letivas, recessos e avaliações dos cursos superiores.</p>
            </div>
            {superiorCalendars.length > 1 ? (
              <label>
                <span>Documento publicado</span>
                <select
                  value={selectedSuperiorCalendarId}
                  onChange={(event) => setSelectedSuperiorCalendarId(event.target.value)}
                >
                  {superiorCalendars.map((cal) => (
                    <option key={cal.id} value={cal.id}>
                      {cal.titulo}
                    </option>
                  ))}
                </select>
              </label>
            ) : (
              <div className="campus-document-info">
                <Icon name="book" size={18} />
                <span>
                  <strong>
                    {currentSuperiorCalendar
                      ? currentSuperiorCalendar.titulo
                      : "Nenhum calendário publicado"}
                  </strong>
                  <small>
                    {currentSuperiorCalendar
                      ? currentSuperiorCalendar.nomeArquivo
                      : "Aguardando publicação pelo administrador"}
                  </small>
                </span>
              </div>
            )}
            <button
              onClick={() =>
                preview(
                  "calendario",
                  selectedSuperiorCalendarId,
                  currentSuperiorCalendar?.titulo || "Calendário Acadêmico - Superiores",
                )
              }
              disabled={!selectedSuperiorCalendarId}
            >
              Acessar PDF <Icon name="chevron" size={16} />
            </button>
          </article>

          <article className="hub-card">
            <span className="option-number">02</span>
            <div>
              <h3>Calendário Acadêmico - Integrados</h3>
              <p>Datas letivas, bimestres e recessos dos cursos técnicos integrados.</p>
            </div>
            {integradoCalendars.length > 1 ? (
              <label>
                <span>Documento publicado</span>
                <select
                  value={selectedIntegradoCalendarId}
                  onChange={(event) => setSelectedIntegradoCalendarId(event.target.value)}
                >
                  {integradoCalendars.map((cal) => (
                    <option key={cal.id} value={cal.id}>
                      {cal.titulo}
                    </option>
                  ))}
                </select>
              </label>
            ) : (
              <div className="campus-document-info">
                <Icon name="book" size={18} />
                <span>
                  <strong>
                    {currentIntegradoCalendar
                      ? currentIntegradoCalendar.titulo
                      : "Nenhum calendário publicado"}
                  </strong>
                  <small>
                    {currentIntegradoCalendar
                      ? currentIntegradoCalendar.nomeArquivo
                      : "Aguardando publicação pelo administrador"}
                  </small>
                </span>
              </div>
            )}
            <button
              onClick={() =>
                preview(
                  "calendario",
                  selectedIntegradoCalendarId,
                  currentIntegradoCalendar?.titulo || "Calendário Acadêmico - Integrados",
                )
              }
              disabled={!selectedIntegradoCalendarId}
            >
              Acessar PDF <Icon name="chevron" size={16} />
            </button>
          </article>
        </div>
      </section>
    </main>
  )
}