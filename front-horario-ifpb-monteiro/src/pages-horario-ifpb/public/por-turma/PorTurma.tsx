import { useEffect, useState, useMemo, type ComponentProps } from "react"
import { Icon } from "@/components/Icon"
import { FilterSidebar } from "@/components/Sidebar"
import { MobileSelection, ScheduleGrid, ScheduleHeading } from "@/components/ScheduleGrid"
import { useFilterPanel } from "@/hooks/useFilterPanel"
import type {
  CursoDTO,
  HorarioDTO,
  ModalidadeCurso,
  ScheduleLesson,
  TurmaDTO,
} from "@/types/api"
import { api } from "@/services/api"
import { API_ENDPOINTS } from "@/services/api-support/endpoints"
import "./por-turma.css"

type SidebarGroups = ComponentProps<typeof FilterSidebar>["groups"]

function compareNaturalPtBr(a: string, b: string) {
  return a.localeCompare(b, "pt-BR", { numeric: true, sensitivity: "base" })
}

function getModalityOrder(modalidade?: ModalidadeCurso): number {
  if (modalidade === "INTEGRADO") return 0
  if (modalidade === "SUPERIOR") return 1
  if (modalidade === "SUBSEQUENTE") return 2
  return 3
}

function getModalitySectionLabel(modalidade?: ModalidadeCurso): string {
  if (modalidade === "INTEGRADO") return "Integrado"
  if (modalidade === "SUPERIOR") return "Superior"
  if (modalidade === "SUBSEQUENTE") return "Subsequente"
  return "Outros"
}

function inferCourseModality(course?: CursoDTO, courseName = ""): ModalidadeCurso | undefined {
  if (course?.modalidade) return course.modalidade

  const normalized = courseName
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()

  if (normalized.includes("tecnico") || normalized.includes("integrado")) return "INTEGRADO"
  if (
    normalized.includes("superior") ||
    normalized.includes("analise") ||
    normalized.includes("construcao") ||
    normalized.includes("licenciatura") ||
    normalized.includes("bacharelado") ||
    normalized.includes("tecnologia")
  ) {
    return "SUPERIOR"
  }
  return undefined
}

export default function PorTurma() {
  const panel = useFilterPanel()
  const [courses, setCourses] = useState<CursoDTO[]>([])
  const [classes, setClasses] = useState<TurmaDTO[]>([])
  const [schedules, setSchedules] = useState<HorarioDTO[]>([])
  const [selectedTurmaId, setSelectedTurmaId] = useState<number | null>(null)
  const [query, setQuery] = useState("")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true)
        const [resCourses, resClasses, resSchedules] = await Promise.all([
          api.get<CursoDTO[]>(API_ENDPOINTS.cursos),
          api.get<TurmaDTO[]>(API_ENDPOINTS.turmas),
          api.get<HorarioDTO[]>(API_ENDPOINTS.horarios),
        ])

        const sortedCourses = [...resCourses.data].sort((a, b) => {
          const modDiff = getModalityOrder(a.modalidade) - getModalityOrder(b.modalidade)
          if (modDiff !== 0) return modDiff
          return compareNaturalPtBr(a.nome, b.nome)
        })

        const sortedClasses = [...resClasses.data].sort((a, b) => {
          const courseObjA = sortedCourses.find((c) => c.id === a.cursoId)
          const courseObjB = sortedCourses.find((c) => c.id === b.cursoId)
          const courseNameA = a.cursoNome || courseObjA?.nome || "Outros Cursos"
          const courseNameB = b.cursoNome || courseObjB?.nome || "Outros Cursos"

          const modA = inferCourseModality(courseObjA, courseNameA)
          const modB = inferCourseModality(courseObjB, courseNameB)
          const modDiff = getModalityOrder(modA) - getModalityOrder(modB)
          if (modDiff !== 0) return modDiff

          const courseDiff = compareNaturalPtBr(courseNameA, courseNameB)
          if (courseDiff !== 0) return courseDiff

          return compareNaturalPtBr(a.nome, b.nome)
        })

        setCourses(sortedCourses)
        setClasses(sortedClasses)
        setSchedules(resSchedules.data.filter((h) => h.status === "PUBLICADO"))
        if (sortedClasses.length > 0) setSelectedTurmaId(sortedClasses[0].id!)
      } catch (err) {
        console.error("Erro ao carregar consulta por turma", err)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  const selectedTurma = useMemo(
    () => classes.find((c) => c.id === selectedTurmaId),
    [classes, selectedTurmaId]
  )

  const lessons: ScheduleLesson[] = useMemo(() => {
    if (!selectedTurmaId) return []
    return schedules
      .filter((item) => item.turmaId === selectedTurmaId)
      .map((item) => ({
        id: String(item.id),
        className: item.turmaNome || "",
        subject: item.disciplinaNome || "",
        teacher: item.professorNome || "",
        room: item.ambienteNome || "",
        day: item.diaSemana,
        start: item.horarioInicio,
        end: item.horarioFim,
        status: item.status || "PUBLICADO",
        rawSubject: item.disciplinaNome || "",
        needsReview: false,
      }))
  }, [schedules, selectedTurmaId])

  // Agrupa por modalidade (Integrado primeiro, Superior depois) e ordena turmas (1º ao 3º ano / períodos)
  const filteredGroups: SidebarGroups = useMemo(() => {
    const q = query.toLocaleLowerCase("pt-BR")

    const filteredClasses = classes.filter((c) => {
      const courseObj = courses.find((course) => course.id === c.cursoId)
      const courseName = c.cursoNome || courseObj?.nome || "Outros Cursos"
      const modalityLabel = getModalitySectionLabel(inferCourseModality(courseObj, courseName))

      return (
        c.nome.toLocaleLowerCase("pt-BR").includes(q) ||
        courseName.toLocaleLowerCase("pt-BR").includes(q) ||
        modalityLabel.toLocaleLowerCase("pt-BR").includes(q)
      )
    })

    const groupsMap = new Map<
      string,
      {
        courseName: string
        modalidade?: ModalidadeCurso
        items: { id: string; label: string }[]
      }
    >()

    filteredClasses.forEach((turma) => {
      const courseObj = courses.find((course) => course.id === turma.cursoId)
      const courseName = turma.cursoNome || courseObj?.nome || "Outros Cursos"
      const modalidade = inferCourseModality(courseObj, courseName)
      const mapKey = `${modalidade ?? "OUTROS"}::${courseName}`

      if (!groupsMap.has(mapKey)) {
        groupsMap.set(mapKey, {
          courseName,
          modalidade,
          items: [],
        })
      }
      groupsMap.get(mapKey)!.items.push({ id: String(turma.id), label: turma.nome })
    })

    return Array.from(groupsMap.values())
      .sort((a, b) => {
        const modDiff = getModalityOrder(a.modalidade) - getModalityOrder(b.modalidade)
        if (modDiff !== 0) return modDiff
        return compareNaturalPtBr(a.courseName, b.courseName)
      })
      .map((entry) => ({
        section: getModalitySectionLabel(entry.modalidade),
        group: entry.courseName,
        caption: "Turmas ofertadas",
        items: [...entry.items].sort((a, b) => compareNaturalPtBr(a.label, b.label)),
      }))
  }, [classes, courses, query])

  const hasPublishedLessons = lessons.length > 0

  return (
    <div className={`workspace${!loading && selectedTurma && !hasPublishedLessons ? " class-empty-schedule" : ""}`}>
      <FilterSidebar
        mode="class"
        groups={filteredGroups}
        selected={String(selectedTurmaId ?? "")}
        onSelect={(id) => setSelectedTurmaId(Number(id))}
        query={query}
        onQueryChange={setQuery}
        open={panel.open}
        onClose={() => panel.setOpen(false)}
      />
      <main className="schedule-area">
        <MobileSelection
          mode="class"
          selected={selectedTurma?.nome ?? "Selecione a turma"}
          onOpen={() => panel.setOpen(true)}
        />
        {selectedTurma && (
          <>
            <ScheduleHeading
              mode="class"
              selected={selectedTurma.nome}
              course={
                selectedTurma.cursoNome ||
                courses.find((c) => c.id === selectedTurma.cursoId)?.nome ||
                ""
              }
              lessons={lessons}
            />
            <ScheduleGrid lessons={lessons} mode="class" label={selectedTurma.nome} />

            {!loading && !hasPublishedLessons && (
              <div className="class-empty-notice" role="status">
                <span>
                  <Icon name="calendar" />
                </span>
                <strong>Nenhum horário publicado para esta turma</strong>
                <p>
                  A turma <strong>{selectedTurma.nome}</strong> ainda não possui blocos de aula
                  publicados na grade semanal.
                </p>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}