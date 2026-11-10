import { useCallback, useState } from "react"
import { apiErrorMessage } from "@/services/api"
import { toast } from "react-toastify"

type RequestStatus = "idle" | "loading" | "success" | "error"

export function useApiRequest<T>() {
  const [status, setStatus] = useState<RequestStatus>("idle")
  const [data, setData] = useState<T | null>(null)
  const [error, setError] = useState("")

  const execute = useCallback(async (request: () => Promise<T>) => {
    setStatus("loading")
    setError("")
    try {
      const result = await request()
      setData(result)
      setStatus("success")
      return result
    } catch (requestError) {
      const message = apiErrorMessage(requestError)
      setError(message)
      toast.error(message)
      setStatus("error")
      return null
    }
  }, [])

  const reset = useCallback(() => {
    setStatus("idle")
    setData(null)
    setError("")
  }, [])

  return {
    data,
    error,
    status,
    isLoading: status === "loading",
    execute,
    reset,
  }
}