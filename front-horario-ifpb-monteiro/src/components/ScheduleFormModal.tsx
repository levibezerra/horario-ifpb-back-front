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
    horarioInicio: "07:30",
    horarioFim: "08:20",
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
    return classes.filter((t) => t.cursoId === form.cursoId)
  }, [classes, form.cursoId])

  const availableSubjects = useMemo(() => {
    if (!form.cursoId) return subjects
    const courseSubjects = subjects.filter((s) => s.cursoId === form.cursoId)
    return courseSubjects.length > 0 ? courseSubjects : subjects.filter((s) => !s.cursoId)
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
      const targetTurma = classes.find((t) => t.id === editing.turmaId)
      const initialCursoId = editing.cursoId || targetTurma?.cursoId || courses[0]?.id || 0

      const targetRoom = rooms.find((r) => r.id === editing.ambienteId)
      const initialBloco = targetRoom?.localizacao?.trim() || availableBlocos[0] || ""

      setForm({
        cursoId: initialCursoId,
        turmaId: editing.turmaId,
        disciplinaId: editing.disciplinaId,
        professorId: editing.professorId,
        bloco: initialBloco,
        ambienteId: editing.ambienteId,
        diaSemana: editing.diaSemana,
        horarioInicio: editing.horarioInicio.substring(0, 5),
        horarioFim: editing.horarioFim.substring(0, 5),
      })
    } else {
      const defaultCursoId = courses[0]?.id || 0
      const defaultClasses = classes.filter((t) => t.cursoId === defaultCursoId)
      const courseSubjects = subjects.filter((s) => s.cursoId === defaultCursoId)
      const defaultSubjects = courseSubjects.length > 0 ? courseSubjects : subjects

      const defaultBloco = availableBlocos[0] || ""
      const defaultRooms = rooms.filter(
        (r) => (r.localizacao?.trim() || "Sem Bloco Definido") === defaultBloco
      )

      setForm({
        cursoId: defaultCursoId,
        turmaId: defaultClasses[0]?.id || 0,
        disciplinaId: defaultSubjects[0]?.id || 0,
        professorId: teachers[0]?.id || 0,
        bloco: defaultBloco,
        ambienteId: defaultRooms[0]?.id || rooms[0]?.id || 0,
        diaSemana: "SEGUNDA",
        horarioInicio: "07:30",
        horarioFim: "08:20",
      })
    }
    setError("")
  }, [open, editing, courses, classes, subjects, teachers, rooms, availableBlocos])

  if (!open) return null

  function handleCursoChange(cursoId: number) {
    const courseClasses = classes.filter((t) => t.cursoId === cursoId)
    const courseSubjects = subjects.filter((s) => s.cursoId === cursoId)
    const validSubjects = courseSubjects.length > 0 ? courseSubjects : subjects.filter((s) => !s.cursoId)

    setForm((prev) => ({
      ...prev,
      cursoId,
      turmaId: courseClasses[0]?.id || 0,
      disciplinaId: validSubjects[0]?.id || 0,
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
          <Button text="Cancelar" onClick={onClose} />
          <Button className="admin-primary" type="submit" text={saving ? "Salvando..." : "Salvar horário"} />
        </div>
      </form>
    </div>
  )
}