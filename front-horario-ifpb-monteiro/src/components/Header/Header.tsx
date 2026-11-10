import { Icon, type IconName } from "@/components/Icon"
import { NavLink } from "react-router-dom"
import { ROUTES } from "@/routes/paths"
import { Logo } from "./Logo"

const NAV_ITEMS: { to: string; icon: IconName; label: string; end?: boolean }[] = [
  { to: ROUTES.home, icon: "home", label: "Início", end: true },
  { to: ROUTES.byClass, icon: "users", label: "Por turma" },
  { to: ROUTES.byProfessor, icon: "teacher", label: "Por professor" },
  { to: ROUTES.byRoom, icon: "room", label: "Por ambiente" },
]

type HeaderProps = {
  showFilterButton?: boolean
  onOpenFilters?: () => void
}

export function Header({ showFilterButton, onOpenFilters }: HeaderProps) {
  return (
    <header className="app-header">
      <Logo />
      <div className="hero-copy">
        <span>CONSULTA ACADÊMICA</span>
        <strong>Encontre seu próximo horário.</strong>
      </div>
      <nav className="mode-switcher" aria-label="Modo de visualização">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) => (isActive ? "mode active" : "mode")}
          >
            <Icon name={item.icon} size={18} />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
      <div className="header-actions">
        <NavLink to={ROUTES.adminLogin} className="admin-entry">
          <Icon name="teacher" size={17} />
          <span>Área administrativa</span>
        </NavLink>
        <div className="header-status">
          <i />
          <span>Fonte conectada à API</span>
          <small>Sistema de Horários IFPB</small>
        </div>
      </div>
      {showFilterButton && (
        <button
          className="mobile-filter"
          onClick={onOpenFilters}
          aria-label="Abrir filtros"
        >
          <Icon name="menu" />
        </button>
      )}
    </header>
  )
}