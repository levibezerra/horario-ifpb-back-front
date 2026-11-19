import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import { api } from "@/services/api"
import { API_ENDPOINTS, type AnoLetivoDTO } from "@/types/api"

type PeriodoLetivoContextData = {
  periodoLetivo: string
  loading: boolean
  atualizarPeriodoLetivo: (novoPeriodo: string) => Promise<void>
}

const PeriodoLetivoContext = createContext<PeriodoLetivoContextData>({
  periodoLetivo: "2026.2",
  loading: true,
  atualizarPeriodoLetivo: async () => {},
})

export function PeriodoLetivoProvider({ children }: { children: ReactNode }) {
  const [periodoLetivo, setPeriodoLetivo] = useState("2026.2")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function carregarPeriodo() {
      try {
        const res = await api.get<AnoLetivoDTO>(API_ENDPOINTS.anoLetivo)
        if (res.data?.periodoLetivo) {
          setPeriodoLetivo(res.data.periodoLetivo)
        }
      } catch (err) {
        console.error("Erro ao carregar o período letivo:", err)
      } finally {
        setLoading(false)
      }
    }

    carregarPeriodo()
  }, [])

  async function atualizarPeriodoLetivo(novoPeriodo: string) {
    const res = await api.put<AnoLetivoDTO>(API_ENDPOINTS.anoLetivo, {
      periodoLetivo: novoPeriodo.trim(),
    })
    setPeriodoLetivo(res.data.periodoLetivo)
  }

  return (
    <PeriodoLetivoContext.Provider
      value={{ periodoLetivo, loading, atualizarPeriodoLetivo }}
    >
      {children}
    </PeriodoLetivoContext.Provider>
  )
}

export function usePeriodoLetivo() {
  return useContext(PeriodoLetivoContext)
}