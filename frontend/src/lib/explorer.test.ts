import { describe, expect, it } from 'vitest'
import { linkifyTxLogLine, txUrl } from './explorer'

const h = '0x' + 'a'.repeat(64)

describe('explorer', () => {
  it('txUrl', () => {
    expect(txUrl(h)).toContain('tx')
  })

  it('linkifyTxLogLine finds hash', () => {
    const parts = linkifyTxLogLine(`Tx: ${h} done`)
    const flat = parts.flatMap((p) => (typeof p === 'string' ? [p] : [p.hash]))
    expect(flat).toContain(h)
  })
})
