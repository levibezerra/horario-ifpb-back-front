import { useEffect, useMemo, useState, type FormEvent } from "react"
import { useNavigate } from "react-router-dom"
import { AdminIcon } from "@/components/Icon"
import { toast } from "react-toastify"
import Button from "@/components/Button"
import { ConfirmDeleteModal } from "@/components/ConfirmDeleteModal"
import InputField from "@/components/InputField"
import { ROUTES } from "@/routes/paths"
import { api, apiErrorMessage, extractFieldErrors } from "@/services/api"
import { API_ENDPOINTS } from "@/services/api-support/endpoints"
import type { CursoDTO, TurmaDTO } from "@/types/api"
import "./turma.css"

type ClassRecord = {
  id: number
  name: string
  detail: string
  cursoId: number
}

export default function Turma() {
  const navigate = useNavigate()
  const [records, setRecords] = useState<ClassRecord[]>([])
  const [availableCourses, setAvailableCourses] = useState<CursoDTO[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  const [query, setQuery] = useState("")
  const [selectedCourseId, setSelectedCourseId] = useState<number | "ALL">("ALL")
  const [editing, setEditing] = useState<ClassRecord | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [deleting, setDeleting] = useState<ClassRecord | null>(null)

  const [form, setForm] = useState({
    name: "",
    cursoId: 0,
  })
  const [error, setError] = useState("")
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  const loadData = async () => {
    try {
      setLoading(true)
      const [res, coursesRes] = await Promise.all([
        api.get<TurmaDTO[]>(API_ENDPOINTS.turmas),
        api.get<CursoDTO[]>(API_ENDPOINTS.cursos),
      ])

      const loadedCourses = coursesRes.data
      setAvailableCourses(loadedCourses)

      setRecords(
        res.data.map((t) => ({
          id: t.id!,
          name: t.nome,
          detail: t.cursoNome || loadedCourses.find((c) => c.id === t.cursoId)?.nome || "",
          cursoId: t.cursoId,
        })),
      )
    } catch (err) {
      toast.error(apiErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const filtered = useMemo(() => {
    const normalizedQuery = query.toLocaleLowerCase("pt-BR")

    const matching = records.filter((record) => {
      if (selectedCourseId !== "ALL" && record.cursoId !== selectedCourseId) {
        return false
      }
      return `${record.name} ${record.detail}`
        .toLocaleLowerCase("pt-BR")
        .includes(normalizedQuery)
    })

    return [...matching].sort((a, b) => {
      const courseComparison = (a.detail || "").localeCompare(b.detail || "", "pt-BR")
      if (courseComparison !== 0) return courseComparison
      return a.name.localeCompare(b.name, "pt-BR")
    })
  }, [records, query, selectedCourseId])

  function openForm(record?: ClassRecord) {
    setEditing(record ?? null)
    if (record) {
      setForm({
        name: record.name,
        cursoId: record.cursoId || (availableCourses[0]?.id ?? 0),
      })
    } else {
      const defaultCourseId =
        selectedCourseId !== "ALL" ? selectedCourseId : (availableCourses[0]?.id ?? 0)

      setForm({
        name: "",
        cursoId: defaultCourseId,
      })
    }
    setError("")
    setFieldErrors({})
    setFormOpen(true)
  }

  async function save(event: FormEvent) {
    event.preventDefault()
    setError("")
    setFieldErrors({})

    if (!form.name.trim()) {
      setFieldErrors({ nome: "Informe o nome da turma antes de salvar." })
      setError("Informe o nome antes de salvar.")
      return
    }
    if (!form.cursoId) {
      setError("Selecione o curso vinculado.")
      return
    }

    try {
      setSubmitting(true)
      const payload: Partial<TurmaDTO> = {
        nome: form.name.trim(),
        cursoId: form.cursoId,
      }
      if (editing) {
        await api.put(`${API_ENDPOINTS.turmas}/${editing.id}`, payload)
      } else {
        await api.post(API_ENDPOINTS.turmas, payload)
      }

      toast.success(
        editing ? "Turma atualizada com sucesso!" : "Turma cadastrada com sucesso!",
      )
      setFormOpen(false)
      loadData()
    } catch (err: unknown) {
      const fields = extractFieldErrors(err)
      setFieldErrors(fields)
      const msg = Object.values(fields)[0] || apiErrorMessage(err)
      setError(msg)
      toast.error(msg)
    } finally {
      setSubmitting(false)
    }
  }

  async function handleConfirmDelete() {
    if (!deleting) return
    await api.delete(`${API_ENDPOINTS.turmas}/${deleting.id}`)
    toast.success(`Turma "${deleting.name}" excluída com sucesso!`)
    await loadData()
  }

  return (
    <div className="admin-management turma-management">
      <div className="admin-page-heading">
        <div>
          <span>ORGANIZAÇÃO ACADÊMICA</span>
          <h1>Gerenciar turmas</h1>
          <p>
            {records.length} {records.length === 1 ? "turma" : "turmas"} cadastradas.
          </p>
        </div>

        <button className="admin-primary" onClick={() => openForm()} disabled={loading}>
          <AdminIcon name="plus" size={18} />
          Adicionar turma
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
                placeholder="Buscar turma..."
              />
            </label>

            <select
              className="course-filter-select"
              aria-label="Filtrar turmas por curso"
              value={selectedCourseId}
              onChange={(event) => {
                const val = event.target.value
                setSelectedCourseId(val === "ALL" ? "ALL" : Number(val))
              }}
            >
              <option value="ALL">Todas as turmas</option>
              {availableCourses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.nome}
                </option>
              ))}
            </select>
          </div>
          <span>{filtered.length} resultados</span>
        </div>

        <div className="admin-table-scroll">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Nome da turma</th>
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
                        <AdminIcon name="classes" size={17} />
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
              <AdminIcon name="classes" size={28} />
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
                <h2>{editing ? "Editar turma" : "Adicionar turma"}</h2>
              </div>
              <button type="button" onClick={() => setFormOpen(false)}>
                <AdminIcon name="close" size={19} />
              </button>
            </div>

            <InputField
              className="admin-form-field"
              label="Nome da turma"
              name="name"
              value={form.name}
              onChange={(e) => {
                setForm((c) => ({ ...c, name: e.target.value }))
                if (error) setError("")
                if (fieldErrors.nome) setFieldErrors((prev) => ({ ...prev, nome: "" }))
              }}
              error={fieldErrors.nome}
              placeholder="Nome da turma"
              required
            />

            <label className="admin-form-field">
              <span>Curso vinculado *</span>
              <select
                value={form.cursoId}
                onChange={(e) => {
                  setForm((c) => ({ ...c, cursoId: Number(e.target.value) }))
                  if (error) setError("")
                }}
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

            {error && <div className="admin-form-error" role="alert">{error}</div>}
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

      <ConfirmDeleteModal
        open={Boolean(deleting)}
        title="Excluir turma?"
        itemName={deleting?.name ?? ""}
        dependencyActionLabel={(err) =>
          err.toLowerCase().includes("disciplina")
            ? "Ver disciplinas da turma"
            : "Ver horários da turma"
        }
        onDependencyAction={
          deleting
            ? (err) => {
                if (err.toLowerCase().includes("disciplina")) {
                  navigate(
                    `${ROUTES.adminSubjects}?cursoId=${deleting.cursoId}&turmaId=${deleting.id}`,
                  )
                  return
                }
                navigate(
                  `${ROUTES.adminSchedules}?cursoId=${deleting.cursoId}&turmaId=${deleting.id}`,
                )
              }
            : undefined
        }
        onConfirm={handleConfirmDelete}
        onClose={() => setDeleting(null)}
      />
    </div>
  )
}