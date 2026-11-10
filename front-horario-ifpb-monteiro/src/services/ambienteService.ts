import type { AmbienteDTO } from "@/types/api"
import { createCrudService } from "./api-support/crudService"
import { API_ENDPOINTS } from "./api-support/endpoints"

export const ambienteService = createCrudService<AmbienteDTO, Partial<AmbienteDTO>, Partial<AmbienteDTO>>(API_ENDPOINTS.ambientes)