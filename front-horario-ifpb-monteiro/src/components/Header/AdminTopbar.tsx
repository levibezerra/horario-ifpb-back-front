import { AdminIcon } from "@/components/Icon"

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
  onSignOut,
  onEditProfile,
}: AdminTopbarProps) {
  return (
    <header className={title === "Visão geral" ? "admin-topbar overview-topbar" : "admin-topbar"}>
      <button
        className="admin-mobile-menu"
        onClick={onOpenMenu}
        aria-label="Abrir menu"
      >
        <AdminIcon name="menu" />
      </button>
      <div>
        <span>ÁREA ADMINISTRATIVA</span>
        {title !== "Visão geral" && <strong>{title}</strong>}
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
        <button onClick={onSignOut} aria-label="Sair da conta">
          <AdminIcon name="logout" size={18} />
        </button>
      </div>
    </header>
  )
}
