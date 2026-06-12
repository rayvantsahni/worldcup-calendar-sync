import type { Match, Venue } from '../types'
import { Flag } from './Flag'
import { localTime, stageChip, tzAbbr } from '../utils/format'

interface Props {
  match: Match
  venue?: Venue
  selected: boolean
  onToggle: () => void
  now: number
  durationMin: number
}

export function MatchCard({ match, venue, selected, onToggle, now, durationMin }: Props) {
  const chip = stageChip(match)

  const start = Date.parse(match.kickoff_utc)
  const isLive = now >= start && now < start + durationMin * 60_000

  return (
    <button
      type="button"
      className={`card ${selected ? 'card--selected' : ''} ${isLive ? 'card--live' : ''}`}
      onClick={onToggle}
      aria-pressed={selected}
    >
      <div className="card-top">
        <span className={`chip chip--${chip.kind}`}>{chip.text}</span>
        <div className="card-top-right">
          {isLive && (
            <span className="live-badge">
              <span className="live-dot" />
              LIVE
            </span>
          )}
          <span className="check" aria-hidden="true">
            {selected ? '✓' : ''}
          </span>
        </div>
      </div>

      <div className="matchup">
        <div className="teams-stack">
          <div className="team">
            <Flag team={match.home} />
            <span className="team-name">{match.home.name}</span>
          </div>
          <div className="team">
            <Flag team={match.away} />
            <span className="team-name">{match.away.name}</span>
          </div>
        </div>

        <div className="kick">
          <span className="kick-time">{localTime(match.kickoff_utc)}</span>
          <span className="kick-tz">{tzAbbr(match.kickoff_utc)}</span>
        </div>
      </div>

      <div className="venue">{venue ? `${venue.stadium} · ${venue.city}` : '—'}</div>
    </button>
  )
}
