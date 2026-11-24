import { useEffect, useMemo, useState, type FormEvent } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { AdminIcon } from "@/components/Icon"
import { toast } from "react-toastify"
import Button from "@/components/Button"
import { ConfirmDeleteModal } from "@/components/ConfirmDeleteModal"
import InputField from "@/components/InputField"
import { ROUTES } from "@/routes/paths"
import { api, apiErrorMessage, extractFieldErrors } from "@/services/api"
import { API_ENDPOINTS } from "@/services/api-support/endpoints"
import type { CursoDTO, DisciplinaDTO, TurmaDTO } from "@/types/api"
import "./disciplina.css"

type SubjectRecord = {
  id: number
  name: string
  detail: string
  turmasDetail: string
  cursoId?: number
  cursoIds?: number[]
  turmaIds?: number[]
}

function compareNaturalPtBr(a: string, b: string) {
  return a.localeCompare(b, "pt-BR", { numeric: true, sensitivity: "base" })
}

export default function Disciplina() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()

  const [records, setRecords] = useState<SubjectRecord[]>([])
  const [availableCourses, setAvailableCourses] = useState<CursoDTO[]>([])
  const [availableClasses, setAvailableClasses] = useState<TurmaDTO[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  const [query, setQuery] = useState("")
  const [selectedClassId, setSelectedClassId] = useState<number | "ALL">(() => {
    const paramTurmaId = Number(searchParams.get("turmaId"))
    return Number.isFinite(paramTurmaId) && paramTurmaId > 0 ? paramTurmaId : "ALL"
  })
  const [editing, setEditing] = useState<SubjectRecord | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [deleting, setDeleting] = useState<SubjectRecord | null>(null)

  const [form, setForm] = useState({
    name: "",
    cursoIds: [] as number[],
    turmaIds: [] as number[],
  })
  const [pendingClassId, setPendingClassId] = useState<number>(0)
  const [error, setError] = useState("")
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  const handleSelectClassFilter = (value: number | "ALL") => {
    setSelectedClassId(value)
    const nextParams = new URLSearchParams(searchParams)
    if (value === "ALL") {
      nextParams.delete("turmaId")
      nextParams.delete("cursoId")
    } else {
      nextParams.set("turmaId", String(value))
      const cls = availableClasses.find((t) => Number(t.id) === Number(value))
      if (cls?.cursoId) {
        nextParams.set("cursoId", String(cls.cursoId))
      }
    }
    setSearchParams(nextParams, { replace: true })
  }

  const loadData = async () => {
    try {
      setLoading(true)
      const [res, coursesRes, classesRes] = await Promise.all([
        api.get<DisciplinaDTO[]>(API_ENDPOINTS.disciplinas),
        api.get<CursoDTO[]>(API_ENDPOINTS.cursos),
        api.get<TurmaDTO[]>(API_ENDPOINTS.turmas),
      ])

      const loadedCourses = [...coursesRes.data].sort((a, b) =>
        compareNaturalPtBr(a.nome, b.nome),
      )
      const loadedClasses = [...classesRes.data].sort((a, b) =>
        compareNaturalPtBr(a.nome, b.nome),
      )

      setAvailableCourses(loadedCourses)
      setAvailableClasses(loadedClasses)

      const paramTurmaId = Number(searchParams.get("turmaId"))
      if (
        Number.isFinite(paramTurmaId) &&
        paramTurmaId > 0 &&
        loadedClasses.some((c) => Number(c.id) === paramTurmaId)
      ) {
        setSelectedClassId(paramTurmaId)
      }

      setRecords(
        res.data.map((d: any) => {
          const cursoIds: number[] = Array.isArray(d.cursoIds)
            ? d.cursoIds.map(Number)
            : d.cursoId
              ? [Number(d.cursoId)]
              : []

          const turmaIds: number[] = Array.isArray(d.turmaIds)
            ? d.turmaIds.map(Number)
            : []

          const detailNames =
            cursoIds.length > 0
              ? cursoIds
                  .map((id) => loadedCourses.find((c) => Number(c.id) === id)?.nome)
                  .filter(Boolean)
                  .join(", ")
              : d.cursoNome || loadedCourses.find((c) => Number(c.id) === Number(d.cursoId))?.nome || ""

          const turmasDetail =
            turmaIds.length > 0
              ? turmaIds
                  .map((id) => loadedClasses.find((t) => Number(t.id) === id)?.nome)
                  .filter(Boolean)
                  .join(", ")
              : Array.isArray(d.turmaNomes)
                ? d.turmaNomes.join(", ")
                : ""

          return {
            id: d.id!,
            name: d.nome,
            detail: detailNames,
            turmasDetail,
            cursoId: d.cursoId,
            cursoIds,
            turmaIds,
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

  useEffect(() => {
    const paramTurmaId = Number(searchParams.get("turmaId"))
    if (
      Number.isFinite(paramTurmaId) &&
      paramTurmaId > 0 &&
      availableClasses.some((c) => Number(c.id) === paramTurmaId) &&
      selectedClassId !== paramTurmaId
    ) {
      setSelectedClassId(paramTurmaId)
    }
  }, [searchParams, availableClasses, selectedClassId])

  const filtered = useMemo(() => {
    const normalizedQuery = query.toLocaleLowerCase("pt-BR")

    return records.filter((record) => {
      if (selectedClassId !== "ALL") {
        if (record.turmaIds && record.turmaIds.length > 0) {
          if (!record.turmaIds.includes(selectedClassId)) return false
        } else {
          const targetClass = availableClasses.find((t) => Number(t.id) === selectedClassId)
          if (targetClass && record.cursoId !== targetClass.cursoId) {
            return false
          }
        }
      }

      return `${record.name} ${record.detail} ${record.turmasDetail}`
        .toLocaleLowerCase("pt-BR")
        .includes(normalizedQuery)
    })
  }, [records, query, selectedClassId, availableClasses])

  // Agrupamento de todas as turmas por curso para o seletor de filtro principal
  const groupedFilterClasses = useMemo(() => {
    const map = new Map<string, TurmaDTO[]>()

    availableCourses.forEach((course) => {
      const courseClasses = availableClasses.filter(
        (cls) => Number(cls.cursoId) === Number(course.id),
      )
      if (courseClasses.length > 0) {
        const label = course.codigo ? `${course.nome} (${course.codigo})` : course.nome
        map.set(label, courseClasses)
      }
    })

    const ungrouped = availableClasses.filter(
      (cls) => !availableCourses.some((c) => Number(c.id) === Number(cls.cursoId)),
    )
    if (ungrouped.length > 0) {
      ungrouped.forEach((cls) => {
        const label = cls.cursoNome || "Outros cursos"
        if (!map.has(label)) map.set(label, [])
        map.get(label)!.push(cls)
      })
    }

    return Array.from(map.entries())
  }, [availableCourses, availableClasses])

  // Turmas filtradas pelos cursos marcados no checkbox e que ainda não foram adicionadas
  const filteredClassesForCourses = useMemo(() => {
    if (form.cursoIds.length === 0) return []
    return availableClasses.filter(
      (cls) =>
        form.cursoIds.includes(Number(cls.cursoId)) &&
        !form.turmaIds.includes(Number(cls.id)),
    )
  }, [availableClasses, form.cursoIds, form.turmaIds])

  // Agrupamento das turmas disponíveis por curso para exibição no <select> do modal
  const groupedAvailableClasses = useMemo(() => {
    const map = new Map<string, TurmaDTO[]>()
    filteredClassesForCourses.forEach((cls) => {
      const course = availableCourses.find((c) => Number(c.id) === Number(cls.cursoId))
      const label = course
        ? course.codigo
          ? `${course.nome} (${course.codigo})`
          : course.nome
        : cls.cursoNome || "Curso"
      if (!map.has(label)) map.set(label, [])
      map.get(label)!.push(cls)
    })
    return Array.from(map.entries())
  }, [filteredClassesForCourses, availableCourses])

  function openForm(record?: SubjectRecord) {
    setEditing(record ?? null)
    if (record) {
      const initialCursoIds =
        record.cursoIds && record.cursoIds.length > 0
          ? record.cursoIds
          : record.cursoId
            ? [Number(record.cursoId)]
            : []

      setForm({
        name: record.name,
        cursoIds: initialCursoIds,
        turmaIds: record.turmaIds ? [...record.turmaIds] : [],
      })
    } else {
      const preselectedClass =
        selectedClassId !== "ALL"
          ? availableClasses.find((t) => Number(t.id) === Number(selectedClassId))
          : undefined

      setForm({
        name: "",
        cursoIds: preselectedClass?.cursoId ? [Number(preselectedClass.cursoId)] : [],
        turmaIds: preselectedClass?.id ? [Number(preselectedClass.id)] : [],
      })
    }
    setPendingClassId(0)
    setError("")
    setFieldErrors({})
    setFormOpen(true)
  }

  function handleToggleCurso(cursoId: number) {
    if (error) setError("")
    setForm((prev) => {
      const exists = prev.cursoIds.includes(cursoId)
      const nextCursoIds = exists
        ? prev.cursoIds.filter((id) => id !== cursoId)
        : [...prev.cursoIds, cursoId]

      // Remove turmas vinculadas a cursos que foram desmarcados
      const nextTurmaIds = prev.turmaIds.filter((turmaId) => {
        const turmaObj = availableClasses.find((t) => Number(t.id) === turmaId)
        return turmaObj ? nextCursoIds.includes(Number(turmaObj.cursoId)) : false
      })

      return {
        ...prev,
        cursoIds: nextCursoIds,
        turmaIds: nextTurmaIds,
      }
    })
    setPendingClassId(0)
  }

  function handleSelectAndAddTurma(turmaId: number) {
    if (!turmaId) return
    if (error) setError("")
    setForm((prev) => {
      if (prev.turmaIds.includes(turmaId)) return prev
      return {
        ...prev,
        turmaIds: [...prev.turmaIds, turmaId],
      }
    })
    setPendingClassId(0)
  }

  function handleRemoveTurma(turmaId: number) {
    setForm((prev) => ({
      ...prev,
      turmaIds: prev.turmaIds.filter((id) => id !== turmaId),
    }))
  }

  async function save(event: FormEvent) {
    event.preventDefault()
    setError("")
    setFieldErrors({})

    if (!form.name.trim()) {
      setFieldErrors({ nome: "Informe o nome da disciplina antes de salvar." })
      setError("Informe o nome da disciplina antes de salvar.")
      return
    }
    if (form.cursoIds.length === 0) {
      setError("Selecione ao menos um curso vinculado.")
      return
    }
    if (form.turmaIds.length === 0) {
      setError("Adicione ao menos uma turma vinculada à disciplina.")
      return
    }

    try {
      setSubmitting(true)
      const payload: Partial<DisciplinaDTO> & {
        cursoIds: number[]
        turmaIds: number[]
      } = {
        nome: form.name.trim(),
        cursoId: form.cursoIds[0],
        cursoIds: form.cursoIds,
        turmaIds: form.turmaIds,
      }

      if (editing) {
        await api.put(`${API_ENDPOINTS.disciplinas}/${editing.id}`, payload)
      } else {
        await api.post(API_ENDPOINTS.disciplinas, payload)
      }

      toast.success(
        editing
          ? "Disciplina atualizada com sucesso!"
          : "Disciplina cadastrada com sucesso!",
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
    await api.delete(`${API_ENDPOINTS.disciplinas}/${deleting.id}`)
    toast.success(`Disciplina "${deleting.name}" excluída com sucesso!`)
    await loadData()
  }

  return (
    <div className="admin-management disciplina-management">
      <div className="admin-page-heading">
        <div>
          <span>COMPONENTES CURRICULARES</span>
          <h1>Gerenciar disciplinas</h1>
          <p>
            {records.length} {records.length === 1 ? "disciplina" : "disciplinas"} cadastradas.
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
              aria-label="Filtrar disciplinas por curso e turma"
              value={selectedClassId}
              onChange={(event) => {
                const val = event.target.value
                handleSelectClassFilter(val === "ALL" ? "ALL" : Number(val))
              }}
            >
              <option value="ALL">Todas as disciplinas</option>
              {groupedFilterClasses.map(([courseLabel, classList]) => (
                <optgroup key={courseLabel} label={courseLabel}>
                  {classList.map((cls) => (
                    <option key={cls.id} value={cls.id}>
                      {cls.nome}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>
          <span>{filtered.length} resultados</span>
        </div>

        <div className="admin-table-scroll">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Nome da disciplina</th>
                <th>Cursos vinculados</th>
                <th>Turmas vinculadas</th>
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
                    <span>{record.turmasDetail || "Não informado"}</span>
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
              onChange={(e) => {
                setForm((c) => ({ ...c, name: e.target.value }))
                if (error) setError("")
                if (fieldErrors.nome) setFieldErrors((prev) => ({ ...prev, nome: "" }))
              }}
              error={fieldErrors.nome}
              placeholder="Nome da disciplina"
              required
            />

            <fieldset className="admin-form-field course-checkboxes">
              <legend>Cursos vinculados *</legend>
              {availableCourses.length === 0 ? (
                <span style={{ color: "#7d8982", fontSize: "12px" }}>
                  Nenhum curso cadastrado.
                </span>
              ) : (
                availableCourses.map((course) => {
                  const courseId = Number(course.id)
                  const checked = form.cursoIds.includes(courseId)
                  const labelText = course.codigo
                    ? `${course.nome} (${course.codigo})`
                    : course.nome

                  return (
                    <label key={courseId}>
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => handleToggleCurso(courseId)}
                      />
                      <span>{labelText}</span>
                    </label>
                  )
                })
              )}
            </fieldset>

            <div className="admin-form-field">
              <span>Turmas vinculadas *</span>
              <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                <select
                  value={pendingClassId}
                  onChange={(e) => {
                    const selectedId = Number(e.target.value)
                    setPendingClassId(selectedId)
                    handleSelectAndAddTurma(selectedId)
                  }}
                  disabled={form.cursoIds.length === 0 || filteredClassesForCourses.length === 0}
                >
                  <option value={0}>
                    {form.cursoIds.length === 0
                      ? "Selecione ao menos um curso acima"
                      : filteredClassesForCourses.length === 0
                        ? "Todas as turmas dos cursos selecionados já foram adicionadas"
                        : "Selecione uma turma para adicionar..."}
                  </option>
                  {groupedAvailableClasses.map(([courseLabel, classList]) => (
                    <optgroup key={courseLabel} label={courseLabel}>
                      {classList.map((cls) => (
                        <option key={cls.id} value={cls.id}>
                          {cls.nome}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </div>

              {form.turmaIds.length > 0 && (
                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: "6px",
                    marginTop: "10px",
                    padding: "10px",
                    borderRadius: "10px",
                    border: "1px solid #dcded8",
                    background: "#f7f5ef",
                  }}
                >
                  {form.turmaIds.map((turmaId) => {
                    const turmaObj = availableClasses.find((t) => Number(t.id) === turmaId)
                    if (!turmaObj) return null
                    const courseObj = availableCourses.find(
                      (c) => Number(c.id) === Number(turmaObj.cursoId),
                    )
                    const courseTag = courseObj?.codigo || courseObj?.nome || ""

                    return (
                      <span
                        key={turmaId}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "6px",
                          padding: "5px 10px",
                          borderRadius: "999px",
                          border: "1px solid #3b9d6d",
                          background: "#e8f5ed",
                          color: "#174f36",
                          fontSize: "12px",
                          fontWeight: 600,
                        }}
                      >
                        <span>
                          {turmaObj.nome}
                          {courseTag ? ` (${courseTag})` : ""}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveTurma(turmaId)}
                          aria-label={`Remover turma ${turmaObj.nome}`}
                          style={{
                            border: 0,
                            background: "transparent",
                            color: "#174f36",
                            cursor: "pointer",
                            padding: 0,
                            display: "inline-flex",
                            alignItems: "center",
                            fontWeight: 800,
                            fontSize: "14px",
                            lineHeight: 1,
                          }}
                        >
                          ×
                        </button>
                      </span>
                    )
                  })}
                </div>
              )}
            </div>

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
        title="Excluir disciplina?"
        itemName={deleting?.name ?? ""}
        dependencyActionLabel="Ver horários"
        onDependencyAction={
          deleting
            ? () => navigate(`${ROUTES.adminSchedules}?disciplinaId=${deleting.id}`)
            : undefined
        }
        onConfirm={handleConfirmDelete}
        onClose={() => setDeleting(null)}
      />
    </div>
  )
}