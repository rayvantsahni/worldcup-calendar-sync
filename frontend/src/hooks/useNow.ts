import { useEffect, useState } from 'react'

/** Current epoch millis, refreshed on an interval so "live" state stays current. */
export function useNow(intervalMs = 30000): number {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), intervalMs)
    return () => clearInterval(id)
  }, [intervalMs])
  return now
}
