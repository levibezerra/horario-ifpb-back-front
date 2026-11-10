import { useEffect, useMemo, useState } from "react"
import { Icon } from "@/components/Icon"
import { useNavigate } from "react-router-dom"
import { ROUTES } from "@/routes/paths"
import type { HorarioDTO, ProfessorDTO, TurmaDTO } from "@/types/api"
import { api } from "@/services/api"
import { API_ENDPOINTS } from "@/services/api-support/endpoints"
import "./inicio.css"

export default function Inicio() {
  const navigate = useNavigate()
  const [classes, setClasses] = useState<TurmaDTO[]>([])
  const [teachers, setTeachers] = useState<ProfessorDTO[]>([])
  const [schedules, setSchedules] = useState<HorarioDTO[]>([])

  useEffect(() => {
    async function loadPublicData() {
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
        console.error("Erro ao carregar dados públicos", err)
      }
    }
    loadPublicData()
  }, [])

  const sortedClasses = useMemo(() => [...classes].sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR")), [classes])
  
  const courses = useMemo(() => {
    const list = classes.map((c) => c.cursoNome).filter((name): name is string => Boolean(name))
    return [...new Set(list)].sort((a, b) => a.localeCompare(b, "pt-BR"))
  }, [classes])

  const sortedTeachers = useMemo(() => [...teachers].sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR")), [teachers])

  const [selectedClassId, setSelectedClassId] = useState<string>("")
  const [selectedCourse, setSelectedCourse] = useState<string>("")
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>("")

  useEffect(() => {
    if (sortedClasses.length > 0 && !selectedClassId) setSelectedClassId(String(sortedClasses[0].id))
    if (courses.length > 0 && !selectedCourse) setSelectedCourse(courses[0])
    if (sortedTeachers.length > 0 && !selectedTeacherId) setSelectedTeacherId(String(sortedTeachers[0].id))
  }, [sortedClasses, courses, sortedTeachers])

  function preview(type: "turma" | "curso" | "campus" | "professor" | "professores", value = "") {
    const params = new URLSearchParams({ tipo: type })
    if (value) params.set("valor", value)
    navigate(`${ROUTES.printSchedules}?${params.toString()}`)
  }

  return (
    <main className="home-main">
      <section className="home-surface home-intro">
        <div className="home-heading">
          <p>CENTRAL DE DOCUMENTOS · 2026.2</p>
          <h1>Horários acadêmicos do Campus Monteiro</h1>
          <span>Consulte a grade na tela ou prepare um documento por turma, curso, professor ou para todo o campus.</span>
        </div>
        <div className="home-stats">
          <div><strong>{classes.length}</strong><small>turmas cadastradas</small></div>
          <div><strong>{sortedTeachers.length}</strong><small>professores cadastrados</small></div>
          <div><strong>{schedules.length}</strong><small>blocos publicados</small></div>
        </div>
      </section>

      <section className="download-hub">
        <div className="hub-heading">
          <div><p>HORÁRIOS DE TURMAS</p><h2>Documentos por organização acadêmica</h2></div>
          <span className="hub-icon"><Icon name="users" size={22} /></span>
        </div>
        <div className="hub-grid">
          <article className="hub-card">
            <span className="option-number">01</span>
            <div><h3>Turma individual</h3><p>Selecione uma turma de qualquer curso ou período.</p></div>
            <label>
              <span>Turma</span>
              <select value={selectedClassId} onChange={(event) => setSelectedClassId(event.target.value)}>
                {sortedClasses.map((item) => (
                  <option key={item.id} value={item.id}>{item.cursoNome ? `${item.nome} — ${item.cursoNome}` : item.nome}</option>
                ))}
              </select>
            </label>
            <button onClick={() => preview("turma", selectedClassId)} disabled={!selectedClassId}>
              Baixar PDF <Icon name="chevron" size={16} />
            </button>
          </article>

          <article className="hub-card">
            <span className="option-number">02</span>
            <div><h3>Curso completo</h3><p>Reúne todas as turmas e períodos vinculados ao curso.</p></div>
            <label>
              <span>Curso</span>
              <select value={selectedCourse} onChange={(event) => setSelectedCourse(event.target.value)}>
                {courses.map((course) => (
                  <option key={course} value={course}>{course}</option>
                ))}
              </select>
            </label>
            <button onClick={() => preview("curso", selectedCourse)} disabled={!selectedCourse}>
              Baixar PDF <Icon name="chevron" size={16} />
            </button>
          </article>

          <article className="hub-card">
            <span className="option-number">03</span>
            <div><h3>Campus completo</h3><p>Todos os cursos, turmas e períodos em um único documento organizado.</p></div>
            <div className="campus-document-info">
              <Icon name="book" size={18} />
              <span><strong>Grade acadêmica geral</strong><small>IFPB Campus Monteiro</small></span>
            </div>
            <button onClick={() => preview("campus")}>Baixar PDF <Icon name="chevron" size={16} /></button>
          </article>
        </div>
      </section>

      <section className="download-hub teacher-hub">
        <div className="hub-heading">
          <div><p>HORÁRIOS DE PROFESSORES</p><h2>Documentos do corpo docente</h2></div>
          <span className="hub-icon"><Icon name="teacher" size={22} /></span>
        </div>
        <div className="hub-grid teacher-download-grid">
          <article className="hub-card">
            <span className="option-number">01</span>
            <div><h3>Professor individual</h3><p>Aulas, turmas, disciplinas, horários e ambientes do docente.</p></div>
            <label>
              <span>Professor</span>
              <select value={selectedTeacherId} onChange={(event) => setSelectedTeacherId(event.target.value)}>
                {sortedTeachers.map((teacher) => (
                  <option key={teacher.id} value={teacher.id}>{teacher.nome}</option>
                ))}
              </select>
            </label>
            <button onClick={() => preview("professor", selectedTeacherId)} disabled={!selectedTeacherId}>
              Baixar PDF <Icon name="chevron" size={16} />
            </button>
          </article>

          <article className="hub-card">
            <span className="option-number">02</span>
            <div><h3>Todos os professores</h3><p>Horários semanais completos, separados e identificados por professor.</p></div>
            <div className="campus-document-info">
              <Icon name="teacher" size={18} />
              <span><strong>{sortedTeachers.length} professores</strong><small>Com aulas cadastradas na grade</small></span>
            </div>
            <button onClick={() => preview("professores")}>Baixar PDF <Icon name="chevron" size={16} /></button>
          </article>
        </div>
      </section>
    </main>
  )
}