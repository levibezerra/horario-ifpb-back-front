import { useEffect, useState, useMemo } from "react"
import { FilterSidebar } from "@/components/Sidebar"
import { MobileSelection, ScheduleGrid, ScheduleHeading } from "@/components/ScheduleGrid"
import { useFilterPanel } from "@/hooks/useFilterPanel"
import type { CursoDTO, HorarioDTO, ScheduleLesson, TurmaDTO } from "@/types/api"
import { api } from "@/services/api"
import { API_ENDPOINTS } from "@/services/api-support/endpoints"
import "./por-turma.css"

function compareNaturalPtBr(a: string, b: string) {
  return a.localeCompare(b, "pt-BR", { numeric: true, sensitivity: "base" })
}

export default function PorTurma() {
  const panel = useFilterPanel()
  const [courses, setCourses] = useState<CursoDTO[]>([])
  const [classes, setClasses] = useState<TurmaDTO[]>([])
  const [schedules, setSchedules] = useState<HorarioDTO[]>([])
  const [selectedTurmaId, setSelectedTurmaId] = useState<number | null>(null)
  const [query, setQuery] = useState("")

  useEffect(() => {
    async function loadData() {
      try {
        const [resCourses, resClasses, resSchedules] = await Promise.all([
          api.get<CursoDTO[]>(API_ENDPOINTS.cursos),
          api.get<TurmaDTO[]>(API_ENDPOINTS.turmas),
          api.get<HorarioDTO[]>(API_ENDPOINTS.horarios),
        ])

        const sortedCourses = [...resCourses.data].sort((a, b) =>
          compareNaturalPtBr(a.nome, b.nome)
        )

        const sortedClasses = [...resClasses.data].sort((a, b) => {
          const courseA = a.cursoNome || sortedCourses.find((c) => c.id === a.cursoId)?.nome || "Outros Cursos"
          const courseB = b.cursoNome || sortedCourses.find((c) => c.id === b.cursoId)?.nome || "Outros Cursos"
          const courseDiff = compareNaturalPtBr(courseA, courseB)
          if (courseDiff !== 0) return courseDiff
          return compareNaturalPtBr(a.nome, b.nome)
        })

        setCourses(sortedCourses)
        setClasses(sortedClasses)
        setSchedules(resSchedules.data.filter((h) => h.status === "PUBLICADO"))
        if (sortedClasses.length > 0) setSelectedTurmaId(sortedClasses[0].id!)
      } catch (err) {
        console.error("Erro ao carregar consulta por turma", err)
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

  // Agrupa e ordena os cursos e as turmas em ordem natural (1º, 2º, 3º... A, B)
  const filteredGroups = useMemo(() => {
    const q = query.toLocaleLowerCase("pt-BR")

    const filteredClasses = classes.filter((c) => {
      const courseName =
        c.cursoNome || courses.find((course) => course.id === c.cursoId)?.nome || "Outros Cursos"
      return (
        c.nome.toLocaleLowerCase("pt-BR").includes(q) ||
        courseName.toLocaleLowerCase("pt-BR").includes(q)
      )
    })

    const groupsMap = new Map<string, { id: string; label: string }[]>()

    filteredClasses.forEach((turma) => {
      const courseName =
        turma.cursoNome ||
        courses.find((course) => course.id === turma.cursoId)?.nome ||
        "Outros Cursos"

      if (!groupsMap.has(courseName)) {
        groupsMap.set(courseName, [])
      }
      groupsMap.get(courseName)!.push({ id: String(turma.id), label: turma.nome })
    })

    return Array.from(groupsMap.entries())
      .sort(([courseA], [courseB]) => compareNaturalPtBr(courseA, courseB))
      .map(([courseName, items]) => ({
        group: courseName,
        caption: "Turmas ofertadas",
        items: [...items].sort((a, b) => compareNaturalPtBr(a.label, b.label)),
      }))
  }, [classes, courses, query])

  return (
    <div className="workspace">
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
          </>
        )}
      </main>
    </div>
  )
}