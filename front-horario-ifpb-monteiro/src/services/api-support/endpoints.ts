export const API_ENDPOINTS = {
  cursos: "/cursos",
  turmas: "/turmas",
  disciplinas: "/disciplinas",
  professores: "/professores",
  ambientes: "/ambientes",
  horarios: "/horarios",
  publicarHorarios: "/horarios/publicar",
  administradores: "/administradores",
  meuPerfil: "/auth/me",
  login: "/auth/login",
  refresh: "/auth/refresh",
  logout: "/auth/logout",
} as const

export const ENDPOINTS = API_ENDPOINTS