import { BrowserRouter, Link, Route, Routes } from "react-router-dom"
import Inicio from "@/pages-horario-ifpb/public/inicio/Inicio"
import PorTurma from "@/pages-horario-ifpb/public/por-turma/PorTurma"
import PorProfessor from "@/pages-horario-ifpb/public/por-professor/PorProfessor"
import PorAmbiente from "@/pages-horario-ifpb/public/por-ambiente/PorAmbiente"
import ImpressaoHorarios from "@/pages-horario-ifpb/public/impressao/ImpressaoHorarios"
import Login from "@/pages-horario-ifpb/admin/login/Login"
import Cadastro from "@/pages-horario-ifpb/admin/cadastro/Cadastro"
import Dashboard from "@/pages-horario-ifpb/admin/dashboard/Dashboard"
import Curso from "@/pages-horario-ifpb/admin/curso/Curso"
import Turma from "@/pages-horario-ifpb/admin/turma/Turma"
import Disciplina from "@/pages-horario-ifpb/admin/disciplina/Disciplina"
import Professor from "@/pages-horario-ifpb/admin/professor/Professor"
import Ambiente from "@/pages-horario-ifpb/admin/ambiente/Ambiente"
import Horario from "@/pages-horario-ifpb/admin/horario/Horario"
import { PublicLayout } from "./PublicLayout"
import { AuthLayout } from "./AuthLayout"
import { AdminLayout } from "./AdminLayout"
import { GuestRoute, ProtectedRoute } from "./ProtectedRoute"
import { ROUTES } from "./paths"

function NotFound() {
  return (
    <PublicLayout>
      <main className="home-main">
        <section className="home-surface home-heading">
          <p>ERRO 404</p>
          <h1>Página não encontrada</h1>
          <span>O endereço acessado não existe neste sistema.</span>
          <Link to={ROUTES.home} className="home-back-link">
            Voltar ao início
          </Link>
        </section>
      </main>
    </PublicLayout>
  )
}

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Rotas Públicas */}
        <Route path={ROUTES.home} element={<PublicLayout><Inicio /></PublicLayout>} />
        <Route path={ROUTES.printSchedules} element={<PublicLayout><ImpressaoHorarios /></PublicLayout>} />
        <Route path={ROUTES.byRoom} element={<PublicLayout><PorAmbiente /></PublicLayout>} />
        <Route path={ROUTES.byClass} element={<PublicLayout withFilters><PorTurma /></PublicLayout>} />
        <Route path={ROUTES.byProfessor} element={<PublicLayout withFilters><PorProfessor /></PublicLayout>} />

        {/* Rotas de Autenticação (Visitante apenas) */}
        <Route path={ROUTES.adminLogin} element={<GuestRoute><AuthLayout><Login /></AuthLayout></GuestRoute>} />
        <Route path={ROUTES.adminRegister} element={<GuestRoute><AuthLayout><Cadastro /></AuthLayout></GuestRoute>} />

        {/* Rotas Administrativas (Protegidas por JWT) */}
        <Route path={ROUTES.adminDashboard} element={<ProtectedRoute><AdminLayout><Dashboard /></AdminLayout></ProtectedRoute>} />
        <Route path={ROUTES.adminCourses} element={<ProtectedRoute><AdminLayout><Curso /></AdminLayout></ProtectedRoute>} />
        <Route path={ROUTES.adminClasses} element={<ProtectedRoute><AdminLayout><Turma /></AdminLayout></ProtectedRoute>} />
        <Route path={ROUTES.adminSubjects} element={<ProtectedRoute><AdminLayout><Disciplina /></AdminLayout></ProtectedRoute>} />
        <Route path={ROUTES.adminTeachers} element={<ProtectedRoute><AdminLayout><Professor /></AdminLayout></ProtectedRoute>} />
        <Route path={ROUTES.adminRooms} element={<ProtectedRoute><AdminLayout><Ambiente /></AdminLayout></ProtectedRoute>} />
        <Route path={ROUTES.adminSchedules} element={<ProtectedRoute><AdminLayout><Horario /></AdminLayout></ProtectedRoute>} />

        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  )
}