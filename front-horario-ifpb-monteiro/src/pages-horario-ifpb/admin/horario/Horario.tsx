import { useEffect, useMemo, useState } from "react"
import { AdminIcon, Icon } from "@/components/Icon"
import { ScheduleHeading } from "@/components/ScheduleGrid"
import { ScheduleFormModal, type ScheduleInitialValues } from "@/components/ScheduleFormModal"
import { getDisciplinaColor } from "@/utils/colorGenerator"
import type {
  AmbienteDTO,
  CursoDTO,
  DiaSemana,
  DisciplinaDTO,
  HorarioDTO,
  ModalidadeCurso,
  ProfessorDTO,
  ScheduleLesson,
  TurmaDTO,
} from "@/types/api"
import { api } from "@/services/api"
import { API_ENDPOINTS } from "@/services/api-support/endpoints"
import "./horario.css"
import { toast } from "react-toastify"

type TimeSlotDefinition = {
  code?: string
  start: string
  end: string
  isBreak?: boolean
  breakLabel?: string
}

type AdminLessonModalProps = {
  lesson: ScheduleLesson
  onClose: () => void
  onEdit: (lessonId: string) => void
  onDelete: (lessonId: string) => Promise<void> | void
}

function AdminLessonModal({
  lesson,
  onClose,
  onEdit,
  onDelete,
}: AdminLessonModalProps) {
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)

  async function handleConfirmDelete() {
    if (!lesson.id) return
    try {
      setDeleting(true)
      await onDelete(lesson.id)
      onClose()
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="modal-layer" role="dialog" aria-modal="true" aria-labelledby="admin-lesson-title">
      <button className="modal-overlay" onClick={onClose} aria-label="Fechar detalhes" />
      <section className="lesson-modal">
        <div className="modal-top">
          <span><Icon name="book" /></span>
          <button onClick={onClose} aria-label="Fechar"><Icon name="x" /></button>
        </div>
        <p>GERENCIAR BLOCO DE AULA</p>
        <h2 id="admin-lesson-title">{lesson.subject}</h2>

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
            <Icon name="room" />
            <span>
              <small>Ambiente</small>
              <strong>{lesson.room || "Não informado"}</strong>
            </span>
          </div>
          <div>
            <Icon name="clock" />
            <span>
              <small>Dia e Horário</small>
              <strong>
                {lesson.day} · {lesson.start.substring(0, 5)}-{lesson.end.substring(0, 5)}
              </strong>
            </span>
          </div>
        </div>

        {!confirmingDelete ? (
          <div style={{ display: "flex", gap: "0.75rem", marginTop: "1rem" }}>
            <button
              type="button"
              className="modal-action"
              style={{ flex: 1, justifyContent: "center" }}
              onClick={() => {
                if (lesson.id) {
                  onClose()
                  onEdit(lesson.id)
                }
              }}
            >
              <AdminIcon name="edit" size={17} />
              Editar Bloco
            </button>

            <button
              type="button"
              className="modal-action"
              style={{
                flex: 1,
                justifyContent: "center",
                backgroundColor: "#dc2626",
                color: "#ffffff",
                borderColor: "#dc2626",
              }}
              onClick={() => setConfirmingDelete(true)}
            >
              <AdminIcon name="trash" size={17} />
              Excluir
            </button>
          </div>
        ) : (
          <div
            style={{
              marginTop: "1rem",
              padding: "0.875rem",
              borderRadius: "10px",
              backgroundColor: "rgba(220, 38, 38, 0.08)",
              border: "1px solid rgba(220, 38, 38, 0.25)",
            }}
          >
            <p
              style={{
                margin: "0 0 0.75rem",
                fontSize: "0.875rem",
                color: "#991b1b",
                textTransform: "none",
                letterSpacing: "normal",
              }}
            >
              Tem certeza que deseja excluir o bloco de <strong>{lesson.subject}</strong>?
            </p>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <button
                type="button"
                className="modal-action"
                style={{ flex: 1, justifyContent: "center", backgroundColor: "transparent", color: "inherit" }}
                onClick={() => setConfirmingDelete(false)}
                disabled={deleting}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="modal-action"
                style={{
                  flex: 1,
                  justifyContent: "center",
                  backgroundColor: "#dc2626",
                  color: "#ffffff",
                  borderColor: "#dc2626",
                }}
                onClick={handleConfirmDelete}
                disabled={deleting}
              >
                {deleting ? "Excluindo..." : "Confirmar Exclusão"}
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  )
}

const DIAS_SEMANA: { key: DiaSemana; label: string }[] = [
  { key: "SEGUNDA", label: "Segunda" },
  { key: "TERCA", label: "Terça" },
  { key: "QUARTA", label: "Quarta" },
  { key: "QUINTA", label: "Quinta" },
  { key: "SEXTA", label: "Sexta" },
]

// Faixa dos Cursos Integrados: 07:00 às 18:10
const SLOTS_INTEGRADO: TimeSlotDefinition[] = [
  { code: "M1", start: "07:00", end: "07:50" },
  { code: "M2", start: "07:50", end: "08:40" },
  { start: "08:40", end: "09:00", isBreak: true, breakLabel: "Intervalo" },
  { code: "M3", start: "09:00", end: "09:50" },
  { code: "M4", start: "09:50", end: "10:40" },
  { code: "M5", start: "10:40", end: "11:30" },
  { code: "M6", start: "11:30", end: "12:20" },
  { start: "12:20", end: "13:00", isBreak: true, breakLabel: "Almoço" },
  { code: "T1", start: "13:00", end: "13:50" },
  { code: "T2", start: "13:50", end: "14:40" },
  { code: "T3", start: "14:40", end: "15:30" },
  { start: "15:30", end: "15:40", isBreak: true, breakLabel: "Intervalo" },
  { code: "T4", start: "15:40", end: "16:30" },
  { code: "T5", start: "16:30", end: "17:20" },
  { code: "T6", start: "17:20", end: "18:10" },
]

// Faixa dos Cursos Superiores: 18:30 às 22:10
const SLOTS_SUPERIOR: TimeSlotDefinition[] = [
  { code: "N1", start: "18:30", end: "19:20" },
  { code: "N2", start: "19:20", end: "20:10" },
  { start: "20:10", end: "20:30", isBreak: true, breakLabel: "Intervalo" },
  { code: "N3", start: "20:30", end: "21:20" },
  { code: "N4", start: "21:20", end: "22:10" },
]

function compareNaturalPtBr(a: string, b: string) {
  return a.localeCompare(b, "pt-BR", { numeric: true, sensitivity: "base" })
}

function inferModality(course?: CursoDTO, courseName = ""): ModalidadeCurso {
  if (course?.modalidade) return course.modalidade

  const norm = courseName
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()

  if (
    norm.includes("superior") ||
    norm.includes("analise") ||
    norm.includes("construcao") ||
    norm.includes("licenciatura") ||
    norm.includes("bacharelado") ||
    norm.includes("tecnologia")
  ) {
    return "SUPERIOR"
  }
  return "INTEGRADO"
}

export default function Horario() {
  const [schedules, setSchedules] = useState<HorarioDTO[]>([])
  const [courses, setCourses] = useState<CursoDTO[]>([])
  const [classes, setClasses] = useState<TurmaDTO[]>([])
  const [subjects, setSubjects] = useState<DisciplinaDTO[]>([])
  const [teachers, setTeachers] = useState<ProfessorDTO[]>([])
  const [rooms, setRooms] = useState<AmbienteDTO[]>([])
  const [loading, setLoading] = useState(true)

  const [selectedClassId, setSelectedClassId] = useState<number | null>(null)
  const [selectedLesson, setSelectedLesson] = useState<ScheduleLesson | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<HorarioDTO | null>(null)
  const [initialValues, setInitialValues] = useState<ScheduleInitialValues | null>(null)
  const [publishConfirmation, setPublishConfirmation] = useState(false)

  const loadAllData = async () => {
    try {
      setLoading(true)
      const [resSchedules, resCourses, resClasses, resSubjects, resTeachers, resRooms] = await Promise.all([
        api.get<HorarioDTO[]>(API_ENDPOINTS.horarios),
        api.get<CursoDTO[]>(API_ENDPOINTS.cursos),
        api.get<TurmaDTO[]>(API_ENDPOINTS.turmas),
        api.get<DisciplinaDTO[]>(API_ENDPOINTS.disciplinas),
        api.get<ProfessorDTO[]>(API_ENDPOINTS.professores),
        api.get<AmbienteDTO[]>(API_ENDPOINTS.ambientes),
      ])

      const sortedCourses = [...resCourses.data].sort((a, b) =>
        compareNaturalPtBr(a.nome, b.nome)
      )

      const sortedClasses = [...resClasses.data].sort((a, b) => {
        const courseA =
          a.cursoNome ||
          sortedCourses.find((c) => Number(c.id) === Number(a.cursoId))?.nome ||
          "Outros Cursos"
        const courseB =
          b.cursoNome ||
          sortedCourses.find((c) => Number(c.id) === Number(b.cursoId))?.nome ||
          "Outros Cursos"

        const courseDiff = compareNaturalPtBr(courseA, courseB)
        if (courseDiff !== 0) return courseDiff
        return compareNaturalPtBr(a.nome, b.nome)
      })

      setSchedules(resSchedules.data)
      setCourses(sortedCourses)
      setClasses(sortedClasses)
      setSubjects(resSubjects.data)
      setTeachers(resTeachers.data)
      setRooms(resRooms.data)

      if (sortedClasses.length > 0 && selectedClassId === null) {
        setSelectedClassId(Number(sortedClasses[0].id))
      }
    } catch (err: any) {
      toast.error("Erro ao carregar os dados de horários.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAllData()
  }, [])

  const draftSchedules = useMemo(
    () => schedules.filter((item) => item.status === "RASCUNHO"),
    [schedules]
  )
  const draftCount = draftSchedules.length

  const handlePublish = async () => {
    try {
      const draftIds = draftSchedules.map((h) => h.id!)
      await api.post(API_ENDPOINTS.publicarHorarios, { horarioIds: draftIds })
      toast.success("Horários publicados com sucesso!")
      await loadAllData()
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Erro ao publicar horários.")
    } finally {
      setPublishConfirmation(false)
    }
  }

  const currentClassIndex = useMemo(
    () => classes.findIndex((c) => Number(c.id) === Number(selectedClassId)),
    [classes, selectedClassId]
  )

  const selectedClass = useMemo(
    () => (currentClassIndex >= 0 ? classes[currentClassIndex] : undefined),
    [classes, currentClassIndex]
  )

  function handlePrevClass() {
    if (classes.length === 0) return
    const prevIndex = currentClassIndex > 0 ? currentClassIndex - 1 : classes.length - 1
    setSelectedClassId(Number(classes[prevIndex].id))
  }

  function handleNextClass() {
    if (classes.length === 0) return
    const nextIndex = currentClassIndex >= 0 && currentClassIndex < classes.length - 1 ? currentClassIndex + 1 : 0
    setSelectedClassId(Number(classes[nextIndex].id))
  }

  const selectedCourse = useMemo(() => {
    if (!selectedClass) return undefined
    return courses.find((c) => Number(c.id) === Number(selectedClass.cursoId))
  }, [courses, selectedClass])

  const selectedModality = useMemo<ModalidadeCurso>(() => {
    const courseName = selectedClass?.cursoNome || selectedCourse?.nome || ""
    return inferModality(selectedCourse, courseName)
  }, [selectedClass, selectedCourse])

  const gridSlots = useMemo<TimeSlotDefinition[]>(() => {
    return selectedModality === "SUPERIOR" ? SLOTS_SUPERIOR : SLOTS_INTEGRADO
  }, [selectedModality])

  const classSchedules = useMemo(() => {
    if (!selectedClassId) return []
    return schedules.filter((item) => Number(item.turmaId) === Number(selectedClassId))
  }, [schedules, selectedClassId])

  const selectedLessons: ScheduleLesson[] = useMemo(() => {
    return classSchedules.map((item) => ({
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
  }, [classSchedules])

  const classesByCourse = useMemo(() => {
    const map = new Map<string, TurmaDTO[]>()
    classes.forEach((turma) => {
      const courseName =
        turma.cursoNome ||
        courses.find((c) => Number(c.id) === Number(turma.cursoId))?.nome ||
        "Outros Cursos"
      if (!map.has(courseName)) map.set(courseName, [])
      map.get(courseName)!.push(turma)
    })
    return Array.from(map.entries())
  }, [classes, courses])

  function openForm(record?: HorarioDTO, preset?: ScheduleInitialValues) {
    setEditing(record ?? null)
    setInitialValues(preset ?? null)
    setFormOpen(true)
  }

  function handleOccupiedSlotClick(h: HorarioDTO) {
    setSelectedLesson({
      id: String(h.id),
      className: h.turmaNome || selectedClass?.nome || "",
      subject: h.disciplinaNome || "",
      teacher: h.professorNome || "",
      room: h.ambienteNome || "",
      day: h.diaSemana,
      start: h.horarioInicio,
      end: h.horarioFim,
      status: h.status || "RASCUNHO",
      rawSubject: h.disciplinaNome || "",
      needsReview: false,
    })
  }

  function handleEditFromModal(lessonId: string) {
    const target = schedules.find((item) => String(item.id) === String(lessonId))
    if (target) {
      openForm(target)
    }
  }

  async function handleDeleteFromModal(lessonId: string) {
    try {
      await api.delete(`${API_ENDPOINTS.horarios}/${lessonId}`)
      toast.success("Horário excluído com sucesso!")
      await loadAllData()
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Erro ao excluir horário.")
    }
  }

  function handleEmptySlotClick(day: DiaSemana, slot: TimeSlotDefinition) {
    if (!selectedClass) {
      toast.info("Selecione uma turma antes de adicionar um bloco de aula.")
      return
    }
    openForm(undefined, {
      cursoId: Number(selectedClass.cursoId || selectedCourse?.id || 0),
      turmaId: Number(selectedClass.id),
      diaSemana: day,
      horarioInicio: slot.start,
      horarioFim: slot.end,
    })
  }

  return (
    <div className="admin-management horario-page">
      <div className="admin-page-heading">
        <div>
          <span>GRADE ACADÊMICA</span>
          <h1>Gerenciar horários</h1>
          <p>Clique em um bloco vazio da grade para cadastrar uma aula ou em um bloco preenchido para gerenciar.</p>
        </div>
        <div className="publish-control">
          <span className={draftCount ? "has-drafts" : ""}>
            {draftCount
              ? `${draftCount} ${draftCount === 1 ? "rascunho pendente" : "rascunhos pendentes"}`
              : "Grade publicada"}
          </span>
          <button
            className="admin-primary"
            onClick={() => setPublishConfirmation(true)}
            disabled={loading || !draftCount}
          >
            <AdminIcon name="check" size={18} /> Publicar horários
          </button>
        </div>
      </div>

      {/* Pré-visualização interativa por turma */}
      <section className="admin-surface horario-schedule-preview">
        <div className="surface-heading horario-surface-heading">
          <div>
            <span>
              GRADE INTERATIVA ({selectedModality === "SUPERIOR" ? "NOTURNO · 18:30-22:10" : "INTEGRADO · 07:00-18:10"})
            </span>
            <h2>Horário acadêmico por turma</h2>
          </div>

          <label className="admin-form-field horario-class-select">
            <span>Selecione a turma</span>
            <select
              value={selectedClassId ?? ""}
              onChange={(e) => setSelectedClassId(Number(e.target.value))}
            >
              {classesByCourse.map(([courseName, courseClasses]) => (
                <optgroup key={courseName} label={courseName}>
                  {courseClasses.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.nome}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </label>
        </div>

        {selectedClass ? (
          <>
            <ScheduleHeading
              mode="class"
              selected={selectedClass.nome}
              course={selectedClass.cursoNome || selectedCourse?.nome || ""}
              lessons={selectedLessons}
              
            />

            <div className="schedule-scroll">
              <div className="schedule-grid" aria-label={`Grade de ${selectedClass.nome}`}>
                <div className="grid-header time-header">
                  <AdminIcon name="clock" size={15} /> Horário
                </div>
                {DIAS_SEMANA.map((day) => (
                  <div className="grid-header" key={day.key}>
                    {day.label}
                  </div>
                ))}

                {gridSlots.map((slot) => {
                  if (slot.isBreak) {
                    return (
                      <div className="schedule-row" key={`${slot.start}-${slot.end}`}>
                        <div className="time-cell break-time">
                          <strong>{slot.breakLabel?.toUpperCase()}</strong>
                          <span>{slot.start}-{slot.end}</span>
                        </div>
                        {DIAS_SEMANA.map((day) => (
                          <div className="grid-cell break-cell" key={`${day.key}-${slot.start}`}>
                            <div className="break-block">
                              <strong>{slot.breakLabel}</strong>
                              <span>{slot.start}-{slot.end}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )
                  }

                  return (
                    <div className="schedule-row" key={`${slot.start}-${slot.end}`}>
                      <div className="time-cell">
                        <strong>{slot.code}</strong>
                        <span>{slot.start}-{slot.end}</span>
                      </div>

                      {DIAS_SEMANA.map((day) => {
                        const cellSchedules = classSchedules.filter((h) => {
                          if (h.diaSemana !== day.key) return false
                          const start = h.horarioInicio.substring(0, 5)
                          const end = h.horarioFim.substring(0, 5)
                          return start <= slot.start && end >= slot.end
                        })

                        return (
                          <div className="grid-cell" key={`${day.key}-${slot.start}`}>
                            {cellSchedules.length > 0 ? (
                              cellSchedules.map((h) => (
                                <button
                                  type="button"
                                  key={h.id}
                                  className="lesson-block"
                                  style={{ backgroundColor: getDisciplinaColor(h.disciplinaNome || "") }}
                                  onClick={() => handleOccupiedSlotClick(h)}
                                  title="Clique para editar ou excluir este bloco"
                                >
                                  <strong>{h.disciplinaNome}</strong>
                                  <span>{h.professorNome}</span>
                                  <small>{h.ambienteNome}</small>
                                  {h.status === "RASCUNHO" && <em>Rascunho</em>}
                                </button>
                              ))
                            ) : (
                              <button
                                type="button"
                                className="free-slot interactive-free-slot"
                                onClick={() => handleEmptySlotClick(day.key, slot)}
                                title={`Clique para adicionar aula em ${day.label} (${slot.code} · ${slot.start}-${slot.end})`}
                              >
                                <span>Sem aula cadastrada</span>
                              </button>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )
                })}
              </div>
            </div>
          </>
        ) : (
          <p className="horario-empty-message">
            {loading ? "Carregando turmas..." : "Nenhuma turma cadastrada."}
          </p>
        )}
      </section>

      {selectedLesson && (
        <AdminLessonModal
          lesson={selectedLesson}
          onClose={() => setSelectedLesson(null)}
          onEdit={handleEditFromModal}
          onDelete={handleDeleteFromModal}
        />
      )}

      <ScheduleFormModal
        open={formOpen}
        editing={editing}
        initialValues={initialValues}
        courses={courses}
        classes={classes}
        subjects={subjects}
        teachers={teachers}
        rooms={rooms}
        onClose={() => {
          setFormOpen(false)
          setEditing(null)
          setInitialValues(null)
        }}
        onSaved={loadAllData}
      />

      {publishConfirmation && (
        <div className="admin-modal-layer" role="alertdialog" aria-modal="true" aria-labelledby="publish-title">
          <button className="admin-modal-backdrop" onClick={() => setPublishConfirmation(false)} aria-label="Cancelar publicação" />
          <section className="admin-confirm publish-confirm">
            <span><AdminIcon name="schedules" size={24} /></span>
            <h2 id="publish-title">Publicar horários?</h2>
            <p>
              Tem certeza de que deseja publicar os {draftCount} horários em rascunho? Após a confirmação, eles ficarão disponíveis na consulta pública.
            </p>
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