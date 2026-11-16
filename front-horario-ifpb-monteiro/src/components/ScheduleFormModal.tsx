import { useEffect, useMemo, useState, type FormEvent } from "react"
import { AdminIcon } from "@/components/Icon"
import Button from "@/components/Button"
import { api } from "@/services/api"
import { API_ENDPOINTS } from "@/services/api-support/endpoints"
import type {
  AmbienteDTO,
  CursoDTO,
  DiaSemana,
  DisciplinaDTO,
  HorarioDTO,
  ProfessorDTO,
  TurmaDTO,
} from "@/types/api"
import { toast } from "react-toastify"

const DIAS_SEMANA: DiaSemana[] = ["SEGUNDA", "TERCA", "QUARTA", "QUINTA", "SEXTA"]

const HORARIOS_GRADE = [
  "07:00",
  "07:50",
  "08:40",
  "09:00",
  "09:50",
  "10:40",
  "11:30",
  "12:20",
  "13:00",
  "13:50",
  "14:40",
  "15:30",
  "15:40",
  "16:30",
  "17:20",
  "18:10",
  "19:20",
  "20:10",
  "20:30",
  "21:20",
  "22:10",
]

type ScheduleFormModalProps = {
  open: boolean
  editing: HorarioDTO | null
  courses: CursoDTO[]
  classes: TurmaDTO[]
  subjects: DisciplinaDTO[]
  teachers: ProfessorDTO[]
  rooms: AmbienteDTO[]
  onClose: () => void
  onSaved: () => Promise<void> | void
}

export function ScheduleFormModal({
  open,
  editing,
  courses,
  classes,
  subjects,
  teachers,
  rooms,
  onClose,
  onSaved,
}: ScheduleFormModalProps) {
  const [form, setForm] = useState({
    cursoId: 0,
    turmaId: 0,
    disciplinaId: 0,
    professorId: 0,
    bloco: "",
    ambienteId: 0,
    diaSemana: "SEGUNDA" as DiaSemana,
    horarioInicio: "07:00",
    horarioFim: "",
  })
  const [error, setError] = useState("")
  const [saving, setSaving] = useState(false)

  const availableBlocos = useMemo(() => {
    const setBlocos = new Set<string>()
    rooms.forEach((r) => {
      const loc = r.localizacao?.trim() || "Sem Bloco Definido"
      setBlocos.add(loc)
    })
    return Array.from(setBlocos).sort()
  }, [rooms])

  const availableClasses = useMemo(() => {
    if (!form.cursoId) return []
    return classes.filter((t) => Number(t.cursoId) === Number(form.cursoId))
  }, [classes, form.cursoId])

  const availableSubjects = useMemo(() => {
    if (!form.cursoId) return []
    return subjects.filter((s) => Number(s.cursoId) === Number(form.cursoId))
  }, [subjects, form.cursoId])

  const availableRooms = useMemo(() => {
    if (!form.bloco) return rooms
    return rooms.filter((r) => {
      const loc = r.localizacao?.trim() || "Sem Bloco Definido"
      return loc === form.bloco
    })
  }, [rooms, form.bloco])

  useEffect(() => {
    if (!open) return

    if (editing) {
      const targetTurma = classes.find((t) => Number(t.id) === Number(editing.turmaId))
      const initialCursoId = Number(editing.cursoId || targetTurma?.cursoId || courses[0]?.id || 0)

      const targetRoom = rooms.find((r) => Number(r.id) === Number(editing.ambienteId))
      const initialBloco = targetRoom?.localizacao?.trim() || availableBlocos[0] || ""

      setForm({
        cursoId: initialCursoId,
        turmaId: Number(editing.turmaId),
        disciplinaId: Number(editing.disciplinaId),
        professorId: Number(editing.professorId),
        bloco: initialBloco,
        ambienteId: Number(editing.ambienteId),
        diaSemana: editing.diaSemana,
        horarioInicio: editing.horarioInicio.substring(0, 5),
        horarioFim: editing.horarioFim.substring(0, 5),
      })
    } else {
      const defaultCursoId = Number(courses[0]?.id || 0)
      const defaultClasses = classes.filter((t) => Number(t.cursoId) === defaultCursoId)
      const defaultSubjects = subjects.filter((s) => Number(s.cursoId) === defaultCursoId)

      const defaultBloco = availableBlocos[0] || ""
      const defaultRooms = rooms.filter(
        (r) => (r.localizacao?.trim() || "Sem Bloco Definido") === defaultBloco
      )

      setForm({
        cursoId: defaultCursoId,
        turmaId: Number(defaultClasses[0]?.id || 0),
        disciplinaId: Number(defaultSubjects[0]?.id || 0),
        professorId: Number(teachers[0]?.id || 0),
        bloco: defaultBloco,
        ambienteId: Number(defaultRooms[0]?.id || rooms[0]?.id || 0),
        diaSemana: "SEGUNDA",
        horarioInicio: "07:00",
        horarioFim: "",
      })
    }
    setError("")
  }, [open, editing, courses, classes, subjects, teachers, rooms, availableBlocos])

  if (!open) return null

  function handleCursoChange(cursoId: number) {
    const courseClasses = classes.filter((t) => Number(t.cursoId) === Number(cursoId))
    const courseSubjects = subjects.filter((s) => Number(s.cursoId) === Number(cursoId))

    setForm((prev) => ({
      ...prev,
      cursoId,
      turmaId: Number(courseClasses[0]?.id || 0),
      disciplinaId: Number(courseSubjects[0]?.id || 0),
    }))
  }

  function handleBlocoChange(bloco: string) {
    const filteredRooms = rooms.filter(
      (r) => (r.localizacao?.trim() || "Sem Bloco Definido") === bloco
    )
    setForm((prev) => ({
      ...prev,
      bloco,
      ambienteId: Number(filteredRooms[0]?.id || 0),
    }))
  }

  function handleToggleTime(time: string) {
    setForm((prev) => {
      // 1. Clicou no horário de início já marcado -> desmarca
      if (prev.horarioInicio === time) {
        return {
          ...prev,
          horarioInicio: prev.horarioFim || "",
          horarioFim: "",
        }
      }

      // 2. Clicou no horário de término já marcado -> desmarca o término
      if (prev.horarioFim === time) {
        return {
          ...prev,
          horarioFim: "",
        }
      }

      // 3. Nenhum horário selecionado ainda -> marca como início
      if (!prev.horarioInicio) {
        return {
          ...prev,
          horarioInicio: time,
          horarioFim: "",
        }
      }

      // 4. Já existe início e ainda não existe término -> se for posterior, marca como término
      if (!prev.horarioFim && time > prev.horarioInicio) {
        return {
          ...prev,
          horarioFim: time,
        }
      }

      // 5. Já existe início e término (ou clicou em horário anterior) -> reinicia com apenas esta caixa marcada
      return {
        ...prev,
        horarioInicio: time,
        horarioFim: "",
      }
    })
  }

  async function save(event: FormEvent) {
    event.preventDefault()
    if (!form.cursoId || form.cursoId === 0) {
      setError("Selecione um curso válido.")
      return
    }
    if (!form.turmaId || form.turmaId === 0) {
      setError("Selecione uma turma vinculada ao curso.")
      return
    }
    if (!form.bloco) {
      setError("Selecione o bloco.")
      return
    }
    if (!form.ambienteId || form.ambienteId === 0) {
      setError("Selecione um ambiente disponível no bloco.")
      return
    }
    if (!form.disciplinaId || form.disciplinaId === 0 || !form.professorId || form.professorId === 0) {
      setError("Selecione todas as entidades obrigatórias.")
      return
    }
    if (!form.horarioInicio || !form.horarioFim || form.horarioFim <= form.horarioInicio) {
      setError("Selecione o horário de início e um horário posterior para o término.")
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
      setSaving(true)
      if (editing?.id) {
        await api.put(`${API_ENDPOINTS.horarios}/${editing.id}`, payload)
        toast.success("Horário atualizado com sucesso!")
      } else {
        await api.post(API_ENDPOINTS.horarios, payload)
        toast.success("Horário cadastrado como rascunho!")
      }
      onClose()
      await onSaved()
    } catch (err: any) {
      const msg = err.response?.data?.message || "Erro ao salvar horário."
      setError(msg)
      toast.error(msg)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="admin-modal-layer" role="dialog" aria-modal="true">
      <button className="admin-modal-backdrop" onClick={onClose} aria-label="Fechar formulário" />
      <form className="admin-modal schedule-form" onSubmit={save}>
        <div className="admin-modal-heading">
          <div>
            <span>{editing ? "EDITAR HORÁRIO" : "NOVO HORÁRIO"}</span>
            <h2>Dados do bloco de aula</h2>
          </div>
          <button type="button" onClick={onClose}>
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
            <select
              value={form.disciplinaId}
              onChange={(e) => setForm((c) => ({ ...c, disciplinaId: Number(e.target.value) }))}
              disabled={!form.cursoId || availableSubjects.length === 0}
            >
              {availableSubjects.length === 0 ? (
                <option value={0}>Nenhuma disciplina cadastrada neste curso</option>
              ) : (
                availableSubjects.map((item) => (
                  <option key={item.id} value={item.id}>{item.nome}</option>
                ))
              )}
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

          <div className="admin-form-field" style={{ gridColumn: "1 / -1" }}>
            <span>
              Horário (Início → Término) *{" "}
              <strong>
                {form.horarioInicio && form.horarioFim
                  ? `${form.horarioInicio} → ${form.horarioFim}`
                  : form.horarioInicio
                  ? `${form.horarioInicio} (selecione o término)`
                  : ""}
              </strong>
            </span>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(84px, 1fr))",
                gap: "8px",
                marginTop: "6px",
              }}
            >
              {HORARIOS_GRADE.map((time) => {
                const isStart = form.horarioInicio === time
                const isEnd = form.horarioFim === time
                const isBetween =
                  Boolean(form.horarioInicio && form.horarioFim) &&
                  time > form.horarioInicio &&
                  time < form.horarioFim
                const checked = isStart || isEnd

                return (
                  <label
                    key={time}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      padding: "6px 10px",
                      borderRadius: "8px",
                      border: checked
                        ? "1.5px solid #2f9e41"
                        : isBetween
                        ? "1px dashed #2f9e41"
                        : "1px solid #d0d7de",
                      backgroundColor: checked
                        ? "rgba(47, 158, 65, 0.14)"
                        : isBetween
                        ? "rgba(47, 158, 65, 0.05)"
                        : "transparent",
                      fontWeight: checked ? 600 : 400,
                      fontSize: "0.875rem",
                      cursor: "pointer",
                      userSelect: "none",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => handleToggleTime(time)}
                      style={{ accentColor: "#2f9e41", cursor: "pointer" }}
                    />
                    <span>{time}</span>
                  </label>
                )
              })}
            </div>
          </div>
        </div>

        {error && <div className="admin-form-error">{error}</div>}
        <div className="admin-modal-actions">
          <Button text="Cancelar" onClick={onClose} />
          <Button className="admin-primary" type="submit" text={saving ? "Salvando..." : "Salvar horário"} />
        </div>
      </form>
    </div>
  )
}