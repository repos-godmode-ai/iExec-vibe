import { useChainId } from 'wagmi'
import {
  CUSDC_HELP,
  DEFAULT_CTOKEN,
  DEFAULT_UNDERLYING,
  defaultChain,
  explorerBase,
} from './config'
import { usePrivaRwaApp } from './hooks/usePrivaRwaApp'
import { ActivityLog, ExplorerHint, WalletBar } from './components/WalletBar'
import { SubmissionChecklist } from './components/SubmissionChecklist'
import { NextStepsPanel } from './components/NextStepsPanel'
import { IexecResourceLinks } from './components/IexecResourceLinks'

export default function App() {
  const ac = usePrivaRwaApp()
  const liveChainId = useChainId()

  return (
    <div className="app">
      <h1>PrivaRWA — Confidential RWA settlement</h1>
      <p className="lead">
        <span className="pill">iExec Nox + ERC-7984</span> On-chain RWA deal escrow: the payment amount in
        confidential cUSDC stays encrypted; settlement actions are public. Built for the iExec Vibe Coding
        Challenge.
      </p>

      <SubmissionChecklist
        isConnected={ac.isConnected}
        needSwitch={ac.needSwitch}
        chainId={liveChainId}
        cValid={ac.cValid}
        factory={ac.factory}
        escrow={ac.escrow}
        wrapStepDone={ac.wrapStepDone}
        fundStepDone={ac.fundStepDone}
        settled={ac.settled}
      />

      <NextStepsPanel nextHint={ac.nextDemoHint} />

      <WalletBar
        isConnected={ac.isConnected}
        address={ac.address}
        needSwitch={ac.needSwitch}
        chainId={liveChainId}
        targetChainId={defaultChain.id}
        connPend={ac.connPend}
        onConnect={ac.connect}
        onSwitch={ac.switchToSepolia}
        onDisconnect={ac.disconnect}
      />
      {ac.needSwitch ? (
        <p className="muted">
          Switch the wallet to Arbitrum Sepolia (chain {defaultChain.id}).{' '}
          <a href={`${explorerBase}`} target="_blank" rel="noreferrer">
            Arbiscan Sepolia
          </a>
        </p>
      ) : null}

      <section>
        <h2>Confidential token (cUSDC from cdefi)</h2>
        <p className="muted">{CUSDC_HELP}</p>
        <p className="muted" style={{ marginTop: 0 }}>
          <strong>Default on Arbitrum Sepolia (official pair)</strong> — USDC:{' '}
          <code>{DEFAULT_UNDERLYING}</code> · cUSDC: <code>{DEFAULT_CTOKEN}</code>. Override with{' '}
          <code>VITE_CTOKEN_ADDRESS</code> or paste below.
        </p>
        <label htmlFor="ctok">cToken (ERC-7984 wrapper) address</label>
        <input
          id="ctok"
          value={ac.cToken}
          onChange={(e) => ac.setCToken(e.target.value as `0x${string}`)}
          type="text"
          spellCheck={false}
        />
        <p className="muted">
          Token: {ac.cName != null ? String(ac.cName) : '…'} ({ac.cSymbol != null ? String(ac.cSymbol) : '…'}){' '}
          {ac.dec != null ? `decimals ${ac.dec}` : ''} · underlying: {ac.shortHex(String(ac.underlyingAddr), 6, 4)}…
        </p>
        <p className="muted">Your public USDC balance: {ac.rawBal != null ? String(ac.rawBal) : '—'}</p>
        <div className="row">
          <div>
            <label htmlFor="ul">Underlying (optional override)</label>
            <input
              id="ul"
              value={ac.underlying}
              onChange={(e) => ac.setUnderlying(e.target.value as `0x${string}`)}
            />
          </div>
          <div>
            <label>Wrap (same amount as “Fund”)</label>
            <button type="button" className="btn btn-ghost" disabled={ac.busy} onClick={() => void ac.wrap()}>
              Approve (if needed) + Wrap
            </button>
          </div>
        </div>
        <div>
          <label>Your confidential balance (Nox handle — decrypt with @iexec-nox/handle)</label>
          <div className="row" style={{ alignItems: 'end' }}>
            <p className="muted" style={{ margin: 0 }}>
              Handle: {ac.shortHandle(ac.hBuyer)}
            </p>
            <button
              type="button"
              className="btn"
              onClick={() => void ac.onDecryptBuyer()}
              disabled={!ac.canDecryptBuyer || ac.busy}
            >
              Decrypt my cToken balance
            </button>
          </div>
          {ac.plainBuyerBal != null ? <p className="log">{ac.plainBuyerBal}</p> : null}
        </div>
        {ac.escrow && ac.cValid ? (
          <div style={{ marginTop: '0.75rem' }}>
            <label>Escrow confidential balance (buyer: try decrypt; only works if you have ACL)</label>
            <p className="muted" style={{ margin: '0.25rem 0' }}>
              Handle: {ac.shortHandle(ac.hEscrow)}
            </p>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => void ac.onDecryptEscrow()}
              disabled={!ac.canDecryptEscrow || ac.busy}
            >
              Decrypt escrow (if permitted)
            </button>
            {ac.plainEscrowBal != null ? <p className="log">{ac.plainEscrowBal}</p> : null}
          </div>
        ) : null}
      </section>

      <section>
        <h2>Factory + escrow (one RWA deal)</h2>
        <p className="muted">Set <code>VITE_FACTORY_ADDRESS</code> in <code>frontend/.env</code> after deploy, or paste below.</p>
        <label htmlFor="fa">RwaConfidentialEscrowFactory</label>
        <input
          id="fa"
          value={ac.factory}
          onChange={(e) => ac.setFactory(e.target.value as `0x${string}` | '')}
          type="text"
        />
        <div className="row">
          <div>
            <label htmlFor="s">Seller address</label>
            <input id="s" value={ac.seller} onChange={(e) => ac.setSeller(e.target.value)} placeholder="0x…" />
          </div>
          <div>
            <label htmlFor="d">Deal label (keccak256 = deal ref)</label>
            <input id="d" value={ac.dealLabel} onChange={(e) => ac.setDealLabel(e.target.value)} />
          </div>
        </div>
        <button
          type="button"
          className="btn"
          onClick={() => void ac.createEscrow()}
          disabled={ac.busy || !ac.isConnected || ac.needSwitch}
        >
          Create escrow (I am the buyer)
        </button>
        {ac.escrow ? <p className="muted">Escrow: {ac.escrow}</p> : null}
      </section>

      {ac.escrow ? (
        <section>
          <h2>Fund &amp; settle</h2>
          <p>
            <strong>Fund</strong> encrypts the amount client-side, then <code>confidentialTransfer</code> to the
            escrow.{' '}
            <a href="https://docs.iex.ec/nox-protocol/references/js-sdk" target="_blank" rel="noreferrer">
              Nox JS SDK
            </a>
            .
          </p>
          <div className="row">
            <div>
              <label htmlFor="f">Amount (same units as wrap)</label>
              <input id="f" value={ac.fundAmount} onChange={(e) => ac.setFundAmount(e.target.value)} />
            </div>
            <div style={{ alignSelf: 'end' }}>
              <button
                type="button"
                className="btn"
                onClick={() => void ac.fundEscrow()}
                disabled={ac.busy || !ac.isConnected || ac.needSwitch}
              >
                Encrypt + transfer to escrow
              </button>
            </div>
          </div>
          {ac.eBuyer != null && ac.eSeller != null ? (
            <p className="muted">
              Buyer: {String(ac.eBuyer)} · Seller: {String(ac.eSeller)} · Released:{' '}
              {ac.eReleased ? 'yes' : 'no'} · Refunded: {ac.eRefunded ? 'yes' : 'no'}
            </p>
          ) : null}
          {ac.settled ? <p className="muted">This deal is settled on-chain.</p> : null}
          <div className="row" style={{ marginTop: '0.5rem' }}>
            <button
              type="button"
              className="btn"
              disabled={!ac.isBuyer || ac.settled || ac.busy}
              onClick={ac.release}
            >
              Release to seller (buyer)
            </button>
            <button
              type="button"
              className="btn btn-ghost"
              disabled={!ac.isBuyer || ac.settled || ac.busy}
              onClick={ac.refund}
            >
              Refund to buyer (buyer)
            </button>
            <button
              type="button"
              className="btn btn-ghost"
              disabled={!ac.isSeller || ac.settled || ac.busy}
              onClick={ac.reject}
            >
              Reject to buyer (seller)
            </button>
          </div>
        </section>
      ) : null}

      <ActivityLog log={ac.log} onClear={ac.clearLog} />
      <IexecResourceLinks />
      <ExplorerHint />
    </div>
  )
}
