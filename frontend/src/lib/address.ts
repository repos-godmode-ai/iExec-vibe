import type { Address, Hex } from 'viem'

const ZERO: Address = '0x0000000000000000000000000000000000000000'
const ZEROS = '0x' + '0'.repeat(64)

export function isZeroAddress(a: string | undefined | null): boolean {
  return !a || a === ZERO
}

export function isEmptyHandle(h: Hex | string | undefined): boolean {
  return !h || h === ZEROS
}

const ADDR_RE = /^0x[0-9a-fA-F]{40}$/

export function isValidEvmAddress(s: string): s is Address {
  return ADDR_RE.test(s)
}

export function toAddress(s: string): Address | null {
  return isValidEvmAddress(s) ? s : null
}
