import { BaseError } from 'viem'

/** User-facing message for wallet / RPC / contract errors. */
export function formatTxError(e: unknown): string {
  if (e instanceof BaseError) return e.shortMessage
  if (e instanceof Error) return e.message
  return String(e)
}
