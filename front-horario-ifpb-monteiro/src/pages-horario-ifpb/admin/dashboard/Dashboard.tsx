import { useEffect, useState, type FormEvent } from "react"
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
import { api, apiErrorMessage } from "@/services/api"
import { API_ENDPOINTS } from "@/services/api-support/endpoints"
import { usePeriodoLetivo } from "@/hooks/usePeriodoLetivo"
import "./dashboard.css"
import { toast } from "react-toastify"

export default function Dashboard() {
  const navigate = useNavigate()
  const { periodoLetivo, loading: loadingPeriodo, atualizarPeriodoLetivo } = usePeriodoLetivo()

  const [classes, setClasses] = useState<TurmaDTO[]>([])
  const [subjects, setSubjects] = useState<DisciplinaDTO[]>([])
  const [teachers, setTeachers] = useState<ProfessorDTO[]>([])
  const [rooms, setRooms] = useState<AmbienteDTO[]>([])
  const [schedules, setSchedules] = useState<HorarioDTO[]>([])
  const [loading, setLoading] = useState(true)

  // Estados de edição do período letivo
  const [editandoPeriodo, setEditandoPeriodo] = useState(false)
  const [novoPeriodo, setNovoPeriodo] = useState("")
  const [salvandoPeriodo, setSalvandoPeriodo] = useState(false)

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
    } catch {
      toast.error("Erro ao carregar dados do Dashboard.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const iniciarEdicaoPeriodo = () => {
    setNovoPeriodo(periodoLetivo)
    setEditandoPeriodo(true)
  }

  const cancelarEdicaoPeriodo = () => {
    setEditandoPeriodo(false)
    setNovoPeriodo("")
  }

  const handleSalvarPeriodo = async (e: FormEvent) => {
    e.preventDefault()
    const valorLimpo = novoPeriodo.trim()

    if (!/^\d{4}\.[12]$/.test(valorLimpo)) {
      toast.warning("Formato inválido. Utilize AAAA.1 ou AAAA.2 (ex: 2027.1).")
      return
    }

    try {
      setSalvandoPeriodo(true)
      await atualizarPeriodoLetivo(valorLimpo)
      toast.success(`Período letivo atualizado para ${valorLimpo}.`)
      setEditandoPeriodo(false)
    } catch (err) {
      toast.error(apiErrorMessage(err) || "Erro ao atualizar o período letivo.")
    } finally {
      setSalvandoPeriodo(false)
    }
  }

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

        <div className="periodo-letivo-card">
          <div className="periodo-letivo-info">
            <small>PERÍODO LETIVO VIGENTE</small>
            {!editandoPeriodo ? (
              <div className="periodo-letivo-display">
                <strong>{loadingPeriodo ? "..." : periodoLetivo}</strong>
                <button
                  type="button"
                  className="periodo-btn-editar"
                  onClick={iniciarEdicaoPeriodo}
                  disabled={loadingPeriodo}
                >
                  Alterar
                </button>
              </div>
            ) : (
              <form className="periodo-letivo-form" onSubmit={handleSalvarPeriodo}>
                <input
                  type="text"
                  value={novoPeriodo}
                  onChange={(e) => setNovoPeriodo(e.target.value)}
                  placeholder="Ex: 2027.1"
                  maxLength={6}
                  disabled={salvandoPeriodo}
                  autoFocus
                />
                <button
                  type="submit"
                  className="periodo-btn-salvar"
                  disabled={salvandoPeriodo}
                >
                  {salvandoPeriodo ? "Salvando..." : "Salvar"}
                </button>
                <button
                  type="button"
                  className="periodo-btn-cancelar"
                  onClick={cancelarEdicaoPeriodo}
                  disabled={salvandoPeriodo}
                >
                  Cancelar
                </button>
              </form>
            )}
          </div>
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