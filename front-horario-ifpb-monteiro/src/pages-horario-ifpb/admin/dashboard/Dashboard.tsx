import { useEffect, useMemo, useState } from "react"
import { AdminIcon, type AdminIconName } from "@/components/Icon"
import { ScheduleGrid, ScheduleHeading } from "@/components/ScheduleGrid"
import { ScheduleFormModal } from "@/components/ScheduleFormModal"
import { useNavigate } from "react-router-dom"
import { ROUTES } from "@/routes/paths"
import type {
  AmbienteDTO,
  CursoDTO,
  DisciplinaDTO,
  HorarioDTO,
  ProfessorDTO,
  ScheduleLesson,
  TurmaDTO,
} from "@/types/api"
import { api } from "@/services/api"
import { API_ENDPOINTS } from "@/services/api-support/endpoints"
import "./dashboard.css"
import { toast } from "react-toastify"

export default function Dashboard() {
  const navigate = useNavigate()
  const [courses, setCourses] = useState<CursoDTO[]>([])
  const [classes, setClasses] = useState<TurmaDTO[]>([])
  const [subjects, setSubjects] = useState<DisciplinaDTO[]>([])
  const [teachers, setTeachers] = useState<ProfessorDTO[]>([])
  const [rooms, setRooms] = useState<AmbienteDTO[]>([])
  const [schedules, setSchedules] = useState<HorarioDTO[]>([])

  const [selectedClassId, setSelectedClassId] = useState<number | null>(null)
  const [publishConfirmation, setPublishConfirmation] = useState(false)
  const [editingSchedule, setEditingSchedule] = useState<HorarioDTO | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [loading, setLoading] = useState(true)

  const fetchData = async () => {
    try {
      setLoading(true)
      const [resCourses, resClasses, resSubjects, resTeachers, resRooms, resSchedules] = await Promise.all([
        api.get<CursoDTO[]>(API_ENDPOINTS.cursos),
        api.get<TurmaDTO[]>(API_ENDPOINTS.turmas),
        api.get<DisciplinaDTO[]>(API_ENDPOINTS.disciplinas),
        api.get<ProfessorDTO[]>(API_ENDPOINTS.professores),
        api.get<AmbienteDTO[]>(API_ENDPOINTS.ambientes),
        api.get<HorarioDTO[]>(API_ENDPOINTS.horarios),
      ])

      setCourses(resCourses.data)
      setClasses(resClasses.data)
      setSubjects(resSubjects.data)
      setTeachers(resTeachers.data)
      setRooms(resRooms.data)
      setSchedules(resSchedules.data)

      if (resClasses.data.length > 0 && selectedClassId === null) {
        setSelectedClassId(resClasses.data[0].id!)
      }
    } catch (err: any) {
      toast.error("Erro ao carregar dados do Dashboard.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const draftSchedules = useMemo(() => schedules.filter((item) => item.status === "RASCUNHO"), [schedules])
  const draftCount = draftSchedules.length

  const handlePublish = async () => {
    try {
      const draftIds = draftSchedules.map((h) => h.id!)
      await api.post(API_ENDPOINTS.publicarHorarios, { horarioIds: draftIds })
      toast.success("Horários publicados com sucesso!")
      fetchData()
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Erro ao publicar horários.")
    } finally {
      setPublishConfirmation(false)
    }
  }

  const handleEditLesson = (lessonId: string) => {
    const targetSchedule = schedules.find((s) => s.id === Number(lessonId))
    if (targetSchedule) {
      setEditingSchedule(targetSchedule)
      setFormOpen(true)
    } else {
      toast.error("Bloco de horário não encontrado.")
    }
  }

  const handleDeleteLesson = async (lessonId: string) => {
    try {
      await api.delete(`${API_ENDPOINTS.horarios}/${lessonId}`)
      toast.success("Horário excluído com sucesso!")
      await fetchData()
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Erro ao excluir horário.")
      throw err
    }
  }

  const indicators = [
    { label: "Turmas cadastradas", value: classes.length, icon: "classes" as AdminIconName, to: ROUTES.adminClasses, note: "Turmas disponíveis" },
    { label: "Disciplinas", value: subjects.length, icon: "subjects" as AdminIconName, to: ROUTES.adminSubjects, note: "Disciplinas cadastradas" },
    { label: "Professores", value: teachers.length, icon: "teachers" as AdminIconName, to: ROUTES.adminTeachers, note: "Docentes cadastrados" },
    { label: "Ambientes", value: rooms.length, icon: "rooms" as AdminIconName, to: ROUTES.adminRooms, note: "Ambientes cadastrados" },
    { label: "Horários cadastrados", value: schedules.length, icon: "schedules" as AdminIconName, to: ROUTES.adminSchedules, note: "Blocos de aula" },
  ]

  const selectedClass = useMemo(() => classes.find((c) => c.id === selectedClassId), [classes, selectedClassId])

  const selectedLessons: ScheduleLesson[] = useMemo(() => {
    if (!selectedClassId) return []
    return schedules
      .filter((item) => item.turmaId === selectedClassId)
      .map((item) => ({
        id: String(item.id),
        className: item.turmaNome || "",
        subject: item.disciplinaNome || "",
        teacher: item.professorNome || "",
        room: item.ambienteNome || "",
        day: item.diaSemana,
        start: item.horarioInicio,
        end: item.horarioFim,
        status: item.status || "RASCUNHO",
        rawSubject: item.disciplinaNome || "",
        needsReview: false,
      }))
  }, [schedules, selectedClassId])

  return (
    <div className="admin-dashboard">
      <div className="admin-page-heading">
        <div>
          <span>PAINEL PRINCIPAL</span>
          <h1>Visão geral</h1>
          <p>Consulte a grade acadêmica e acompanhe os cadastros do sistema.</p>
        </div>
        <div className="publish-control">
          <span className={draftCount ? "has-drafts" : ""}>
            {draftCount ? `${draftCount} ${draftCount === 1 ? "rascunho pendente" : "rascunhos pendentes"}` : "Grade publicada"}
          </span>
          <button className="admin-primary" onClick={() => setPublishConfirmation(true)} disabled={!draftCount}>
            <AdminIcon name="check" size={18} /> Publicar horários
          </button>
        </div>
      </div>

      <div className="indicator-grid">
        {indicators.map((item) => (
          <button className="indicator-card" key={item.label} onClick={() => navigate(item.to)}>
            <span><AdminIcon name={item.icon} size={22} /></span>
            <strong>{loading ? "..." : item.value}</strong>
            <div>{item.label}</div>
            <small>{item.note}</small>
          </button>
        ))}
      </div>

      <section className="admin-surface dashboard-schedule-preview">
        <div className="surface-heading">
          <div>
            <span>PRÉ-VISUALIZAÇÃO</span>
            <h2>Horário acadêmico por turma</h2>
          </div>
          <label className="admin-form-field">
            <span>Selecione a turma</span>
            <select value={selectedClassId ?? ""} onChange={(e) => setSelectedClassId(Number(e.target.value))}>
              {classes.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.cursoNome ? `${item.nome} – ${item.cursoNome}` : item.nome}
                </option>
              ))}
            </select>
          </label>
        </div>

        {selectedClass ? (
          <>
            <ScheduleHeading mode="class" selected={selectedClass.nome} course={selectedClass.cursoNome || ""} lessons={selectedLessons} />
            <ScheduleGrid
              lessons={selectedLessons}
              mode="class"
              label={selectedClass.nome}
              isAdmin
              onEditLesson={handleEditLesson}
              onDeleteLesson={handleDeleteLesson}
            />
          </>
        ) : (
          <p>{loading ? "Carregando turmas..." : "Nenhuma turma cadastrada."}</p>
        )}
      </section>

      <ScheduleFormModal
        open={formOpen}
        editing={editingSchedule}
        courses={courses}
        classes={classes}
        subjects={subjects}
        teachers={teachers}
        rooms={rooms}
        onClose={() => {
          setFormOpen(false)
          setEditingSchedule(null)
        }}
        onSaved={fetchData}
      />

      {publishConfirmation && (
        <div className="admin-modal-layer" role="alertdialog" aria-modal="true" aria-labelledby="publish-title">
          <button className="admin-modal-backdrop" onClick={() => setPublishConfirmation(false)} aria-label="Cancelar publicação" />
          <section className="admin-confirm publish-confirm">
            <span><AdminIcon name="schedules" size={24} /></span>
            <h2 id="publish-title">Publicar horários?</h2>
            <p>Tem certeza de que deseja publicar os {draftCount} horários em rascunho? Após a confirmação, eles ficarão disponíveis na consulta pública.</p>
            <div>
              <button onClick={() => setPublishConfirmation(false)}>Cancelar</button>
              <button className="confirm-publish" onClick={handlePublish}>Confirmar publicação</button>
            </div>
          </section>
        </div>
      )}
    </div>
  )
}