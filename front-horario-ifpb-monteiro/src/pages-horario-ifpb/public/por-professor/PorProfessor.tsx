import { useEffect, useState, useMemo } from "react"
import { FilterSidebar } from "@/components/Sidebar"
import { ProfessorCard } from "@/components/ProfessorCard"
import { MobileSelection, ScheduleGrid, ScheduleHeading } from "@/components/ScheduleGrid"
import { useFilterPanel } from "@/hooks/useFilterPanel"
import type { HorarioDTO, ProfessorDTO, ScheduleLesson } from "@/types/api"
import { api } from "@/services/api"
import { API_ENDPOINTS } from "@/services/api-support/endpoints"
import "./por-professor.css"

export default function PorProfessor() {
  const panel = useFilterPanel()
  const [teachers, setTeachers] = useState<ProfessorDTO[]>([])
  const [schedules, setSchedules] = useState<HorarioDTO[]>([])
  const [selectedProfId, setSelectedProfId] = useState<number | null>(null)
  const [query, setQuery] = useState("")

  useEffect(() => {
    async function loadData() {
      try {
        const [resTeachers, resSchedules] = await Promise.all([
          api.get<ProfessorDTO[]>(API_ENDPOINTS.professores),
          api.get<HorarioDTO[]>(API_ENDPOINTS.horarios),
        ])
        setTeachers(resTeachers.data)
        setSchedules(resSchedules.data.filter((h) => h.status === "PUBLICADO"))
        if (resTeachers.data.length > 0) setSelectedProfId(resTeachers.data[0].id!)
      } catch (err) {
        console.error("Erro ao carregar consulta por professor", err)
      }
    }
    loadData()
  }, [])

  const selectedTeacher = useMemo(() => teachers.find((t) => t.id === selectedProfId), [teachers, selectedProfId])

  const lessons: ScheduleLesson[] = useMemo(() => {
    if (!selectedProfId) return []
    return schedules
      .filter((item) => item.professorId === selectedProfId)
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
  }, [schedules, selectedProfId])

  const filteredGroups = useMemo(() => {
    const q = query.toLocaleLowerCase("pt-BR")
    const filtered = teachers.filter((t) => t.nome.toLocaleLowerCase("pt-BR").includes(q))
    return [
      {
        group: "Docentes",
        caption: "Corpo docente",
        items: filtered.map((t) => ({ id: String(t.id), label: t.nome })),
      },
    ]
  }, [teachers, query])

  return (
    <div className="workspace">
      <FilterSidebar
        mode="teacher"
        groups={filteredGroups}
        selected={String(selectedProfId ?? "")}
        onSelect={(id) => setSelectedProfId(Number(id))}
        query={query}
        onQueryChange={setQuery}
        open={panel.open}
        onClose={() => panel.setOpen(false)}
      />
      <main className="schedule-area">
        <MobileSelection
          mode="teacher"
          selected={selectedTeacher?.nome ?? "Selecione um professor"}
          onOpen={() => panel.setOpen(true)}
        />
        {selectedTeacher && (
          <>
            <ScheduleHeading
              mode="teacher"
              selected={selectedTeacher.nome}
              course={selectedTeacher.cursosNomes?.join(" · ") || ""}
              lessons={lessons}
            />
            <ProfessorCard 
              name={selectedTeacher.nome} 
              lessons={lessons} 
              professorData={selectedTeacher} 
            />
            <ScheduleGrid lessons={lessons} mode="teacher" label={selectedTeacher.nome} />
          </>
        )}
      </main>
    </div>
  )
}