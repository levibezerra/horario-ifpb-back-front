import { useEffect, useMemo, useState, type FormEvent } from "react"
import { AdminIcon, type AdminIconName } from "@/components/Icon"
import { EMAIL_PATTERN } from "@/services/authService"
import { toast } from "react-toastify"
import Button from "@/components/Button"
import InputField from "@/components/InputField"
import { api } from "@/services/api"
import { API_ENDPOINTS } from "@/services/api-support/endpoints"
import type {
  AmbienteDTO,
  CategoriaAmbiente,
  CursoDTO,
  DisciplinaDTO,
  ModalidadeCurso,
  ProfessorDTO,
  TurmaDTO,
} from "@/types/api"

export enum TipoCalendarioAcademico {
  SUPERIOR = "SUPERIOR",
  INTEGRADO = "INTEGRADO",
}

export enum StatusCalendarioAcademico {
  RASCUNHO = "RASCUNHO",
  PUBLICADO = "PUBLICADO",
}

export type EntityKind =
  | "courses"
  | "classes"
  | "subjects"
  | "teachers"
  | "rooms"
  | "academicSchedules"

export type EntityRecord = {
  id: number
  name: string
  code?: string
  modalidade?: ModalidadeCurso
  tipoCalendario?: TipoCalendarioAcademico
  detail?: string
  email?: string
  lattesUrl?: string
  cursosIds?: number[]
  categoria?: CategoriaAmbiente
  cursoId?: number
  pdfUrl?: string
  fileName?: string
  statusCalendario?: StatusCalendarioAcademico
}

const ACADEMIC_CALENDARS_ENDPOINT =
  (API_ENDPOINTS as Record<string, string>).calendariosAcademicos || "/calendarios-academicos"

export const entityConfig: Record<
  EntityKind,
  {
    title: string
    eyebrow: string
    singular: string
    plural: string
    search: string
    nameLabel: string
    detailLabel: string
    icon: AdminIconName
    endpoint: string
  }
> = {
  courses: {
    title: "Gerenciar cursos",
    eyebrow: "OFERTA ACADÊMICA",
    singular: "curso",
    plural: "cursos",
    search: "Buscar curso...",
    nameLabel: "Nome do curso",
    detailLabel: "Código e Modalidade",
    icon: "graduation",
    endpoint: API_ENDPOINTS.cursos,
  },
  classes: {
    title: "Gerenciar turmas",
    eyebrow: "ORGANIZAÇÃO ACADÊMICA",
    singular: "turma",
    plural: "turmas",
    search: "Buscar turma...",
    nameLabel: "Nome da turma",
    detailLabel: "Curso vinculado",
    icon: "classes",
    endpoint: API_ENDPOINTS.turmas,
  },
  subjects: {
    title: "Gerenciar disciplinas",
    eyebrow: "COMPONENTES CURRICULARES",
    singular: "disciplina",
    plural: "disciplinas",
    search: "Buscar disciplina...",
    nameLabel: "Nome da disciplina",
    detailLabel: "Curso vinculado",
    icon: "subjects",
    endpoint: API_ENDPOINTS.disciplinas,
  },
  teachers: {
    title: "Gerenciar professores",
    eyebrow: "CORPO DOCENTE",
    singular: "professor",
    plural: "professores",
    search: "Buscar professor...",
    nameLabel: "Nome do professor",
    detailLabel: "Cursos vinculados",
    icon: "teachers",
    endpoint: API_ENDPOINTS.professores,
  },
  rooms: {
    title: "Gerenciar ambientes",
    eyebrow: "ESPAÇOS ACADÊMICOS",
    singular: "ambiente",
    plural: "ambientes",
    search: "Buscar ambiente...",
    nameLabel: "Identificação ou nome",
    detailLabel: "Localização",
    icon: "rooms",
    endpoint: API_ENDPOINTS.ambientes,
  },
  academicSchedules: {
    title: "Calendário Acadêmico",
    eyebrow: "DOCUMENTO OFICIAL — CAMPUS MONTEIRO",
    singular: "calendário acadêmico",
    plural: "calendários acadêmicos",
    search: "Buscar semestre ou arquivo...",
    nameLabel: "Título / Semestre letivo",
    detailLabel: "Tipo, Arquivo PDF e Status",
    icon: "filePdf",
    endpoint: ACADEMIC_CALENDARS_ENDPOINT,
  },
}

const ROOM_CATEGORIES_OPTIONS: { id: CategoriaAmbiente; label: string }[] = [
  { id: "SALA", label: "Sala de Aula" },
  { id: "LABORATORIO", label: "Laboratório" },
  { id: "AUDITORIO", label: "Auditório" },
  { id: "ESPORTIVO", label: "Espaço Esportivo" },
]

const COURSE_MODALITIES_OPTIONS: { id: ModalidadeCurso; label: string }[] = [
  { id: "INTEGRADO", label: "Técnico Integrado" },
  { id: "SUPERIOR", label: "Ensino Superior" },
  { id: "SUBSEQUENTE", label: "Técnico Subsequente" },
]

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

export function EntityManager({ kind }: { kind: EntityKind }) {
  const config = entityConfig[kind]
  const [records, setRecords] = useState<EntityRecord[]>([])
  const [availableCourses, setAvailableCourses] = useState<CursoDTO[]>([])
  const [availableClasses, setAvailableClasses] = useState<TurmaDTO[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [bulkActionLoading, setBulkActionLoading] = useState(false)

  const [query, setQuery] = useState("")
  const [selectedCourseId, setSelectedCourseId] = useState<number | "ALL">("ALL")
  const [selectedClassId, setSelectedClassId] = useState<number | "ALL">("ALL")
  const [selectedScheduleIds, setSelectedScheduleIds] = useState<number[]>([])
  const [editing, setEditing] = useState<EntityRecord | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [deleting, setDeleting] = useState<EntityRecord | null>(null)

  const [form, setForm] = useState({
    name: "",
    code: "",
    modalidade: "INTEGRADO" as ModalidadeCurso,
    tipoCalendario: TipoCalendarioAcademico.SUPERIOR,
    detail: "",
    email: "",
    lattesUrl: "",
    cursoId: 0,
    cursosIds: [] as number[],
    categoria: "SALA" as CategoriaAmbiente,
    pdfFile: null as File | null,
    statusCalendario: StatusCalendarioAcademico.RASCUNHO,
  })
  const [error, setError] = useState("")

  const supportsCourseFilter = kind === "classes" || kind === "subjects"

  const loadData = async () => {
    try {
      setLoading(true)
      const res = await api.get(config.endpoint)

      let loadedCourses: CursoDTO[] = []
      let loadedClasses: TurmaDTO[] = []
      if (kind === "classes" || kind === "subjects" || kind === "teachers") {
        const coursesRes = await api.get<CursoDTO[]>(API_ENDPOINTS.cursos)
        loadedCourses = coursesRes.data
        setAvailableCourses(loadedCourses)

        const classesRes = await api.get<TurmaDTO[]>(API_ENDPOINTS.turmas)
        loadedClasses = classesRes.data
        setAvailableClasses(loadedClasses)
      }

      if (kind === "courses") {
        setRecords(
          res.data.map((c: CursoDTO) => {
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
      } else if (kind === "classes") {
        setRecords(
          res.data.map((t: TurmaDTO) => ({
            id: t.id!,
            name: t.nome,
            detail: t.cursoNome || loadedCourses.find((c) => c.id === t.cursoId)?.nome || "",
            cursoId: t.cursoId,
          })),
        )
      } else if (kind === "subjects") {
        setRecords(
          res.data.map((d: DisciplinaDTO) => ({
            id: d.id!,
            name: d.nome,
            detail: d.cursoNome || loadedCourses.find((c) => c.id === d.cursoId)?.nome || "",
            cursoId: d.cursoId,
          })),
        )
      } else if (kind === "teachers") {
        setRecords(
          res.data.map((p: ProfessorDTO) => ({
            id: p.id!,
            name: p.nome,
            email: p.email,
            lattesUrl: p.lattesUrl,
            cursosIds: p.cursosIds || [],
            detail: p.cursosNomes?.join(", ") || "",
          })),
        )
      } else if (kind === "rooms") {
        setRecords(
          res.data.map((a: AmbienteDTO) => ({
            id: a.id!,
            name: a.nome,
            categoria: a.categoria,
            detail: a.localizacao || "",
          })),
        )
      } else if (kind === "academicSchedules") {
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
              pdfUrl: item.urlArquivo || item.arquivoUrl || `${config.endpoint}/${item.id}/download`,
              statusCalendario,
              detail: fileName,
            }
          }),
        )
      }
    } catch (err: any) {
      toast.error(`Erro ao carregar os dados de ${config.plural}.`)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    setQuery("")
    setSelectedCourseId("ALL")
    setSelectedClassId("ALL")
    setSelectedScheduleIds([])
    loadData()
  }, [kind])

  const filtered = useMemo(() => {
    const normalizedQuery = query.toLocaleLowerCase("pt-BR")

    const matching = records.filter((record) => {
      if (kind === "classes" && selectedCourseId !== "ALL" && record.cursoId !== selectedCourseId) {
        return false
      }
      if (kind === "subjects" && selectedClassId !== "ALL") {
        const targetClass = availableClasses.find((t) => t.id === selectedClassId)
        if (targetClass && record.cursoId !== targetClass.cursoId) {
          return false
        }
      }

      return `${record.name} ${record.code ?? ""} ${record.tipoCalendario ?? ""} ${record.detail ?? ""}`
        .toLocaleLowerCase("pt-BR")
        .includes(normalizedQuery)
    })

    if (supportsCourseFilter) {
      return [...matching].sort((a, b) => {
        const courseComparison = (a.detail || "").localeCompare(b.detail || "", "pt-BR")
        if (courseComparison !== 0) return courseComparison
        return a.name.localeCompare(b.name, "pt-BR")
      })
    }

    return matching
  }, [records, query, selectedCourseId, selectedClassId, availableClasses, kind, supportsCourseFilter])

  const allFilteredSelected =
    kind === "academicSchedules" &&
    filtered.length > 0 &&
    filtered.every((record) => selectedScheduleIds.includes(record.id))

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
        await api.patch(`${config.endpoint}/${id}/publicar`)
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
          await api.patch(`${config.endpoint}/${id}/despublicar`)
        } catch {
          const target = records.find((r) => r.id === id)
          const formData = new FormData()
          formData.append("titulo", target?.name || "Calendário Acadêmico")
          formData.append("tipo", target?.tipoCalendario || TipoCalendarioAcademico.SUPERIOR)
          formData.append("status", StatusCalendarioAcademico.RASCUNHO)
          await api.put(`${config.endpoint}/${id}`, formData, {
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

  function openForm(record?: EntityRecord) {
    setEditing(record ?? null)
    if (record) {
      setForm({
        name: record.name,
        code: record.code || "",
        modalidade: record.modalidade || "INTEGRADO",
        tipoCalendario: record.tipoCalendario || TipoCalendarioAcademico.SUPERIOR,
        detail: record.detail || "",
        email: record.email || "",
        lattesUrl: record.lattesUrl || "",
        cursoId: record.cursoId || (availableCourses[0]?.id ?? 0),
        cursosIds: record.cursosIds || [],
        categoria: record.categoria || "SALA",
        pdfFile: null,
        statusCalendario: record.statusCalendario || StatusCalendarioAcademico.RASCUNHO,
      })
    } else {
      const defaultCourseId =
        supportsCourseFilter && selectedCourseId !== "ALL"
          ? selectedCourseId
          : (availableCourses[0]?.id ?? 0)

      setForm({
        name: "",
        code: "",
        modalidade: "INTEGRADO",
        tipoCalendario: TipoCalendarioAcademico.SUPERIOR,
        detail: "",
        email: "",
        lattesUrl: "",
        cursoId: defaultCourseId,
        cursosIds: [],
        categoria: "SALA",
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
    if (kind === "courses" && !form.code.trim()) {
      setError("Informe o código do curso.")
      return
    }
    if (supportsCourseFilter && !form.cursoId) {
      setError("Selecione o curso vinculado.")
      return
    }
    if (kind === "teachers" && !form.email.trim()) {
      setError("Informe o e-mail do professor.")
      return
    }
    if (form.email && !EMAIL_PATTERN.test(form.email)) {
      setError("Informe um e-mail válido.")
      return
    }
    if (kind === "academicSchedules") {
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
    }

    try {
      setSubmitting(true)
      if (kind === "courses") {
        const payload: Partial<CursoDTO> = {
          nome: form.name.trim(),
          codigo: form.code.trim(),
          modalidade: form.modalidade,
        }
        if (editing) await api.put(`${config.endpoint}/${editing.id}`, payload)
        else await api.post(config.endpoint, payload)
      } else if (kind === "classes") {
        const payload: Partial<TurmaDTO> = { nome: form.name.trim(), cursoId: form.cursoId }
        if (editing) await api.put(`${config.endpoint}/${editing.id}`, payload)
        else await api.post(config.endpoint, payload)
      } else if (kind === "subjects") {
        const payload: Partial<DisciplinaDTO> = {
          nome: form.name.trim(),
          cursoId: form.cursoId,
        }
        if (editing) await api.put(`${config.endpoint}/${editing.id}`, payload)
        else await api.post(config.endpoint, payload)
      } else if (kind === "teachers") {
        const payload: Partial<ProfessorDTO> = {
          nome: form.name.trim(),
          email: form.email.trim(),
          lattesUrl: form.lattesUrl.trim() || undefined,
          cursosIds: form.cursosIds,
        }
        if (editing) await api.put(`${config.endpoint}/${editing.id}`, payload)
        else await api.post(config.endpoint, payload)
      } else if (kind === "rooms") {
        const payload: Partial<AmbienteDTO> = {
          nome: form.name.trim(),
          categoria: form.categoria,
          localizacao: form.detail.trim() || undefined,
        }
        if (editing) await api.put(`${config.endpoint}/${editing.id}`, payload)
        else await api.post(config.endpoint, payload)
      } else if (kind === "academicSchedules") {
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
          await api.put(`${config.endpoint}/${editing.id}`, formData, multipartHeaders)
        } else {
          await api.post(config.endpoint, formData, multipartHeaders)
        }
      }

      toast.success(
        editing
          ? `${config.singular} atualizado(a) com sucesso!`
          : `${config.singular} cadastrado(a) com sucesso!`,
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
      await api.delete(`${config.endpoint}/${deleting.id}`)
      toast.success("Registro excluído com sucesso!")
      setSelectedScheduleIds((prev) => prev.filter((id) => id !== deleting.id))
      setDeleting(null)
      loadData()
    } catch (err: any) {
      toast.error("Erro ao excluir registro.")
    }
  }

  return (
    <div className="admin-management">
      <div className="admin-page-heading">
        <div>
          <span>{config.eyebrow}</span>
          <h1>{config.title}</h1>
          <p>
            {records.length} {records.length === 1 ? config.singular : config.plural} cadastrados.
          </p>
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", alignItems: "center" }}>
          {kind === "academicSchedules" && (
            <>
              <button
                type="button"
                className="admin-primary"
                onClick={handlePublishSelectedSchedules}
                disabled={loading || bulkActionLoading || selectedScheduleIds.length === 0}
                style={{
                  opacity: selectedScheduleIds.length === 0 ? 0.55 : 1,
                  cursor: selectedScheduleIds.length === 0 ? "not-allowed" : "pointer",
                }}
              >
                <AdminIcon name="check" size={18} />
                Publicar
              </button>

              <button
                type="button"
                onClick={handleUnpublishSelectedSchedules}
                disabled={loading || bulkActionLoading || selectedScheduleIds.length === 0}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "10px 16px",
                  borderRadius: "10px",
                  border: "1px solid #d0d7de",
                  backgroundColor: "#fff",
                  color: "#dc2626",
                  fontWeight: 600,
                  fontSize: "0.92rem",
                  opacity: selectedScheduleIds.length === 0 ? 0.55 : 1,
                  cursor: selectedScheduleIds.length === 0 ? "not-allowed" : "pointer",
                }}
              >
                <AdminIcon name="close" size={18} />
                Remover da área pública
              </button>
            </>
          )}

          <button className="admin-primary" onClick={() => openForm()} disabled={loading}>
            <AdminIcon name="plus" size={18} />
            {kind === "academicSchedules"
              ? "Enviar PDF do calendário"
              : `Adicionar ${config.singular}`}
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
                placeholder={config.search}
              />
            </label>

            {kind === "classes" && (
              <select
                className="course-filter-select"
                aria-label="Filtrar turmas por curso"
                value={selectedCourseId}
                onChange={(event) => {
                  const val = event.target.value
                  setSelectedCourseId(val === "ALL" ? "ALL" : Number(val))
                }}
              >
                <option value="ALL">Todos os cursos</option>
                {availableCourses.map((course) => (
                  <option key={course.id} value={course.id}>
                    {course.nome}
                  </option>
                ))}
              </select>
            )}

            {kind === "subjects" && (
              <select
                className="course-filter-select"
                aria-label="Filtrar disciplinas por turma/período e curso"
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
            )}
          </div>
          <span>{filtered.length} resultados</span>
        </div>

        <div className="admin-table-scroll">
          <table className="admin-table">
            <thead>
              <tr>
                {kind === "academicSchedules" && (
                  <th style={{ width: "44px" }}>
                    <label
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "6px",
                        cursor: "pointer",
                      }}
                      title="Selecionar todos"
                    >
                      <input
                        type="checkbox"
                        checked={allFilteredSelected}
                        onChange={(e) => toggleSelectAllSchedules(e.target.checked)}
                        aria-label="Selecionar todos os calendários acadêmicos"
                        style={{ accentColor: "#2f9e41", width: "16px", height: "16px" }}
                      />
                    </label>
                  </th>
                )}
                <th>{config.nameLabel}</th>
                <th>
                  {kind === "teachers"
                    ? "Cursos e dados acadêmicos"
                    : config.detailLabel || "Informações"}
                </th>
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
                    style={
                      kind === "academicSchedules" && isSelected
                        ? { backgroundColor: "rgba(47, 158, 65, 0.06)" }
                        : undefined
                    }
                  >
                    {kind === "academicSchedules" && (
                      <td>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelectSchedule(record.id)}
                          aria-label={`Selecionar ${record.name}`}
                          style={{
                            accentColor: "#2f9e41",
                            width: "16px",
                            height: "16px",
                            cursor: "pointer",
                          }}
                        />
                      </td>
                    )}
                    <td>
                      <div style={{ display: "inline-flex", alignItems: "center", gap: "10px" }}>
                        <span
                          className="table-entity-icon"
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0,
                          }}
                        >
                          <AdminIcon name={config.icon} size={17} />
                        </span>
                        <strong>{record.name}</strong>
                      </div>
                    </td>
                    <td>
                      {kind === "academicSchedules" && (
                        <small
                          style={{
                            display: "inline-block",
                            marginRight: "8px",
                            padding: "2px 8px",
                            borderRadius: "999px",
                            fontWeight: 600,
                            backgroundColor: "rgba(15, 23, 42, 0.08)",
                            color: "#1e293b",
                          }}
                        >
                          {tipoLabel}
                        </small>
                      )}
                      <span>{record.detail || "Não informado"}</span>
                      {kind === "rooms" && record.categoria && <small>{record.categoria}</small>}
                      {kind === "teachers" && record.email && <small>{record.email}</small>}
                      {kind === "academicSchedules" && (
                        <small
                          style={{
                            display: "inline-block",
                            marginLeft: "8px",
                            padding: "2px 8px",
                            borderRadius: "999px",
                            fontWeight: 600,
                            backgroundColor: isPublished
                              ? "rgba(47, 158, 65, 0.14)"
                              : "rgba(100, 116, 139, 0.14)",
                            color: isPublished ? "#2f9e41" : "#475569",
                          }}
                        >
                          {isPublished ? "Publicado na área pública" : "Rascunho (não público)"}
                        </small>
                      )}
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
              <AdminIcon name={config.icon} size={28} />
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
                  {editing ? `Editar ${config.singular}` : `Adicionar ${config.singular}`}
                </h2>
              </div>
              <button type="button" onClick={() => setFormOpen(false)}>
                <AdminIcon name="close" size={19} />
              </button>
            </div>

            <InputField
              className="admin-form-field"
              label={config.nameLabel}
              name="name"
              value={form.name}
              onChange={(e) => setForm((c) => ({ ...c, name: e.target.value }))}
              placeholder={
                kind === "academicSchedules"
                  ? "Ex: Calendário Acadêmico 2026.2"
                  : config.nameLabel
              }
              required
            />

            {kind === "academicSchedules" && (
              <>
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

                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    marginTop: "8px",
                    padding: "10px 12px",
                    borderRadius: "8px",
                    border: "1px solid #d0d7de",
                    cursor: "pointer",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={form.statusCalendario === StatusCalendarioAcademico.PUBLICADO}
                    onChange={(e) =>
                      setForm((c) => ({
                        ...c,
                        statusCalendario: e.target.checked
                          ? StatusCalendarioAcademico.PUBLICADO
                          : StatusCalendarioAcademico.RASCUNHO,
                      }))
                    }
                    style={{ accentColor: "#2f9e41", width: "16px", height: "16px" }}
                  />
                  <span>
                    <strong>Publicar na área pública</strong> (disponibilizar imediatamente para
                    download na tela inicial)
                  </span>
                </label>
              </>
            )}

            {kind === "courses" && (
              <>
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
              </>
            )}

            {supportsCourseFilter && (
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
            )}

            {kind === "teachers" && (
              <>
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
              </>
            )}

            {kind === "rooms" && (
              <>
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
              </>
            )}

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
                    : kind === "academicSchedules"
                    ? "Salvar e enviar PDF"
                    : "Adicionar"
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
            <h2>Excluir {config.singular}?</h2>
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