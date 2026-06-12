export interface Filters {
  team: string
  group: string
  stage: string
  venueId: string
  weekday: string
}

export const EMPTY_FILTERS: Filters = {
  team: '',
  group: '',
  stage: '',
  venueId: '',
  weekday: '',
}

export interface VenueOption {
  id: string
  label: string
}

export interface FilterOptions {
  teams: string[]
  groups: string[]
  stages: string[]
  venues: VenueOption[]
  weekdays: { value: number; label: string }[]
}

interface Props {
  options: FilterOptions
  value: Filters
  onChange: (next: Filters) => void
  resultCount: number
  totalCount: number
}

interface FieldProps {
  label: string
  allLabel: string
  value: string
  onChange: (v: string) => void
  options: { value: string; label: string }[]
}

function Field({ label, allLabel, value, onChange, options }: FieldProps) {
  return (
    <div className="filter-field">
      <label>{label}</label>
      <select value={value} onChange={(e) => onChange(e.target.value)}>
        <option value="">{allLabel}</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  )
}

export function FilterBar({ options, value, onChange, resultCount, totalCount }: Props) {
  const set = (key: keyof Filters, v: string) => onChange({ ...value, [key]: v })
  const active = Object.values(value).some(Boolean)

  return (
    <div className="filterbar">
      <div className="filters">
        <Field
          label="Team"
          allLabel="All teams"
          value={value.team}
          onChange={(v) => set('team', v)}
          options={options.teams.map((t) => ({ value: t, label: t }))}
        />
        <Field
          label="Group"
          allLabel="All groups"
          value={value.group}
          onChange={(v) => set('group', v)}
          options={options.groups.map((g) => ({ value: g, label: `Group ${g}` }))}
        />
        <Field
          label="Stage"
          allLabel="All stages"
          value={value.stage}
          onChange={(v) => set('stage', v)}
          options={options.stages.map((s) => ({ value: s, label: s }))}
        />
        <Field
          label="Stadium"
          allLabel="All stadiums"
          value={value.venueId}
          onChange={(v) => set('venueId', v)}
          options={options.venues.map((v) => ({ value: v.id, label: v.label }))}
        />
        <Field
          label="Day"
          allLabel="Any day"
          value={value.weekday}
          onChange={(v) => set('weekday', v)}
          options={options.weekdays.map((d) => ({ value: String(d.value), label: d.label }))}
        />
      </div>

      <div className="filter-meta">
        <span>
          Showing <strong>{resultCount}</strong> of {totalCount}
        </span>
        {active && (
          <button className="btn-clear-filters" onClick={() => onChange(EMPTY_FILTERS)}>
            Clear filters
          </button>
        )}
      </div>
    </div>
  )
}
