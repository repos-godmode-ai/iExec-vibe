import { useCallback, useRef, useState } from 'react'

/**
 * Coordinates async actions with a single `busy` flag; uses a ref to block double-submits
 * without stale closures.
 */
export function useWithBusy() {
  const [busy, setBusy] = useState(false)
  const lock = useRef(false)

  const run = useCallback(async (fn: () => Promise<void>) => {
    if (lock.current) return
    lock.current = true
    setBusy(true)
    try {
      await fn()
    } finally {
      lock.current = false
      setBusy(false)
    }
  }, [])

  return { busy, run }
}
