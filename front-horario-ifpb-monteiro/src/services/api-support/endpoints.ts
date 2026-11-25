export const API_ENDPOINTS = {
  cursos: "/cursos",
  turmas: "/turmas",
  disciplinas: "/disciplinas",
  professores: "/professores",
  ambientes: "/ambientes",
  horarios: "/horarios",
  publicarHorarios: "/horarios/publicar",
  despublicarHorarios: "/horarios/despublicar",
  excluirHorariosLote: "/horarios/excluir-lote",
  horariosPorTurma: "/horarios/turma",
  administradores: "/administradores",
  meuPerfil: "/auth/me",
  login: "/auth/login",
  refresh: "/auth/refresh",
  logout: "/auth/logout",
  ultimaAtualizacao: "/horarios/ultima-atualizacao",
} as const

export const ENDPOINTS = API_ENDPOINTS