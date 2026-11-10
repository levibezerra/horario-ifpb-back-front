import type { ProfessorDTO } from "@/types/api"
import { createCrudService } from "./api-support/crudService"
import { API_ENDPOINTS } from "./api-support/endpoints"

export const professorService = createCrudService<ProfessorDTO, Partial<ProfessorDTO>, Partial<ProfessorDTO>>(API_ENDPOINTS.professores)