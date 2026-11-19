import { AdminDataProvider } from "@/hooks/useAdminData"
import { AuthProvider } from "@/hooks/useAuth"
import { PeriodoLetivoProvider } from "@/hooks/usePeriodoLetivo"
import AppRoutes from "@/routes/AppRoutes"
import { ToastContainer } from "react-toastify"
import "react-toastify/dist/ReactToastify.css"
import "@/style/global.css"

export default function App() {
  return (
    <>
      <AuthProvider>
        <PeriodoLetivoProvider>
          <AdminDataProvider>
            <AppRoutes />
          </AdminDataProvider>
        </PeriodoLetivoProvider>
      </AuthProvider>
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        pauseOnHover
        draggable
        theme="light"
      />
    </>
  )
}