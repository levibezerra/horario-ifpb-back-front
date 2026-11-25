import { useEffect, useMemo, useState } from "react"
import { useSearchParams } from "react-router-dom"
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
import { api, apiErrorMessage } from "@/services/api"
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

const SLOTS_COMPLETO: TimeSlotDefinition[] = [
  ...SLOTS_INTEGRADO,
  { start: "18:10", end: "18:30", isBreak: true, breakLabel: "Intervalo" },
  ...SLOTS_SUPERIOR,
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

function parsePositiveParam(value: string | null): number | null {
  const num = Number(value)
  return Number.isFinite(num) && num > 0 ? num : null
}

type BulkDeleteConfirmState =
  | { type: "selected"; ids: number[] }
  | { type: "allClass"; turmaId: number; count: number; className: string }
  | null

export default function Horario() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [schedules, setSchedules] = useState<HorarioDTO[]>([])
  const [courses, setCourses] = useState<CursoDTO[]>([])
  const [classes, setClasses] = useState<TurmaDTO[]>([])
  const [subjects, setSubjects] = useState<DisciplinaDTO[]>([])
  const [teachers, setTeachers] = useState<ProfessorDTO[]>([])
  const [rooms, setRooms] = useState<AmbienteDTO[]>([])
  const [loading, setLoading] = useState(true)
  const [batchProcessing, setBatchProcessing] = useState(false)

  const filterAmbienteId = useMemo(
    () => parsePositiveParam(searchParams.get("ambienteId")),
    [searchParams],
  )
  const filterProfessorId = useMemo(
    () => parsePositiveParam(searchParams.get("professorId")),
    [searchParams],
  )
  const filterDisciplinaId = useMemo(
    () => parsePositiveParam(searchParams.get("disciplinaId")),
    [searchParams],
  )

  const [selectedClassId, setSelectedClassId] = useState<number | null>(() =>
    parsePositiveParam(searchParams.get("turmaId")),
  )
  const [selectedLesson, setSelectedLesson] = useState<ScheduleLesson | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<HorarioDTO | null>(null)
  const [initialValues, setInitialValues] = useState<ScheduleInitialValues | null>(null)
  const [publishConfirmation, setPublishConfirmation] = useState(false)

  // Estados para seleção múltipla e ações em lote
  const [selectionMode, setSelectionMode] = useState(false)
  const [selectedScheduleIds, setSelectedScheduleIds] = useState<number[]>([])
  const [bulkDeleteConfirm, setBulkDeleteConfirm] = useState<BulkDeleteConfirmState>(null)

  const handleSelectClass = (classId: number) => {
    setSelectedClassId(classId)
    setSelectedScheduleIds([])
    const targetClass = classes.find((c) => Number(c.id) === Number(classId))
    const nextParams = new URLSearchParams(searchParams)
    nextParams.set("turmaId", String(classId))
    if (targetClass?.cursoId) {
      nextParams.set("cursoId", String(targetClass.cursoId))
    }
    setSearchParams(nextParams, { replace: true })
  }

  const clearResourceFilters = () => {
    const nextParams = new URLSearchParams(searchParams)
    nextParams.delete("ambienteId")
    nextParams.delete("professorId")
    nextParams.delete("disciplinaId")
    setSearchParams(nextParams, { replace: true })
    setSelectedScheduleIds([])
  }

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

      const paramTurmaId = parsePositiveParam(searchParams.get("turmaId"))
      const paramCursoId = parsePositiveParam(searchParams.get("cursoId"))
      const paramAmbienteId = parsePositiveParam(searchParams.get("ambienteId"))
      const paramProfessorId = parsePositiveParam(searchParams.get("professorId"))
      const paramDisciplinaId = parsePositiveParam(searchParams.get("disciplinaId"))

      if (sortedClasses.length > 0) {
        const matchedByTurma = paramTurmaId
          ? sortedClasses.find((c) => Number(c.id) === paramTurmaId)
          : undefined

        const matchedByAmbiente =
          !matchedByTurma && paramAmbienteId
            ? (() => {
                const lessonInRoom = resSchedules.data.find(
                  (h) => Number(h.ambienteId) === paramAmbienteId && h.turmaId,
                )
                return lessonInRoom
                  ? sortedClasses.find((c) => Number(c.id) === Number(lessonInRoom.turmaId))
                  : undefined
              })()
            : undefined

        const matchedByProfessor =
          !matchedByTurma && !matchedByAmbiente && paramProfessorId
            ? (() => {
                const lessonByTeacher = resSchedules.data.find(
                  (h) => Number(h.professorId) === paramProfessorId && h.turmaId,
                )
                return lessonByTeacher
                  ? sortedClasses.find((c) => Number(c.id) === Number(lessonByTeacher.turmaId))
                  : undefined
              })()
            : undefined

        const matchedByDisciplina =
          !matchedByTurma && !matchedByAmbiente && !matchedByProfessor && paramDisciplinaId
            ? (() => {
                const lessonBySubject = resSchedules.data.find(
                  (h) => Number(h.disciplinaId) === paramDisciplinaId && h.turmaId,
                )
                return lessonBySubject
                  ? sortedClasses.find((c) => Number(c.id) === Number(lessonBySubject.turmaId))
                  : undefined
              })()
            : undefined

        const matchedByCurso =
          !matchedByTurma &&
          !matchedByAmbiente &&
          !matchedByProfessor &&
          !matchedByDisciplina &&
          paramCursoId
            ? sortedClasses.find((c) => Number(c.cursoId) === paramCursoId)
            : undefined

        const resolvedClass =
          matchedByTurma ??
          matchedByAmbiente ??
          matchedByProfessor ??
          matchedByDisciplina ??
          matchedByCurso

        if (resolvedClass) {
          setSelectedClassId(Number(resolvedClass.id))
        } else if (
          selectedClassId === null ||
          !sortedClasses.some((c) => Number(c.id) === Number(selectedClassId))
        ) {
          setSelectedClassId(Number(sortedClasses[0].id))
        }
      }
    } catch (err: unknown) {
      toast.error(apiErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAllData()
  }, [])

  useEffect(() => {
    const paramTurmaId = parsePositiveParam(searchParams.get("turmaId"))
    if (
      paramTurmaId &&
      classes.some((c) => Number(c.id) === paramTurmaId) &&
      Number(selectedClassId) !== paramTurmaId
    ) {
      setSelectedClassId(paramTurmaId)
    }
  }, [searchParams, classes, selectedClassId])

  const filteredRoom = useMemo(
    () =>
      filterAmbienteId
        ? rooms.find((r) => Number(r.id) === filterAmbienteId)
        : undefined,
    [filterAmbienteId, rooms],
  )

  const filteredTeacher = useMemo(
    () =>
      filterProfessorId
        ? teachers.find((t) => Number(t.id) === filterProfessorId)
        : undefined,
    [filterProfessorId, teachers],
  )

  const filteredSubject = useMemo(
    () =>
      filterDisciplinaId
        ? subjects.find((s) => Number(s.id) === filterDisciplinaId)
        : undefined,
    [filterDisciplinaId, subjects],
  )

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
    } catch (err: unknown) {
      toast.error(apiErrorMessage(err))
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

  const selectedCourse = useMemo(() => {
    if (!selectedClass) return undefined
    return courses.find((c) => Number(c.id) === Number(selectedClass.cursoId))
  }, [courses, selectedClass])

  const selectedModality = useMemo<ModalidadeCurso>(() => {
    const courseName = selectedClass?.cursoNome || selectedCourse?.nome || ""
    return inferModality(selectedCourse, courseName)
  }, [selectedClass, selectedCourse])

  const hasResourceFilter = Boolean(
    filterAmbienteId || filterProfessorId || filterDisciplinaId,
  )

  const gridSlots = useMemo<TimeSlotDefinition[]>(() => {
    if (hasResourceFilter) return SLOTS_COMPLETO
    return selectedModality === "SUPERIOR" ? SLOTS_SUPERIOR : SLOTS_INTEGRADO
  }, [hasResourceFilter, selectedModality])

  const visibleSchedules = useMemo(() => {
    if (filterAmbienteId) {
      return schedules.filter((item) => Number(item.ambienteId) === filterAmbienteId)
    }
    if (filterProfessorId) {
      return schedules.filter((item) => Number(item.professorId) === filterProfessorId)
    }
    if (filterDisciplinaId) {
      return schedules.filter((item) => Number(item.disciplinaId) === filterDisciplinaId)
    }
    if (!selectedClassId) return []
    return schedules.filter((item) => Number(item.turmaId) === Number(selectedClassId))
  }, [schedules, filterAmbienteId, filterProfessorId, filterDisciplinaId, selectedClassId])

  const visibleScheduleIds = useMemo(
    () => visibleSchedules.map((h) => Number(h.id)).filter((id) => Number.isFinite(id) && id > 0),
    [visibleSchedules]
  )

  // IDs selecionados que estão atualmente PUBLICADOS (elegíveis para remover da área pública)
  const selectedPublishedIds = useMemo(() => {
    if (!selectionMode || selectedScheduleIds.length === 0) return []
    const selectedSet = new Set(selectedScheduleIds)
    return visibleSchedules
      .filter((h) => h.id != null && selectedSet.has(Number(h.id)) && h.status === "PUBLICADO")
      .map((h) => Number(h.id))
  }, [selectionMode, selectedScheduleIds, visibleSchedules])

  const selectedLessons: ScheduleLesson[] = useMemo(() => {
    return visibleSchedules.map((item) => ({
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
  }, [visibleSchedules])

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

  function formatScheduleClassLabel(h: HorarioDTO): string {
    const turmaObj = classes.find((c) => Number(c.id) === Number(h.turmaId))
    const cursoObj = turmaObj
      ? courses.find((c) => Number(c.id) === Number(turmaObj.cursoId))
      : undefined

    const turmaNome = h.turmaNome || turmaObj?.nome || ""
    const cursoCodigo = cursoObj?.codigo?.trim()

    if (turmaNome && cursoCodigo) {
      return `${turmaNome} · ${cursoCodigo}`
    }
    return turmaNome || h.ambienteNome || ""
  }

  function openForm(record?: HorarioDTO, preset?: ScheduleInitialValues) {
    setEditing(record ?? null)
    setInitialValues(preset ?? null)
    setFormOpen(true)
  }

  function toggleScheduleSelection(id: number) {
    setSelectedScheduleIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    )
  }

  function toggleSelectAllVisible() {
    if (selectedScheduleIds.length === visibleScheduleIds.length) {
      setSelectedScheduleIds([])
    } else {
      setSelectedScheduleIds(visibleScheduleIds)
    }
  }

  function exitSelectionMode() {
    setSelectionMode(false)
    setSelectedScheduleIds([])
  }

  function handleOccupiedSlotClick(h: HorarioDTO) {
    if (selectionMode) {
      if (h.id != null) {
        toggleScheduleSelection(Number(h.id))
      }
      return
    }

    setSelectedLesson({
      id: String(h.id),
      className: formatScheduleClassLabel(h) || selectedClass?.nome || "",
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
    } catch (err: unknown) {
      toast.error(apiErrorMessage(err))
    }
  }

  async function handleConfirmBulkDelete() {
    if (!bulkDeleteConfirm) return

    try {
      setBatchProcessing(true)
      if (bulkDeleteConfirm.type === "allClass") {
        await api.delete(`${API_ENDPOINTS.horariosPorTurma}/${bulkDeleteConfirm.turmaId}`)
        toast.success(
          `Todos os horários da turma ${bulkDeleteConfirm.className} foram excluídos!`
        )
      } else {
        await api.post(API_ENDPOINTS.excluirHorariosLote, {
          horarioIds: bulkDeleteConfirm.ids,
        })
        const count = bulkDeleteConfirm.ids.length
        toast.success(
          count === 1
            ? "1 bloco de aula excluído com sucesso!"
            : `${count} blocos de aula excluídos com sucesso!`
        )
      }
      setSelectedScheduleIds([])
      setSelectionMode(false)
      setBulkDeleteConfirm(null)
      await loadAllData()
    } catch (err: unknown) {
      toast.error(apiErrorMessage(err))
    } finally {
      setBatchProcessing(false)
    }
  }

  async function handleUnpublishSelected() {
    if (selectedPublishedIds.length === 0) return

    try {
      setBatchProcessing(true)
      await api.post(API_ENDPOINTS.despublicarHorarios, {
        horarioIds: selectedPublishedIds,
      })

      const count = selectedPublishedIds.length
      toast.success(
        count === 1
          ? "1 bloco removido da área pública e retornado para rascunho."
          : `${count} blocos removidos da área pública e retornados para rascunho.`
      )
      setSelectedScheduleIds([])
      setSelectionMode(false)
      await loadAllData()
    } catch (err: unknown) {
      toast.error(apiErrorMessage(err))
    } finally {
      setBatchProcessing(false)
    }
  }

  function handleEmptySlotClick(day: DiaSemana, slot: TimeSlotDefinition) {
    if (selectionMode) return
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
      lockContextFields: true,
      ...(filterAmbienteId ? { ambienteId: filterAmbienteId } : {}),
      ...(filterProfessorId ? { professorId: filterProfessorId } : {}),
      ...(filterDisciplinaId ? { disciplinaId: filterDisciplinaId } : {}),
    })
  }

  const headingTitle = filteredRoom
    ? filteredRoom.nome
    : filteredTeacher
      ? filteredTeacher.nome
      : filteredSubject
        ? filteredSubject.nome
        : selectedClass?.nome ?? ""

  const headingSubtitle = useMemo(() => {
    if (filteredRoom) {
      return filteredRoom.localizacao || "Horários vinculados ao ambiente"
    }
    if (filteredTeacher) {
      return filteredTeacher.email || "Horários vinculados ao docente"
    }
    if (filteredSubject) {
      const subjectAny = filteredSubject as DisciplinaDTO & {
        cursoIds?: number[]
        cursosNomes?: string[]
      }
      const ids = Array.isArray(subjectAny.cursoIds)
        ? subjectAny.cursoIds.map(Number)
        : filteredSubject.cursoId
          ? [Number(filteredSubject.cursoId)]
          : []

      if (ids.length > 0) {
        const labels = ids
          .map((id) => {
            const c = courses.find((item) => Number(item.id) === id)
            if (!c) return null
            return c.codigo ? `${c.nome} (${c.codigo})` : c.nome
          })
          .filter(Boolean)
        if (labels.length > 0) return labels.join(" · ")
      }

      return (
        subjectAny.cursosNomes?.join(" · ") ||
        filteredSubject.cursoNome ||
        "Horários vinculados à disciplina"
      )
    }
    return selectedClass?.cursoNome || selectedCourse?.nome || ""
  }, [filteredRoom, filteredTeacher, filteredSubject, courses, selectedClass, selectedCourse])

  const allVisibleSelected =
    visibleScheduleIds.length > 0 &&
    selectedScheduleIds.length === visibleScheduleIds.length

  const canUnpublishSelected =
    !loading &&
    !batchProcessing &&
    selectionMode &&
    selectedPublishedIds.length > 0

  return (
    <div className="admin-management horario-page">
      <div className="admin-page-heading">
        <div>
          <span>GRADE ACADÊMICA</span>
          <h1>Gerenciar horários</h1>
          <p>Clique em um bloco vazio da grade para cadastrar uma aula ou em um bloco preenchido para gerenciar.</p>
        </div>
        <div className="publish-control">
          <div className="publish-actions">
            <button
              type="button"
              className="admin-danger-outline"
              onClick={handleUnpublishSelected}
              disabled={!canUnpublishSelected}
              title={
                !selectionMode
                  ? "Clique em \"Selecionar\" na grade e marque os blocos publicados que deseja remover"
                  : selectedPublishedIds.length === 0
                    ? "Selecione pelo menos um bloco publicado na grade"
                    : `Remover ${selectedPublishedIds.length} bloco(s) selecionado(s) da área pública`
              }
            >
              <AdminIcon name="close" size={16} /> Remover da área pública
              {canUnpublishSelected ? ` (${selectedPublishedIds.length})` : ""}
            </button>

            <div className="publish-primary-group">
              <span className={`publish-status-badge ${draftCount ? "has-drafts" : ""}`}>
                {draftCount
                  ? `${draftCount} ${draftCount === 1 ? "rascunho pendente" : "rascunhos pendentes"}`
                  : "Grade publicada"}
              </span>
              <button
                type="button"
                className="admin-primary"
                onClick={() => setPublishConfirmation(true)}
                disabled={loading || batchProcessing || !draftCount}
              >
                <AdminIcon name="check" size={16} /> Publicar horários
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Pré-visualização interativa por turma / ambiente / professor / disciplina */}
      <section className="admin-surface horario-schedule-preview">
        <div className="surface-heading horario-surface-heading">
          <div>
            <span>
              {filteredRoom
                ? "HORÁRIOS VINCULADOS AO AMBIENTE"
                : filteredTeacher
                  ? "HORÁRIOS VINCULADOS AO PROFESSOR"
                  : filteredSubject
                    ? "HORÁRIOS VINCULADOS À DISCIPLINA"
                    : `GRADE INTERATIVA (${selectedModality === "SUPERIOR" ? "NOTURNO · 18:30-22:10" : "INTEGRADO · 07:00-18:10"})`}
            </span>
            <h2>
              {filteredRoom
                ? `Ocupação: ${filteredRoom.nome}`
                : filteredTeacher
                  ? `Aulas de ${filteredTeacher.nome}`
                  : filteredSubject
                    ? `Aulas de ${filteredSubject.nome}`
                    : "Horário acadêmico por turma"}
            </h2>
          </div>

          <div style={{ display: "flex", alignItems: "flex-end", gap: "0.75rem", flexWrap: "wrap" }}>
            {hasResourceFilter ? (
              <button
                type="button"
                className="admin-primary"
                onClick={clearResourceFilters}
              >
                <AdminIcon name="close" size={16} /> Ver grade por turma
              </button>
            ) : (
              <label className="admin-form-field horario-class-select">
                <span>Selecione a turma</span>
                <select
                  value={selectedClassId ?? ""}
                  onChange={(e) => handleSelectClass(Number(e.target.value))}
                  disabled={selectionMode}
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
            )}
          </div>
        </div>

        {(selectedClass || hasResourceFilter) ? (
          <>
            <div className="horario-heading-toolbar">
              <ScheduleHeading
                mode={filteredRoom ? "room" : filteredTeacher ? "teacher" : "class"}
                selected={headingTitle}
                course={headingSubtitle}
                lessons={selectedLessons}
              />

              {visibleScheduleIds.length > 0 && (
                <div className="horario-compact-actions" role="toolbar" aria-label="Ações dos blocos da grade">
                  {!selectionMode ? (
                    <>
                      <button
                        type="button"
                        className="horario-mini-btn"
                        onClick={() => {
                          setSelectionMode(true)
                          setSelectedScheduleIds([])
                        }}
                        disabled={batchProcessing}
                      >
                        <AdminIcon name="check" size={13} /> Selecionar
                      </button>

                      {!hasResourceFilter && selectedClass && (
                        <button
                          type="button"
                          className="horario-mini-btn danger"
                          onClick={() =>
                            setBulkDeleteConfirm({
                              type: "allClass",
                              turmaId: Number(selectedClass.id),
                              count: visibleScheduleIds.length,
                              className: selectedClass.nome,
                            })
                          }
                          disabled={batchProcessing}
                        >
                          <AdminIcon name="trash" size={13} /> Deletar
                        </button>
                      )}
                    </>
                  ) : (
                    <>
                      <label className="horario-mini-check">
                        <input
                          type="checkbox"
                          checked={allVisibleSelected}
                          onChange={toggleSelectAllVisible}
                        />
                        <span>Todos ({visibleScheduleIds.length})</span>
                      </label>

                      <button
                        type="button"
                        className="horario-mini-btn"
                        onClick={exitSelectionMode}
                        disabled={batchProcessing}
                      >
                        Cancelar
                      </button>

                      <button
                        type="button"
                        className="horario-mini-btn danger"
                        disabled={selectedScheduleIds.length === 0 || batchProcessing}
                        onClick={() =>
                          setBulkDeleteConfirm({
                            type: "selected",
                            ids: selectedScheduleIds,
                          })
                        }
                      >
                        <AdminIcon name="trash" size={13} /> Deletar ({selectedScheduleIds.length})
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>

            <div className="schedule-scroll">
              <div className="schedule-grid" aria-label={`Grade de ${headingTitle}`}>
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
                        const cellSchedules = visibleSchedules.filter((h) => {
                          if (h.diaSemana !== day.key) return false
                          const start = h.horarioInicio.substring(0, 5)
                          const end = h.horarioFim.substring(0, 5)
                          return start <= slot.start && end >= slot.end
                        })

                        return (
                          <div className="grid-cell" key={`${day.key}-${slot.start}`}>
                            {cellSchedules.length > 0 ? (
                              cellSchedules.map((h) => {
                                const scheduleId = Number(h.id)
                                const isChecked = selectionMode && selectedScheduleIds.includes(scheduleId)

                                return (
                                  <button
                                    type="button"
                                    key={h.id}
                                    className="lesson-block"
                                    style={{
                                      backgroundColor: getDisciplinaColor(h.disciplinaNome || ""),
                                      position: "relative",
                                      outline: isChecked ? "2.5px solid #dc2626" : undefined,
                                      outlineOffset: isChecked ? "-2px" : undefined,
                                    }}
                                    onClick={() => handleOccupiedSlotClick(h)}
                                    title={
                                      selectionMode
                                        ? "Clique para marcar ou desmarcar este bloco"
                                        : "Clique para editar ou excluir este bloco"
                                    }
                                  >
                                    {selectionMode && (
                                      <span
                                        style={{
                                          position: "absolute",
                                          top: "6px",
                                          right: "6px",
                                          display: "inline-flex",
                                          alignItems: "center",
                                          justifyContent: "center",
                                          backgroundColor: "#ffffff",
                                          borderRadius: "4px",
                                          padding: "2px",
                                          boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
                                        }}
                                      >
                                        <input
                                          type="checkbox"
                                          checked={isChecked}
                                          onChange={() => {}}
                                          onClick={(e) => {
                                            e.stopPropagation()
                                            toggleScheduleSelection(scheduleId)
                                          }}
                                          aria-label={`Selecionar aula ${h.disciplinaNome}`}
                                          style={{
                                            width: "15px",
                                            height: "15px",
                                            margin: 0,
                                            accentColor: "#dc2626",
                                            cursor: "pointer",
                                          }}
                                        />
                                      </span>
                                    )}

                                    <strong>{h.disciplinaNome}</strong>
                                    <span>{h.professorNome}</span>
                                    {hasResourceFilter ? (
                                      <small style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                                        <Icon name="users" />
                                        <span>{formatScheduleClassLabel(h)}</span>
                                      </small>
                                    ) : (
                                      <small>{h.ambienteNome}</small>
                                    )}
                                    {h.status === "RASCUNHO" && <em>Rascunho</em>}
                                  </button>
                                )
                              })
                            ) : (
                              <button
                                type="button"
                                className="free-slot interactive-free-slot"
                                onClick={() => handleEmptySlotClick(day.key, slot)}
                                disabled={selectionMode}
                                title={
                                  selectionMode
                                    ? undefined
                                    : `Clique para adicionar aula em ${day.label} (${slot.code} · ${slot.start}-${slot.end})`
                                }
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

      {/* Modal de confirmação de publicação */}
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

      {/* Modal de confirmação de exclusão em lote / apagar todos da turma */}
      {bulkDeleteConfirm && (
        <div className="admin-modal-layer" role="alertdialog" aria-modal="true" aria-labelledby="bulk-delete-title">
          <button
            className="admin-modal-backdrop"
            onClick={() => !batchProcessing && setBulkDeleteConfirm(null)}
            aria-label="Cancelar exclusão"
          />
          <section className="admin-confirm">
            <span style={{ backgroundColor: "rgba(220, 38, 38, 0.12)", color: "#dc2626" }}>
              <AdminIcon name="trash" size={24} />
            </span>
            <h2 id="bulk-delete-title">
              {bulkDeleteConfirm.type === "allClass"
                ? `Apagar todos os horários da turma ${bulkDeleteConfirm.className}?`
                : `Excluir ${bulkDeleteConfirm.ids.length} bloco(s) selecionado(s)?`}
            </h2>
            <p>
              {bulkDeleteConfirm.type === "allClass"
                ? `Esta ação excluirá permanentemente todos os ${bulkDeleteConfirm.count} blocos de aula cadastrados para a turma ${bulkDeleteConfirm.className}.`
                : `Esta ação excluirá permanentemente os ${bulkDeleteConfirm.ids.length} blocos de aula marcados na grade.`}
            </p>
            <div>
              <button
                type="button"
                onClick={() => setBulkDeleteConfirm(null)}
                disabled={batchProcessing}
              >
                Cancelar
              </button>
              <button
                type="button"
                style={{ backgroundColor: "#dc2626", color: "#ffffff" }}
                onClick={handleConfirmBulkDelete}
                disabled={batchProcessing}
              >
                {batchProcessing ? "Excluindo..." : "Confirmar exclusão"}
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  )
}