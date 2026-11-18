import { Icon } from "@/components/Icon"
import type { ReactNode } from "react"
import type { ViewMode } from "@/types/api"
import { initials } from "@/services/scheduleService"

export type FilterGroup = {
  section?: string
  group: string
  caption?: string
  items: Array<{ id: string; label: string }>
}

type FilterSidebarProps = {
  mode: ViewMode
  groups: FilterGroup[]
  selected: string
  onSelect: (item: string) => void
  query: string
  onQueryChange: (query: string) => void
  open: boolean
  onClose: () => void
  topContent?: ReactNode
}

export function FilterSidebar({
  mode,
  groups,
  selected,
  onSelect,
  query,
  onQueryChange,
  open,
  onClose,
  topContent,
}: FilterSidebarProps) {
  const total = groups.reduce((sum, group) => sum + group.items.length, 0)

  return (
    <>
      {open && (
        <button className="overlay" onClick={onClose} aria-label="Fechar filtros" />
      )}
      <aside className={open ? "filter-panel open" : "filter-panel"}>
        <div className="filter-heading">
          <div>
            <p>CONSULTAR POR</p>
            <h2>{mode === "class" ? "Turmas" : mode === "teacher" ? "Professores" : "Ambientes"}</h2>
          </div>
          <button onClick={onClose} aria-label="Fechar">
            <Icon name="x" />
          </button>
        </div>
        {topContent}
        <label className="search-field">
          <Icon name="search" size={18} />
          <input
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder={`Buscar ${mode === "class" ? "turma" : mode === "teacher" ? "professor" : "ambiente"}...`}
          />
          {query && (
            <button onClick={() => onQueryChange("")} aria-label="Limpar busca">
              <Icon name="x" size={16} />
            </button>
          )}
        </label>
        <div className="result-count">
          <span>{total} resultados</span>
          {query && <button onClick={() => onQueryChange("")}>Limpar filtro</button>}
        </div>
        <div className="group-list">
          {groups.map((group, index) => {
            const showSectionHeader =
              Boolean(group.section) &&
              (index === 0 || groups[index - 1]?.section !== group.section)

            return (
              <section key={`${group.section ?? "default"}-${group.group}`}>
                {showSectionHeader && (
                  <div
                    className="modality-section-title"
                    style={{
                      fontSize: "0.78rem",
                      fontWeight: 700,
                      textTransform: "uppercase",
                      letterSpacing: "0.06em",
                      color: "#2f9e41",
                      padding: index === 0 ? "8px 4px 6px" : "4px 6px",
                      paddingTop: "7px",
                      borderBottom: "1px solid rgba(15, 23, 42, 0.08)",
                      borderTop: "1px solid rgba(15, 23, 42, 0.08)",
                      marginBottom: "8px",
                    }}
                  >
                    {group.section}
                  </div>
                )}

                <div className="group-title">
                  <div>
                    <strong>{group.group}</strong>
                    {group.caption && <small>{group.caption}</small>}
                  </div>
                  <span>{group.items.length}</span>
                </div>
                {group.items.map((item) => (
                  <button
                    key={item.id}
                    className={item.id === selected ? "filter-item selected" : "filter-item"}
                    onClick={() => {
                      onSelect(item.id)
                      onClose()
                    }}
                  >
                    {mode === "teacher" ? (
                      <span className="avatar">{initials(item.label)}</span>
                    ) : (
                      <span className="radio"><i /></span>
                    )}
                    <span>
                      <strong>{item.label}</strong>
                      <small>{mode === "class" ? group.caption : group.group}</small>
                    </span>
                    {item.id === selected && <Icon name="chevron" size={17} />}
                  </button>
                ))}
              </section>
            )
          })}
          {total === 0 && (
            <div className="no-results">
              <Icon name="search" />
              <strong>{mode === "room" ? "Nenhum ambiente cadastrado" : "Nenhum resultado"}</strong>
              <span>{mode === "room" ? "Não existem ambientes nesta categoria." : "Tente outro termo de busca."}</span>
            </div>
          )}
        </div>
      </aside>
    </>
  )
}