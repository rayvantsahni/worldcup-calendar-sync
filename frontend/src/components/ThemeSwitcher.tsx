import type { CSSProperties } from 'react'
import { THEME_LABELS, THEME_SWATCH, THEMES } from '../hooks/useTheme'
import type { Theme } from '../hooks/useTheme'

interface Props {
  theme: Theme
  onTheme: (t: Theme) => void
}

export function ThemeSwitcher({ theme, onTheme }: Props) {
  return (
    <nav className="theme-switch" aria-label="Theme">
      {THEMES.map((t) => {
        const [a, b] = THEME_SWATCH[t]
        const style = { '--a': a, '--b': b } as CSSProperties
        return (
          <button
            key={t}
            className={`swatch ${theme === t ? 'active' : ''}`}
            onClick={() => onTheme(t)}
            title={THEME_LABELS[t]}
            aria-label={`${THEME_LABELS[t]} theme`}
            aria-pressed={theme === t}
          >
            <span className="swatch-dot" style={style} />
          </button>
        )
      })}
    </nav>
  )
}
