import { describe, expect, it } from 'vitest'
import { getNextDemoHint } from './nextDemoHint'

const base = {
  isConnected: true,
  needSwitch: false,
  chainId: 421614,
  targetChainId: 421614,
  cValid: true,
  factoryInput: '0x' + 'a'.repeat(40),
  factoryFromEnv: undefined as `0x${string}` | undefined,
  escrow: '0x' + 'b'.repeat(40) as `0x${string}`,
  wrapStepDone: true,
  fundStepDone: true,
  settled: true,
}

describe('getNextDemoHint', () => {
  it('asks to connect first', () => {
    expect(getNextDemoHint({ ...base, isConnected: false })).toMatch(/Connect/)
  })

  it('asks to switch chain', () => {
    expect(
      getNextDemoHint({ ...base, needSwitch: true }),
    ).toMatch(/Arbitrum Sepolia/)
    expect(
      getNextDemoHint({ ...base, chainId: 1 }),
    ).toMatch(/Arbitrum Sepolia/)
  })

  it('asks for cToken', () => {
    expect(getNextDemoHint({ ...base, cValid: false })).toMatch(/cUSDC|cToken|VITE_CTOKEN/)
  })

  it('asks for factory when missing', () => {
    expect(
      getNextDemoHint({
        ...base,
        factoryInput: '',
        factoryFromEnv: undefined,
      }),
    ).toMatch(/Factory/)
  })

  it('accepts factory from env without form', () => {
    expect(
      getNextDemoHint({
        ...base,
        factoryInput: '',
        factoryFromEnv: '0x' + 'c'.repeat(40) as `0x${string}`,
        escrow: null,
      }),
    ).toMatch(/seller|escrow|deal/i)
  })

  it('asks to create escrow', () => {
    expect(getNextDemoHint({ ...base, escrow: null })).toMatch(/seller|escrow|buyer/i)
  })

  it('asks to wrap when no cUSDC step', () => {
    expect(getNextDemoHint({ ...base, wrapStepDone: false, settled: false })).toMatch(/cUSDC|Wrap|confidential/i)
  })

  it('asks to fund', () => {
    expect(
      getNextDemoHint({ ...base, fundStepDone: false, settled: false }),
    ).toMatch(/Fund|encrypt/i)
  })

  it('asks to settle', () => {
    expect(getNextDemoHint({ ...base, settled: false })).toMatch(/Settle|Release|Refund|Reject/)
  })

  it('returns null when path complete', () => {
    expect(getNextDemoHint(base)).toBeNull()
  })
})
