import { decodeEventLog, type Hex, type Log } from 'viem'
import { escrowFactoryAbi } from '../abis/contracts'

const abi = escrowFactoryAbi as readonly object[]

/** Extract new escrow address from `RwaConfidentialEscrowCreated` in tx logs. */
export function parseEscrowFromLogs(logs: readonly Log[]): `0x${string}` | null {
  for (const lg of logs) {
    try {
      const d = decodeEventLog({
        abi,
        data: lg.data,
        topics: lg.topics as [Hex, ...Hex[]],
        strict: false,
      })
      if (d.eventName === 'RwaConfidentialEscrowCreated' && d.args && typeof d.args === 'object' && 'escrow' in d.args) {
        return d.args.escrow as `0x${string}`
      }
    } catch {
      /* not this log */
    }
  }
  return null
}
