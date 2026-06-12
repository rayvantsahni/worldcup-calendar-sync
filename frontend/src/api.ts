import type { FixturesResponse } from './types'

// Served as a static asset (BASE_URL handles subpath deployments).
const DATA_URL = `${import.meta.env.BASE_URL}data/fixtures.json`

export async function fetchFixtures(): Promise<FixturesResponse> {
  const res = await fetch(DATA_URL)
  if (!res.ok) throw new Error(`Failed to load fixtures (${res.status})`)
  return res.json()
}
