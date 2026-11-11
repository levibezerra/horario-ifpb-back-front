export type EntityId = number

export type DiaSemana =
  | "SEGUNDA"
  | "TERCA"
  | "QUARTA"
  | "QUINTA"
  | "SEXTA"

export type StatusHorario = "RASCUNHO" | "PUBLICADO"

export type CategoriaAmbiente =
  | "SALA"
  | "LABORATORIO"
  | "AUDITORIO"
  | "ESPORTIVO"

export type ModalidadeCurso =
  | "INTEGRADO"
  | "SUPERIOR"
  | "SUBSEQUENTE"

export type ReferenciaApi = {
  id: EntityId
  nome: string
}

export type Period = {
  code: string
  start: string
  end: string
  break?: boolean
}

// ==========================================
// DTOs de Resposta (Spring Boot / PostgreSQL)
// ==========================================

export type CursoDTO = {
  id?: EntityId
  nome: string
  codigo?: string
  modalidade: ModalidadeCurso
}

export type TurmaDTO = {
  id?: EntityId
  nome: string
  cursoId: EntityId
  cursoNome?: string
}

export type DisciplinaDTO = {
  id?: EntityId
  nome: string
}

export type ProfessorDTO = {
  id?: EntityId
  nome: string
  email: string
  lattesUrl?: string
  cursosIds?: EntityId[]
  cursosNomes?: string[]
}

export type AmbienteDTO = {
  id?: EntityId
  nome: string
  categoria: CategoriaAmbiente
  localizacao?: string
}

export type HorarioDTO = {
  id?: EntityId
  diaSemana: DiaSemana
  horarioInicio: string
  horarioFim: string
  status?: StatusHorario
  professorId: EntityId
  professorNome?: string
  turmaId: EntityId
  turmaNome?: string
  cursoId?: EntityId       
  cursoNome?: string     
  disciplinaId: EntityId
  disciplinaNome?: string
  ambienteId: EntityId
  ambienteNome?: string
}

export type AdministradorDTO = {
  id?: EntityId
  nome: string
  email: string
}

// Aliases para compatibilidade caso algum arquivo antigo chame de *Api
export type CursoApi = CursoDTO
export type TurmaApi = TurmaDTO
export type DisciplinaApi = DisciplinaDTO
export type ProfessorApi = ProfessorDTO
export type AmbienteApi = AmbienteDTO
export type HorarioApi = HorarioDTO
export type AdministradorApi = AdministradorDTO

// ==========================================
// DTOs para Exibição na Grade (Schedule UI)
// ==========================================

export type DayName = DiaSemana | "Segunda" | "Terça" | "Quarta" | "Quinta" | "Sexta"

export type ScheduleLesson = {
  id?: string
  className: string
  day: DayName
  start: string
  end: string
  subject: string
  rawSubject?: string
  teacher: string
  room?: string
  status?: StatusHorario
  needsReview?: boolean
}

export type ViewMode = "class" | "teacher" | "room"

// ==========================================
// DTOs de Requisição (Auth & CRUD Requests)
// ==========================================

export type LoginRequest = {
  email: string
  senha: string
}

export type AuthResponse = {
  accessToken: string
  tokenType: "Bearer"
  expiresIn?: number
  administrador: AdministradorDTO
}

export type CriarCursoRequest = Omit<CursoDTO, "id">
export type AtualizarCursoRequest = Partial<CriarCursoRequest>

export type CriarTurmaRequest = {
  nome: string
  cursoId: EntityId
}
export type AtualizarTurmaRequest = Partial<CriarTurmaRequest>

export type CriarDisciplinaRequest = {
  nome: string
}
export type AtualizarDisciplinaRequest = Partial<CriarDisciplinaRequest>

export type CriarProfessorRequest = {
  nome: string
  email: string
  lattesUrl?: string
  cursosIds?: EntityId[]
}
export type AtualizarProfessorRequest = Partial<CriarProfessorRequest>

export type CriarAmbienteRequest = {
  nome: string
  categoria: CategoriaAmbiente
  localizacao?: string
}
export type AtualizarAmbienteRequest = Partial<CriarAmbienteRequest>

export type CriarHorarioRequest = {
  diaSemana: DiaSemana
  horarioInicio: string
  horarioFim: string
  status?: StatusHorario
  professorId: EntityId
  turmaId: EntityId
  disciplinaId: EntityId
  ambienteId: EntityId
}
export type AtualizarHorarioRequest = Partial<CriarHorarioRequest>

export type PublicarHorariosRequest = {
  horarioIds?: EntityId[]
}

export type CriarAdministradorRequest = {
  nome: string
  email: string
  senha: string
}

export type AtualizarMeuPerfilRequest = {
  nome?: string
  email?: string
  novaSenha?: string
}

export type AtualizarAdministradorRequest = {
  nome?: string
  email?: string
}

// ==========================================
// Paginação e Erros
// ==========================================

export type SpringPage<T> = {
  content: T[]
  totalElements: number
  totalPages: number
  number: number
  size: number
  first: boolean
  last: boolean
  empty: boolean
}

export type ListResponse<T> = T[] | SpringPage<T>

export type ListParams = {
  page?: number
  size?: number
  sort?: string
  busca?: string
}

export type ApiErrorPayload = {
  status?: number
  code?: string
  message?: string
  errors?: Record<string, string | string[]>
  timestamp?: string
  path?: string
}