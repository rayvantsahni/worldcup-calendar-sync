import { useState } from 'react'

const REMINDERS: { label: string; value: number | null }[] = [
  { label: 'None', value: null },
  { label: 'At kickoff', value: 0 },
  { label: '15 min', value: 15 },
  { label: '30 min', value: 30 },
  { label: '1 hour', value: 60 },
  { label: '3 hours', value: 180 },
  { label: '1 day', value: 1440 },
]

interface Props {
  count: number
  total: number
  onSelectAll: () => void
  onClear: () => void
  onDownload: (reminderMinutes: number | null) => void
}

export function SelectionBar({ count, total, onSelectAll, onClear, onDownload }: Props) {
  const [open, setOpen] = useState(false)
  const [reminder, setReminder] = useState<number | null>(null)

  const confirm = () => {
    onDownload(reminder)
    setOpen(false)
  }

  return (
    <div className="selbar">
      <div className="selbar-inner">
        <div className="selcount">
          <strong>{count}</strong> selected
        </div>
        <div className="selactions">
          <button className="btn-ghost" onClick={onSelectAll}>
            Select all{total ? ` (${total})` : ''}
          </button>
          <button className="btn-ghost" onClick={onClear} disabled={count === 0}>
            Clear
          </button>

          <div className="dl">
            <button
              className="btn-primary"
              onClick={() => setOpen((o) => !o)}
              disabled={count === 0}
              aria-expanded={open}
            >
              Download .ics{count ? ` (${count})` : ''}
            </button>

            {open && count > 0 && (
              <>
                <div className="dl-backdrop" onClick={() => setOpen(false)} />
                <div className="dl-pop" role="dialog" aria-label="Download options">
                  <div className="dl-head">Remind me before kickoff</div>
                  <div className="dl-opts">
                    {REMINDERS.map((r) => (
                      <button
                        key={r.label}
                        className={`dl-chip ${reminder === r.value ? 'active' : ''}`}
                        onClick={() => setReminder(r.value)}
                      >
                        {r.label}
                      </button>
                    ))}
                  </div>
                  <button className="dl-go" onClick={confirm}>
                    Download .ics ({count})
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
