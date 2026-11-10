import { useEffect, useState, type FormEvent } from "react"
import { AdminIcon, type AdminIconName } from "@/components/Icon"
import { EMAIL_PATTERN } from "@/services/authService"
import { toast } from "react-toastify"
import Button from "@/components/Button"
import InputField from "@/components/InputField"
import { api } from "@/services/api"
import { API_ENDPOINTS } from "@/services/api-support/endpoints"
import type { AmbienteDTO, CategoriaAmbiente, CursoDTO, DisciplinaDTO, ProfessorDTO, TurmaDTO } from "@/types/api"

export type EntityKind = "courses" | "classes" | "subjects" | "teachers" | "rooms"

export type EntityRecord = {
  id: number
  name: string
  code?: string
  detail?: string
  email?: string
  lattesUrl?: string
  cursosIds?: number[]
  categoria?: CategoriaAmbiente
  cursoId?: number
}

export const entityConfig: Record<EntityKind, {
  title: string
  eyebrow: string
  singular: string
  plural: string
  search: string
  nameLabel: string
  detailLabel: string
  icon: AdminIconName
  endpoint: string
}> = {
  courses: {
    title: "Gerenciar cursos",
    eyebrow: "OFERTA ACADÊMICA",
    singular: "curso",
    plural: "cursos",
    search: "Buscar curso...",
    nameLabel: "Nome do curso",
    detailLabel: "Código do curso",
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
    detailLabel: "",
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
}

const ROOM_CATEGORIES_OPTIONS: { id: CategoriaAmbiente; label: string }[] = [
  { id: "SALA", label: "Sala de Aula" },
  { id: "LABORATORIO", label: "Laboratório" },
  { id: "AUDITORIO", label: "Auditório" },
  { id: "ESPORTIVO", label: "Espaço Esportivo" },
]

export function EntityManager({ kind }: { kind: EntityKind }) {
  const config = entityConfig[kind]
  const [records, setRecords] = useState<EntityRecord[]>([])
  const [availableCourses, setAvailableCourses] = useState<CursoDTO[]>([])
  const [loading, setLoading] = useState(true)

  const [query, setQuery] = useState("")
  const [editing, setEditing] = useState<EntityRecord | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [deleting, setDeleting] = useState<EntityRecord | null>(null)

  const [form, setForm] = useState({
    name: "",
    code: "",
    detail: "",
    email: "",
    lattesUrl: "",
    cursoId: 0,
    cursosIds: [] as number[],
    categoria: "SALA" as CategoriaAmbiente,
  })
  const [error, setError] = useState("")

  const loadData = async () => {
    try {
      setLoading(true)
      const res = await api.get(config.endpoint)

      if (kind === "classes" || kind === "teachers") {
        const coursesRes = await api.get<CursoDTO[]>(API_ENDPOINTS.cursos)
        setAvailableCourses(coursesRes.data)
      }

      if (kind === "courses") {
        setRecords(res.data.map((c: CursoDTO) => ({
          id: c.id!,
          name: c.nome,
          code: c.codigo || "",
          detail: c.codigo || "",
        })))
      } else if (kind === "classes") {
        setRecords(res.data.map((t: TurmaDTO) => ({
          id: t.id!,
          name: t.nome,
          detail: t.cursoNome || "",
          cursoId: t.cursoId,
        })))
      } else if (kind === "subjects") {
        setRecords(res.data.map((d: DisciplinaDTO) => ({
          id: d.id!,
          name: d.nome,
        })))
      } else if (kind === "teachers") {
        setRecords(res.data.map((p: ProfessorDTO) => ({
          id: p.id!,
          name: p.nome,
          email: p.email,
          lattesUrl: p.lattesUrl,
          cursosIds: p.cursosIds || [],
          detail: p.cursosNomes?.join(", ") || "",
        })))
      } else if (kind === "rooms") {
        setRecords(res.data.map((a: AmbienteDTO) => ({
          id: a.id!,
          name: a.nome,
          categoria: a.categoria,
          detail: a.localizacao || "",
        })))
      }
    } catch (err: any) {
      toast.error(`Erro ao carregar os dados de ${config.plural}.`)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [kind])

  const filtered = records.filter((record) =>
    `${record.name} ${record.code ?? ""} ${record.detail ?? ""}`
      .toLocaleLowerCase("pt-BR")
      .includes(query.toLocaleLowerCase("pt-BR")),
  )

  function openForm(record?: EntityRecord) {
    setEditing(record ?? null)
    if (record) {
      setForm({
        name: record.name,
        code: record.code || "",
        detail: record.detail || "",
        email: record.email || "",
        lattesUrl: record.lattesUrl || "",
        cursoId: record.cursoId || (availableCourses[0]?.id ?? 0),
        cursosIds: record.cursosIds || [],
        categoria: record.categoria || "SALA",
      })
    } else {
      setForm({
        name: "",
        code: "",
        detail: "",
        email: "",
        lattesUrl: "",
        cursoId: availableCourses[0]?.id ?? 0,
        cursosIds: [],
        categoria: "SALA",
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
    if (kind === "classes" && !form.cursoId) {
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

    try {
      if (kind === "courses") {
        const payload: Partial<CursoDTO> = { nome: form.name.trim(), codigo: form.code.trim() }
        if (editing) await api.put(`${config.endpoint}/${editing.id}`, payload)
        else await api.post(config.endpoint, payload)
      } else if (kind === "classes") {
        const payload: Partial<TurmaDTO> = { nome: form.name.trim(), cursoId: form.cursoId }
        if (editing) await api.put(`${config.endpoint}/${editing.id}`, payload)
        else await api.post(config.endpoint, payload)
      } else if (kind === "subjects") {
        const payload: Partial<DisciplinaDTO> = { nome: form.name.trim() }
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
      }

      toast.success(editing ? `${config.singular} atualizado(a) com sucesso!` : `${config.singular} cadastrado(a) com sucesso!`)
      setFormOpen(false)
      loadData()
    } catch (err: any) {
      const msg = err.response?.data?.message || "Erro ao salvar no servidor."
      setError(msg)
      toast.error(msg)
    }
  }

  async function confirmDelete() {
    if (!deleting) return
    try {
      await api.delete(`${config.endpoint}/${deleting.id}`)
      toast.success("Registro excluído com sucesso!")
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
          <p>{records.length} {records.length === 1 ? config.singular : config.plural} cadastrados.</p>
        </div>
        <button className="admin-primary" onClick={() => openForm()} disabled={loading}>
          <AdminIcon name="plus" size={18} />
          Adicionar {config.singular}
        </button>
      </div>

      <section className="admin-surface management-surface">
        <div className="table-toolbar">
          <label>
            <AdminIcon name="search" size={18} />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={config.search}
            />
          </label>
          <span>{filtered.length} resultados</span>
        </div>
        <div className="admin-table-scroll">
          <table className="admin-table">
            <thead>
              <tr>
                <th>{config.nameLabel}</th>
                <th>{kind === "teachers" ? "Cursos e dados acadêmicos" : config.detailLabel || "Informações"}</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((record) => (
                <tr key={record.id}>
                  <td>
                    <span className="table-entity-icon">
                      <AdminIcon name={config.icon} size={17} />
                    </span>
                    <strong>{record.name}</strong>
                  </td>
                  <td>
                    <span>{record.detail || "Não informado"}</span>
                    {kind === "rooms" && record.categoria && (
                      <small>{record.categoria}</small>
                    )}
                    {kind === "teachers" && record.email && (
                      <small>{record.email}</small>
                    )}
                  </td>
                  <td>
                    <button onClick={() => openForm(record)} aria-label={`Editar ${record.name}`}>
                      <AdminIcon name="edit" size={17} />
                    </button>
                    <button className="danger-action" onClick={() => setDeleting(record)} aria-label={`Excluir ${record.name}`}>
                      <AdminIcon name="trash" size={17} />
                    </button>
                  </td>
                </tr>
              ))}
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
          <button className="admin-modal-backdrop" onClick={() => setFormOpen(false)} aria-label="Fechar formulário" />
          <form className="admin-modal" onSubmit={save} noValidate>
            <div className="admin-modal-heading">
              <div>
                <span>{editing ? "EDITAR REGISTRO" : "NOVO REGISTRO"}</span>
                <h2>{editing ? `Editar ${config.singular}` : `Adicionar ${config.singular}`}</h2>
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
              placeholder={config.nameLabel}
              required
            />

            {kind === "courses" && (
              <InputField
                className="admin-form-field"
                label="Código do curso *"
                name="code"
                value={form.code}
                onChange={(e) => setForm((c) => ({ ...c, code: e.target.value }))}
                placeholder="Ex: ADS, INFO, EDIF"
                required
              />
            )}

            {kind === "classes" && (
              <label className="admin-form-field">
                <span>Curso vinculado *</span>
                <select value={form.cursoId} onChange={(e) => setForm((c) => ({ ...c, cursoId: Number(e.target.value) }))}>
                  {availableCourses.map((course) => (
                    <option key={course.id} value={course.id}>{course.nome}</option>
                  ))}
                </select>
              </label>
            )}

            {kind === "teachers" && (
              <>
                <label className="admin-form-field">
                  <span>E-mail acadêmico *</span>
                  <input type="email" value={form.email} onChange={(e) => setForm((c) => ({ ...c, email: e.target.value }))} placeholder="nome@ifpb.edu.br" />
                </label>
                <label className="admin-form-field">
                  <span>Link do Currículo Lattes</span>
                  <input type="url" value={form.lattesUrl} onChange={(e) => setForm((c) => ({ ...c, lattesUrl: e.target.value }))} placeholder="https://lattes.cnpq.br/..." />
                </label>
                <fieldset className="admin-form-field course-checkboxes">
                  <legend>Cursos vinculados</legend>
                  {availableCourses.map((course) => (
                    <label key={course.id}>
                      <input
                        type="checkbox"
                        checked={form.cursosIds.includes(course.id!)}
                        onChange={(e) => setForm((c) => ({
                          ...c,
                          cursosIds: e.target.checked
                            ? [...c.cursosIds, course.id!]
                            : c.cursosIds.filter((id) => id !== course.id),
                        }))}
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
                  <select value={form.categoria} onChange={(e) => setForm((c) => ({ ...c, categoria: e.target.value as CategoriaAmbiente }))}>
                    {ROOM_CATEGORIES_OPTIONS.map((cat) => (
                      <option key={cat.id} value={cat.id}>{cat.label}</option>
                    ))}
                  </select>
                </label>
                <label className="admin-form-field">
                  <span>Localização</span>
                  <input value={form.detail} onChange={(e) => setForm((c) => ({ ...c, detail: e.target.value }))} placeholder="Ex: Bloco A" />
                </label>
              </>
            )}

            {error && <div className="admin-form-error">{error}</div>}
            <div className="admin-modal-actions">
              <Button text="Cancelar" onClick={() => setFormOpen(false)} />
              <Button className="admin-primary" type="submit" text={editing ? "Salvar alterações" : "Adicionar"} />
            </div>
          </form>
        </div>
      )}

      {deleting && (
        <div className="admin-modal-layer" role="alertdialog" aria-modal="true">
          <button className="admin-modal-backdrop" onClick={() => setDeleting(null)} aria-label="Cancelar exclusão" />
          <section className="admin-confirm">
            <span><AdminIcon name="warning" size={24} /></span>
            <h2>Excluir {config.singular}?</h2>
            <p>O registro <strong>{deleting.name}</strong> será removido permanentemente.</p>
            <div>
              <button onClick={() => setDeleting(null)}>Cancelar</button>
              <button className="confirm-delete" onClick={confirmDelete}>Excluir registro</button>
            </div>
          </section>
        </div>
      )}
    </div>
  )
}