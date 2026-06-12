import { useEffect, useState } from 'react'

export const THEMES = ['heritage', 'midnight', 'floodlight'] as const
export type Theme = (typeof THEMES)[number]

export const THEME_LABELS: Record<Theme, string> = {
  heritage: 'Heritage',
  midnight: 'Midnight',
  floodlight: 'Floodlight',
}

const KEY = 'wc2026.theme'

/** Selected visual theme, applied to <html data-theme> and persisted. */
export function useTheme() {
  const [theme, setTheme] = useState<Theme>(() => {
    const saved = localStorage.getItem(KEY)
    return saved && (THEMES as readonly string[]).includes(saved) ? (saved as Theme) : 'heritage'
  })

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    localStorage.setItem(KEY, theme)
  }, [theme])

  return { theme, setTheme }
}
