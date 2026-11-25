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
import type { CursoDTO, ModalidadeCurso } from "@/types/api"
import "./curso.css"

type CourseRecord = {
  id: number
  name: string
  code: string
  modalidade: ModalidadeCurso
  detail: string
}

const COURSE_MODALITIES_OPTIONS: { id: ModalidadeCurso; label: string }[] = [
  { id: "INTEGRADO", label: "Técnico Integrado" },
  { id: "SUPERIOR", label: "Ensino Superior" },
  { id: "SUBSEQUENTE", label: "Técnico Subsequente" },
]

function normalizeText(value: string): string {
  return value.trim().replace(/\s+/g, " ")
}

export default function Curso() {
  const navigate = useNavigate()

  const [records, setRecords] = useState<CourseRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  const [query, setQuery] = useState("")
  const [editing, setEditing] = useState<CourseRecord | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [deleting, setDeleting] = useState<CourseRecord | null>(null)

  const [form, setForm] = useState({
    name: "",
    code: "",
    modalidade: "INTEGRADO" as ModalidadeCurso,
  })
  const [error, setError] = useState("")
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  const loadData = async () => {
    try {
      setLoading(true)
      const res = await api.get<CursoDTO[]>(API_ENDPOINTS.cursos)
      setRecords(
        res.data.map((c) => {
          const modLabel =
            COURSE_MODALITIES_OPTIONS.find((m) => m.id === c.modalidade)?.label ||
            c.modalidade ||
            "Não definida"
          return {
            id: c.id!,
            name: c.nome,
            code: c.codigo || "",
            modalidade: c.modalidade || "INTEGRADO",
            detail: c.codigo ? `${c.codigo} — ${modLabel}` : modLabel,
          }
        }),
      )
    } catch (err: unknown) {
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
    return records.filter((record) =>
      `${record.name} ${record.code} ${record.detail}`
        .toLocaleLowerCase("pt-BR")
        .includes(normalizedQuery),
    )
  }, [records, query])

  function openForm(record?: CourseRecord) {
    setEditing(record ?? null)
    if (record) {
      setForm({
        name: record.name,
        code: record.code,
        modalidade: record.modalidade,
      })
    } else {
      setForm({
        name: "",
        code: "",
        modalidade: "INTEGRADO",
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

    const trimmedName = normalizeText(form.name)
    const normalizedCode = form.code.trim().toUpperCase()

    if (!trimmedName) {
      const msg = "Informe o nome do curso antes de salvar."
      setFieldErrors({ nome: msg })
      setError(msg)
      return
    }
    if (!normalizedCode) {
      const msg = "Informe o código do curso antes de salvar."
      setFieldErrors({ codigo: msg })
      setError(msg)
      return
    }

    const duplicateCode = records.some(
      (item) =>
        (!editing || item.id !== editing.id) &&
        item.code.trim().toUpperCase() === normalizedCode,
    )
    if (duplicateCode) {
      const msg = `Já existe um curso cadastrado com o código "${normalizedCode}".`
      setFieldErrors({ codigo: "Este código já está em uso." })
      setError(msg)
      return
    }

    const duplicateNameModality = records.some(
      (item) =>
        (!editing || item.id !== editing.id) &&
        normalizeText(item.name).toLocaleLowerCase("pt-BR") ===
          trimmedName.toLocaleLowerCase("pt-BR") &&
        item.modalidade === form.modalidade,
    )
    if (duplicateNameModality) {
      const msg = `Já existe um curso cadastrado com o nome "${trimmedName}" nesta modalidade.`
      setFieldErrors({ nome: "Curso já cadastrado nesta modalidade." })
      setError(msg)
      return
    }

    try {
      setSubmitting(true)
      const payload: Partial<CursoDTO> = {
        nome: trimmedName,
        codigo: normalizedCode,
        modalidade: form.modalidade,
      }
      if (editing) {
        await api.put(`${API_ENDPOINTS.cursos}/${editing.id}`, payload)
      } else {
        await api.post(API_ENDPOINTS.cursos, payload)
      }

      toast.success(
        editing ? "Curso atualizado com sucesso!" : "Curso cadastrado com sucesso!",
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
    await api.delete(`${API_ENDPOINTS.cursos}/${deleting.id}`)
    toast.success(`Curso "${deleting.name}" excluído com sucesso!`)
    await loadData()
  }

  return (
    <div className="admin-management curso-management">
      <div className="admin-page-heading">
        <div>
          <span>OFERTA ACADÊMICA</span>
          <h1>Gerenciar cursos</h1>
          <p>
            {records.length} {records.length === 1 ? "curso" : "cursos"} cadastrados.
          </p>
        </div>

        <button className="admin-primary" onClick={() => openForm()} disabled={loading}>
          <AdminIcon name="plus" size={18} />
          Adicionar curso
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
                placeholder="Buscar curso..."
              />
            </label>
          </div>
          <span>{filtered.length} resultados</span>
        </div>

        <div className="admin-table-scroll">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Nome do curso</th>
                <th>Código e Modalidade</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((record) => (
                <tr key={record.id}>
                  <td>
                    <div className="entity-name-cell">
                      <span className="table-entity-icon">
                        <AdminIcon name="graduation" size={17} />
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
              <AdminIcon name="graduation" size={28} />
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
                <h2>{editing ? "Editar curso" : "Adicionar curso"}</h2>
              </div>
              <button type="button" onClick={() => setFormOpen(false)}>
                <AdminIcon name="close" size={19} />
              </button>
            </div>

            <InputField
              className="admin-form-field"
              label="Nome do curso"
              name="name"
              value={form.name}
              onChange={(e) => {
                setForm((c) => ({ ...c, name: e.target.value }))
                if (error) setError("")
                if (fieldErrors.nome) setFieldErrors((prev) => ({ ...prev, nome: "" }))
              }}
              error={fieldErrors.nome}
              placeholder="Nome do curso"
              required
            />

            <InputField
              className="admin-form-field"
              label="Código do curso *"
              name="code"
              value={form.code}
              onChange={(e) => {
                setForm((c) => ({ ...c, code: e.target.value }))
                if (error) setError("")
                if (fieldErrors.codigo) setFieldErrors((prev) => ({ ...prev, codigo: "" }))
              }}
              error={fieldErrors.codigo}
              placeholder="Ex: ADS, INFO, EDIF"
              required
            />

            <label className="admin-form-field">
              <span>Modalidade do curso *</span>
              <select
                value={form.modalidade}
                onChange={(e) => {
                  setForm((c) => ({ ...c, modalidade: e.target.value as ModalidadeCurso }))
                  if (error) setError("")
                }}
              >
                {COURSE_MODALITIES_OPTIONS.map((mod) => (
                  <option key={mod.id} value={mod.id}>
                    {mod.label}
                  </option>
                ))}
              </select>
            </label>

            {error && (
              <div className="admin-form-error" role="alert">
                {error}
              </div>
            )}
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
        title="Excluir curso?"
        itemName={deleting?.name ?? ""}
        dependencyActionLabel={(err) => {
          const lower = err.toLowerCase()
          if (lower.includes("turma")) return "Ver turmas"
          if (lower.includes("disciplina")) return "Ver disciplinas"
          if (lower.includes("professor")) {
            return err.includes("1 professor(es)") ? "Ver professor" : "Ver professores"
          }
          return "Ver turmas"
        }}
        onDependencyAction={
          deleting
            ? (err) => {
                const lower = err.toLowerCase()
                if (lower.includes("turma")) {
                  navigate(`${ROUTES.adminClasses}?cursoId=${deleting.id}`)
                  return
                }
                if (lower.includes("disciplina")) {
                  navigate(`${ROUTES.adminSubjects}?cursoId=${deleting.id}`)
                  return
                }
                if (lower.includes("professor")) {
                  navigate(`${ROUTES.adminTeachers}?cursoId=${deleting.id}`)
                  return
                }
                navigate(`${ROUTES.adminClasses}?cursoId=${deleting.id}`)
              }
            : undefined
        }
        onConfirm={handleConfirmDelete}
        onClose={() => setDeleting(null)}
      />
    </div>
  )
}