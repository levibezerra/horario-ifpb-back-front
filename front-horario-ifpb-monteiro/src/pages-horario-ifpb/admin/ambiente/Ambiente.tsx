import { useEffect, useMemo, useState, type FormEvent } from "react"
import { useNavigate } from "react-router-dom"
import QRCode from "qrcode"
import { AdminIcon } from "@/components/Icon"
import { toast } from "react-toastify"
import Button from "@/components/Button"
import { ConfirmDeleteModal } from "@/components/ConfirmDeleteModal"
import InputField from "@/components/InputField"
import { api, apiErrorMessage, extractFieldErrors } from "@/services/api"
import { API_ENDPOINTS } from "@/services/api-support/endpoints"
import { ambientePath, ROUTES } from "@/routes/paths"
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

const PUBLIC_BASE_URL = (
  import.meta.env.VITE_PUBLIC_URL || "http://192.168.18.148:5173"
).replace(/\/+$/, "")

const NEW_BLOCK_OPTION = "__NEW_BLOCK__"

function buildPublicRoomUrl(room: RoomRecord): string {
  return `${PUBLIC_BASE_URL}${ambientePath(room.name)}`
}

function sanitizeFileName(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase()
}

function normalizeBlockValue(value: string): string {
  return value.trim().replace(/\s+/g, " ")
}

function getCategoryLabel(categoria: CategoriaAmbiente): string {
  return (
    ROOM_CATEGORIES_OPTIONS.find((item) => item.id === categoria)?.label ??
    categoria
  )
}

export default function Ambiente() {
  const navigate = useNavigate()

  const [records, setRecords] = useState<RoomRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  const [query, setQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<CategoriaAmbiente | "ALL">("ALL")
  const [selectedBlock, setSelectedBlock] = useState<string>("ALL")
  const [editing, setEditing] = useState<RoomRecord | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [deleting, setDeleting] = useState<RoomRecord | null>(null)

  const [qrRoom, setQrRoom] = useState<RoomRecord | null>(null)
  const [qrDataUrl, setQrDataUrl] = useState<string>("")
  const [qrUrl, setQrUrl] = useState<string>("")

  const [form, setForm] = useState({
    name: "",
    categoria: "SALA" as CategoriaAmbiente,
    detail: "",
  })
  const [isCreatingNewBlock, setIsCreatingNewBlock] = useState(false)
  const [error, setError] = useState("")
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

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
    } catch (err: unknown) {
      toast.error(apiErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  // Extrai automaticamente os blocos/localizações únicos cadastrados nos ambientes
  const availableBlocks = useMemo(() => {
    const uniqueMap = new Map<string, string>()

    records.forEach((record) => {
      const cleaned = normalizeBlockValue(record.detail)
      if (!cleaned) return
      const key = cleaned.toLocaleLowerCase("pt-BR")
      if (!uniqueMap.has(key)) {
        uniqueMap.set(key, cleaned)
      }
    })

    return Array.from(uniqueMap.values()).sort((a, b) =>
      a.localeCompare(b, "pt-BR", { numeric: true, sensitivity: "base" }),
    )
  }, [records])

  // Garante que o filtro de bloco volte para "ALL" caso o bloco selecionado deixe de existir
  useEffect(() => {
    if (
      selectedBlock !== "ALL" &&
      !availableBlocks.some(
        (b) => b.toLocaleLowerCase("pt-BR") === selectedBlock.toLocaleLowerCase("pt-BR"),
      )
    ) {
      setSelectedBlock("ALL")
    }
  }, [availableBlocks, selectedBlock])

  const filtered = useMemo(() => {
    const normalizedQuery = query.toLocaleLowerCase("pt-BR")
    const normalizedSelectedBlock = selectedBlock.toLocaleLowerCase("pt-BR")

    return records.filter((record) => {
      if (selectedCategory !== "ALL" && record.categoria !== selectedCategory) {
        return false
      }

      if (selectedBlock !== "ALL") {
        const recordBlock = normalizeBlockValue(record.detail).toLocaleLowerCase("pt-BR")
        if (recordBlock !== normalizedSelectedBlock) {
          return false
        }
      }

      return `${record.name} ${record.categoria} ${record.detail}`
        .toLocaleLowerCase("pt-BR")
        .includes(normalizedQuery)
    })
  }, [records, query, selectedCategory, selectedBlock])

  function openForm(record?: RoomRecord) {
    setEditing(record ?? null)
    if (record) {
      const normalizedDetail = normalizeBlockValue(record.detail || "")
      const matchesExisting =
        !normalizedDetail ||
        availableBlocks.some(
          (b) => b.toLocaleLowerCase("pt-BR") === normalizedDetail.toLocaleLowerCase("pt-BR"),
        )

      setForm({
        name: record.name,
        categoria: record.categoria || "SALA",
        detail: normalizedDetail,
      })
      setIsCreatingNewBlock(Boolean(normalizedDetail) && !matchesExisting)
    } else {
      const initialBlock = selectedBlock !== "ALL" ? selectedBlock : ""
      setForm({
        name: "",
        categoria: selectedCategory !== "ALL" ? selectedCategory : "SALA",
        detail: initialBlock,
      })
      setIsCreatingNewBlock(availableBlocks.length === 0)
    }
    setError("")
    setFieldErrors({})
    setFormOpen(true)
  }

  async function openQrModal(record: RoomRecord) {
    try {
      const targetUrl = buildPublicRoomUrl(record)
      const dataUrl = await QRCode.toDataURL(targetUrl, {
        width: 512,
        margin: 2,
        color: {
          dark: "#113822",
          light: "#ffffff",
        },
        errorCorrectionLevel: "M",
      })
      setQrRoom(record)
      setQrUrl(targetUrl)
      setQrDataUrl(dataUrl)
    } catch {
      toast.error("Não foi possível gerar o QR Code deste ambiente.")
    }
  }

  function handleDownloadQr() {
    if (!qrRoom || !qrDataUrl) return

    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement("canvas")
      const width = 600
      const height = 720
      canvas.width = width
      canvas.height = height

      const ctx = canvas.getContext("2d")
      if (!ctx) return

      ctx.fillStyle = "#ffffff"
      ctx.fillRect(0, 0, width, height)

      ctx.strokeStyle = "#d0d7de"
      ctx.lineWidth = 4
      ctx.strokeRect(16, 16, width - 32, height - 32)

      ctx.fillStyle = "#113822"
      ctx.font = "bold 28px sans-serif"
      ctx.textAlign = "center"
      ctx.fillText(qrRoom.name, width / 2, 76)

      if (qrRoom.detail) {
        ctx.fillStyle = "#4b5563"
        ctx.font = "18px sans-serif"
        ctx.fillText(qrRoom.detail, width / 2, 108)
      }

      const qrSize = 440
      ctx.drawImage(img, (width - qrSize) / 2, 135, qrSize, qrSize)

      ctx.fillStyle = "#1f2937"
      ctx.font = "600 18px sans-serif"
      ctx.fillText("Aponte a câmera para ver o horário da sala", width / 2, 625)

      ctx.fillStyle = "#6b7280"
      ctx.font = "14px sans-serif"
      ctx.fillText("IFPB · Campus Monteiro", width / 2, 658)

      const link = document.createElement("a")
      link.download = `qrcode-${sanitizeFileName(qrRoom.name || "ambiente")}.png`
      link.href = canvas.toDataURL("image/png")
      link.click()
      toast.success("QR Code baixado com sucesso!")
    }
    img.src = qrDataUrl
  }

  async function handleCopyLink() {
    if (!qrUrl) return
    try {
      await navigator.clipboard.writeText(qrUrl)
      toast.success("Link da grade copiado!")
    } catch {
      toast.error("Não foi possível copiar o link.")
    }
  }

  async function save(event: FormEvent) {
    event.preventDefault()
    setError("")
    setFieldErrors({})

    const trimmedName = normalizeBlockValue(form.name)
    if (!trimmedName) {
      const msg = "Informe o nome ou identificação do ambiente antes de salvar."
      setFieldErrors({ nome: msg })
      setError(msg)
      return
    }

    const normalizedDetail = normalizeBlockValue(form.detail)
    const existingCanonicalBlock = availableBlocks.find(
      (b) => b.toLocaleLowerCase("pt-BR") === normalizedDetail.toLocaleLowerCase("pt-BR"),
    )
    const finalBlock = existingCanonicalBlock || normalizedDetail

    const isDuplicateLocal = records.some((item) => {
      if (editing && item.id === editing.id) return false
      const sameName =
        normalizeBlockValue(item.name).toLocaleLowerCase("pt-BR") ===
        trimmedName.toLocaleLowerCase("pt-BR")
      const sameCategory = item.categoria === form.categoria
      const sameBlock =
        normalizeBlockValue(item.detail || "").toLocaleLowerCase("pt-BR") ===
        finalBlock.toLocaleLowerCase("pt-BR")
      return sameName && sameCategory && sameBlock
    })

    if (isDuplicateLocal) {
      const localInfo = finalBlock
        ? `no bloco/localização "${finalBlock}"`
        : "sem bloco/localização informada"
      const duplicateMsg = `Já existe um ambiente cadastrado com o nome "${trimmedName}" do tipo "${getCategoryLabel(form.categoria)}" ${localInfo}.`
      setFieldErrors({ nome: "Já existe um ambiente idêntico neste bloco." })
      setError(duplicateMsg)
      return
    }

    try {
      setSubmitting(true)
      const payload: Partial<AmbienteDTO> = {
        nome: trimmedName,
        categoria: form.categoria,
        localizacao: finalBlock || undefined,
      }
      if (editing) {
        await api.put(`${API_ENDPOINTS.ambientes}/${editing.id}`, payload)
      } else {
        await api.post(API_ENDPOINTS.ambientes, payload)
      }

      toast.success(
        editing ? "Ambiente atualizado com sucesso!" : "Ambiente cadastrado com sucesso!",
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
    await api.delete(`${API_ENDPOINTS.ambientes}/${deleting.id}`)
    toast.success(`Ambiente "${deleting.name}" excluído com sucesso!`)
    await loadData()
  }

  const matchedSelectBlock = availableBlocks.find(
    (b) => b.toLocaleLowerCase("pt-BR") === normalizeBlockValue(form.detail).toLocaleLowerCase("pt-BR"),
  )
  const blockSelectValue = isCreatingNewBlock
    ? NEW_BLOCK_OPTION
    : matchedSelectBlock || ""

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

            <select
              className="course-filter-select"
              aria-label="Filtrar ambientes por categoria"
              value={selectedCategory}
              onChange={(event) =>
                setSelectedCategory(event.target.value as CategoriaAmbiente | "ALL")
              }
            >
              <option value="ALL">Todos os ambientes</option>
              {ROOM_CATEGORIES_OPTIONS.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.label}
                </option>
              ))}
            </select>

            <select
              className="course-filter-select"
              aria-label="Filtrar ambientes por bloco"
              value={selectedBlock}
              onChange={(event) => setSelectedBlock(event.target.value)}
              disabled={availableBlocks.length === 0}
            >
              <option value="ALL">Todos os blocos</option>
              {availableBlocks.map((block) => (
                <option key={block} value={block}>
                  {block}
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
                    {record.categoria && <small>{getCategoryLabel(record.categoria)}</small>}
                  </td>
                  <td>
                    <div className="admin-table-actions">
                      <button
                        type="button"
                        onClick={() => openQrModal(record)}
                        aria-label={`Gerar QR Code de ${record.name}`}
                        title="Gerar QR Code da grade do ambiente"
                      >
                        <svg
                          width="17"
                          height="17"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          aria-hidden="true"
                        >
                          <rect x="3" y="3" width="7" height="7" rx="1" />
                          <rect x="14" y="3" width="7" height="7" rx="1" />
                          <rect x="3" y="14" width="7" height="7" rx="1" />
                          <path d="M14 14h3v3h-3z" />
                          <path d="M20 14v3h-3" />
                          <path d="M14 20h3" />
                          <path d="M20 20h.01" />
                        </svg>
                      </button>
                      <button
                        type="button"
                        onClick={() => openForm(record)}
                        aria-label={`Editar ${record.name}`}
                        title="Editar ambiente"
                      >
                        <AdminIcon name="edit" size={17} />
                      </button>
                      <button
                        type="button"
                        className="danger-action"
                        onClick={() => setDeleting(record)}
                        aria-label={`Excluir ${record.name}`}
                        title="Excluir ambiente"
                      >
                        <AdminIcon name="trash" size={17} />
                      </button>
                    </div>
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

      {qrRoom && (
        <div className="admin-modal-layer" role="dialog" aria-modal="true" aria-labelledby="qr-modal-title">
          <button
            className="admin-modal-backdrop"
            onClick={() => setQrRoom(null)}
            aria-label="Fechar QR Code"
          />
          <section className="admin-modal" style={{ maxWidth: "440px", textAlign: "center" }}>
            <div className="admin-modal-heading" style={{ textAlign: "left" }}>
              <div>
                <span>QR CODE DO AMBIENTE</span>
                <h2 id="qr-modal-title">{qrRoom.name}</h2>
              </div>
              <button type="button" onClick={() => setQrRoom(null)} aria-label="Fechar">
                <AdminIcon name="close" size={19} />
              </button>
            </div>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "0.75rem",
                padding: "1.25rem",
                margin: "0.5rem 0 1rem",
                borderRadius: "12px",
                border: "1px solid #d0d7de",
                backgroundColor: "#ffffff",
              }}
            >
              {qrDataUrl && (
                <img
                  src={qrDataUrl}
                  alt={`QR Code da grade de ${qrRoom.name}`}
                  style={{ width: "240px", height: "240px", display: "block" }}
                />
              )}
              <div style={{ fontSize: "0.875rem", color: "#374151" }}>
                <strong>{qrRoom.name}</strong>
                {qrRoom.detail ? ` · ${qrRoom.detail}` : ""}
              </div>
              <small
                style={{
                  fontSize: "0.75rem",
                  color: "#6b7280",
                  wordBreak: "break-all",
                }}
              >
                {qrUrl}
              </small>
            </div>

            <div className="admin-modal-actions" style={{ justifyContent: "space-between", gap: "0.5rem" }}>
              <Button text="Copiar link" onClick={handleCopyLink} />
              <Button
                className="admin-primary"
                type="button"
                text="Baixar QR Code (PNG)"
                onClick={handleDownloadQr}
              />
            </div>
          </section>
        </div>
      )}

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
              onChange={(e) => {
                setForm((c) => ({ ...c, name: e.target.value }))
                if (error) setError("")
                if (fieldErrors.nome) setFieldErrors((prev) => ({ ...prev, nome: "" }))
              }}
              error={fieldErrors.nome}
              placeholder="Identificação ou nome"
              required
            />

            <label className="admin-form-field">
              <span>Categoria *</span>
              <select
                value={form.categoria}
                onChange={(e) => {
                  setForm((c) => ({ ...c, categoria: e.target.value as CategoriaAmbiente }))
                  if (error) setError("")
                }}
              >
                {ROOM_CATEGORIES_OPTIONS.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </label>

            <div className="admin-form-field">
              <span>Bloco / Localização</span>
              {availableBlocks.length > 0 && (
                <select
                  aria-label="Selecionar bloco cadastrado"
                  value={blockSelectValue}
                  onChange={(e) => {
                    const value = e.target.value
                    if (error) setError("")
                    if (value === NEW_BLOCK_OPTION) {
                      setIsCreatingNewBlock(true)
                      setForm((c) => ({ ...c, detail: "" }))
                    } else {
                      setIsCreatingNewBlock(false)
                      setForm((c) => ({ ...c, detail: value }))
                    }
                  }}
                >
                  <option value="">Sem bloco / Não informado</option>
                  {availableBlocks.map((block) => (
                    <option key={block} value={block}>
                      {block}
                    </option>
                  ))}
                  <option value={NEW_BLOCK_OPTION}>+ Digitar novo bloco...</option>
                </select>
              )}

              {(availableBlocks.length === 0 || isCreatingNewBlock) && (
                <input
                  value={form.detail}
                  onChange={(e) => {
                    setForm((c) => ({ ...c, detail: e.target.value }))
                    if (error) setError("")
                  }}
                  placeholder="Ex: Bloco A"
                  style={availableBlocks.length > 0 ? { marginTop: "8px" } : undefined}
                />
              )}
            </div>

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
        title="Excluir ambiente?"
        itemName={deleting?.name ?? ""}
        dependencyActionLabel="Ver horários"
        onDependencyAction={
          deleting
            ? () => navigate(`${ROUTES.adminSchedules}?ambienteId=${deleting.id}`)
            : undefined
        }
        onConfirm={handleConfirmDelete}
        onClose={() => setDeleting(null)}
      />
    </div>
  )
}