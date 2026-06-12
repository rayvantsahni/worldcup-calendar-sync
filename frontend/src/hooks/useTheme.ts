import { useEffect, useState } from 'react'

export const THEMES = ['heritage', 'floodlight', 'pop'] as const
export type Theme = (typeof THEMES)[number]

export const THEME_LABELS: Record<Theme, string> = {
  heritage: 'Heritage',
  floodlight: 'Floodlight',
  pop: 'Pop',
}

// Two representative colors per theme, used for the switcher's swatch dots.
export const THEME_SWATCH: Record<Theme, [string, string]> = {
  heritage: ['#1e5b3e', '#c8a24b'],
  floodlight: ['#e8412b', '#ffd23f'],
  pop: ['#2b4bf2', '#c6f035'],
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
