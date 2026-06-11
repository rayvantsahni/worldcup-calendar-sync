import type { FixturesResponse } from './types'

const BASE = '/api'

export async function fetchFixtures(): Promise<FixturesResponse> {
  const res = await fetch(`${BASE}/fixtures`)
  if (!res.ok) throw new Error(`Failed to load fixtures (${res.status})`)
  return res.json()
}

/** Requests the .ics from the backend and triggers a browser download. */
export async function downloadIcs(matchNumbers: number[]): Promise<void> {
  const res = await fetch(`${BASE}/calendar/ics`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ match_numbers: matchNumbers }),
  })
  if (!res.ok) throw new Error(`Failed to generate calendar (${res.status})`)

  const blob = await res.blob()
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'worldcup-2026.ics'
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}
