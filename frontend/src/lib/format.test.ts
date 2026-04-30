import { describe, expect, it } from 'vitest'
import { formatAmountLabel, shortHandle, shortHex } from './format'

describe('format', () => {
  it('shortHex / shortHandle', () => {
    expect(shortHex('0xabcdef1234', 4, 0)).toBe('0xab…')
    expect(shortHandle('0x' + '1'.repeat(64))).toMatch(/…$/)
  })

  it('formatAmountLabel', () => {
    expect(formatAmountLabel(1_000_000n, 6, 'USDC')).toBe('1 cUSDC')
  })
})
