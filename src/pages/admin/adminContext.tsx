import { createContext, useContext } from 'react'

export interface AdminUI {
  openSettings: () => void
  openSearch: () => void
}

export const AdminUIContext = createContext<AdminUI | null>(null)

export function useAdminUI(): AdminUI {
  const ctx = useContext(AdminUIContext)
  if (!ctx) throw new Error('useAdminUI debe usarse dentro de AdminLayout')
  return ctx
}
