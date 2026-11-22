import { useEffect, useState, type FormEvent } from "react"
import { AdminIcon, type AdminIconName } from "@/components/Icon"
import { useNavigate } from "react-router-dom"
import { ROUTES } from "@/routes/paths"
import type {
  AmbienteDTO,
  CursoDTO,
  DisciplinaDTO,
  HorarioDTO,
  ProfessorDTO,
  TurmaDTO,
} from "@/types/api"
import { api, apiErrorMessage } from "@/services/api"
import { API_ENDPOINTS } from "@/services/api-support/endpoints"
import { usePeriodoLetivo } from "@/hooks/usePeriodoLetivo"
import "./dashboard.css"
import { toast } from "react-toastify"

const ACADEMIC_CALENDARS_ENDPOINT =
  (API_ENDPOINTS as Record<string, string>).calendariosAcademicos || "/calendarios-academicos"

export default function Dashboard() {
  const navigate = useNavigate()
  const { periodoLetivo, loading: loadingPeriodo, atualizarPeriodoLetivo } = usePeriodoLetivo()

  const [courses, setCourses] = useState<CursoDTO[]>([])
  const [classes, setClasses] = useState<TurmaDTO[]>([])
  const [subjects, setSubjects] = useState<DisciplinaDTO[]>([])
  const [teachers, setTeachers] = useState<ProfessorDTO[]>([])
  const [rooms, setRooms] = useState<AmbienteDTO[]>([])
  const [schedules, setSchedules] = useState<HorarioDTO[]>([])
  const [academicCalendarsCount, setAcademicCalendarsCount] = useState(0)
  const [loading, setLoading] = useState(true)

  // Estados de edição do período letivo
  const [editandoPeriodo, setEditandoPeriodo] = useState(false)
  const [novoPeriodo, setNovoPeriodo] = useState("")
  const [salvandoPeriodo, setSalvandoPeriodo] = useState(false)

  const fetchData = async () => {
    try {
      setLoading(true)
      const [
        resCourses,
        resClasses,
        resSubjects,
        resTeachers,
        resRooms,
        resSchedules,
        resAcademicCalendars,
      ] = await Promise.all([
        api.get<CursoDTO[]>(API_ENDPOINTS.cursos),
        api.get<TurmaDTO[]>(API_ENDPOINTS.turmas),
        api.get<DisciplinaDTO[]>(API_ENDPOINTS.disciplinas),
        api.get<ProfessorDTO[]>(API_ENDPOINTS.professores),
        api.get<AmbienteDTO[]>(API_ENDPOINTS.ambientes),
        api.get<HorarioDTO[]>(API_ENDPOINTS.horarios),
        api.get(ACADEMIC_CALENDARS_ENDPOINT),
      ])

      const rawCalendars = resAcademicCalendars.data
      const calendarsList = Array.isArray(rawCalendars)
        ? rawCalendars
        : rawCalendars
        ? [rawCalendars]
        : []

      setCourses(resCourses.data)
      setClasses(resClasses.data)
      setSubjects(resSubjects.data)
      setTeachers(resTeachers.data)
      setRooms(resRooms.data)
      setSchedules(resSchedules.data)
      setAcademicCalendarsCount(calendarsList.length)
    } catch {
      toast.error("Erro ao carregar dados do Dashboard.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const iniciarEdicaoPeriodo = () => {
    setNovoPeriodo(periodoLetivo)
    setEditandoPeriodo(true)
  }

  const cancelarEdicaoPeriodo = () => {
    setEditandoPeriodo(false)
    setNovoPeriodo("")
  }

  const handleSalvarPeriodo = async (e: FormEvent) => {
    e.preventDefault()
    const valorLimpo = novoPeriodo.trim()

    if (!/^\d{4}\.[12]$/.test(valorLimpo)) {
      toast.warning("Formato inválido. Utilize AAAA.1 ou AAAA.2 (ex: 2027.1).")
      return
    }

    try {
      setSalvandoPeriodo(true)
      await atualizarPeriodoLetivo(valorLimpo)
      toast.success(`Período letivo atualizado para ${valorLimpo}.`)
      setEditandoPeriodo(false)
    } catch (err) {
      toast.error(apiErrorMessage(err) || "Erro ao atualizar o período letivo.")
    } finally {
      setSalvandoPeriodo(false)
    }
  }

  const indicators = [
    {
      label: "Cursos",
      value: courses.length,
      icon: "courses" as AdminIconName,
      to: ROUTES.adminCourses,
      note: "Cursos cadastrados",
    },
    {
      label: "Turmas",
      value: classes.length,
      icon: "classes" as AdminIconName,
      to: ROUTES.adminClasses,
      note: "Turmas disponíveis",
    },
    {
      label: "Disciplinas",
      value: subjects.length,
      icon: "subjects" as AdminIconName,
      to: ROUTES.adminSubjects,
      note: "Disciplinas cadastradas",
    },
    {
      label: "Professores",
      value: teachers.length,
      icon: "teachers" as AdminIconName,
      to: ROUTES.adminTeachers,
      note: "Docentes cadastrados",
    },
    {
      label: "Ambientes",
      value: rooms.length,
      icon: "rooms" as AdminIconName,
      to: ROUTES.adminRooms,
      note: "Ambientes cadastrados",
    },
    {
      label: "Horários",
      value: schedules.length,
      icon: "schedules" as AdminIconName,
      to: ROUTES.adminSchedules,
      note: "Blocos de aula",
    },
    {
      label: "Calendário Acadêmico",
      value: academicCalendarsCount,
      icon: "filePdf" as AdminIconName,
      to: ROUTES.adminAcademicSchedules,
      note: "Documentos oficiais",
    },
  ]

  return (
    <div className="admin-dashboard">
      <div className="admin-page-heading">
        <div>
          <span>PAINEL PRINCIPAL</span>
          <h1>Visão geral</h1>
          <p>Acompanhe os cadastros gerais do sistema.</p>
        </div>
      </div>

      <div className="indicator-grid">
        {/* 1º Bloco: Período Letivo */}
        <div className="indicator-card periodo-indicator-card">
          <span className="indicator-icon-box">
            <AdminIcon name="semester" size={22} />
          </span>

          {!editandoPeriodo ? (
            <div className="indicator-card-body">
              <strong>{loadingPeriodo ? "..." : periodoLetivo}</strong>
              <div className="indicator-card-title">Período letivo</div>
              <div className="periodo-card-footer">
                <small>Semestre letivo vigente</small>
                <button
                  type="button"
                  className="periodo-edit-icon-btn"
                  onClick={iniciarEdicaoPeriodo}
                  disabled={loadingPeriodo}
                  aria-label="Editar período letivo"
                  title="Editar período letivo"
                >
                  <AdminIcon name="edit" size={16} />
                </button>
              </div>
            </div>
          ) : (
            <form className="periodo-card-form" onSubmit={handleSalvarPeriodo}>
              <input
                type="text"
                value={novoPeriodo}
                onChange={(e) => setNovoPeriodo(e.target.value)}
                placeholder="Ex: 2027.1"
                maxLength={6}
                disabled={salvandoPeriodo}
                autoFocus
              />
              <div className="periodo-card-form-actions">
                <button
                  type="submit"
                  className="periodo-btn-salvar"
                  disabled={salvandoPeriodo}
                >
                  {salvandoPeriodo ? "..." : "Salvar"}
                </button>
                <button
                  type="button"
                  className="periodo-btn-cancelar"
                  onClick={cancelarEdicaoPeriodo}
                  disabled={salvandoPeriodo}
                >
                  Cancelar
                </button>
              </div>
              <div className="indicator-card-title">Período letivo</div>
            </form>
          )}
        </div>

        {/* 2º ao 8º Bloco */}
        {indicators.map((item) => (
          <button
            type="button"
            className="indicator-card"
            key={item.label}
            onClick={() => navigate(item.to)}
          >
            <span className="indicator-icon-box">
              <AdminIcon name={item.icon} size={22} />
            </span>
            <div className="indicator-card-body">
              <strong>{loading ? "..." : item.value}</strong>
              <div className="indicator-card-title">{item.label}</div>
              <small>{item.note}</small>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}