import { useEffect, useState } from "react"
import { Icon, type IconName } from "@/components/Icon"
import { NavLink } from "react-router-dom"
import { ROUTES } from "@/routes/paths"
import { Logo } from "./Logo"
import { api } from "@/services/api"
import { API_ENDPOINTS } from "@/services/api-support/endpoints"
import type { HorarioDTO } from "@/types/api"

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
  const [lastUpdateText, setLastUpdateText] = useState<string>("Buscando atualizações...")

  useEffect(() => {
    async function loadLastUpdate() {
      try {
        const res = await api.get<HorarioDTO[]>(API_ENDPOINTS.horarios)
        const publicados = res.data.filter((h) => h.status === "PUBLICADO")

        if (publicados.length > 0) {
          // Encontra a maior/última data de atualização
          const datas = publicados
            .map((h) => h.dataAtualizacao)
            .filter(Boolean)
            .map((d) => new Date(d!).getTime())

          if (datas.length > 0) {
            const maxDate = new Date(Math.max(...datas))
            const formattedDate = maxDate.toLocaleDateString("pt-BR", {
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
            })
            const formattedTime = maxDate.toLocaleTimeString("pt-BR", {
              hour: "2-digit",
              minute: "2-digit",
            })
            setLastUpdateText(`Atualizado em ${formattedDate} às ${formattedTime}`)
            return
          }
        }
        setLastUpdateText("Sistema de Horários IFPB")
      } catch {
        setLastUpdateText("Sistema de Horários IFPB")
      }
    }

    loadLastUpdate()
  }, [])

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
          <small>{lastUpdateText}</small>
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