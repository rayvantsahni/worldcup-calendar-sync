import type { Team } from '../types'

/** Renders a country flag (flag-icons SVG) or a neutral badge for knockout placeholders. */
export function Flag({ team }: { team: Team }) {
  if (team.code) {
    return <span className={`fi fi-${team.code} flag`} role="img" aria-label={team.name} />
  }
  return (
    <span className="flag flag-placeholder" aria-hidden="true">
      ?
    </span>
  )
}
