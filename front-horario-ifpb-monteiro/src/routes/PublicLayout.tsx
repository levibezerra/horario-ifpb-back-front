import type { ReactNode } from "react"
import { Header } from "@/components/Header"
import { FilterPanelProvider, useFilterPanel } from "@/hooks/useFilterPanel"
import "@/style/public.css"

function PublicShell({
  withFilters,
  children,
}: {
  withFilters: boolean
  children: ReactNode
}) {
  const panel = useFilterPanel()
  return (
    <div className="app-shell">
      <Header
        showFilterButton={withFilters}
        onOpenFilters={() => panel.setOpen(true)}
      />
      {children}
    </div>
  )
}

export function PublicLayout({
  withFilters = false,
  children,
}: {
  withFilters?: boolean
  children: ReactNode
}) {
  return (
    <FilterPanelProvider>
      <PublicShell withFilters={withFilters}>{children}</PublicShell>
    </FilterPanelProvider>
  )
}