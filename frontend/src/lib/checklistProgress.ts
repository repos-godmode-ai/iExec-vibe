import type { Hex } from 'viem'
import { isEmptyHandle } from './address'

/**
 * "Wrap" step: session success OR buyer already has a non-zero confidential balance (cUSDC).
 */
export function checklistWrapDone(
  wrapSucceeded: boolean,
  cValid: boolean,
  hBuyer: Hex | undefined,
): boolean {
  if (wrapSucceeded) return true
  if (!cValid) return false
  return hBuyer != null && !isEmptyHandle(hBuyer)
}

/**
 * "Fund" step: session success OR escrow contract holds a non-zero confidential balance.
 */
export function checklistFundDone(
  fundedThisEscrow: boolean,
  cValid: boolean,
  escrow: `0x${string}` | null,
  hEscrow: Hex | undefined,
): boolean {
  if (fundedThisEscrow) return true
  if (!escrow || !cValid) return false
  return hEscrow != null && !isEmptyHandle(hEscrow)
}
