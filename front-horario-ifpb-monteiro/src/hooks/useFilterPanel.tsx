import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react"
import { useLocation } from "react-router-dom"

type FilterPanelValue = { open: boolean; setOpen: (open: boolean) => void }

const FilterPanelContext = createContext<FilterPanelValue | null>(null)

export function FilterPanelProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false)
  const { pathname } = useLocation()

  useEffect(() => setOpen(false), [pathname])

  return (
    <FilterPanelContext.Provider value={{ open, setOpen }}>
      {children}
    </FilterPanelContext.Provider>
  )
}

export function useFilterPanel() {
  const context = useContext(FilterPanelContext)
  if (!context) {
    throw new Error("useFilterPanel deve ser utilizado dentro de <FilterPanelProvider>.")
  }
  return context
}