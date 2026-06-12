import type { Match, Team, Venue } from './types'

// Emoji for UK home nations (Unicode subdivision tag sequences).
const SUBDIVISION_FLAGS: Record<string, string> = {
  'gb-eng': '\u{1F3F4}\u{E0067}\u{E0062}\u{E0065}\u{E006E}\u{E0067}\u{E007F}',
  'gb-sct': '\u{1F3F4}\u{E0067}\u{E0062}\u{E0073}\u{E0063}\u{E0074}\u{E007F}',
  'gb-wls': '\u{1F3F4}\u{E0067}\u{E0062}\u{E0077}\u{E006C}\u{E0073}\u{E007F}',
}

function flagEmoji(team: Team): string {
  const code = team.code
  if (!code) return ''
  if (SUBDIVISION_FLAGS[code]) return SUBDIVISION_FLAGS[code]
  if (/^[a-z]{2}$/i.test(code)) {
    return [...code.toLowerCase()]
      .map((c) => String.fromCodePoint(0x1f1e6 + c.charCodeAt(0) - 97))
      .join('')
  }
  return ''
}

function teamLabel(team: Team): string {
  const emoji = flagEmoji(team)
  return emoji ? `${emoji} ${team.name}` : team.name
}

function eventSummary(m: Match): string {
  return `${m.stage}: ${teamLabel(m.home)} vs ${teamLabel(m.away)}`
}

function stageLine(m: Match): string {
  if (m.group) {
    let line = `${m.stage} - Group ${m.group}`
    if (m.matchday) line += ` (Matchday ${m.matchday})`
    return line
  }
  return m.stage
}

/** Venue wall-clock kickoff, e.g. "Thu 11 Jun 2026, 13:00". */
function localKickoffLabel(m: Match): string {
  // kickoff_local is naive venue time; read it as UTC so components don't shift.
  const d = new Date(`${m.kickoff_local}Z`)
  return new Intl.DateTimeFormat('en-GB', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'UTC',
  }).format(d)
}

function eventDescription(m: Match, v?: Venue): string {
  const lines = [`Stage: ${stageLine(m)}`, `Fixture: Match ${m.match_number}`]
  if (v) {
    lines.push(`Venue: ${v.stadium}, ${v.city}, ${v.country}`)
    lines.push(`Capacity: ${v.capacity.toLocaleString('en-US')}`)
  }
  lines.push(`Kickoff (venue local time): ${localKickoffLabel(m)}`)
  return lines.join('\n')
}

function eventLocation(v: Venue): string {
  return `${v.stadium}, ${v.city}, ${v.country}`
}

// Escape per RFC 5545 text rules.
function esc(s: string): string {
  return s.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n')
}

function icsStamp(d: Date): string {
  const p = (n: number) => String(n).padStart(2, '0')
  return (
    `${d.getUTCFullYear()}${p(d.getUTCMonth() + 1)}${p(d.getUTCDate())}` +
    `T${p(d.getUTCHours())}${p(d.getUTCMinutes())}${p(d.getUTCSeconds())}Z`
  )
}

/**
 * Build a VCALENDAR string. Event times are UTC so every client renders them in
 * the viewer's local zone. `reminderMinutes` (null = none, 0 = at kickoff) adds a
 * VALARM that fires that many minutes before kickoff.
 */
export function buildIcs(
  matches: Match[],
  venues: Map<string, Venue>,
  durationMin: number,
  reminderMinutes: number | null,
): string {
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//worldcup-calendar-sync//FIFA World Cup 2026//EN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:FIFA World Cup 2026',
  ]
  const stamp = icsStamp(new Date())

  for (const m of matches) {
    const v = venues.get(m.venue_id)
    const start = new Date(m.kickoff_utc)
    const end = new Date(start.getTime() + durationMin * 60_000)

    lines.push('BEGIN:VEVENT')
    lines.push(`UID:wc2026-match-${m.match_number}@worldcup-calendar-sync`)
    lines.push(`SUMMARY:${esc(eventSummary(m))}`)
    lines.push(`DTSTART:${icsStamp(start)}`)
    lines.push(`DTEND:${icsStamp(end)}`)
    lines.push(`DTSTAMP:${stamp}`)
    if (v) lines.push(`LOCATION:${esc(eventLocation(v))}`)
    lines.push(`DESCRIPTION:${esc(eventDescription(m, v))}`)
    if (reminderMinutes !== null) {
      lines.push(
        'BEGIN:VALARM',
        'ACTION:DISPLAY',
        `DESCRIPTION:${esc(eventSummary(m))}`,
        `TRIGGER:-PT${reminderMinutes}M`,
        'END:VALARM',
      )
    }
    lines.push('END:VEVENT')
  }

  lines.push('END:VCALENDAR')
  return lines.join('\r\n') + '\r\n'
}

/** Trigger a browser download of an .ics string. */
export function downloadIcs(filename: string, content: string): void {
  const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}
