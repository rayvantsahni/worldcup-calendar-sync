import { THEME_LABELS, THEMES } from '../hooks/useTheme'
import type { Theme } from '../hooks/useTheme'

interface Props {
  theme: Theme
  onTheme: (t: Theme) => void
}

export function ThemeSwitcher({ theme, onTheme }: Props) {
  return (
    <nav className="theme-switch" aria-label="Theme">
      {THEMES.map((t) => (
        <button key={t} className={theme === t ? 'active' : ''} onClick={() => onTheme(t)}>
          {THEME_LABELS[t]}
        </button>
      ))}
    </nav>
  )
}
