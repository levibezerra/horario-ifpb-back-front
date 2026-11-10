import type { HorarioDTO } from "@/types/api"
import { api } from "./api"
import { API_ENDPOINTS } from "./api-support/endpoints"

export const horarioService = {
  async list() {
    const response = await api.get<HorarioDTO[]>(API_ENDPOINTS.horarios)
    return response.data
  },
  async getById(id: number) {
    const response = await api.get<HorarioDTO>(`${API_ENDPOINTS.horarios}/${id}`)
    return response.data
  },
  async create(payload: Partial<HorarioDTO>) {
    const response = await api.post<HorarioDTO>(API_ENDPOINTS.horarios, payload)
    return response.data
  },
  async update(id: number, payload: Partial<HorarioDTO>) {
    const response = await api.put<HorarioDTO>(`${API_ENDPOINTS.horarios}/${id}`, payload)
    return response.data
  },
  async remove(id: number) {
    await api.delete(`${API_ENDPOINTS.horarios}/${id}`)
  },
  async publish(horarioIds: number[]) {
    const response = await api.post(API_ENDPOINTS.publicarHorarios, { horarioIds })
    return response.data
  },
}