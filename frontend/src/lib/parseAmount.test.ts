import { describe, expect, it } from 'vitest'
import { safeParseUnits } from './parseAmount'

describe('safeParseUnits', () => {
  it('accepts valid amounts', () => {
    const a = safeParseUnits('1', 6)
    expect(a.ok && a.value === 1_000_000n).toBe(true)
    const b = safeParseUnits('0.5', 6)
    expect(b.ok && b.value === 500_000n).toBe(true)
  })

  it('rejects empty and invalid', () => {
    expect(safeParseUnits('', 6).ok).toBe(false)
    expect(safeParseUnits('abc', 6).ok).toBe(false)
  })
})
