import { useCallback } from "react"
import { useLocation, useNavigate } from "react-router-dom"

export function useSearchParam(key: string) {
  const { pathname, search } = useLocation()
  const navigate = useNavigate()
  const value = new URLSearchParams(search).get(key)

  const setValue = useCallback(
    (next: string | null) => {
      const params = new URLSearchParams(window.location.search)
      if (next === null) params.delete(key)
      else params.set(key, next)
      const query = params.toString()
      navigate(`${pathname}${query ? `?${query}` : ""}`, { replace: true })
    },
    [key, navigate, pathname],
  )

  return [value, setValue] as const
}