import { useEffect, useMemo, useState, type FormEvent } from "react"
import { AdminIcon } from "@/components/Icon"
import { toast } from "react-toastify"
import Button from "@/components/Button"
import InputField from "@/components/InputField"
import { api } from "@/services/api"
import { API_ENDPOINTS } from "@/services/api-support/endpoints"
import type { AmbienteDTO, CategoriaAmbiente } from "@/types/api"
import "./ambiente.css"

type RoomRecord = {
  id: number
  name: string
  categoria: CategoriaAmbiente
  detail: string
}

const ROOM_CATEGORIES_OPTIONS: { id: CategoriaAmbiente; label: string }[] = [
  { id: "SALA", label: "Sala de Aula" },
  { id: "LABORATORIO", label: "Laboratório" },
  { id: "AUDITORIO", label: "Auditório" },
  { id: "ESPORTIVO", label: "Espaço Esportivo" },
]

export default function Ambiente() {
  const [records, setRecords] = useState<RoomRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  const [query, setQuery] = useState("")
  const [editing, setEditing] = useState<RoomRecord | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [deleting, setDeleting] = useState<RoomRecord | null>(null)

  const [form, setForm] = useState({
    name: "",
    categoria: "SALA" as CategoriaAmbiente,
    detail: "",
  })
  const [error, setError] = useState("")

  const loadData = async () => {
    try {
      setLoading(true)
      const res = await api.get<AmbienteDTO[]>(API_ENDPOINTS.ambientes)
      setRecords(
        res.data.map((a) => ({
          id: a.id!,
          name: a.nome,
          categoria: a.categoria,
          detail: a.localizacao || "",
        })),
      )
    } catch {
      toast.error("Erro ao carregar os dados de ambientes.")
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
      `${record.name} ${record.categoria} ${record.detail}`
        .toLocaleLowerCase("pt-BR")
        .includes(normalizedQuery),
    )
  }, [records, query])

  function openForm(record?: RoomRecord) {
    setEditing(record ?? null)
    if (record) {
      setForm({
        name: record.name,
        categoria: record.categoria || "SALA",
        detail: record.detail || "",
      })
    } else {
      setForm({
        name: "",
        categoria: "SALA",
        detail: "",
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
      const payload: Partial<AmbienteDTO> = {
        nome: form.name.trim(),
        categoria: form.categoria,
        localizacao: form.detail.trim() || undefined,
      }
      if (editing) {
        await api.put(`${API_ENDPOINTS.ambientes}/${editing.id}`, payload)
      } else {
        await api.post(API_ENDPOINTS.ambientes, payload)
      }

      toast.success(
        editing ? "ambiente atualizado(a) com sucesso!" : "ambiente cadastrado(a) com sucesso!",
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
      await api.delete(`${API_ENDPOINTS.ambientes}/${deleting.id}`)
      toast.success("Registro excluído com sucesso!")
      setDeleting(null)
      loadData()
    } catch {
      toast.error("Erro ao excluir registro.")
    }
  }

  return (
    <div className="admin-management ambiente-management">
      <div className="admin-page-heading">
        <div>
          <span>ESPAÇOS ACADÊMICOS</span>
          <h1>Gerenciar ambientes</h1>
          <p>
            {records.length} {records.length === 1 ? "ambiente" : "ambientes"} cadastrados.
          </p>
        </div>

        <button className="admin-primary" onClick={() => openForm()} disabled={loading}>
          <AdminIcon name="plus" size={18} />
          Adicionar ambiente
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
                placeholder="Buscar ambiente..."
              />
            </label>
          </div>
          <span>{filtered.length} resultados</span>
        </div>

        <div className="admin-table-scroll">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Identificação ou nome</th>
                <th>Localização</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((record) => (
                <tr key={record.id}>
                  <td>
                    <div className="entity-name-cell">
                      <span className="table-entity-icon">
                        <AdminIcon name="rooms" size={17} />
                      </span>
                      <strong>{record.name}</strong>
                    </div>
                  </td>
                  <td>
                    <span>{record.detail || "Não informado"}</span>
                    {record.categoria && <small>{record.categoria}</small>}
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
              <AdminIcon name="rooms" size={28} />
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
                <h2>{editing ? "Editar ambiente" : "Adicionar ambiente"}</h2>
              </div>
              <button type="button" onClick={() => setFormOpen(false)}>
                <AdminIcon name="close" size={19} />
              </button>
            </div>

            <InputField
              className="admin-form-field"
              label="Identificação ou nome"
              name="name"
              value={form.name}
              onChange={(e) => setForm((c) => ({ ...c, name: e.target.value }))}
              placeholder="Identificação ou nome"
              required
            />

            <label className="admin-form-field">
              <span>Categoria *</span>
              <select
                value={form.categoria}
                onChange={(e) =>
                  setForm((c) => ({ ...c, categoria: e.target.value as CategoriaAmbiente }))
                }
              >
                {ROOM_CATEGORIES_OPTIONS.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="admin-form-field">
              <span>Localização</span>
              <input
                value={form.detail}
                onChange={(e) => setForm((c) => ({ ...c, detail: e.target.value }))}
                placeholder="Ex: Bloco A"
              />
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
            <h2>Excluir ambiente?</h2>
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