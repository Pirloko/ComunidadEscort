import { useEffect, type ReactNode } from 'react'

/** La app usa solo modo oscuro; no hay toggle ni tema claro. */
export function ThemeProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    const root = document.documentElement
    root.classList.add('dark')
    localStorage.setItem('theme', 'dark')
  }, [])

  return children
}
