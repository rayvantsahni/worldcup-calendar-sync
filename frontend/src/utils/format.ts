import type { Match } from '../types'

/** Kickoff in the viewer's local timezone, e.g. "20:00". */
export function localTime(iso: string): string {
  return new Intl.DateTimeFormat(undefined, {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso))
}

/** Short timezone label for the viewer, e.g. "GMT+1". */
export function tzAbbr(iso: string): string {
  const parts = new Intl.DateTimeFormat(undefined, {
    timeZoneName: 'short',
  }).formatToParts(new Date(iso))
  return parts.find((p) => p.type === 'timeZoneName')?.value ?? ''
}

/** Stable local-date key (YYYY-MM-DD) for grouping. */
export function localDateKey(iso: string): string {
  const d = new Date(iso)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/** Human date header, e.g. "Thursday, 11 June". */
export function localDateLabel(iso: string): string {
  return new Intl.DateTimeFormat(undefined, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(new Date(iso))
}

/** Stage chip text + kind (drives color). */
export function stageChip(m: Match): { text: string; kind: 'group' | 'knockout' } {
  if (m.group) {
    const md = m.matchday ? ` · MD${m.matchday}` : ''
    return { text: `GROUP ${m.group}${md}`, kind: 'group' }
  }
  return { text: m.stage.toUpperCase(), kind: 'knockout' }
}
