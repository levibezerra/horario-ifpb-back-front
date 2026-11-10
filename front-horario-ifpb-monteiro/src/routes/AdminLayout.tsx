import { useState, type ReactNode } from "react"
import { AdminTopbar } from "@/components/Header"
import { AdminSidebar, ADMIN_NAV_ITEMS } from "@/components/Sidebar"
import { useAuth } from "@/hooks/useAuth"
import { useLocation, useNavigate } from "react-router-dom"
import { ROUTES } from "@/routes/paths"
import "@/style/admin.css"
import { AdminProfileModal } from "@/components/AdminProfileModal"

export function AdminLayout({ children }: { children: ReactNode }) {
  const { adminName, adminEmail, signOut, updateProfile } = useAuth()
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)

  const title =
    ADMIN_NAV_ITEMS.find((item) =>
      item.end ? pathname === item.to : pathname.startsWith(item.to),
    )?.label ?? "Área administrativa"

  function handleSignOut() {
    signOut()
    navigate(ROUTES.adminLogin)
  }

  return (
    <div className="admin-root admin-shell">
      <AdminSidebar
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        onSignOut={handleSignOut}
      />
      <div className="admin-main">
        <AdminTopbar
          title={title}
          adminName={adminName ?? "Administrador"}
          onOpenMenu={() => setMenuOpen(true)}
          onSignOut={handleSignOut}
          onEditProfile={() => setProfileOpen(true)}
        />
        <main className="admin-content">{children}</main>
      </div>
      {profileOpen && (
        <AdminProfileModal
          name={adminName ?? "Administrador"}
          email={adminEmail}
          onClose={() => setProfileOpen(false)}
          onSave={updateProfile}
        />
      )}
    </div>
  )
}