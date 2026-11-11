import { useEffect, useMemo, useState, type FormEvent } from "react"
import { AdminIcon } from "@/components/Icon"
import type { AmbienteDTO, CursoDTO, DiaSemana, DisciplinaDTO, HorarioDTO, ProfessorDTO, TurmaDTO } from "@/types/api"
import { api } from "@/services/api"
import { API_ENDPOINTS } from "@/services/api-support/endpoints"
import "./horario.css"
import { toast } from "react-toastify"
import Button from "@/components/Button"

const DIAS_SEMANA: DiaSemana[] = ["SEGUNDA", "TERCA", "QUARTA", "QUINTA", "SEXTA"]

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

  const [form, setForm] = useState({
    cursoId: 0,
    turmaId: 0,
    disciplinaId: 0,
    professorId: 0,
    bloco: "",
    ambienteId: 0,
    diaSemana: "SEGUNDA" as DiaSemana,
    horarioInicio: "07:30",
    horarioFim: "08:20",
  })
  const [error, setError] = useState("")

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

  // Extrai lista única de blocos (localizações) dos ambientes cadastrados
  const availableBlocos = useMemo(() => {
    const setBlocos = new Set<string>()
    rooms.forEach((r) => {
      const loc = r.localizacao?.trim() || "Sem Bloco Definido"
      setBlocos.add(loc)
    })
    return Array.from(setBlocos).sort()
  }, [rooms])

  // Turmas filtradas pelo curso selecionado
  const availableClasses = useMemo(() => {
    if (!form.cursoId) return []
    return classes.filter((t) => t.cursoId === form.cursoId)
  }, [classes, form.cursoId])

  // Ambientes filtrados pelo bloco (localizacao) selecionado
  const availableRooms = useMemo(() => {
    if (!form.bloco) return rooms
    return rooms.filter((r) => {
      const loc = r.localizacao?.trim() || "Sem Bloco Definido"
      return loc === form.bloco
    })
  }, [rooms, form.bloco])

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
    if (record) {
      const targetTurma = classes.find((t) => t.id === record.turmaId)
      const initialCursoId = record.cursoId || targetTurma?.cursoId || courses[0]?.id || 0

      const targetRoom = rooms.find((r) => r.id === record.ambienteId)
      const initialBloco = targetRoom?.localizacao?.trim() || availableBlocos[0] || ""

      setForm({
        cursoId: initialCursoId,
        turmaId: record.turmaId,
        disciplinaId: record.disciplinaId,
        professorId: record.professorId,
        bloco: initialBloco,
        ambienteId: record.ambienteId,
        diaSemana: record.diaSemana,
        horarioInicio: record.horarioInicio.substring(0, 5),
        horarioFim: record.horarioFim.substring(0, 5),
      })
    } else {
      const defaultCursoId = courses[0]?.id || 0
      const defaultClasses = classes.filter((t) => t.cursoId === defaultCursoId)
      const defaultBloco = availableBlocos[0] || ""
      const defaultRooms = rooms.filter(
        (r) => (r.localizacao?.trim() || "Sem Bloco Definido") === defaultBloco
      )

      setForm({
        cursoId: defaultCursoId,
        turmaId: defaultClasses[0]?.id || 0,
        disciplinaId: subjects[0]?.id || 0,
        professorId: teachers[0]?.id || 0,
        bloco: defaultBloco,
        ambienteId: defaultRooms[0]?.id || rooms[0]?.id || 0,
        diaSemana: "SEGUNDA",
        horarioInicio: "07:30",
        horarioFim: "08:20",
      })
    }
    setError("")
    setFormOpen(true)
  }

  function handleCursoChange(cursoId: number) {
    const courseClasses = classes.filter((t) => t.cursoId === cursoId)
    setForm((prev) => ({
      ...prev,
      cursoId,
      turmaId: courseClasses[0]?.id || 0,
    }))
  }

  function handleBlocoChange(bloco: string) {
    const filteredRooms = rooms.filter(
      (r) => (r.localizacao?.trim() || "Sem Bloco Definido") === bloco
    )
    setForm((prev) => ({
      ...prev,
      bloco,
      ambienteId: filteredRooms[0]?.id || 0,
    }))
  }

  async function save(event: FormEvent) {
    event.preventDefault()
    if (!form.cursoId) {
      setError("Selecione um curso.")
      return
    }
    if (!form.turmaId) {
      setError("Selecione uma turma vinculada ao curso.")
      return
    }
    if (!form.bloco) {
      setError("Selecione o bloco.")
      return
    }
    if (!form.ambienteId) {
      setError("Selecione um ambiente disponível no bloco.")
      return
    }
    if (!form.disciplinaId || !form.professorId) {
      setError("Selecione todas as entidades obrigatórias.")
      return
    }

    const payload = {
      turmaId: form.turmaId,
      disciplinaId: form.disciplinaId,
      professorId: form.professorId,
      ambienteId: form.ambienteId,
      diaSemana: form.diaSemana,
      horarioInicio: form.horarioInicio.length === 5 ? `${form.horarioInicio}:00` : form.horarioInicio,
      horarioFim: form.horarioFim.length === 5 ? `${form.horarioFim}:00` : form.horarioFim,
      status: "RASCUNHO" as const,
    }

    try {
      if (editing?.id) {
        await api.put(`${API_ENDPOINTS.horarios}/${editing.id}`, payload)
        toast.success("Horário atualizado com sucesso!")
      } else {
        await api.post(API_ENDPOINTS.horarios, payload)
        toast.success("Horário cadastrado como rascunho!")
      }
      setFormOpen(false)
      loadAllData()
    } catch (err: any) {
      const msg = err.response?.data?.message || "Erro ao salvar horário."
      setError(msg)
      toast.error(msg)
    }
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

      {formOpen && (
        <div className="admin-modal-layer" role="dialog" aria-modal="true">
          <button className="admin-modal-backdrop" onClick={() => setFormOpen(false)} aria-label="Fechar formulário" />
          <form className="admin-modal schedule-form" onSubmit={save}>
            <div className="admin-modal-heading">
              <div>
                <span>{editing ? "EDITAR HORÁRIO" : "NOVO HORÁRIO"}</span>
                <h2>Dados do bloco de aula</h2>
              </div>
              <button type="button" onClick={() => setFormOpen(false)}>
                <AdminIcon name="close" size={19} />
              </button>
            </div>
            <div className="schedule-form-grid">
              <label className="admin-form-field">
                <span>Curso *</span>
                <select
                  value={form.cursoId}
                  onChange={(e) => handleCursoChange(Number(e.target.value))}
                >
                  <option value={0} disabled>Selecione um curso</option>
                  {courses.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.nome} ({item.codigo})
                    </option>
                  ))}
                </select>
              </label>

              <label className="admin-form-field">
                <span>Turma *</span>
                <select
                  value={form.turmaId}
                  onChange={(e) => setForm((c) => ({ ...c, turmaId: Number(e.target.value) }))}
                  disabled={!form.cursoId || availableClasses.length === 0}
                >
                  {availableClasses.length === 0 ? (
                    <option value={0}>Nenhuma turma cadastrada neste curso</option>
                  ) : (
                    availableClasses.map((item) => (
                      <option key={item.id} value={item.id}>{item.nome}</option>
                    ))
                  )}
                </select>
              </label>

              <label className="admin-form-field">
                <span>Disciplina *</span>
                <select value={form.disciplinaId} onChange={(e) => setForm((c) => ({ ...c, disciplinaId: Number(e.target.value) }))}>
                  {subjects.map((item) => (
                    <option key={item.id} value={item.id}>{item.nome}</option>
                  ))}
                </select>
              </label>

              <label className="admin-form-field">
                <span>Professor *</span>
                <select value={form.professorId} onChange={(e) => setForm((c) => ({ ...c, professorId: Number(e.target.value) }))}>
                  {teachers.map((item) => (
                    <option key={item.id} value={item.id}>{item.nome}</option>
                  ))}
                </select>
              </label>

              <label className="admin-form-field">
                <span>Bloco / Localização *</span>
                <select
                  value={form.bloco}
                  onChange={(e) => handleBlocoChange(e.target.value)}
                >
                  <option value="" disabled>Selecione o bloco</option>
                  {availableBlocos.map((bloco) => (
                    <option key={bloco} value={bloco}>{bloco}</option>
                  ))}
                </select>
              </label>

              <label className="admin-form-field">
                <span>Ambiente *</span>
                <select
                  value={form.ambienteId}
                  onChange={(e) => setForm((c) => ({ ...c, ambienteId: Number(e.target.value) }))}
                  disabled={!form.bloco || availableRooms.length === 0}
                >
                  {availableRooms.length === 0 ? (
                    <option value={0}>Nenhum ambiente encontrado neste bloco</option>
                  ) : (
                    availableRooms.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.nome} ({item.categoria})
                      </option>
                    ))
                  )}
                </select>
              </label>

              <label className="admin-form-field">
                <span>Dia da semana *</span>
                <select value={form.diaSemana} onChange={(e) => setForm((c) => ({ ...c, diaSemana: e.target.value as DiaSemana }))}>
                  {DIAS_SEMANA.map((day) => (
                    <option key={day} value={day}>{day}</option>
                  ))}
                </select>
              </label>

              <label className="admin-form-field">
                <span>Início *</span>
                <input type="time" value={form.horarioInicio} onChange={(e) => setForm((c) => ({ ...c, horarioInicio: e.target.value }))} />
              </label>

              <label className="admin-form-field">
                <span>Término *</span>
                <input type="time" value={form.horarioFim} onChange={(e) => setForm((c) => ({ ...c, horarioFim: e.target.value }))} />
              </label>
            </div>

            {error && <div className="admin-form-error">{error}</div>}
            <div className="admin-modal-actions">
              <Button text="Cancelar" onClick={() => setFormOpen(false)} />
              <Button className="admin-primary" type="submit" text="Salvar horário" />
            </div>
          </form>
        </div>
      )}

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