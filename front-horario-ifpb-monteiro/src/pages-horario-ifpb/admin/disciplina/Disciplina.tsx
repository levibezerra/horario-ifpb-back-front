import { useEffect, useMemo, useState, type FormEvent } from "react"
import { AdminIcon } from "@/components/Icon"
import { toast } from "react-toastify"
import Button from "@/components/Button"
import InputField from "@/components/InputField"
import { api } from "@/services/api"
import { API_ENDPOINTS } from "@/services/api-support/endpoints"
import type { CursoDTO, DisciplinaDTO, TurmaDTO } from "@/types/api"
import "./disciplina.css"

type SubjectRecord = {
  id: number
  name: string
  detail: string
  cursoId?: number
}

export default function Disciplina() {
  const [records, setRecords] = useState<SubjectRecord[]>([])
  const [availableCourses, setAvailableCourses] = useState<CursoDTO[]>([])
  const [availableClasses, setAvailableClasses] = useState<TurmaDTO[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  const [query, setQuery] = useState("")
  const [selectedClassId, setSelectedClassId] = useState<number | "ALL">("ALL")
  const [editing, setEditing] = useState<SubjectRecord | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [deleting, setDeleting] = useState<SubjectRecord | null>(null)

  const [form, setForm] = useState({
    name: "",
    cursoId: 0,
  })
  const [error, setError] = useState("")

  const loadData = async () => {
    try {
      setLoading(true)
      const [res, coursesRes, classesRes] = await Promise.all([
        api.get<DisciplinaDTO[]>(API_ENDPOINTS.disciplinas),
        api.get<CursoDTO[]>(API_ENDPOINTS.cursos),
        api.get<TurmaDTO[]>(API_ENDPOINTS.turmas),
      ])

      const loadedCourses = coursesRes.data
      setAvailableCourses(loadedCourses)
      setAvailableClasses(classesRes.data)

      setRecords(
        res.data.map((d) => ({
          id: d.id!,
          name: d.nome,
          detail: d.cursoNome || loadedCourses.find((c) => c.id === d.cursoId)?.nome || "",
          cursoId: d.cursoId,
        })),
      )
    } catch {
      toast.error("Erro ao carregar os dados de disciplinas.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const filtered = useMemo(() => {
    const normalizedQuery = query.toLocaleLowerCase("pt-BR")

    return records.filter((record) => {
      if (selectedClassId !== "ALL") {
        const targetClass = availableClasses.find((t) => t.id === selectedClassId)
        if (targetClass && record.cursoId !== targetClass.cursoId) {
          return false
        }
      }

      return `${record.name} ${record.detail}`
        .toLocaleLowerCase("pt-BR")
        .includes(normalizedQuery)
    })
  }, [records, query, selectedClassId, availableClasses])

  function openForm(record?: SubjectRecord) {
    setEditing(record ?? null)
    if (record) {
      setForm({
        name: record.name,
        cursoId: record.cursoId || (availableCourses[0]?.id ?? 0),
      })
    } else {
      setForm({
        name: "",
        cursoId: availableCourses[0]?.id ?? 0,
      })
    }
    setError("")
    setFormOpen(true)
  }

  async function save(event: FormEvent) {
    event.preventDefault()
    if (!form.name.trim()) {
      setError("Informe o nome antes de salvar.")
      return
    }

    try {
      setSubmitting(true)
      const payload: Partial<DisciplinaDTO> = {
        nome: form.name.trim(),
        cursoId: form.cursoId,
      }
      if (editing) {
        await api.put(`${API_ENDPOINTS.disciplinas}/${editing.id}`, payload)
      } else {
        await api.post(API_ENDPOINTS.disciplinas, payload)
      }

      toast.success(
        editing
          ? "disciplina atualizado(a) com sucesso!"
          : "disciplina cadastrado(a) com sucesso!",
      )
      setFormOpen(false)
      loadData()
    } catch (err: any) {
      const msg = err.response?.data?.message || "Erro ao salvar no servidor."
      setError(msg)
      toast.error(msg)
    } finally {
      setSubmitting(false)
    }
  }

  async function confirmDelete() {
    if (!deleting) return
    try {
      await api.delete(`${API_ENDPOINTS.disciplinas}/${deleting.id}`)
      toast.success("Registro excluído com sucesso!")
      setDeleting(null)
      loadData()
    } catch {
      toast.error("Erro ao excluir registro.")
    }
  }

  return (
    <div className="admin-management disciplina-management">
      <div className="admin-page-heading">
        <div>
          <span>COMPONENTES CURRICULARES</span>
          <h1>Gerenciar disciplinas</h1>
          <p>
            {records.length} {records.length === 1 ? "disciplina" : "disciplinas"} cadastrados.
          </p>
        </div>

        <button className="admin-primary" onClick={() => openForm()} disabled={loading}>
          <AdminIcon name="plus" size={18} />
          Adicionar disciplina
        </button>
      </div>

      <section className="admin-surface management-surface">
        <div className="table-toolbar">
          <div className="table-toolbar-filters">
            <label>
              <AdminIcon name="search" size={18} />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Buscar disciplina..."
              />
            </label>

            <select
              className="course-filter-select"
              aria-label="Filtrar disciplinas por turma/período"
              value={selectedClassId}
              onChange={(event) => {
                const val = event.target.value
                setSelectedClassId(val === "ALL" ? "ALL" : Number(val))
              }}
            >
              <option value="ALL">Todas as disciplinas</option>
              {availableClasses.map((cls) => {
                const courseName =
                  cls.cursoNome || availableCourses.find((c) => c.id === cls.cursoId)?.nome || ""
                return (
                  <option key={cls.id} value={cls.id}>
                    {cls.nome} — {courseName}
                  </option>
                )
              })}
            </select>
          </div>
          <span>{filtered.length} resultados</span>
        </div>

        <div className="admin-table-scroll">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Nome da disciplina</th>
                <th>Curso vinculado</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((record) => (
                <tr key={record.id}>
                  <td>
                    <div className="entity-name-cell">
                      <span className="table-entity-icon">
                        <AdminIcon name="subjects" size={17} />
                      </span>
                      <strong>{record.name}</strong>
                    </div>
                  </td>
                  <td>
                    <span>{record.detail || "Não informado"}</span>
                  </td>
                  <td>
                    <button onClick={() => openForm(record)} aria-label={`Editar ${record.name}`}>
                      <AdminIcon name="edit" size={17} />
                    </button>
                    <button
                      className="danger-action"
                      onClick={() => setDeleting(record)}
                      aria-label={`Excluir ${record.name}`}
                    >
                      <AdminIcon name="trash" size={17} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!loading && !filtered.length && (
            <div className="admin-empty">
              <AdminIcon name="subjects" size={28} />
              <strong>Nenhum registro encontrado</strong>
            </div>
          )}
        </div>
      </section>

      {formOpen && (
        <div className="admin-modal-layer" role="dialog" aria-modal="true">
          <button
            className="admin-modal-backdrop"
            onClick={() => setFormOpen(false)}
            aria-label="Fechar formulário"
          />
          <form className="admin-modal" onSubmit={save} noValidate>
            <div className="admin-modal-heading">
              <div>
                <span>{editing ? "EDITAR REGISTRO" : "NOVO REGISTRO"}</span>
                <h2>{editing ? "Editar disciplina" : "Adicionar disciplina"}</h2>
              </div>
              <button type="button" onClick={() => setFormOpen(false)}>
                <AdminIcon name="close" size={19} />
              </button>
            </div>

            <InputField
              className="admin-form-field"
              label="Nome da disciplina"
              name="name"
              value={form.name}
              onChange={(e) => setForm((c) => ({ ...c, name: e.target.value }))}
              placeholder="Nome da disciplina"
              required
            />

            <label className="admin-form-field">
              <span>Curso vinculado *</span>
              <select
                value={form.cursoId}
                onChange={(e) => setForm((c) => ({ ...c, cursoId: Number(e.target.value) }))}
              >
                {availableCourses.length === 0 ? (
                  <option value={0}>Nenhum curso cadastrado</option>
                ) : (
                  availableCourses.map((course) => (
                    <option key={course.id} value={course.id}>
                      {course.codigo ? `${course.nome} (${course.codigo})` : course.nome}
                    </option>
                  ))
                )}
              </select>
            </label>

            {error && <div className="admin-form-error">{error}</div>}
            <div className="admin-modal-actions">
              <Button text="Cancelar" onClick={() => setFormOpen(false)} />
              <Button
                className="admin-primary"
                type="submit"
                text={submitting ? "Enviando..." : editing ? "Salvar alterações" : "Adicionar"}
              />
            </div>
          </form>
        </div>
      )}

      {deleting && (
        <div className="admin-modal-layer" role="alertdialog" aria-modal="true">
          <button
            className="admin-modal-backdrop"
            onClick={() => setDeleting(null)}
            aria-label="Cancelar exclusão"
          />
          <section className="admin-confirm">
            <span>
              <AdminIcon name="warning" size={24} />
            </span>
            <h2>Excluir disciplina?</h2>
            <p>
              O registro <strong>{deleting.name}</strong> será removido permanentemente.
            </p>
            <div>
              <button onClick={() => setDeleting(null)}>Cancelar</button>
              <button className="confirm-delete" onClick={confirmDelete}>
                Excluir registro
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  )
}