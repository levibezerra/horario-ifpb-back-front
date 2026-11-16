import axios from "axios"
import { authSession } from "./api-support/authSession"
import { normalizeApiError } from "./api-support/apiError"
export { apiErrorMessage, ApiError, normalizeApiError } from "./api-support/apiError"

function resolveBaseURL(): string {
  const envUrl = import.meta.env.VITE_API_URL?.trim()
  if (envUrl) return envUrl

  const hostname = typeof window !== "undefined" ? window.location.hostname : "localhost"
  return `http://${hostname}:8080/api/v1`
}

const baseURL = resolveBaseURL()

export const isApiConfigured = true

export const api = axios.create({
  baseURL,
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
  },
  timeout: 15_000,
})

let unauthorizedHandler: (() => void) | null = null
let forbiddenHandler: (() => void) | null = null

export function setApiAuthHandlers(handlers: {
  onUnauthorized?: () => void
  onForbidden?: () => void
}) {
  unauthorizedHandler = handlers.onUnauthorized ?? null
  forbiddenHandler = handlers.onForbidden ?? null
}

api.interceptors.request.use((config) => {
  const token = window.sessionStorage.getItem("ifpb_access_token") || authSession.getAccessToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    const normalized = normalizeApiError(error)
    if (normalized.status === 401) {
      authSession.clear()
      unauthorizedHandler?.()
    }
    if (normalized.status === 403) {
      forbiddenHandler?.()
    }
    return Promise.reject(normalized)
  },
)

export default api