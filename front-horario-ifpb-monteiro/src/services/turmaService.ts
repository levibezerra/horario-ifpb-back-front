import type { TurmaDTO } from "@/types/api"
import { createCrudService } from "./api-support/crudService"
import { API_ENDPOINTS } from "./api-support/endpoints"

export const turmaService = createCrudService<TurmaDTO, Partial<TurmaDTO>, Partial<TurmaDTO>>(API_ENDPOINTS.turmas)