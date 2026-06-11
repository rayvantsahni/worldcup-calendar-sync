import { useMemo } from 'react'
import type { Match, Venue } from '../types'
import { Flag } from './Flag'
import { localDateKey, localTime } from '../utils/format'

interface Props {
  matches: Match[]
  venues: Map<string, Venue>
  selected: Set<number>
  onToggle: (n: number) => void
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const pad = (n: number) => String(n).padStart(2, '0')

interface MonthBlock {
  year: number
  month: number // 0-based
  label: string
}

export function CalendarView({ matches, venues, selected, onToggle }: Props) {
  const byDate = useMemo(() => {
    const map = new Map<string, Match[]>()
    for (const m of matches) {
      const key = localDateKey(m.kickoff_utc)
      const bucket = map.get(key)
      if (bucket) bucket.push(m)
      else map.set(key, [m])
    }
    for (const list of map.values()) {
      list.sort((a, b) => a.kickoff_utc.localeCompare(b.kickoff_utc))
    }
    return map
  }, [matches])

  const months = useMemo<MonthBlock[]>(() => {
    const keys = [...byDate.keys()].sort()
    if (keys.length === 0) return []
    const [fy, fm] = keys[0].split('-').map(Number)
    const [ly, lm] = keys[keys.length - 1].split('-').map(Number)
    const blocks: MonthBlock[] = []
    let y = fy
    let m = fm - 1
    while (y < ly || (y === ly && m <= lm - 1)) {
      blocks.push({
        year: y,
        month: m,
        label: new Date(y, m, 1).toLocaleString(undefined, { month: 'long', year: 'numeric' }),
      })
      m += 1
      if (m > 11) {
        m = 0
        y += 1
      }
    }
    return blocks
  }, [byDate])

  const todayKey = localDateKey(new Date().toISOString())

  if (months.length === 0) {
    return <p className="state-msg">No fixtures to show.</p>
  }

  return (
    <div className="cal-scroll">
      {months.map((block) => {
        const startWeekday = new Date(block.year, block.month, 1).getDay()
        const daysInMonth = new Date(block.year, block.month + 1, 0).getDate()
        const cells: (number | null)[] = [
          ...Array(startWeekday).fill(null),
          ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
        ]

        return (
          <section key={block.label} className="cal-month">
            <h2 className="cal-month-title">{block.label}</h2>
            <div className="cal-grid">
              {WEEKDAYS.map((d) => (
                <div key={d} className="cal-weekday">
                  {d}
                </div>
              ))}

              {cells.map((day, idx) => {
                if (day === null) {
                  return <div key={`e-${idx}`} className="cal-cell cal-cell--empty" />
                }
                const key = `${block.year}-${pad(block.month + 1)}-${pad(day)}`
                const dayMatches = byDate.get(key) ?? []
                const classes = [
                  'cal-cell',
                  dayMatches.length ? 'cal-cell--has' : '',
                  key === todayKey ? 'cal-cell--today' : '',
                ]
                  .filter(Boolean)
                  .join(' ')

                return (
                  <div key={key} className={classes}>
                    <span className="cal-daynum">{day}</span>
                    {dayMatches.map((m) => (
                      <button
                        key={m.match_number}
                        type="button"
                        className={`cal-chip ${selected.has(m.match_number) ? 'sel' : ''}`}
                        onClick={() => onToggle(m.match_number)}
                        aria-pressed={selected.has(m.match_number)}
                        title={`${m.home.name} vs ${m.away.name} · ${venues.get(m.venue_id)?.city ?? ''}`}
                      >
                        <span className="cal-chip-flags">
                          <Flag team={m.home} />
                          <Flag team={m.away} />
                        </span>
                        <span className="cal-chip-time">{localTime(m.kickoff_utc)}</span>
                      </button>
                    ))}
                  </div>
                )
              })}
            </div>
          </section>
        )
      })}
    </div>
  )
}
