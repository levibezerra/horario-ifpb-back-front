import { useEffect, useMemo, useState } from "react"
import { FilterSidebar } from "@/components/Sidebar"
import { MobileSelection, ScheduleGrid, ScheduleHeading } from "@/components/ScheduleGrid"
import { Icon } from "@/components/Icon"
import { useFilterPanel } from "@/hooks/useFilterPanel"
import type {
  AmbienteDTO,
  CategoriaAmbiente,
  CursoDTO,
  HorarioDTO,
  ScheduleLesson,
  TurmaDTO,
} from "@/types/api"
import { api } from "@/services/api"
import { API_ENDPOINTS } from "@/services/api-support/endpoints"
import "./por-ambiente.css"

const ROOM_CATEGORIES: { id: CategoriaAmbiente; label: string; caption: string }[] = [
  { id: "SALA", label: "Salas de Aula", caption: "Espaços convencionais" },
  { id: "LABORATORIO", label: "Laboratórios", caption: "Espaços práticos e de informática" },
  { id: "AUDITORIO", label: "Auditórios", caption: "Espaços de eventos e palestras" },
  { id: "ESPORTIVO", label: "Espaços Esportivos", caption: "Quadras e ginásios" },
]

export default function PorAmbiente() {
  const panel = useFilterPanel()
  const [rooms, setRooms] = useState<AmbienteDTO[]>([])
  const [classes, setClasses] = useState<TurmaDTO[]>([])
  const [courses, setCourses] = useState<CursoDTO[]>([])
  const [schedules, setSchedules] = useState<HorarioDTO[]>([])
  const [category, setCategory] = useState<CategoriaAmbiente>("SALA")
  const [selectedRoomId, setSelectedRoomId] = useState<number | null>(null)
  const [query, setQuery] = useState("")

  useEffect(() => {
    async function loadData() {
      try {
        const [resRooms, resClasses, resCourses, resSchedules] = await Promise.all([
          api.get<AmbienteDTO[]>(API_ENDPOINTS.ambientes),
          api.get<TurmaDTO[]>(API_ENDPOINTS.turmas),
          api.get<CursoDTO[]>(API_ENDPOINTS.cursos),
          api.get<HorarioDTO[]>(API_ENDPOINTS.horarios),
        ])
        setRooms(resRooms.data)
        setClasses(resClasses.data)
        setCourses(resCourses.data)
        setSchedules(resSchedules.data.filter((h) => h.status === "PUBLICADO"))
      } catch (err) {
        console.error("Erro ao carregar consulta por ambiente", err)
      }
    }
    loadData()
  }, [])

  const courseInfoByClassId = useMemo(() => {
    const courseById = new Map<number, CursoDTO>()
    courses.forEach((course) => {
      if (course.id != null) {
        courseById.set(Number(course.id), course)
      }
    })

    const map = new Map<number, { name: string; code: string }>()
    classes.forEach((turma) => {
      if (turma.id != null) {
        const course = courseById.get(Number(turma.cursoId))
        map.set(Number(turma.id), {
          name: turma.cursoNome || course?.nome || "",
          code: course?.codigo?.trim() || "",
        })
      }
    })
    return map
  }, [classes, courses])

  const roomsInCategory = useMemo(() => {
    const q = query.toLocaleLowerCase("pt-BR")
    return rooms
      .filter((room) => room.categoria === category)
      .filter(
        (room) =>
          room.nome.toLocaleLowerCase("pt-BR").includes(q) ||
          (room.localizacao || "").toLocaleLowerCase("pt-BR").includes(q),
      )
      .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"))
  }, [category, query, rooms])

  useEffect(() => {
    if (roomsInCategory.length > 0) {
      if (!roomsInCategory.some((r) => r.id === selectedRoomId)) {
        setSelectedRoomId(roomsInCategory[0].id!)
      }
    } else {
      setSelectedRoomId(null)
    }
  }, [roomsInCategory, selectedRoomId])

  const selectedRoom = rooms.find((room) => room.id === selectedRoomId)

  const lessons: ScheduleLesson[] = useMemo(() => {
    if (!selectedRoomId) return []
    return schedules
      .filter((item) => item.ambienteId === selectedRoomId)
      .map((item) => {
        const courseInfo = courseInfoByClassId.get(Number(item.turmaId))
        const courseName = item.cursoNome || courseInfo?.name || ""
        const courseCode = courseInfo?.code || ""

        return {
          id: String(item.id),
          className: item.turmaNome || "",
          courseName,
          courseCode,
          subject: item.disciplinaNome || "",
          teacher: item.professorNome || "",
          room: item.ambienteNome || "",
          day: item.diaSemana,
          start: item.horarioInicio,
          end: item.horarioFim,
          status: item.status || "PUBLICADO",
          rawSubject: item.disciplinaNome || "",
          needsReview: false,
        }
      })
  }, [schedules, selectedRoomId, courseInfoByClassId])

  const activeCategoryObj = ROOM_CATEGORIES.find((item) => item.id === category)!

  const groups = useMemo(() => {
    const groupsMap = new Map<string, { id: string; label: string }[]>()

    roomsInCategory.forEach((room) => {
      const blocoName = room.localizacao?.trim() || "Bloco não informado"
      if (!groupsMap.has(blocoName)) {
        groupsMap.set(blocoName, [])
      }
      groupsMap.get(blocoName)!.push({
        id: String(room.id),
        label: room.nome,
      })
    })

    return Array.from(groupsMap.entries())
      .sort(([a], [b]) => a.localeCompare(b, "pt-BR"))
      .map(([blocoName, items]) => ({
        group: blocoName,
        caption: activeCategoryObj.label,
        items,
      }))
  }, [roomsInCategory, activeCategoryObj.label])

  return (
    <div className="workspace">
      <FilterSidebar
        mode="room"
        groups={groups}
        selected={String(selectedRoomId ?? "")}
        onSelect={(id) => setSelectedRoomId(Number(id))}
        query={query}
        onQueryChange={setQuery}
        open={panel.open}
        onClose={() => panel.setOpen(false)}
        topContent={
          <div className="room-category-tabs" aria-label="Categorias de ambientes">
            {ROOM_CATEGORIES.map((item) => (
              <button
                key={item.id}
                className={item.id === category ? "active" : ""}
                onClick={() => {
                  setCategory(item.id)
                  setQuery("")
                }}
              >
                {item.label}
              </button>
            ))}
          </div>
        }
      />
      <main className="schedule-area">
        <MobileSelection
          mode="room"
          selected={selectedRoom?.nome ?? "Selecione um ambiente"}
          onOpen={() => panel.setOpen(true)}
        />
        {selectedRoom ? (
          <>
            <ScheduleHeading
              mode="room"
              selected={selectedRoom.nome}
              course={
                selectedRoom.localizacao
                  ? `${activeCategoryObj.label} · ${selectedRoom.localizacao}`
                  : activeCategoryObj.label
              }
              lessons={lessons}
            />
            <section className="context-card room-profile">
              <span className="room-icon"><Icon name="room" size={24} /></span>
              <div>
                <p>{activeCategoryObj.label.toLocaleUpperCase("pt-BR")}</p>
                <h2>{selectedRoom.nome}</h2>
                <span>{selectedRoom.localizacao || "Localização não informada"}</span>
              </div>
            </section>
            {!lessons.length && (
              <div className="room-empty-notice">
                <Icon name="info" size={17} />
                <span>Não há atividades registradas para este ambiente.</span>
              </div>
            )}
            <ScheduleGrid lessons={lessons} mode="room" label={selectedRoom.nome} showEmptyPeriods />
          </>
        ) : (
          <section className="room-selection-empty">
            <span><Icon name="room" size={28} /></span>
            <h1>Nenhum ambiente disponível</h1>
            <p>Não existem ambientes cadastrados na categoria {activeCategoryObj.label}.</p>
          </section>
        )}
      </main>
    </div>
  )
}