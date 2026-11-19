import { useEffect, useState } from "react"
import { AdminIcon, type AdminIconName } from "@/components/Icon"
import { useNavigate } from "react-router-dom"
import { ROUTES } from "@/routes/paths"
import type {
  AmbienteDTO,
  DisciplinaDTO,
  HorarioDTO,
  ProfessorDTO,
  TurmaDTO,
} from "@/types/api"
import { api } from "@/services/api"
import { API_ENDPOINTS } from "@/services/api-support/endpoints"
import "./dashboard.css"
import { toast } from "react-toastify"

export default function Dashboard() {
  const navigate = useNavigate()
  const [classes, setClasses] = useState<TurmaDTO[]>([])
  const [subjects, setSubjects] = useState<DisciplinaDTO[]>([])
  const [teachers, setTeachers] = useState<ProfessorDTO[]>([])
  const [rooms, setRooms] = useState<AmbienteDTO[]>([])
  const [schedules, setSchedules] = useState<HorarioDTO[]>([])
  const [loading, setLoading] = useState(true)

  const fetchData = async () => {
    try {
      setLoading(true)
      const [resClasses, resSubjects, resTeachers, resRooms, resSchedules] = await Promise.all([
        api.get<TurmaDTO[]>(API_ENDPOINTS.turmas),
        api.get<DisciplinaDTO[]>(API_ENDPOINTS.disciplinas),
        api.get<ProfessorDTO[]>(API_ENDPOINTS.professores),
        api.get<AmbienteDTO[]>(API_ENDPOINTS.ambientes),
        api.get<HorarioDTO[]>(API_ENDPOINTS.horarios),
      ])

      setClasses(resClasses.data)
      setSubjects(resSubjects.data)
      setTeachers(resTeachers.data)
      setRooms(resRooms.data)
      setSchedules(resSchedules.data)
    } catch (err: any) {
      toast.error("Erro ao carregar dados do Dashboard.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const indicators = [
    { label: "Turmas cadastradas", value: classes.length, icon: "classes" as AdminIconName, to: ROUTES.adminClasses, note: "Turmas disponíveis" },
    { label: "Disciplinas", value: subjects.length, icon: "subjects" as AdminIconName, to: ROUTES.adminSubjects, note: "Disciplinas cadastradas" },
    { label: "Professores", value: teachers.length, icon: "teachers" as AdminIconName, to: ROUTES.adminTeachers, note: "Docentes cadastrados" },
    { label: "Ambientes", value: rooms.length, icon: "rooms" as AdminIconName, to: ROUTES.adminRooms, note: "Ambientes cadastrados" },
    { label: "Horários cadastrados", value: schedules.length, icon: "schedules" as AdminIconName, to: ROUTES.adminSchedules, note: "Blocos de aula" },
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
        {indicators.map((item) => (
          <button className="indicator-card" key={item.label} onClick={() => navigate(item.to)}>
            <span><AdminIcon name={item.icon} size={22} /></span>
            <strong>{loading ? "..." : item.value}</strong>
            <div>{item.label}</div>
            <small>{item.note}</small>
          </button>
        ))}
      </div>
    </div>
  )
}