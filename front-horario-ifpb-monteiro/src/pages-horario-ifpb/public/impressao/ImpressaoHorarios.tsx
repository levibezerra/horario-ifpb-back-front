import { useEffect, useMemo, useState } from "react"
import { Icon } from "@/components/Icon"
import { useLocation } from "react-router-dom"
import { ScheduleGrid, ScheduleHeading } from "@/components/ScheduleGrid"
import { usePeriodoLetivo } from "@/hooks/usePeriodoLetivo"
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

const ACADEMIC_CALENDARS_ENDPOINT =
  (API_ENDPOINTS as Record<string, string>).calendariosAcademicos || "/calendarios-academicos"

function compareNaturalPtBr(a: string, b: string) {
  return a.localeCompare(b, "pt-BR", { numeric: true, sensitivity: "base" })
}

function compareClassesByCourseAndName(a: TurmaDTO, b: TurmaDTO) {
  const courseA = a.cursoNome || "Outros Cursos"
  const courseB = b.cursoNome || "Outros Cursos"
  const courseDiff = compareNaturalPtBr(courseA, courseB)
  if (courseDiff !== 0) return courseDiff
  return compareNaturalPtBr(a.nome, b.nome)
}

export default function ImpressaoHorarios() {
  const { search, state } = useLocation()
  const { periodoLetivo } = usePeriodoLetivo()
  const params = new URLSearchParams(search)
  const kind = params.get("tipo") ?? "turma"
  const value = params.get("valor") ?? ""
  const passedTitle = params.get("titulo") || (state as any)?.calendarTitle || ""

  const [classes, setClasses] = useState<TurmaDTO[]>([])
  const [teachers, setTeachers] = useState<ProfessorDTO[]>([])
  const [schedules, setSchedules] = useState<HorarioDTO[]>([])

  const [calendarTitle, setCalendarTitle] = useState<string>(passedTitle || "Calendário Acadêmico")
  const [calendarFileName, setCalendarFileName] = useState<string>("calendario-academico.pdf")
  const [calendarPdfBlobUrl, setCalendarPdfBlobUrl] = useState<string>("")
  const [loadingCalendar, setLoadingCalendar] = useState<boolean>(kind === "calendario")

  useEffect(() => {
    if (kind === "calendario") {
      let objectUrl = ""

      async function loadCalendar() {
        try {
          setLoadingCalendar(true)
          const resList = await api.get(ACADEMIC_CALENDARS_ENDPOINT)
          const items = Array.isArray(resList.data)
            ? resList.data
            : resList.data
            ? [resList.data]
            : []
          const found = items.find((item: any) => String(item.id) === String(value))

          if (found) {
            setCalendarTitle(found.titulo || found.nome || passedTitle || "Calendário Acadêmico")
            setCalendarFileName(
              found.nomeArquivo || found.arquivoNome || "calendario-academico.pdf",
            )
          }

          if (value) {
            const downloadUrl =
              found?.urlArquivo ||
              found?.arquivoUrl ||
              `${ACADEMIC_CALENDARS_ENDPOINT}/${value}/download`

            const pdfRes = await api.get(downloadUrl, { responseType: "blob" })
            const blob = new Blob([pdfRes.data], { type: "application/pdf" })
            objectUrl = URL.createObjectURL(blob)
            setCalendarPdfBlobUrl(objectUrl)
          }
        } catch (err) {
          console.error("Erro ao carregar calendário acadêmico", err)
        } finally {
          setLoadingCalendar(false)
        }
      }

      loadCalendar()

      return () => {
        if (objectUrl) URL.revokeObjectURL(objectUrl)
      }
    }

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
  }, [kind, value, passedTitle])

  const handleDownloadCalendarPdf = () => {
    if (!calendarPdfBlobUrl) return
    const link = document.createElement("a")
    link.href = calendarPdfBlobUrl
    link.download = calendarFileName
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

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
    if (kind === "calendario") return []

    if (kind === "professor" || kind === "professores") {
      const selectedTeachers =
        kind === "professor"
          ? teachers.filter((t) => String(t.id) === value || t.nome === value)
          : [...teachers].sort((a, b) => compareNaturalPtBr(a.nome, b.nome))

      return selectedTeachers.map((teacher) => {
        const teacherSchedules = schedules.filter((item) => item.professorId === teacher.id)
        return {
          id: `teacher-${teacher.id}`,
          name: teacher.nome,
          detail: teacher.cursosNomes?.join(" · ") || "",
          mode: "teacher",
          lessons: teacherSchedules.map(toLesson),
        }
      })
    }

    const selectedClasses =
      kind === "turma"
        ? classes.filter((c) => String(c.id) === value || c.nome === value)
        : kind === "curso"
        ? classes
            .filter((c) => c.cursoNome === value)
            .sort((a, b) => compareNaturalPtBr(a.nome, b.nome))
        : [...classes].sort(compareClassesByCourseAndName)

    return selectedClasses.map((item) => {
      const classSchedules = schedules.filter((schedule) => schedule.turmaId === item.id)
      const courseWithYear = item.cursoNome
        ? `${item.cursoNome} · ${periodoLetivo}`
        : periodoLetivo

      return {
        id: `class-${item.id}`,
        name: item.nome,
        detail: courseWithYear,
        mode: "class",
        lessons: classSchedules.map(toLesson),
      }
    })
  }, [classes, kind, periodoLetivo, schedules, teachers, value])

  const title =
    kind === "calendario"
      ? calendarTitle
      : kind === "turma"
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
    return () => {
      document.title = "Horário IFPB · Campus Monteiro"
    }
  }, [title])

  return (
    <main className="print-page">
      <div className="print-actions">
        <button className="print-back" onClick={() => window.history.back()}>
          <Icon name="chevron" size={17} /> Voltar
        </button>
        <div>
          <strong>Pré-visualização do documento</strong>
          <p>Confira o conteúdo antes de imprimir ou salvar.</p>
        </div>
        {kind === "calendario" ? (
          <button
            type="button"
            onClick={handleDownloadCalendarPdf}
            disabled={!calendarPdfBlobUrl}
          >
            Baixar PDF
          </button>
        ) : (
          <button onClick={() => window.print()}>Imprimir ou salvar em PDF</button>
        )}
      </div>

      <header className="print-document-heading">
        <div className="print-brand">
          <div className="print-logo-mark" aria-hidden="true">
            {Array.from({ length: 10 }).map((_, i) => (
              <i key={i} />
            ))}
          </div>
          <div className="print-campus">
            <strong>INSTITUTO FEDERAL DA PARAÍBA</strong>
            <span>
              Campus Monteiro ·{" "}
              {kind === "calendario"
                ? `Calendário acadêmico oficial ${periodoLetivo}`
                : `Horário acadêmico ${periodoLetivo}`}
            </span>
          </div>
        </div>
        <div className="print-document-type">
          <span>{kind === "calendario" ? "CALENDÁRIO ACADÊMICO" : "DOCUMENTO ACADÊMICO"}</span>
          <small>Gerado em {new Intl.DateTimeFormat("pt-BR").format(new Date())}</small>
        </div>
        <h1>{title}</h1>
        <p>
          {kind === "calendario"
            ? "Documento oficial publicado pela coordenação acadêmica do Campus Monteiro."
            : "Grade semanal oficial para consulta e organização acadêmica."}
        </p>
      </header>

      {kind === "calendario" ? (
        <section className="print-class-section">
          {loadingCalendar ? (
            <div className="print-empty">
              <strong>Carregando calendário acadêmico...</strong>
              <p>Aguarde enquanto o arquivo PDF é preparado.</p>
            </div>
          ) : calendarPdfBlobUrl ? (
            <iframe
              src={calendarPdfBlobUrl}
              title={title}
              style={{
                width: "100%",
                height: "82vh",
                border: "1px solid #d0d7de",
                borderRadius: "12px",
                backgroundColor: "#fff",
              }}
            />
          ) : (
            <div className="print-empty">
              <strong>Nenhum calendário acadêmico encontrado</strong>
              <p>Retorne à página inicial e verifique se há um calendário publicado.</p>
            </div>
          )}
        </section>
      ) : (
        <>
          {documents.map((doc, index) => {
            const previousDoc = index > 0 ? documents[index - 1] : null
            const showCourseDivider =
              kind === "campus" && doc.detail && doc.detail !== previousDoc?.detail

            return (
              <section className="print-class-section" key={doc.id}>
                {showCourseDivider && (
                  <div className="print-course-divider">
                    <span>CURSO</span>
                    <strong>{doc.detail}</strong>
                  </div>
                )}
                {kind === "professores" && (
                  <div className="print-course-divider teacher-divider">
                    <span>PROFESSOR</span>
                    <strong>{doc.name}</strong>
                    <small>{doc.detail}</small>
                  </div>
                )}
                <ScheduleHeading
                  mode={doc.mode}
                  selected={doc.name}
                  course={doc.detail}
                  lessons={doc.lessons}
                />
                <ScheduleGrid lessons={doc.lessons} mode={doc.mode} label={doc.name} />
              </section>
            )
          })}
          {!documents.length && (
            <div className="print-empty">
              <strong>Nenhum horário encontrado</strong>
              <p>Retorne à página anterior e escolha outra opção.</p>
            </div>
          )}
        </>
      )}
    </main>
  )
}