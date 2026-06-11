import { useEffect, useMemo, useState } from 'react'
import { downloadIcs, fetchFixtures } from './api'
import { useSelection } from './hooks/useSelection'
import type { FixturesResponse, Match, Venue } from './types'
import { Header } from './components/Header'
import { MatchCard } from './components/MatchCard'
import { SelectionBar } from './components/SelectionBar'
import { CalendarView } from './components/CalendarView'
import { localDateKey, localDateLabel } from './utils/format'

type View = 'list' | 'calendar'

interface DateGroup {
  key: string
  label: string
  matches: Match[]
}

export default function App() {
  const [data, setData] = useState<FixturesResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [view, setView] = useState<View>('list')
  const [downloading, setDownloading] = useState(false)
  const { selected, toggle, selectAll, clear } = useSelection()

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

  const groups = useMemo<DateGroup[]>(() => {
    if (!data) return []
    const sorted = [...data.matches].sort((a, b) => a.kickoff_utc.localeCompare(b.kickoff_utc))
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
  }, [data])

  const allNums = useMemo(() => data?.matches.map((m) => m.match_number) ?? [], [data])

  async function handleDownload() {
    setDownloading(true)
    try {
      await downloadIcs([...selected])
    } catch {
      alert('Could not generate the calendar. Make sure the backend is running on :8000.')
    } finally {
      setDownloading(false)
    }
  }

  if (error) {
    return (
      <div className="app">
        <Header view={view} onView={setView} />
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
        <Header view={view} onView={setView} />
        <main className="content">
          <p className="state-msg">Loading fixtures…</p>
        </main>
      </div>
    )
  }

  return (
    <div className="app">
      <Header view={view} onView={setView} meta={data.meta} />

      <main className="content">
        {view === 'calendar' ? (
          <CalendarView
            matches={data.matches}
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
        downloading={downloading}
      />
    </div>
  )
}
