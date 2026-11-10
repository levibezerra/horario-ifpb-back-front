import type { AdministradorDTO } from "@/types/api"
import { api } from "./api"
import { API_ENDPOINTS } from "./api-support/endpoints"

export const administradorService = {
  async getMe() {
    const response = await api.get<AdministradorDTO>(API_ENDPOINTS.meuPerfil)
    return response.data
  },
  async updateMe(payload: { nome?: string; email?: string; novaSenha?: string }) {
    const response = await api.put<AdministradorDTO>(API_ENDPOINTS.meuPerfil, payload)
    return response.data
  },
  async list() {
    const response = await api.get<AdministradorDTO[]>(API_ENDPOINTS.administradores)
    return response.data
  },
  async getById(id: number) {
    const response = await api.get<AdministradorDTO>(`${API_ENDPOINTS.administradores}/${id}`)
    return response.data
  },
  async create(payload: Partial<AdministradorDTO>) {
    const response = await api.post<AdministradorDTO>(API_ENDPOINTS.administradores, payload)
    return response.data
  },
  async update(id: number, payload: Partial<AdministradorDTO>) {
    const response = await api.put<AdministradorDTO>(`${API_ENDPOINTS.administradores}/${id}`, payload)
    return response.data
  },
  async remove(id: number) {
    await api.delete(`${API_ENDPOINTS.administradores}/${id}`)
  },
}