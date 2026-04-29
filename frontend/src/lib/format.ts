import { formatUnits, type Hex } from 'viem'

export function shortHex(s: string | undefined, pre = 10, post = 0): string {
  if (!s) return '—'
  if (s.length <= pre + post) return s
  return post > 0 ? `${s.slice(0, pre)}…${s.slice(-post)}` : `${s.slice(0, pre)}…`
}

export function shortHandle(h: Hex | string | undefined): string {
  if (!h) return '—'
  if (h.length < 20) return h
  return `${h.slice(0, 18)}…`
}

export function formatAmountLabel(raw: bigint, decimals: number, unit: string): string {
  return `${formatUnits(raw, decimals)} c${unit}`
}
