import type { AuthResponse, LoginRequest } from "@/types/api"
import { api } from "../api"
import { authSession } from "./authSession"
import { API_ENDPOINTS } from "./endpoints"

export const autenticacaoService = {
  async login(payload: LoginRequest): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>(API_ENDPOINTS.login, payload)
    if (response.data.accessToken) {
      authSession.setAccessToken(response.data.accessToken)
    }
    return response.data
  },
  async refresh(): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>(API_ENDPOINTS.refresh)
    if (response.data.accessToken) {
      authSession.setAccessToken(response.data.accessToken)
    }
    return response.data
  },
  async logout(): Promise<void> {
    try {
      await api.post(API_ENDPOINTS.logout)
    } finally {
      authSession.clear()
    }
  },
}