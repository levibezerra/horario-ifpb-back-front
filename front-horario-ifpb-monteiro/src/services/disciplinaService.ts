import type { DisciplinaDTO } from "@/types/api"
import { createCrudService } from "./api-support/crudService"
import { API_ENDPOINTS } from "./api-support/endpoints"

export const disciplinaService = createCrudService<DisciplinaDTO, Partial<DisciplinaDTO>, Partial<DisciplinaDTO>>(API_ENDPOINTS.disciplinas)