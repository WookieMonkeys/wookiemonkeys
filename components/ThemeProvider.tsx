'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'

type Theme = 'dark' | 'light'

interface ThemeContextValue {
  theme: Theme
  toggle: () => void
}

const ThemeContext = createContext<ThemeContextValue>({ theme: 'dark', toggle: () => {} })

export function useTheme() {
  return useContext(ThemeContext)
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>('dark')

  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const apply = (dark: boolean) => {
      const t: Theme = dark ? 'dark' : 'light'
      setTheme(t)
      document.documentElement.setAttribute('data-theme', t)
    }
    apply(mq.matches)
    mq.addEventListener('change', (e) => apply(e.matches))
    return () => mq.removeEventListener('change', (e) => apply(e.matches))
  }, [])

  const toggle = () => {}

  return (
    <ThemeContext.Provider value={{ theme, toggle }}>
      {children}
    </ThemeContext.Provider>
  )
}
