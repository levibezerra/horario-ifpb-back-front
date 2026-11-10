import { AdminIcon, type AdminIconName } from "@/components/Icon"
import { AdminLogo } from "@/components/Header"
import { Link, NavLink } from "react-router-dom"
import { ROUTES } from "@/routes/paths"

export const ADMIN_NAV_ITEMS: {
  to: string
  icon: AdminIconName
  label: string
  end?: boolean
}[] = [
  { to: ROUTES.adminDashboard, icon: "home", label: "Visão geral", end: true },
  { to: ROUTES.adminCourses, icon: "courses", label: "Cursos" },
  { to: ROUTES.adminClasses, icon: "classes", label: "Turmas" },
  { to: ROUTES.adminSubjects, icon: "subjects", label: "Disciplinas" },
  { to: ROUTES.adminTeachers, icon: "teachers", label: "Professores" },
  { to: ROUTES.adminRooms, icon: "rooms", label: "Ambientes" },
  { to: ROUTES.adminSchedules, icon: "schedules", label: "Horários" },
]

type AdminSidebarProps = {
  open: boolean
  onClose: () => void
  onSignOut: () => void
}

export function AdminSidebar({ open, onClose, onSignOut }: AdminSidebarProps) {
  return (
    <>
      <aside className={open ? "admin-sidebar open" : "admin-sidebar"}>
        <div className="sidebar-brand">
          <AdminLogo compact />
          <button onClick={onClose}>
            <AdminIcon name="close" size={19} />
          </button>
        </div>
        <nav>
          <span>GERENCIAMENTO</span>
          {ADMIN_NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => (isActive ? "active" : "")}
              onClick={onClose}
            >
              <AdminIcon name={item.icon} size={19} />
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-footer">
          <Link to={ROUTES.home}>
            <AdminIcon name="arrow" size={18} />
            Consulta pública
          </Link>
          <button onClick={onSignOut}>
            <AdminIcon name="logout" size={18} />
            Sair da conta
          </button>
        </div>
      </aside>

      {open && (
        <button
          className="admin-nav-overlay"
          onClick={onClose}
          aria-label="Fechar menu"
        />
      )}
    </>
  )
}