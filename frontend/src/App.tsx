import { useEffect, useMemo, useState } from 'react'
import { fetchFixtures } from './api'
import { buildIcs, downloadIcs } from './ics'
import { useSelection } from './hooks/useSelection'
import { useNow } from './hooks/useNow'
import { useTheme } from './hooks/useTheme'
import type { FixturesResponse, Match, Venue } from './types'
import { Header } from './components/Header'
import { MatchCard } from './components/MatchCard'
import { SelectionBar } from './components/SelectionBar'
import { CalendarView } from './components/CalendarView'
import { EMPTY_FILTERS, FilterBar } from './components/FilterBar'
import type { FilterOptions, Filters } from './components/FilterBar'
import { localDateKey, localDateLabel } from './utils/format'

type View = 'list' | 'calendar'

const STAGE_ORDER = [
  'Group Stage',
  'Round of 32',
  'Round of 16',
  'Quarter-final',
  'Semi-final',
  'Third-place Play-off',
  'Final',
]
const WEEKDAY_LABELS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

interface DateGroup {
  key: string
  label: string
  matches: Match[]
}

export default function App() {
  const [data, setData] = useState<FixturesResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [view, setView] = useState<View>('list')
  const { selected, toggle, selectAll, clear } = useSelection()
  const now = useNow()
  const durationMin = data?.meta.default_match_duration_minutes ?? 105
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS)
  const { theme, setTheme } = useTheme()

  useEffect(() => {
    fetchFixtures()
      .then(setData)
      .catch((e) => setError(e?.message ?? String(e)))
  }, [])

  const venueMap = useMemo(() => {
    const m = new Map<string, Venue>()
    data?.venues.forEach((v) => m.set(v.id, v))
    return m
  }, [data])

  const filterOptions = useMemo<FilterOptions>(() => {
    if (!data) return { teams: [], groups: [], stages: [], venues: [], weekdays: [] }
    const teams = new Set<string>()
    const groupSet = new Set<string>()
    const stageSet = new Set<string>()
    for (const m of data.matches) {
      if (!m.home.placeholder) teams.add(m.home.name)
      if (!m.away.placeholder) teams.add(m.away.name)
      if (m.group) groupSet.add(m.group)
      stageSet.add(m.stage)
    }
    return {
      teams: [...teams].sort(),
      groups: [...groupSet].sort(),
      stages: STAGE_ORDER.filter((s) => stageSet.has(s)),
      venues: [...data.venues]
        .map((v) => ({ id: v.id, label: `${v.stadium} · ${v.city}` }))
        .sort((a, b) => a.label.localeCompare(b.label)),
      weekdays: WEEKDAY_LABELS.map((label, value) => ({ value, label })),
    }
  }, [data])

  const filteredMatches = useMemo<Match[]>(() => {
    if (!data) return []
    return data.matches.filter((m) => {
      if (filters.team && m.home.name !== filters.team && m.away.name !== filters.team) return false
      if (filters.group && m.group !== filters.group) return false
      if (filters.stage && m.stage !== filters.stage) return false
      if (filters.venueId && m.venue_id !== filters.venueId) return false
      if (filters.weekday !== '' && new Date(m.kickoff_utc).getDay() !== Number(filters.weekday))
        return false
      return true
    })
  }, [data, filters])

  const groups = useMemo<DateGroup[]>(() => {
    const sorted = [...filteredMatches].sort((a, b) => a.kickoff_utc.localeCompare(b.kickoff_utc))
    const byDate = new Map<string, Match[]>()
    for (const m of sorted) {
      const key = localDateKey(m.kickoff_utc)
      const bucket = byDate.get(key)
      if (bucket) bucket.push(m)
      else byDate.set(key, [m])
    }
    return [...byDate.entries()].map(([key, matches]) => ({
      key,
      label: localDateLabel(matches[0].kickoff_utc),
      matches,
    }))
  }, [filteredMatches])

  const allNums = useMemo(() => filteredMatches.map((m) => m.match_number), [filteredMatches])

  function handleDownload(reminderMinutes: number | null) {
    if (!data) return
    const chosen = data.matches.filter((m) => selected.has(m.match_number))
    if (chosen.length === 0) return
    const ics = buildIcs(chosen, venueMap, data.meta.default_match_duration_minutes, reminderMinutes)
    downloadIcs('worldcup-2026.ics', ics)
  }

  if (error) {
    return (
      <div className="app">
        <Header view={view} onView={setView} theme={theme} onTheme={setTheme} />
        <main className="content">
          <p className="state-msg state-msg--error">
            {error}
            <br />
            <span>
              Make sure the backend is running: <code>uvicorn app.main:app --reload</code>
            </span>
          </p>
        </main>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="app">
        <Header view={view} onView={setView} theme={theme} onTheme={setTheme} />
        <main className="content">
          <p className="state-msg">Loading fixtures…</p>
        </main>
      </div>
    )
  }

  return (
    <div className="app">
      <Header view={view} onView={setView} theme={theme} onTheme={setTheme} meta={data.meta} />

      <main className="content">
        <FilterBar
          options={filterOptions}
          value={filters}
          onChange={setFilters}
          resultCount={filteredMatches.length}
          totalCount={data.matches.length}
        />

        {filteredMatches.length === 0 ? (
          <p className="state-msg">No matches fit these filters.</p>
        ) : view === 'calendar' ? (
          <CalendarView
            matches={filteredMatches}
            venues={venueMap}
            selected={selected}
            onToggle={toggle}
          />
        ) : (
          groups.map((g) => (
            <section key={g.key} className="date-group">
              <div className="date-head">
                <h2>{g.label}</h2>
                <span className="rule" />
              </div>
              <div className="cards">
                {g.matches.map((m) => (
                  <MatchCard
                    key={m.match_number}
                    match={m}
                    venue={venueMap.get(m.venue_id)}
                    selected={selected.has(m.match_number)}
                    onToggle={() => toggle(m.match_number)}
                    now={now}
                    durationMin={durationMin}
                  />
                ))}
              </div>
            </section>
          ))
        )}
      </main>

      <SelectionBar
        count={selected.size}
        total={allNums.length}
        onSelectAll={() => selectAll(allNums)}
        onClear={clear}
        onDownload={handleDownload}
      />
    </div>
  )
}
