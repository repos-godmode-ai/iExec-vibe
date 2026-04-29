import { parseUnits } from 'viem'

export type ParseAmountResult = { ok: true; value: bigint } | { ok: false; error: string }

const DECIMAL = /^\d*\.?\d*$/

/**
 * Safer than raw `parseUnits` for user input: rejects empty and malformed strings.
 */
export function safeParseUnits(amount: string, decimals: number): ParseAmountResult {
  const t = amount.trim()
  if (t === '') return { ok: false, error: 'Enter an amount' }
  if (decimals < 0 || decimals > 78) return { ok: false, error: 'Invalid token decimals' }
  if (!DECIMAL.test(t)) return { ok: false, error: 'Amount must be a number (e.g. 1.5)' }
  try {
    return { ok: true, value: parseUnits(t as `${number}` | string, decimals) }
  } catch {
    return { ok: false, error: 'Amount is too large or has too many decimal places' }
  }
}
