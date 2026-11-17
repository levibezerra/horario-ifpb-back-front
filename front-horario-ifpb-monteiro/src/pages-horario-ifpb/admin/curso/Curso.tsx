import { useEffect, useMemo, useState, type FormEvent } from "react"
import { AdminIcon } from "@/components/Icon"
import { toast } from "react-toastify"
import Button from "@/components/Button"
import InputField from "@/components/InputField"
import { api } from "@/services/api"
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

export default function Curso() {
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
    } catch {
      toast.error("Erro ao carregar os dados de cursos.")
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
    setFormOpen(true)
  }

  async function save(event: FormEvent) {
    event.preventDefault()
    if (!form.name.trim()) {
      setError("Informe o nome antes de salvar.")
      return
    }
    if (!form.code.trim()) {
      setError("Informe o código do curso.")
      return
    }

    try {
      setSubmitting(true)
      const payload: Partial<CursoDTO> = {
        nome: form.name.trim(),
        codigo: form.code.trim(),
        modalidade: form.modalidade,
      }
      if (editing) {
        await api.put(`${API_ENDPOINTS.cursos}/${editing.id}`, payload)
      } else {
        await api.post(API_ENDPOINTS.cursos, payload)
      }

      toast.success(
        editing ? "curso atualizado(a) com sucesso!" : "curso cadastrado(a) com sucesso!",
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
      await api.delete(`${API_ENDPOINTS.cursos}/${deleting.id}`)
      toast.success("Registro excluído com sucesso!")
      setDeleting(null)
      loadData()
    } catch {
      toast.error("Erro ao excluir registro.")
    }
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
              onChange={(e) => setForm((c) => ({ ...c, name: e.target.value }))}
              placeholder="Nome do curso"
              required
            />

            <InputField
              className="admin-form-field"
              label="Código do curso *"
              name="code"
              value={form.code}
              onChange={(e) => setForm((c) => ({ ...c, code: e.target.value }))}
              placeholder="Ex: ADS, INFO, EDIF"
              required
            />

            <label className="admin-form-field">
              <span>Modalidade do curso *</span>
              <select
                value={form.modalidade}
                onChange={(e) =>
                  setForm((c) => ({ ...c, modalidade: e.target.value as ModalidadeCurso }))
                }
              >
                {COURSE_MODALITIES_OPTIONS.map((mod) => (
                  <option key={mod.id} value={mod.id}>
                    {mod.label}
                  </option>
                ))}
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
            <h2>Excluir curso?</h2>
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