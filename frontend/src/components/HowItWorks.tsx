import { useEffect, useState } from 'react'

export function HowItWorks() {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  return (
    <>
      <button className="how-link" onClick={() => setOpen(true)}>
        How it works
      </button>

      {open && (
        <div className="modal-backdrop" onClick={() => setOpen(false)}>
          <div
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-label="How it works"
            onClick={(e) => e.stopPropagation()}
          >
            <button className="modal-close" onClick={() => setOpen(false)} aria-label="Close">
              ×
            </button>
            <h2 className="modal-title">How it works</h2>
            <ol className="how-steps">
              <li>
                <strong>Browse</strong> every fixture as a chronological list or a monthly calendar.
              </li>
              <li>
                <strong>Filter</strong> by team, group, stage, stadium, or day to find the matches
                you care about.
              </li>
              <li>
                <strong>Select</strong> matches by tapping them, or use Select all / Clear.
              </li>
              <li>
                <strong>Download</strong> your picks as a single calendar file (.ics).
              </li>
              <li>
                <strong>Import</strong> it into Google, Apple, or Outlook Calendar. Each event
                carries the teams, stage, venue, and kickoff in your local time.
              </li>
            </ol>
            <p className="how-foot">No sign-in, no account linking. Just a file you own.</p>
          </div>
        </div>
      )}
    </>
  )
}
