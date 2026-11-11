import type { ReactNode } from "react"
import { useAuth } from "@/hooks/useAuth"
import { Navigate, useLocation } from "react-router-dom"
import { ROUTES } from "./paths"

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth()
  const location = useLocation()

  if (!isAuthenticated) {
    // Redireciona para o login guardando a localização atual de origem
    return <Navigate to={ROUTES.adminLogin} state={{ from: location }} replace />
  }

  return <>{children}</>
}

export function GuestRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth()
  const location = useLocation()

  // Se já estiver autenticado e tentar acessar login/cadastro, redireciona para a rota anterior ou dashboard
  if (isAuthenticated) {
    const destination = location.state?.from?.pathname || ROUTES.adminDashboard
    return <Navigate to={destination} replace />
  }

  return <>{children}</>
}