export function Logo() {
  return (
    <div className="logo">
      <div className="logo-grid" aria-hidden="true">
        {Array.from({ length: 10 }).map((_, index) => (
          <i key={index} />
        ))}
      </div>
      <div>
        <strong>
          IFPB <span>·</span> Campus Monteiro
        </strong>
        <small>Horário acadêmico 2026.2</small>
      </div>
    </div>
  )
}

export function AdminLogo({ compact = false }: { compact?: boolean }) {
  return (
    <div className={compact ? "admin-brand compact" : "admin-brand"}>
      <div className="admin-logo-mark" aria-hidden="true">
        {Array.from({ length: 10 }).map((_, index) => (
          <i key={index} />
        ))}
      </div>
      <div>
        <strong>IFPB · Campus Monteiro</strong>
        <small>Gestão do horário acadêmico</small>
      </div>
    </div>
  )
}
