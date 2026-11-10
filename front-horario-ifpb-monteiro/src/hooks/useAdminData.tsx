import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from "react"
import type {
  AmbienteDTO,
  DisciplinaDTO,
  HorarioDTO,
  ProfessorDTO,
  TurmaDTO,
} from "@/types/api"
import { api } from "@/services/api"
import { API_ENDPOINTS } from "@/services/api-support/endpoints"
import { toast } from "react-toastify"

type AdminDataContextValue = {
  classes: TurmaDTO[]
  setClasses: Dispatch<SetStateAction<TurmaDTO[]>>
  subjects: DisciplinaDTO[]
  setSubjects: Dispatch<SetStateAction<DisciplinaDTO[]>>
  teachers: ProfessorDTO[]
  setTeachers: Dispatch<SetStateAction<ProfessorDTO[]>>
  rooms: AmbienteDTO[]
  setRooms: Dispatch<SetStateAction<AmbienteDTO[]>>
  schedules: HorarioDTO[]
  setSchedules: Dispatch<SetStateAction<HorarioDTO[]>>
  publishedSchedules: HorarioDTO[]
  loading: boolean
  refetch: () => Promise<void>
  publishSchedules: () => Promise<void>
  deleteSchedule: (id: number) => Promise<void>
}

const AdminDataContext = createContext<AdminDataContextValue | null>(null)

export function AdminDataProvider({ children }: { children: ReactNode }) {
  const [classes, setClasses] = useState<TurmaDTO[]>([])
  const [subjects, setSubjects] = useState<DisciplinaDTO[]>([])
  const [teachers, setTeachers] = useState<ProfessorDTO[]>([])
  const [rooms, setRooms] = useState<AmbienteDTO[]>([])
  const [schedules, setSchedules] = useState<HorarioDTO[]>([])
  const [loading, setLoading] = useState<boolean>(true)

  const refetch = useCallback(async () => {
    try {
      setLoading(true)
      const [resClasses, resSubjects, resTeachers, resRooms, resSchedules] =
        await Promise.all([
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
    } catch (error) {
      console.error("Erro ao carregar dados do Spring Boot", error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refetch()
  }, [refetch])

  const publishedSchedules = schedules.filter(
    (schedule) => schedule.status === "PUBLICADO",
  )

  const publishSchedules = async () => {
    try {
      const draftIds = schedules
        .filter((s) => s.status === "RASCUNHO")
        .map((s) => s.id!)

      if (!draftIds.length) {
        toast.info("Não há rascunhos para publicar.")
        return
      }

      await api.post(API_ENDPOINTS.publicarHorarios, { horarioIds: draftIds })
      toast.success("Horários publicados com sucesso!")
      await refetch()
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Erro ao publicar horários.")
    }
  }

  const deleteSchedule = async (id: number) => {
    try {
      await api.delete(`${API_ENDPOINTS.horarios}/${id}`)
      toast.success("Horário excluído com sucesso!")
      await refetch()
    } catch (error: any) {
      toast.error("Erro ao excluir horário no servidor.")
    }
  }

  return (
    <AdminDataContext.Provider
      value={{
        classes,
        setClasses,
        subjects,
        setSubjects,
        teachers,
        setTeachers,
        rooms,
        setRooms,
        schedules,
        setSchedules,
        publishedSchedules,
        loading,
        refetch,
        publishSchedules,
        deleteSchedule,
      }}
    >
      {children}
    </AdminDataContext.Provider>
  )
}

export function useAdminData() {
  const context = useContext(AdminDataContext)
  if (!context) {
    throw new Error("useAdminData deve ser utilizado dentro de <AdminDataProvider>.")
  }
  return context
}