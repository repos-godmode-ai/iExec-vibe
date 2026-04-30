import { describe, expect, it } from 'vitest'
import { checklistWrapDone, checklistFundDone } from './checklistProgress'
import { keccak256, stringToBytes } from 'viem'

const ZEROS = '0x' + '0'.repeat(64) as const
const nonEmpty: `0x${string}` = keccak256(stringToBytes('h'))

describe('checklistWrapDone', () => {
  it('is true when wrap succeeded in session', () => {
    expect(checklistWrapDone(true, true, ZEROS)).toBe(true)
  })

  it('is true when cValid and buyer has non-empty handle', () => {
    expect(checklistWrapDone(false, true, nonEmpty)).toBe(true)
  })

  it('is false for empty handle even if cValid', () => {
    expect(checklistWrapDone(false, true, ZEROS)).toBe(false)
  })

  it('is false if not cValid', () => {
    expect(checklistWrapDone(false, false, nonEmpty)).toBe(false)
  })
})

describe('checklistFundDone', () => {
  const escrow = '0x' + '1'.repeat(40) as `0x${string}`

  it('is true when funded in session', () => {
    expect(checklistFundDone(true, true, escrow, ZEROS)).toBe(true)
  })

  it('is true when escrow has non-empty handle', () => {
    expect(checklistFundDone(false, true, escrow, nonEmpty)).toBe(true)
  })

  it('is false without escrow', () => {
    expect(checklistFundDone(false, true, null, nonEmpty)).toBe(false)
  })

  it('is false for empty escrow handle', () => {
    expect(checklistFundDone(false, true, escrow, ZEROS)).toBe(false)
  })
})
