import { describe, expect, it } from 'vitest'
import { encodeAbiParameters, encodeEventTopics, type Hex, type Log, pad } from 'viem'
import { escrowFactoryAbi } from '../abis/contracts'
import { parseEscrowFromLogs } from './parseFactoryEvent'

const escrow = '0x1111111111111111111111111111111111111111' as const
const cToken = '0x2222222222222222222222222222222222222222' as const
const buyer = '0x3333333333333333333333333333333333333333' as const
const seller = '0x4444444444444444444444444444444444444444' as const
const dealRef = pad('0xdd', { size: 32 })

function buildFactoryLog(): Log {
  const topics = encodeEventTopics({
    abi: escrowFactoryAbi,
    eventName: 'RwaConfidentialEscrowCreated',
    args: { escrow, cToken, buyer },
  })
  const data = encodeAbiParameters(
    [
      { name: 'seller', type: 'address' },
      { name: 'dealRef', type: 'bytes32' },
    ],
    [seller, dealRef],
  )
  return {
    address: '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa' as Hex,
    blockHash: null,
    blockNumber: 1n,
    data,
    logIndex: 0,
    transactionHash: '0x' + 'b'.repeat(64) as Hex,
    transactionIndex: 0,
    removed: false,
    topics: topics as [Hex, ...Hex[]],
  }
}

describe('parseEscrowFromLogs', () => {
  it('returns escrow from RwaConfidentialEscrowCreated', () => {
    const log = buildFactoryLog()
    expect(parseEscrowFromLogs([log])).toBe(escrow)
  })

  it('returns null when no match', () => {
    expect(
      parseEscrowFromLogs([
        {
          ...buildFactoryLog(),
          topics: [pad('0x01', { size: 32 }) as Hex] as [Hex, ...Hex[]],
        },
      ]),
    ).toBe(null)
  })
})
