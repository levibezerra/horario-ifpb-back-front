import { useEffect, useState, useMemo } from "react"
import { FilterSidebar } from "@/components/Sidebar"
import { MobileSelection, ScheduleGrid, ScheduleHeading } from "@/components/ScheduleGrid"
import { useFilterPanel } from "@/hooks/useFilterPanel"
import type { HorarioDTO, ScheduleLesson, TurmaDTO } from "@/types/api"
import { api } from "@/services/api"
import { API_ENDPOINTS } from "@/services/api-support/endpoints"
import "./por-turma.css"

export default function PorTurma() {
  const panel = useFilterPanel()
  const [classes, setClasses] = useState<TurmaDTO[]>([])
  const [schedules, setSchedules] = useState<HorarioDTO[]>([])
  const [selectedTurmaId, setSelectedTurmaId] = useState<number | null>(null)
  const [query, setQuery] = useState("")

  useEffect(() => {
    async function loadData() {
      try {
        const [resClasses, resSchedules] = await Promise.all([
          api.get<TurmaDTO[]>(API_ENDPOINTS.turmas),
          api.get<HorarioDTO[]>(API_ENDPOINTS.horarios),
        ])
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

  const filteredGroups = useMemo(() => {
    const q = query.toLocaleLowerCase("pt-BR")
    const filtered = classes.filter((c) => c.nome.toLocaleLowerCase("pt-BR").includes(q))
    return [
      {
        group: "Turmas",
        caption: "Selecione uma turma",
        items: filtered.map((c) => ({ id: String(c.id), label: c.nome })),
      },
    ]
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