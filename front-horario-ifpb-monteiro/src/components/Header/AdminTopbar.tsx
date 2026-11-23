import { AdminIcon } from "@/components/Icon"
import { useLocation } from "react-router-dom"
import { ROUTES } from "@/routes/paths"

type AdminTopbarProps = {
  title: string
  adminName: string
  onOpenMenu: () => void
  onSignOut: () => void
  onEditProfile: () => void
}

export function AdminTopbar({
  title,
  adminName,
  onOpenMenu,
  onEditProfile,
}: AdminTopbarProps) {
  const { pathname } = useLocation()

  const isAcademicCalendarsRoute =
    pathname.startsWith(ROUTES.adminAcademicSchedules) ||
    pathname.includes("calendario")

  const displayTitle = isAcademicCalendarsRoute ? "Calendários Acadêmicos" : title

  return (
    <header
      className={
        displayTitle === "Visão geral" ? "admin-topbar overview-topbar" : "admin-topbar"
      }
    >
      <button
        className="admin-mobile-menu"
        onClick={onOpenMenu}
        aria-label="Abrir menu"
      >
        <AdminIcon name="menu" />
      </button>
      <div>
        <span>ÁREA ADMINISTRATIVA</span>
        {displayTitle !== "Visão geral" && <strong>{displayTitle}</strong>}
      </div>
      <div className="admin-account">
        <span>{adminName.slice(0, 2).toUpperCase()}</span>
        <div>
          <strong>{adminName}</strong>
          <small>Administrador da sessão</small>
        </div>
        <button className="admin-edit-profile" onClick={onEditProfile}>
          <AdminIcon name="edit" size={16} />
          <span>Editar perfil</span>
        </button>
      </div>
    </header>
  )
}