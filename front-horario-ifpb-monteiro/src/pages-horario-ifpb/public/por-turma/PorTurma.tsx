import { useEffect, useState, useMemo } from "react"
import { FilterSidebar } from "@/components/Sidebar"
import { MobileSelection, ScheduleGrid, ScheduleHeading } from "@/components/ScheduleGrid"
import { useFilterPanel } from "@/hooks/useFilterPanel"
import type { CursoDTO, HorarioDTO, ScheduleLesson, TurmaDTO } from "@/types/api"
import { api } from "@/services/api"
import { API_ENDPOINTS } from "@/services/api-support/endpoints"
import "./por-turma.css"

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
        setCourses(resCourses.data)
        setClasses(resClasses.data)
        setSchedules(resSchedules.data.filter((h) => h.status === "PUBLICADO"))
        if (resClasses.data.length > 0) setSelectedTurmaId(resClasses.data[0].id!)
      } catch (err) {
        console.error("Erro ao carregar consulta por turma", err)
      }
    }
    loadData()
  }, [])

  const selectedTurma = useMemo(() => classes.find((c) => c.id === selectedTurmaId), [classes, selectedTurmaId])

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

  // Agrupa as turmas por curso
  const filteredGroups = useMemo(() => {
    const q = query.toLocaleLowerCase("pt-BR")
    
    // Filtra as turmas pela busca (por nome da turma ou pelo nome do curso)
    const filteredClasses = classes.filter((c) => 
      c.nome.toLocaleLowerCase("pt-BR").includes(q) ||
      (c.cursoNome || "").toLocaleLowerCase("pt-BR").includes(q)
    )

    // Agrupamento por curso
    const groupsMap = new Map<string, { id: string; label: string }[]>()

    filteredClasses.forEach((turma) => {
      const courseName = turma.cursoNome || "Outros Cursos"
      if (!groupsMap.has(courseName)) {
        groupsMap.set(courseName, [])
      }
      groupsMap.get(courseName)!.push({ id: String(turma.id), label: turma.nome })
    })

    // Mapeia para o formato esperado pelo FilterSidebar
    return Array.from(groupsMap.entries()).map(([courseName, items]) => ({
      group: courseName,
      caption: "Turmas ofertadas",
      items,
    }))
  }, [classes, query])

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
              course={selectedTurma.cursoNome || ""}
              lessons={lessons}
            />
            <ScheduleGrid lessons={lessons} mode="class" label={selectedTurma.nome} />
          </>
        )}
      </main>
    </div>
  )
}