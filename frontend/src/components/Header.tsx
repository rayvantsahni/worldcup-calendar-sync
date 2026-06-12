import type { Meta } from '../types'
import { Emblem } from './Emblem'
import { ThemeSwitcher } from './ThemeSwitcher'
import { Onboarding } from './Onboarding'
import type { Theme } from '../hooks/useTheme'

type View = 'list' | 'calendar'

interface Props {
  view: View
  onView: (v: View) => void
  theme: Theme
  onTheme: (t: Theme) => void
  meta?: Meta
}

export function Header({ view, onView, theme, onTheme }: Props) {
  return (
    <header className="masthead">
      <div className="masthead-inner">
        <div className="brand">
          <span className="emblem">
            <Emblem />
          </span>
          <div className="brand-text">
            <h1>
              FIFA World Cup <span className="year">2026</span>
            </h1>
            <p className="hosts">United States · Canada · Mexico</p>
          </div>
        </div>

        <div className="masthead-controls">
          <div className="control-group">
            <span className="control-label">View</span>
            <nav className="view-toggle" aria-label="View">
              <button className={view === 'list' ? 'active' : ''} onClick={() => onView('list')}>
                List
              </button>
              <button
                className={view === 'calendar' ? 'active' : ''}
                onClick={() => onView('calendar')}
              >
                Calendar
              </button>
            </nav>
          </div>
          <div className="control-group">
            <span className="control-label">Theme</span>
            <ThemeSwitcher theme={theme} onTheme={onTheme} />
          </div>
          <Onboarding />
        </div>
      </div>
    </header>
  )
}
