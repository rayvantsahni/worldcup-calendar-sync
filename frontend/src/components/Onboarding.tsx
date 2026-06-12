import { useState } from 'react'

const KEY = 'wc2026.onboarded'

/** First-visit hint pointing at the View and Theme controls. Dismiss persists. */
export function Onboarding() {
  const [show, setShow] = useState(() => !localStorage.getItem(KEY))
  if (!show) return null

  const close = () => {
    localStorage.setItem(KEY, '1')
    setShow(false)
  }

  return (
    <div className="onboard" role="dialog" aria-label="Tips">
      <button className="onboard-close" onClick={close} aria-label="Dismiss">
        ×
      </button>
      <p className="onboard-line">
        <span className="onboard-dot" /> Try different <strong>Views</strong>
      </p>
      <p className="onboard-line">
        <span className="onboard-dot" /> Try different <strong>Themes</strong>
      </p>
    </div>
  )
}
