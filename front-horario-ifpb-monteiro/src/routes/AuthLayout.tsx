import type { ReactNode } from "react"
import { AdminIcon } from "@/components/Icon"
import { AdminLogo } from "@/components/Header"
import { Link } from "react-router-dom"
import { ROUTES } from "@/routes/paths"
import "@/style/admin.css"

export function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="admin-root">
      <Link to={ROUTES.home} className="back-public auth-back-public">
        <AdminIcon name="arrow" size={17} />
        Voltar à consulta pública
      </Link>
      <main className="admin-auth">
        <section className="auth-visual">
          <AdminLogo />
          <div>
            <span>ÁREA RESTRITA</span>
            <h1>Organize a rotina acadêmica em um só lugar.</h1>
            <p>
              Gerencie turmas, professores, disciplinas, ambientes e horários
              preservando a consulta pública dos estudantes.
            </p>
          </div>
          <small>Sistema Gestor de Horários IFPB</small>
        </section>

        <section className="auth-panel">
          <div className="auth-card">
            <div className="auth-mobile-brand">
              <AdminLogo compact />
            </div>
            {children}
          </div>
        </section>
      </main>
    </div>
  )
}