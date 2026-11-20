import { useEffect, useMemo, useState, type FormEvent } from "react"
import { AdminIcon } from "@/components/Icon"
import { toast } from "react-toastify"
import Button from "@/components/Button"
import InputField from "@/components/InputField"
import { api } from "@/services/api"
import { API_ENDPOINTS } from "@/services/api-support/endpoints"
import { usePeriodoLetivo } from "@/hooks/usePeriodoLetivo"
import {
  StatusCalendarioAcademico,
  TipoCalendarioAcademico,
} from "@/types/api"
import "./calendario_academico.css"

type AcademicScheduleRecord = {
  id: number
  name: string
  tipoCalendario: TipoCalendarioAcademico
  detail: string
  pdfUrl: string
  fileName: string
  statusCalendario: StatusCalendarioAcademico
}

const ACADEMIC_CALENDARS_ENDPOINT =
  (API_ENDPOINTS as Record<string, string>).calendariosAcademicos || "/calendarios-academicos"

const ACADEMIC_CALENDAR_TYPES_OPTIONS: { id: TipoCalendarioAcademico; label: string }[] = [
  { id: TipoCalendarioAcademico.SUPERIOR, label: "Cursos Superiores" },
  { id: TipoCalendarioAcademico.INTEGRADO, label: "Cursos Técnicos Integrados" },
]

function parseTipoCalendario(raw: any): TipoCalendarioAcademico {
  const value = String(raw?.tipo || raw?.modalidade || "").toUpperCase()
  if (value === TipoCalendarioAcademico.INTEGRADO) return TipoCalendarioAcademico.INTEGRADO
  if (value === TipoCalendarioAcademico.SUPERIOR) return TipoCalendarioAcademico.SUPERIOR

  const title = String(raw?.titulo || raw?.nome || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
  return title.includes("integrado")
    ? TipoCalendarioAcademico.INTEGRADO
    : TipoCalendarioAcademico.SUPERIOR
}

function parseStatusCalendario(raw: any): StatusCalendarioAcademico {
  const status = String(raw?.status || "").toUpperCase()
  if (status === StatusCalendarioAcademico.PUBLICADO || raw?.publicado === true) {
    return StatusCalendarioAcademico.PUBLICADO
  }
  return StatusCalendarioAcademico.RASCUNHO
}

export default function CalendarioAcademico() {
  const { periodoLetivo } = usePeriodoLetivo()

  const [records, setRecords] = useState<AcademicScheduleRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [bulkActionLoading, setBulkActionLoading] = useState(false)

  const [query, setQuery] = useState("")
  const [selectedScheduleIds, setSelectedScheduleIds] = useState<number[]>([])
  const [editing, setEditing] = useState<AcademicScheduleRecord | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [deleting, setDeleting] = useState<AcademicScheduleRecord | null>(null)

  const [form, setForm] = useState({
    name: "",
    tipoCalendario: TipoCalendarioAcademico.SUPERIOR,
    pdfFile: null as File | null,
    statusCalendario: StatusCalendarioAcademico.RASCUNHO,
  })
  const [error, setError] = useState("")

  const loadData = async () => {
    try {
      setLoading(true)
      const res = await api.get(ACADEMIC_CALENDARS_ENDPOINT)
      const items = Array.isArray(res.data) ? res.data : res.data ? [res.data] : []
      setRecords(
        items.map((item: any) => {
          const statusCalendario = parseStatusCalendario(item)
          const fileName = item.nomeArquivo || item.arquivoNome || "calendario-academico.pdf"
          const tipoCalendario = parseTipoCalendario(item)
          return {
            id: item.id,
            name: item.titulo || item.nome || "Calendário Acadêmico",
            tipoCalendario,
            fileName,
            pdfUrl:
              item.urlArquivo ||
              item.arquivoUrl ||
              `${ACADEMIC_CALENDARS_ENDPOINT}/${item.id}/download`,
            statusCalendario,
            detail: fileName,
          }
        }),
      )
    } catch {
      toast.error("Erro ao carregar os dados de calendários acadêmicos.")
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
      `${record.name} ${record.tipoCalendario} ${record.detail}`
        .toLocaleLowerCase("pt-BR")
        .includes(normalizedQuery),
    )
  }, [records, query])

  const allFilteredSelected =
    filtered.length > 0 && filtered.every((record) => selectedScheduleIds.includes(record.id))

  function toggleSelectAllSchedules(checked: boolean) {
    if (checked) {
      const visibleIds = filtered.map((r) => r.id)
      setSelectedScheduleIds((prev) => Array.from(new Set([...prev, ...visibleIds])))
    } else {
      const visibleSet = new Set(filtered.map((r) => r.id))
      setSelectedScheduleIds((prev) => prev.filter((id) => !visibleSet.has(id)))
    }
  }

  function toggleSelectSchedule(id: number) {
    setSelectedScheduleIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    )
  }

  async function handlePublishSelectedSchedules() {
    if (selectedScheduleIds.length === 0) {
      toast.warning("Selecione pelo menos um calendário acadêmico para publicar.")
      return
    }

    try {
      setBulkActionLoading(true)
      for (const id of selectedScheduleIds) {
        await api.patch(`${ACADEMIC_CALENDARS_ENDPOINT}/${id}/publicar`)
      }
      toast.success(
        selectedScheduleIds.length === 1
          ? "Calendário acadêmico publicado na área pública!"
          : "Calendários acadêmicos selecionados publicados na área pública!",
      )
      setSelectedScheduleIds([])
      loadData()
    } catch (err: any) {
      const msg = err.response?.data?.message || "Erro ao publicar o(s) calendário(s) acadêmico(s)."
      toast.error(msg)
    } finally {
      setBulkActionLoading(false)
    }
  }

  async function handleUnpublishSelectedSchedules() {
    if (selectedScheduleIds.length === 0) {
      toast.warning("Selecione pelo menos um calendário acadêmico para remover da área pública.")
      return
    }

    try {
      setBulkActionLoading(true)
      for (const id of selectedScheduleIds) {
        try {
          await api.patch(`${ACADEMIC_CALENDARS_ENDPOINT}/${id}/despublicar`)
        } catch {
          const target = records.find((r) => r.id === id)
          const formData = new FormData()
          formData.append("titulo", target?.name || "Calendário Acadêmico")
          formData.append("tipo", target?.tipoCalendario || TipoCalendarioAcademico.SUPERIOR)
          formData.append("status", StatusCalendarioAcademico.RASCUNHO)
          await api.put(`${ACADEMIC_CALENDARS_ENDPOINT}/${id}`, formData, {
            headers: { "Content-Type": "multipart/form-data" },
          })
        }
      }
      toast.success(
        selectedScheduleIds.length === 1
          ? "Calendário acadêmico removido da área pública!"
          : "Calendários acadêmicos selecionados removidos da área pública!",
      )
      setSelectedScheduleIds([])
      loadData()
    } catch (err: any) {
      const msg =
        err.response?.data?.message ||
        "Erro ao remover o(s) calendário(s) acadêmico(s) da área pública."
      toast.error(msg)
    } finally {
      setBulkActionLoading(false)
    }
  }

  function openForm(record?: AcademicScheduleRecord) {
    setEditing(record ?? null)
    if (record) {
      setForm({
        name: record.name,
        tipoCalendario: record.tipoCalendario,
        pdfFile: null,
        statusCalendario: record.statusCalendario,
      })
    } else {
      setForm({
        name: "",
        tipoCalendario: TipoCalendarioAcademico.SUPERIOR,
        pdfFile: null,
        statusCalendario: StatusCalendarioAcademico.RASCUNHO,
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
    if (!form.tipoCalendario) {
      setError("Selecione o tipo do calendário acadêmico.")
      return
    }
    if (!editing && !form.pdfFile) {
      setError("Selecione o arquivo PDF do calendário acadêmico.")
      return
    }
    if (
      form.pdfFile &&
      form.pdfFile.type !== "application/pdf" &&
      !form.pdfFile.name.toLowerCase().endsWith(".pdf")
    ) {
      setError("Apenas arquivos no formato PDF (.pdf) são permitidos.")
      return
    }

    try {
      setSubmitting(true)
      const formData = new FormData()
      formData.append("titulo", form.name.trim())
      formData.append("tipo", form.tipoCalendario)
      formData.append("status", form.statusCalendario)
      if (form.pdfFile) {
        formData.append("arquivo", form.pdfFile)
      }

      const multipartHeaders = {
        headers: { "Content-Type": "multipart/form-data" },
      }

      if (editing) {
        await api.put(`${ACADEMIC_CALENDARS_ENDPOINT}/${editing.id}`, formData, multipartHeaders)
      } else {
        await api.post(ACADEMIC_CALENDARS_ENDPOINT, formData, multipartHeaders)
      }

      toast.success(
        editing
          ? "Calendário acadêmico atualizado(a) com sucesso!"
          : "Calendário acadêmico cadastrado(a) com sucesso!",
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
      await api.delete(`${ACADEMIC_CALENDARS_ENDPOINT}/${deleting.id}`)
      toast.success("Registro excluído com sucesso!")
      setSelectedScheduleIds((prev) => prev.filter((id) => id !== deleting.id))
      setDeleting(null)
      loadData()
    } catch {
      toast.error("Erro ao excluir registro.")
    }
  }

  return (
    <div className="admin-management calendario-academico-management">
      <div className="admin-page-heading">
        <div>
          <span>DOCUMENTO OFICIAL — CAMPUS MONTEIRO</span>
          <h1>Calendário Acadêmico</h1>
          <p>
            {records.length}{" "}
            {records.length === 1 ? "calendário acadêmico" : "calendários acadêmicos"} cadastrados.
          </p>
        </div>

        <div className="calendario-header-actions">
          <button
            type="button"
            className="admin-primary"
            onClick={handlePublishSelectedSchedules}
            disabled={loading || bulkActionLoading || selectedScheduleIds.length === 0}
          >
            <AdminIcon name="check" size={18} />
            Publicar
          </button>

          <button
            type="button"
            className="calendario-unpublish-btn"
            onClick={handleUnpublishSelectedSchedules}
            disabled={loading || bulkActionLoading || selectedScheduleIds.length === 0}
          >
            <AdminIcon name="close" size={18} />
            Remover da área pública
          </button>

          <button className="admin-primary" onClick={() => openForm()} disabled={loading}>
            <AdminIcon name="plus" size={18} />
            Enviar PDF do calendário
          </button>
        </div>
      </div>

      <section className="admin-surface management-surface">
        <div className="table-toolbar">
          <div className="table-toolbar-filters">
            <label>
              <AdminIcon name="search" size={18} />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Buscar semestre ou arquivo..."
              />
            </label>
          </div>
          <span>{filtered.length} resultados</span>
        </div>

        <div className="admin-table-scroll">
          <table className="admin-table">
            <thead>
              <tr>
                <th className="calendario-checkbox-col">
                  <label className="calendario-checkbox-label" title="Selecionar todos">
                    <input
                      type="checkbox"
                      className="calendario-checkbox"
                      checked={allFilteredSelected}
                      onChange={(e) => toggleSelectAllSchedules(e.target.checked)}
                      aria-label="Selecionar todos os calendários acadêmicos"
                    />
                  </label>
                </th>
                <th>Título / Semestre letivo</th>
                <th>Tipo, Arquivo PDF e Status</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((record) => {
                const isSelected = selectedScheduleIds.includes(record.id)
                const tipoLabel =
                  record.tipoCalendario === TipoCalendarioAcademico.INTEGRADO
                    ? "Integrado"
                    : "Superior"
                const isPublished =
                  record.statusCalendario === StatusCalendarioAcademico.PUBLICADO

                return (
                  <tr
                    key={record.id}
                    className={isSelected ? "calendario-row-selected" : undefined}
                  >
                    <td>
                      <input
                        type="checkbox"
                        className="calendario-checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelectSchedule(record.id)}
                        aria-label={`Selecionar ${record.name}`}
                      />
                    </td>
                    <td>
                      <div className="entity-name-cell">
                        <span className="table-entity-icon">
                          <AdminIcon name="filePdf" size={17} />
                        </span>
                        <strong>{record.name}</strong>
                      </div>
                    </td>
                    <td>
                      <small className="calendario-badge-tipo">{tipoLabel}</small>
                      <span>{record.detail || "Não informado"}</span>
                      <small
                        className={`calendario-badge-status ${
                          isPublished ? "is-published" : "is-draft"
                        }`}
                      >
                        {isPublished ? "Publicado na área pública" : "Rascunho (não público)"}
                      </small>
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
                )
              })}
            </tbody>
          </table>
          {!loading && !filtered.length && (
            <div className="admin-empty">
              <AdminIcon name="filePdf" size={28} />
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
                <h2>
                  {editing ? "Editar calendário acadêmico" : "Adicionar calendário acadêmico"}
                </h2>
              </div>
              <button type="button" onClick={() => setFormOpen(false)}>
                <AdminIcon name="close" size={19} />
              </button>
            </div>

            <InputField
              className="admin-form-field"
              label="Título / Semestre letivo"
              name="name"
              value={form.name}
              onChange={(e) => setForm((c) => ({ ...c, name: e.target.value }))}
              placeholder={`Ex: Calendário Acadêmico ${periodoLetivo}`}
              required
            />

            <label className="admin-form-field">
              <span>Tipo de calendário *</span>
              <select
                value={form.tipoCalendario}
                onChange={(e) =>
                  setForm((c) => ({
                    ...c,
                    tipoCalendario: e.target.value as TipoCalendarioAcademico,
                  }))
                }
              >
                {ACADEMIC_CALENDAR_TYPES_OPTIONS.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="admin-form-field">
              <span>
                Arquivo PDF do Calendário {editing ? "(opcional para substituir)" : "*"}
              </span>
              <input
                type="file"
                accept="application/pdf,.pdf"
                onChange={(e) => {
                  const file = e.target.files?.[0] || null
                  setForm((c) => ({ ...c, pdfFile: file }))
                }}
              />
              {editing?.fileName && !form.pdfFile && (
                <small>Arquivo atual: {editing.fileName}</small>
              )}
            </label>

            <label className="calendario-publish-checkbox-card">
              <input
                type="checkbox"
                className="calendario-checkbox"
                checked={form.statusCalendario === StatusCalendarioAcademico.PUBLICADO}
                onChange={(e) =>
                  setForm((c) => ({
                    ...c,
                    statusCalendario: e.target.checked
                      ? StatusCalendarioAcademico.PUBLICADO
                      : StatusCalendarioAcademico.RASCUNHO,
                  }))
                }
              />
              <span>
                <strong>Publicar na área pública</strong> (disponibilizar imediatamente para
                download na tela inicial)
              </span>
            </label>

            {error && <div className="admin-form-error">{error}</div>}
            <div className="admin-modal-actions">
              <Button text="Cancelar" onClick={() => setFormOpen(false)} />
              <Button
                className="admin-primary"
                type="submit"
                text={
                  submitting
                    ? "Enviando..."
                    : editing
                    ? "Salvar alterações"
                    : "Salvar e enviar PDF"
                }
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
            <h2>Excluir calendário acadêmico?</h2>
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