// Mirrors the backend's /api/fixtures response shape.

export interface Venue {
  id: string
  stadium: string
  city: string
  country: string
  country_code: string
  capacity: number
  timezone: string
  latitude?: number | null
  longitude?: number | null
}

export interface Team {
  name: string
  code: string | null
  fifa_code: string | null
  placeholder: boolean
  source: string | null
}

export interface Match {
  match_number: number
  stage: string
  group: string | null
  matchday: number | null
  home: Team
  away: Team
  venue_id: string
  kickoff_local: string
  kickoff_utc: string
}

export interface Meta {
  tournament: string
  version: string
  total_matches: number
  default_match_duration_minutes: number
}

export interface FixturesResponse {
  meta: Meta
  venues: Venue[]
  matches: Match[]
}
