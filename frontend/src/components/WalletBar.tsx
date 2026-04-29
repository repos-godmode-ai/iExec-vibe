import type { ReactNode } from 'react'
import type { LogLine } from '../hooks/useActivityLog'
import { explorerBase } from '../config'
import { shortHex } from '../lib/format'
import { linkifyTxLogLine, txUrl } from '../lib/explorer'

type Props = {
  isConnected: boolean
  address: `0x${string}` | undefined
  needSwitch: boolean
  chainId: number
  targetChainId: number
  connPend: boolean
  onConnect: () => void
  onSwitch: () => void
  onDisconnect: () => void
}

export function WalletBar({
  isConnected,
  address,
  needSwitch,
  chainId,
  targetChainId,
  connPend,
  onConnect,
  onSwitch,
  onDisconnect,
}: Props) {
  return (
    <div className="wallet-row">
      {!isConnected ? (
        <button className="btn" type="button" disabled={connPend} onClick={onConnect}>
          {connPend ? 'Connecting…' : 'Connect wallet'}
        </button>
      ) : (
        <>
          <span className="addr" title={address}>
            {address ? shortHex(address, 6, 4) : ''}
          </span>
          {needSwitch ? (
            <button type="button" className="btn" onClick={onSwitch}>
              Switch to Arbitrum Sepolia
            </button>
          ) : null}
          <button type="button" className="btn btn-ghost" onClick={onDisconnect}>
            Disconnect
          </button>
        </>
      )}
      {isConnected && (
        <span className="muted" style={{ fontSize: '0.8rem' }}>
          chain {chainId}
          {needSwitch ? ` (use ${targetChainId})` : ''}
        </span>
      )}
    </div>
  )
}

function renderLogText(text: string): ReactNode {
  const bits = linkifyTxLogLine(text)
  return bits.map((b, i) =>
    typeof b === 'string' ? (
      <span key={i}>{b}</span>
    ) : (
      <a key={i} href={txUrl(b.hash)} target="_blank" rel="noreferrer" className="tx-link">
        {b.hash.slice(0, 10)}…{b.hash.slice(-6)}
      </a>
    ),
  )
}

export function ActivityLog({ log, onClear }: { log: LogLine[]; onClear: () => void }) {
  if (log.length === 0) return null
  return (
    <section>
      <div className="section-head">
        <h2>Activity / trace</h2>
        <button type="button" className="btn btn-ghost" onClick={onClear}>
          Clear
        </button>
      </div>
      {log.map((l, i) => (
        <p key={i} className="log" data-kind={l.kind}>
          [{l.kind}] {renderLogText(l.text)}
        </p>
      ))}
    </section>
  )
}

export function ExplorerHint() {
  return (
    <p className="muted">
      Explorer: {explorerBase} — search your escrow or cToken. Build log: <code>docs/AI_TRACES.md</code>. Hackathon:{' '}
      <a href="https://dorahacks.io/hackathon/vibe-coding-iexec/detail" target="_blank" rel="noreferrer">
        DoraHacks iExec Vibe Coding
      </a>
      . Feedback: <code>feedback.md</code>.
    </p>
  )
}
