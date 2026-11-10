import type { CursoDTO } from "@/types/api"
import { createCrudService } from "./api-support/crudService"
import { API_ENDPOINTS } from "./api-support/endpoints"

export const cursoService = createCrudService<CursoDTO, Partial<CursoDTO>, Partial<CursoDTO>>(API_ENDPOINTS.cursos)