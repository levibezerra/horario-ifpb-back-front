import axios from "axios"
import type { ApiErrorPayload } from "@/types/api"

const STATUS_MESSAGES: Record<number, string> = {
  400: "Verifique os dados informados e tente novamente.",
  401: "Sua sessão expirou. Entre novamente para continuar.",
  403: "Você não possui permissão para realizar esta ação.",
  404: "O registro solicitado não foi encontrado.",
  409: "Conflito de dados: já existe um registro semelhante ou este item está em uso.",
  422: "Não foi possível processar os dados enviados.",
  500: "O servidor encontrou um problema. Tente novamente mais tarde.",
}

export class ApiError extends Error {
  readonly status?: number
  readonly code?: string
  readonly fieldErrors?: Record<string, string>

  constructor(
    message: string,
    options?: {
      status?: number
      code?: string
      fieldErrors?: Record<string, string>
    },
  ) {
    super(message)
    this.name = "ApiError"
    this.status = options?.status
    this.code = options?.code
    this.fieldErrors = options?.fieldErrors
  }
}

function normalizeFieldErrors(
  rawErrors?: ApiErrorPayload["errors"],
): Record<string, string> | undefined {
  if (!rawErrors || typeof rawErrors !== "object") return undefined

  const normalized: Record<string, string> = {}
  for (const [field, value] of Object.entries(rawErrors)) {
    if (Array.isArray(value) && value.length > 0) {
      normalized[field] = String(value[0])
      continue
    }
    if (typeof value === "string" && value.trim()) {
      normalized[field] = value
    }
  }

  return Object.keys(normalized).length > 0 ? normalized : undefined
}

export function normalizeApiError(error: unknown): ApiError {
  if (error instanceof ApiError) return error

  if (!axios.isAxiosError<ApiErrorPayload>(error)) {
    return new ApiError("Não foi possível concluir a operação.")
  }

  const status = error.response?.status
  const payload = error.response?.data
  const fieldErrors = normalizeFieldErrors(payload?.errors)

  if (error.code === "ECONNABORTED") {
    return new ApiError("A requisição demorou muito para responder. Tente novamente.", {
      status,
      code: error.code,
    })
  }

  if (error.code === "ERR_NETWORK" || !error.response) {
    return new ApiError("Não foi possível conectar ao servidor. Verifique sua conexão.", {
      code: error.code ?? "ERR_NETWORK",
    })
  }

  const firstFieldMessage = fieldErrors ? Object.values(fieldErrors)[0] : undefined
  const message =
    (payload?.code === "VALIDATION_ERROR" && firstFieldMessage) ||
    payload?.message ||
    (status ? STATUS_MESSAGES[status] : undefined) ||
    "Não foi possível concluir a requisição."

  return new ApiError(message, {
    status,
    code: payload?.code ?? error.code,
    fieldErrors,
  })
}

export function apiErrorMessage(error: unknown): string {
  return normalizeApiError(error).message
}

export function extractFieldErrors(error: unknown): Record<string, string> {
  return normalizeApiError(error).fieldErrors ?? {}
}