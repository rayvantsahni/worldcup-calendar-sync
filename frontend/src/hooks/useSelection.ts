import { useCallback, useEffect, useState } from 'react'

const KEY = 'wc2026.selected'

/** Selected match numbers, persisted to localStorage so refreshes don't lose them. */
export function useSelection() {
  const [selected, setSelected] = useState<Set<number>>(() => {
    try {
      const raw = localStorage.getItem(KEY)
      return new Set<number>(raw ? JSON.parse(raw) : [])
    } catch {
      return new Set<number>()
    }
  })

  useEffect(() => {
    localStorage.setItem(KEY, JSON.stringify([...selected]))
  }, [selected])

  const toggle = useCallback((n: number) => {
    setSelected((prev) => {
      const next = new Set(prev)
      next.has(n) ? next.delete(n) : next.add(n)
      return next
    })
  }, [])

  const selectAll = useCallback((nums: number[]) => setSelected(new Set(nums)), [])
  const clear = useCallback(() => setSelected(new Set()), [])

  return { selected, toggle, selectAll, clear }
}
