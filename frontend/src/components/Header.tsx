import type { Meta } from '../types'
import { ThemeSwitcher } from './ThemeSwitcher'
import { Onboarding } from './Onboarding'
import { HowItWorks } from './HowItWorks'
import type { Theme } from '../hooks/useTheme'

type View = 'list' | 'calendar'

interface Props {
  view: View
  onView: (v: View) => void
  theme: Theme
  onTheme: (t: Theme) => void
  meta?: Meta
}

function formatUpdated(iso: string): string {
  const d = new Date(iso)
  const diffMs = Date.now() - d.getTime()
  const diffMin = Math.floor(diffMs / 60_000)
  if (diffMin < 60) return `${diffMin}m ago`
  const diffHr = Math.floor(diffMin / 60)
  if (diffHr < 24) return `${diffHr}h ago`
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

export function Header({ view, onView, theme, onTheme, meta }: Props) {
  return (
    <header className="masthead">
      <div className="masthead-inner">
        <div className="brand">
          <span className="emblem">
            <img
              className="logo-img"
              src={`${import.meta.env.BASE_URL}logo.webp`}
              alt="World Cup 2026"
            />
          </span>
          <div className="brand-text">
            <h1>
              FIFA World Cup <span className="year">2026</span>
            </h1>
            <p className="tagline">Build your personal matchday calendar</p>
            {meta?.generated_at && (
              <p className="data-updated">Data updated {formatUpdated(meta.generated_at)}</p>
            )}
            <HowItWorks />
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
