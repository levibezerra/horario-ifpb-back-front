import { useEffect, useMemo, useState } from "react"
import { Icon } from "@/components/Icon"
import { useLocation } from "react-router-dom"
import { ScheduleGrid, ScheduleHeading } from "@/components/ScheduleGrid"
import type { HorarioDTO, ProfessorDTO, ScheduleLesson, TurmaDTO, ViewMode } from "@/types/api"
import { api } from "@/services/api"
import { API_ENDPOINTS } from "@/services/api-support/endpoints"
import "./impressao.css"

type PrintDocument = {
  id: string
  name: string
  detail: string
  mode: ViewMode
  lessons: ScheduleLesson[]
}

export default function ImpressaoHorarios() {
  const { search } = useLocation()
  const params = new URLSearchParams(search)
  const kind = params.get("tipo") ?? "turma"
  const value = params.get("valor") ?? ""

  const [classes, setClasses] = useState<TurmaDTO[]>([])
  const [teachers, setTeachers] = useState<ProfessorDTO[]>([])
  const [schedules, setSchedules] = useState<HorarioDTO[]>([])

  useEffect(() => {
    async function loadData() {
      try {
        const [resClasses, resTeachers, resSchedules] = await Promise.all([
          api.get<TurmaDTO[]>(API_ENDPOINTS.turmas),
          api.get<ProfessorDTO[]>(API_ENDPOINTS.professores),
          api.get<HorarioDTO[]>(API_ENDPOINTS.horarios),
        ])
        setClasses(resClasses.data)
        setTeachers(resTeachers.data)
        setSchedules(resSchedules.data.filter((h) => h.status === "PUBLICADO"))
      } catch (err) {
        console.error("Erro ao carregar dados de impressão", err)
      }
    }
    loadData()
  }, [])

  const toLesson = (item: HorarioDTO): ScheduleLesson => ({
    id: String(item.id),
    className: item.turmaNome || "",
    subject: item.disciplinaNome || "",
    teacher: item.professorNome || "",
    room: item.ambienteNome || "",
    day: item.diaSemana,
    start: item.horarioInicio,
    end: item.horarioFim,
    status: item.status || "PUBLICADO",
    rawSubject: item.disciplinaNome || "",
    needsReview: false,
  })

  const documents = useMemo<PrintDocument[]>(() => {
    if (kind === "professor" || kind === "professores") {
      const selectedTeachers = kind === "professor"
        ? teachers.filter((t) => String(t.id) === value || t.nome === value)
        : [...teachers].sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"))

      return selectedTeachers.map((teacher) => {
        const lessons = schedules.filter((item) => item.professorId === teacher.id).map(toLesson)
        return {
          id: `teacher-${teacher.id}`,
          name: teacher.nome,
          detail: teacher.cursosNomes?.join(" · ") || "",
          mode: "teacher",
          lessons,
        }
      })
    }

    const selectedClasses = kind === "turma"
      ? classes.filter((c) => String(c.id) === value || c.nome === value)
      : kind === "curso"
        ? classes.filter((c) => c.cursoNome === value)
        : [...classes].sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"))

    return selectedClasses.map((item) => ({
      id: `class-${item.id}`,
      name: item.nome,
      detail: item.cursoNome ?? "",
      mode: "class",
      lessons: schedules.filter((schedule) => schedule.turmaId === item.id).map(toLesson),
    }))
  }, [classes, kind, schedules, teachers, value])

  const title = kind === "turma"
    ? `Horário Acadêmico – Turma`
    : kind === "curso"
      ? `Horário Acadêmico Completo – ${value}`
      : kind === "professor"
        ? `Horário Acadêmico – Professor`
        : kind === "professores"
          ? "Horário Semanal Completo – Professores"
          : "Horário Acadêmico Geral – IFPB Campus Monteiro"

  useEffect(() => {
    document.title = `${title} | IFPB`
    return () => { document.title = "Horário IFPB · Campus Monteiro" }
  }, [title])

  return (
    <main className="print-page">
      <div className="print-actions">
        <button className="print-back" onClick={() => window.history.back()}><Icon name="chevron" size={17} /> Voltar</button>
        <div><strong>Pré-visualização do documento</strong><p>Confira o conteúdo antes de imprimir ou salvar.</p></div>
        <button onClick={() => window.print()}>Imprimir ou salvar em PDF</button>
      </div>
      <header className="print-document-heading">
        <div className="print-brand">
          <div className="print-logo-mark" aria-hidden="true">{Array.from({ length: 10 }).map((_, i) => <i key={i} />)}</div>
          <div><strong>INSTITUTO FEDERAL</strong><span>Paraíba</span></div>
        </div>
        <div className="print-campus"><strong>Instituto Federal da Paraíba</strong><span>Campus Monteiro · Horário acadêmico 2026.2</span></div>
        <div className="print-document-type"><span>DOCUMENTO ACADÊMICO</span><small>Gerado em {new Intl.DateTimeFormat("pt-BR").format(new Date())}</small></div>
        <h1>{title}</h1>
        <p>Grade semanal oficial para consulta e organização acadêmica.</p>
      </header>
      {documents.map((doc, index) => (
        <section className="print-class-section" key={doc.id}>
          {kind === "professores" && (
            <div className="print-course-divider teacher-divider">
              <span>PROFESSOR</span><strong>{doc.name}</strong><small>{doc.detail}</small>
            </div>
          )}
          <ScheduleHeading mode={doc.mode} selected={doc.name} course={doc.detail} lessons={doc.lessons} />
          <ScheduleGrid lessons={doc.lessons} mode={doc.mode} label={doc.name} />
        </section>
      ))}
      {!documents.length && (
        <div className="print-empty">
          <strong>Nenhum horário encontrado</strong>
          <p>Retorne à página anterior e escolha outra opção.</p>
        </div>
      )}
    </main>
  )
}