import { useEffect, useMemo, useState } from "react"
import { AdminIcon } from "@/components/Icon"
import { ScheduleFormModal } from "@/components/ScheduleFormModal"
import type { AmbienteDTO, CursoDTO, DisciplinaDTO, HorarioDTO, ProfessorDTO, TurmaDTO } from "@/types/api"
import { api } from "@/services/api"
import { API_ENDPOINTS } from "@/services/api-support/endpoints"
import "./horario.css"
import { toast } from "react-toastify"

export default function Horario() {
  const [schedules, setSchedules] = useState<HorarioDTO[]>([])
  const [courses, setCourses] = useState<CursoDTO[]>([])
  const [classes, setClasses] = useState<TurmaDTO[]>([])
  const [subjects, setSubjects] = useState<DisciplinaDTO[]>([])
  const [teachers, setTeachers] = useState<ProfessorDTO[]>([])
  const [rooms, setRooms] = useState<AmbienteDTO[]>([])
  const [loading, setLoading] = useState(true)

  const [query, setQuery] = useState("")
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<HorarioDTO | null>(null)
  const [deleting, setDeleting] = useState<HorarioDTO | null>(null)

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
      setSchedules(resSchedules.data)
      setCourses(resCourses.data)
      setClasses(resClasses.data)
      setSubjects(resSubjects.data)
      setTeachers(resTeachers.data)
      setRooms(resRooms.data)
    } catch (err: any) {
      toast.error("Erro ao carregar os dados de horários.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAllData()
  }, [])

  const filtered = useMemo(() => {
    const q = query.toLocaleLowerCase("pt-BR")
    return schedules.filter(
      (h) =>
        (h.turmaNome || "").toLocaleLowerCase("pt-BR").includes(q) ||
        (h.cursoNome || "").toLocaleLowerCase("pt-BR").includes(q) ||
        (h.disciplinaNome || "").toLocaleLowerCase("pt-BR").includes(q) ||
        (h.professorNome || "").toLocaleLowerCase("pt-BR").includes(q) ||
        (h.ambienteNome || "").toLocaleLowerCase("pt-BR").includes(q) ||
        (h.diaSemana || "").toLocaleLowerCase("pt-BR").includes(q)
    )
  }, [schedules, query])

  function openForm(record?: HorarioDTO) {
    setEditing(record ?? null)
    setFormOpen(true)
  }

  async function confirmDelete() {
    if (!deleting?.id) return
    try {
      await api.delete(`${API_ENDPOINTS.horarios}/${deleting.id}`)
      toast.success("Horário excluído com sucesso!")
      setDeleting(null)
      loadAllData()
    } catch (err: any) {
      toast.error("Erro ao excluir horário.")
    }
  }

  return (
    <div className="admin-management">
      <div className="admin-page-heading">
        <div>
          <span>GRADE ACADÊMICA</span>
          <h1>Gerenciar horários</h1>
          <p>Associe cursos, turmas, disciplinas, professores, blocos, ambientes e períodos.</p>
        </div>
        <button className="admin-primary" onClick={() => openForm()} disabled={loading}>
          <AdminIcon name="plus" size={18} />
          Adicionar horário
        </button>
      </div>

      <section className="admin-surface management-surface">
        <div className="table-toolbar">
          <label>
            <AdminIcon name="search" size={18} />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Buscar por curso, turma, disciplina, professor ou ambiente..."
            />
          </label>
          <span>{filtered.length} resultados</span>
        </div>
        <div className="admin-table-scroll">
          <table className="admin-table schedule-admin-table">
            <thead>
              <tr>
                <th>Dia e horário</th>
                <th>Curso / Turma</th>
                <th>Disciplina</th>
                <th>Professor</th>
                <th>Ambiente</th>
                <th>Status</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((record) => (
                <tr key={record.id}>
                  <td>
                    <strong>{record.diaSemana}</strong>
                    <small>{record.horarioInicio.substring(0, 5)}–{record.horarioFim.substring(0, 5)}</small>
                  </td>
                  <td>
                    <strong>{record.turmaNome}</strong>
                    {record.cursoNome && <small style={{ display: "block", opacity: 0.8 }}>{record.cursoNome}</small>}
                  </td>
                  <td>{record.disciplinaNome}</td>
                  <td>{record.professorNome}</td>
                  <td>{record.ambienteNome}</td>
                  <td>
                    <span className={`schedule-status ${(record.status || "RASCUNHO").toLocaleLowerCase("pt-BR")}`}>
                      {record.status === "PUBLICADO" ? "Publicado" : "Rascunho"}
                    </span>
                  </td>
                  <td>
                    <button onClick={() => openForm(record)} aria-label="Editar horário">
                      <AdminIcon name="edit" size={17} />
                    </button>
                    <button className="danger-action" onClick={() => setDeleting(record)} aria-label="Excluir horário">
                      <AdminIcon name="trash" size={17} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!loading && !filtered.length && (
            <div className="admin-empty">
              <AdminIcon name="schedules" size={28} />
              <strong>Nenhum horário encontrado</strong>
            </div>
          )}
        </div>
      </section>

      <ScheduleFormModal
        open={formOpen}
        editing={editing}
        courses={courses}
        classes={classes}
        subjects={subjects}
        teachers={teachers}
        rooms={rooms}
        onClose={() => {
          setFormOpen(false)
          setEditing(null)
        }}
        onSaved={loadAllData}
      />

      {deleting && (
        <div className="admin-modal-layer" role="alertdialog" aria-modal="true">
          <button className="admin-modal-backdrop" onClick={() => setDeleting(null)} aria-label="Cancelar exclusão" />
          <section className="admin-confirm">
            <span><AdminIcon name="warning" size={24} /></span>
            <h2>Excluir horário?</h2>
            <p>O bloco de <strong>{deleting.disciplinaNome}</strong> para <strong>{deleting.turmaNome}</strong> será removido.</p>
            <div>
              <button onClick={() => setDeleting(null)}>Cancelar</button>
              <button className="confirm-delete" onClick={confirmDelete}>Excluir horário</button>
            </div>
          </section>
        </div>
      )}
    </div>
  )
}