import { explorerBase } from '../config'

const TX_RE = /^0x[a-fA-F0-9]{64}$/

export function txUrl(hash: string): string {
  return `${explorerBase}/tx/${hash}`
}

/** Turn "… Tx: 0xabc…" into React nodes with a link for the hash. */
export function linkifyTxLogLine(text: string): (string | { type: 'tx'; hash: string })[] {
  const parts: (string | { type: 'tx'; hash: string })[] = []
  const re = /(0x[a-fA-F0-9]{64})/g
  let last = 0
  let m: RegExpExecArray | null
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) parts.push(text.slice(last, m.index))
    const h = m[1]
    if (TX_RE.test(h)) parts.push({ type: 'tx', hash: h })
    else parts.push(h)
    last = m.index + h.length
  }
  if (last < text.length) parts.push(text.slice(last))
  if (parts.length === 0) return [text]
  return parts
}
