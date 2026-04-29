import { useCallback, useState } from 'react'

export type LogLine = { kind: 'ok' | 'err' | 'info'; text: string }

const MAX = 20

export function useActivityLog() {
  const [log, setLog] = useState<LogLine[]>([])

  const add = useCallback((m: LogLine) => {
    setLog((prev) => [...prev, m].slice(-MAX))
  }, [])

  const clear = useCallback(() => setLog([]), [])

  return { log, add, clear }
}
