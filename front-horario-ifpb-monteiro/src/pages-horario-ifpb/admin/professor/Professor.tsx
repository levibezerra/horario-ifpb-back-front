import { useEffect, useMemo, useState, type FormEvent } from "react"
import { AdminIcon } from "@/components/Icon"
import { EMAIL_PATTERN } from "@/services/authService"
import { toast } from "react-toastify"
import Button from "@/components/Button"
import InputField from "@/components/InputField"
import { api } from "@/services/api"
import { API_ENDPOINTS } from "@/services/api-support/endpoints"
import type { CursoDTO, ProfessorDTO } from "@/types/api"
import "./professor.css"

type TeacherRecord = {
  id: number
  name: string
  email: string
  lattesUrl?: string
  cursosIds: number[]
  detail: string
}

export default function Professor() {
  const [records, setRecords] = useState<TeacherRecord[]>([])
  const [availableCourses, setAvailableCourses] = useState<CursoDTO[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  const [query, setQuery] = useState("")
  const [selectedCourseId, setSelectedCourseId] = useState<number | "ALL">("ALL")
  const [editing, setEditing] = useState<TeacherRecord | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [deleting, setDeleting] = useState<TeacherRecord | null>(null)

  const [form, setForm] = useState({
    name: "",
    email: "",
    lattesUrl: "",
    cursosIds: [] as number[],
  })
  const [error, setError] = useState("")

  const loadData = async () => {
    try {
      setLoading(true)
      const [res, coursesRes] = await Promise.all([
        api.get<ProfessorDTO[]>(API_ENDPOINTS.professores),
        api.get<CursoDTO[]>(API_ENDPOINTS.cursos),
      ])

      setAvailableCourses(coursesRes.data)
      setRecords(
        res.data.map((p) => ({
          id: p.id!,
          name: p.nome,
          email: p.email,
          lattesUrl: p.lattesUrl,
          cursosIds: p.cursosIds || [],
          detail: p.cursosNomes?.join(", ") || "",
        })),
      )
    } catch {
      toast.error("Erro ao carregar os dados de professores.")
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
      if (selectedCourseId !== "ALL") {
        if (!record.cursosIds || !record.cursosIds.includes(selectedCourseId)) {
          return false
        }
      }

      return `${record.name} ${record.email} ${record.detail}`
        .toLocaleLowerCase("pt-BR")
        .includes(normalizedQuery)
    })

    return [...matching].sort((a, b) => {
      const courseComparison = (a.detail || "").localeCompare(b.detail || "", "pt-BR")
      if (courseComparison !== 0) return courseComparison
      return a.name.localeCompare(b.name, "pt-BR")
    })
  }, [records, query, selectedCourseId])

  function openForm(record?: TeacherRecord) {
    setEditing(record ?? null)
    if (record) {
      setForm({
        name: record.name,
        email: record.email,
        lattesUrl: record.lattesUrl || "",
        cursosIds: record.cursosIds || [],
      })
    } else {
      setForm({
        name: "",
        email: "",
        lattesUrl: "",
        cursosIds: selectedCourseId !== "ALL" ? [selectedCourseId] : [],
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
    if (!form.email.trim()) {
      setError("Informe o e-mail do professor.")
      return
    }
    if (!EMAIL_PATTERN.test(form.email)) {
      setError("Informe um e-mail válido.")
      return
    }

    try {
      setSubmitting(true)
      const payload: Partial<ProfessorDTO> = {
        nome: form.name.trim(),
        email: form.email.trim(),
        lattesUrl: form.lattesUrl.trim() || undefined,
        cursosIds: form.cursosIds,
      }
      if (editing) {
        await api.put(`${API_ENDPOINTS.professores}/${editing.id}`, payload)
      } else {
        await api.post(API_ENDPOINTS.professores, payload)
      }

      toast.success(
        editing
          ? "Professor atualizado(a) com sucesso!"
          : "Professor cadastrado(a) com sucesso!",
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
      await api.delete(`${API_ENDPOINTS.professores}/${deleting.id}`)
      toast.success("Registro excluído com sucesso!")
      setDeleting(null)
      loadData()
    } catch {
      toast.error("Erro ao excluir registro.")
    }
  }

  return (
    <div className="admin-management professor-management">
      <div className="admin-page-heading">
        <div>
          <span>CORPO DOCENTE</span>
          <h1>Gerenciar professores</h1>
          <p>
            {records.length} {records.length === 1 ? "professor" : "professores"} cadastrados.
          </p>
        </div>

        <button className="admin-primary" onClick={() => openForm()} disabled={loading}>
          <AdminIcon name="plus" size={18} />
          Adicionar professor
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
                placeholder="Buscar professor..."
              />
            </label>

            <select
              className="course-filter-select"
              aria-label="Filtrar professores por curso"
              value={selectedCourseId}
              onChange={(event) => {
                const val = event.target.value
                setSelectedCourseId(val === "ALL" ? "ALL" : Number(val))
              }}
            >
              <option value="ALL">Todos os professores</option>
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
                <th>Nome do professor</th>
                <th>Cursos e dados acadêmicos</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((record) => (
                <tr key={record.id}>
                  <td>
                    <div className="entity-name-cell">
                      <span className="table-entity-icon">
                        <AdminIcon name="teachers" size={17} />
                      </span>
                      <strong>{record.name}</strong>
                    </div>
                  </td>
                  <td>
                    <span>{record.detail || "Não informado"}</span>
                    {record.email && <small>{record.email}</small>}
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
              <AdminIcon name="teachers" size={28} />
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
                <h2>{editing ? "Editar professor" : "Adicionar professor"}</h2>
              </div>
              <button type="button" onClick={() => setFormOpen(false)}>
                <AdminIcon name="close" size={19} />
              </button>
            </div>

            <InputField
              className="admin-form-field"
              label="Nome do professor"
              name="name"
              value={form.name}
              onChange={(e) => setForm((c) => ({ ...c, name: e.target.value }))}
              placeholder="Nome do professor"
              required
            />

            <label className="admin-form-field">
              <span>E-mail acadêmico *</span>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm((c) => ({ ...c, email: e.target.value }))}
                placeholder="nome@ifpb.edu.br"
              />
            </label>

            <label className="admin-form-field">
              <span>Link do Currículo Lattes</span>
              <input
                type="url"
                value={form.lattesUrl}
                onChange={(e) => setForm((c) => ({ ...c, lattesUrl: e.target.value }))}
                placeholder="https://lattes.cnpq.br/..."
              />
            </label>

            <fieldset className="admin-form-field course-checkboxes">
              <legend>Cursos vinculados</legend>
              {availableCourses.map((course) => (
                <label key={course.id}>
                  <input
                    type="checkbox"
                    checked={form.cursosIds.includes(course.id!)}
                    onChange={(e) =>
                      setForm((c) => ({
                        ...c,
                        cursosIds: e.target.checked
                          ? [...c.cursosIds, course.id!]
                          : c.cursosIds.filter((id) => id !== course.id),
                      }))
                    }
                  />
                  <span>{course.nome}</span>
                </label>
              ))}
            </fieldset>

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
            <h2>Excluir professor?</h2>
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