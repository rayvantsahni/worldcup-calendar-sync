interface Props {
  count: number
  total: number
  onSelectAll: () => void
  onClear: () => void
  onDownload: () => void
  downloading: boolean
}

export function SelectionBar({ count, total, onSelectAll, onClear, onDownload, downloading }: Props) {
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
          <button className="btn-primary" onClick={onDownload} disabled={count === 0 || downloading}>
            {downloading ? 'Preparing…' : `Download .ics${count ? ` (${count})` : ''}`}
          </button>
        </div>
      </div>
    </div>
  )
}
