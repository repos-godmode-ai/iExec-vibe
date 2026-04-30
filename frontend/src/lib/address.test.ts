import { describe, expect, it } from 'vitest'
import { isEmptyHandle, isValidEvmAddress, toAddress, isZeroAddress } from './address'

describe('address', () => {
  it('isValidEvmAddress / toAddress', () => {
    expect(isValidEvmAddress('0x' + '1'.repeat(40))).toBe(true)
    expect(isValidEvmAddress('0x123')).toBe(false)
    expect(toAddress('0x' + '2'.repeat(40))).toBe('0x' + '2'.repeat(40))
    expect(toAddress('bad')).toBe(null)
  })

  it('isZeroAddress', () => {
    expect(isZeroAddress('0x0000000000000000000000000000000000000000')).toBe(true)
    expect(isZeroAddress(undefined)).toBe(true)
    expect(isZeroAddress('0x' + '1'.repeat(40))).toBe(false)
  })

  it('isEmptyHandle', () => {
    expect(isEmptyHandle('0x' + '0'.repeat(64))).toBe(true)
    expect(isEmptyHandle(undefined)).toBe(true)
    expect(isEmptyHandle('0x' + '1'.repeat(64))).toBe(false)
  })
})
