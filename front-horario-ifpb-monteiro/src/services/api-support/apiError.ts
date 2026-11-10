import axios from "axios"
import type { ApiErrorPayload } from "@/types/api"

const STATUS_MESSAGES: Record<number, string> = {
  400: "Verifique os dados informados e tente novamente.",
  401: "Sua sessão expirou. Entre novamente para continuar.",
  403: "Você não possui permissão para realizar esta ação.",
  404: "O registro solicitado não foi encontrado.",
  500: "O servidor encontrou um problema. Tente novamente mais tarde.",
}

export class ApiError extends Error {
  readonly status?: number
  readonly code?: string
  readonly fieldErrors?: ApiErrorPayload["errors"]

  constructor(
    message: string,
    options?: {
      status?: number
      code?: string
      fieldErrors?: ApiErrorPayload["errors"]
    },
  ) {
    super(message)
    this.name = "ApiError"
    this.status = options?.status
    this.code = options?.code
    this.fieldErrors = options?.fieldErrors
  }
}

export function normalizeApiError(error: unknown): ApiError {
  if (error instanceof ApiError) return error
  if (!axios.isAxiosError<ApiErrorPayload>(error))
    return new ApiError("Não foi possível concluir a operação.")

  const status = error.response?.status
  const payload = error.response?.data
  const message =
    payload?.message ||
    (status ? STATUS_MESSAGES[status] : undefined) ||
    (error.code === "ERR_NETWORK"
      ? "Não foi possível conectar ao servidor Spring Boot."
      : "Não foi possível concluir a requisição.")

  return new ApiError(message, {
    status,
    code: payload?.code ?? error.code,
    fieldErrors: payload?.errors,
  })
}

export function apiErrorMessage(error: unknown): string {
  return normalizeApiError(error).message
}