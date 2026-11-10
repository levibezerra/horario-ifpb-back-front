import { useMemo, useState } from "react"
import type { ScheduleLesson, ViewMode } from "@/types/api"
import { useSearchParam } from "./useSearchParam"
import { useAdminData } from "./useAdminData"

export function useScheduleView(mode: ViewMode) {
  const [param, setParam] = useSearchParam("sel")
  const [query, setQuery] = useState("")
  const { classes, teachers, publishedSchedules: schedules } = useAdminData()

  const groups = useMemo(() => {
    if (mode === "class") {
      const byCourse = new Map<string, Array<{ id: string; label: string }>>()
      classes.forEach((item) => {
        const course = item.cursoNome || "Geral"
        const list = byCourse.get(course) ?? []
        list.push({ id: String(item.id), label: item.nome })
        byCourse.set(course, list)
      })
      return [...byCourse.entries()].map(([group, items]) => ({
        group,
        caption: "Turmas do curso",
        items,
      }))
    }

    const byCourse = new Map<string, Array<{ id: string; label: string }>>()
    teachers.forEach((teacher) => {
      const courses = teacher.cursosNomes?.length
        ? teacher.cursosNomes
        : ["Docentes"]
      courses.forEach((course) => {
        const list = byCourse.get(course) ?? []
        if (!list.some((i) => i.id === String(teacher.id))) {
          list.push({ id: String(teacher.id!), label: teacher.nome })
        }
        byCourse.set(course, list)
      })
    })

    return [...byCourse.entries()]
      .sort(([a], [b]) => a.localeCompare(b, "pt-BR"))
      .map(([group, items]) => ({
        group,
        caption: "Professores vinculados",
        items: items.sort((a, b) => a.label.localeCompare(b.label, "pt-BR")),
      }))
  }, [mode, classes, teachers])

  const fallbackId =
    mode === "class"
      ? classes[0]?.id ? String(classes[0].id) : ""
      : teachers[0]?.id ? String(teachers[0].id) : ""

  const allItemIds = useMemo(
    () => groups.flatMap((g) => g.items.map((i) => i.id)),
    [groups],
  )

  const selected = param && allItemIds.includes(param) ? param : fallbackId

  const filteredGroups = useMemo(() => {
    const term = query.toLocaleLowerCase("pt-BR")
    return groups
      .map((group) => ({
        ...group,
        items: group.items.filter((item) =>
          item.label.toLocaleLowerCase("pt-BR").includes(term),
        ),
      }))
      .filter((group) => group.items.length)
  }, [groups, query])

  const lessons: ScheduleLesson[] = useMemo(() => {
    if (!selected) return []
    const selectedNum = Number(selected)

    return schedules
      .filter((item) =>
        mode === "class"
          ? item.turmaId === selectedNum
          : item.professorId === selectedNum,
      )
      .map((item) => ({
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
      }))
  }, [mode, selected, schedules])

  const selectedCourse = groups.find((group) =>
    group.items.some((i) => i.id === selected),
  )?.group

  return {
    groups,
    filteredGroups,
    selected,
    select: (id: string) => setParam(id),
    query,
    setQuery,
    lessons,
    selectedCourse,
  }
}