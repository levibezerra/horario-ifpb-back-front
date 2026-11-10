export const ROUTES = {
  home: "/",
  byRoom: "/ambientes",
  printSchedules: "/imprimir-horarios",
  byClass: "/turmas",
  byProfessor: "/professores",
  adminLogin: "/admin/login",
  adminRegister: "/admin/register",
  adminDashboard: "/admin",
  adminCourses: "/admin/cursos",
  adminClasses: "/admin/turmas",
  adminSubjects: "/admin/disciplinas",
  adminTeachers: "/admin/professores",
  adminRooms: "/admin/ambientes",
  adminSchedules: "/admin/horarios",
} as const

export type RoutePath = (typeof ROUTES)[keyof typeof ROUTES]

export function professorPath(identifier: string) {
  return `${ROUTES.byProfessor}?sel=${encodeURIComponent(identifier)}`
}