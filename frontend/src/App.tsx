import { useCallback, useEffect, useState } from 'react'
import {
  useAccount,
  useConnect,
  useChainId,
  useDisconnect,
  usePublicClient,
  useWalletClient,
  useReadContract,
  useWriteContract,
  useSwitchChain,
} from 'wagmi'
import { createViemHandleClient } from '@iexec-nox/handle'
import {
  decodeEventLog,
  type Hex,
  keccak256,
  stringToBytes,
  parseUnits,
} from 'viem'
import { factoryFromEnv, cTokenFromEnv, explorerBase, defaultChain } from './config'
import ircAbi from './abis/ierc7984.json'
import escAbi from './abis/rwaEscrow.json'
import factoryAbi from './abis/escrowFactory.json'
import { erc20Abi } from './abi/erc20'
import { wrapper7984Abi } from './abi/wrapper7984'

const factoryAbiT = factoryAbi as readonly object[]
const escAbiT = escAbi as readonly object[]
const ircAbiT = ircAbi as readonly object[]

const DEFAULT_UNDERLYING = '0x1baabb04529d43a73232b713c0fe471f7c7334d5' as const

const CUSDC_DOC =
  'Use the Confidential DeFi app at cdefi.iex.ec on Arbitrum Sepolia: get test ETH and USDC from the faucet, then wrap to cUSDC. Copy the cUSDC (ERC-7984) contract address into the field below.'

type StatusMsg = { kind: 'ok' | 'err' | 'info'; text: string }

export default function App() {
  const { address, isConnected } = useAccount()
  const { connect, connectors, isPending: connPend } = useConnect()
  const { disconnect } = useDisconnect()
  const { switchChain } = useSwitchChain()
  const chainId = useChainId()
  const { data: walletClient } = useWalletClient()
  const publicClient = usePublicClient()
  const { writeContractAsync } = useWriteContract()

  const [cToken, setCToken] = useState<`0x${string}`>(
    () => (cTokenFromEnv ?? '0x0000000000000000000000000000000000000000') as `0x${string}`,
  )
  const [factory, setFactory] = useState<`0x${string}` | ''>(
    () => factoryFromEnv ?? '',
  )
  const [underlying, setUnderlying] = useState<`0x${string}`>(DEFAULT_UNDERLYING)
  const [escrow, setEscrow] = useState<`0x${string}` | null>(null)
  const [seller, setSeller] = useState('')
  const [dealLabel, setDealLabel] = useState('RWA-001')
  const [fundAmount, setFundAmount] = useState('1')
  const [log, setLog] = useState<StatusMsg[]>([])
  const [busy, setBusy] = useState(false)

  const addLog = useCallback((m: StatusMsg) => {
    setLog((prev) => [...prev, m].slice(-14))
  }, [])

  const needSwitch = isConnected && chainId !== defaultChain.id

  const cTokenInfo = {
    address: cToken,
    chainId: defaultChain.id,
  } as const

  const { data: cName } = useReadContract({ ...cTokenInfo, abi: ircAbiT, functionName: 'name' })
  const { data: cSymbol } = useReadContract({ ...cTokenInfo, abi: ircAbiT, functionName: 'symbol' })
  const { data: cDec } = useReadContract({ ...cTokenInfo, abi: ircAbiT, functionName: 'decimals' })
  const dec = cDec != null ? Number(cDec) : null
  const { data: cWrappingAddr } = useReadContract({
    ...cTokenInfo,
    abi: wrapper7984Abi,
    functionName: 'underlying',
    query: { enabled: cToken !== '0x0000000000000000000000000000000000000000' },
  })
  const underlyingAddr = (cWrappingAddr as `0x${string}` | undefined) ?? underlying

  useEffect(() => {
    if (cWrappingAddr) setUnderlying(cWrappingAddr)
  }, [cWrappingAddr])

  const { data: rawBal, refetch: refetchErc20 } = useReadContract({
    address: underlyingAddr,
    abi: erc20Abi,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: { enabled: !!address && underlyingAddr !== '0x0000000000000000000000000000000000000000' },
  })

  const escrowView = {
    address: escrow ?? '0x0000000000000000000000000000000000000000',
    abi: escAbiT,
  } as const

  const { data: eBuyer } = useReadContract({
    ...escrowView,
    functionName: 'buyer',
    args: undefined,
    query: { enabled: !!escrow },
  })
  const { data: eSeller } = useReadContract({
    ...escrowView,
    functionName: 'seller',
    query: { enabled: !!escrow },
  })
  const { data: eReleased } = useReadContract({
    ...escrowView,
    functionName: 'released',
    query: { enabled: !!escrow },
  })
  const { data: eRefunded } = useReadContract({
    ...escrowView,
    functionName: 'refunded',
    query: { enabled: !!escrow },
  })
  const { data: hBuyer } = useReadContract({
    address: cToken,
    abi: ircAbiT,
    functionName: 'confidentialBalanceOf',
    args: address ? [address] : undefined,
    query: { enabled: !!address && cToken !== '0x0000000000000000000000000000000000000000' },
  })

  const canDecrypt = Boolean(address && cToken && hBuyer && hBuyer !== '0x' + '0'.repeat(64))

  const [plainBuyerBal, setPlainBuyerBal] = useState<string | null>(null)

  const runDecrypt = useCallback(async () => {
    if (!walletClient || !address) return
    if (!cToken || cToken === '0x0000000000000000000000000000000000000000') {
      addLog({ kind: 'err', text: 'Set a valid cToken (confidential token) address.' })
      return
    }
    const hc = await createViemHandleClient(walletClient)
    const h = hBuyer as Hex
    if (!h || h === '0x' + '0'.repeat(64)) {
      setPlainBuyerBal('0 (no confidential balance / uninitialized)')
      return
    }
    try {
      const d = await hc.decrypt(h)
      const v = d.value
      if (dec == null) {
        setPlainBuyerBal(String(v))
        return
      }
      setPlainBuyerBal(
        (Number(v) / 10 ** dec).toString() + ' c' + (cSymbol != null ? String(cSymbol) : 'tokens'),
      )
    } catch (e) {
      addLog({
        kind: 'err',
        text: `Decrypt failed: ${e instanceof Error ? e.message : String(e)} (grant ACL or use the correct account)`,
      })
    }
  }, [walletClient, address, cToken, hBuyer, dec, cSymbol, addLog])

  const createEscrow = async () => {
    if (!publicClient || !writeContractAsync || !address) return
    if (!factory) {
      addLog({ kind: 'err', text: 'Set factory contract address (deployed on Arbitrum Sepolia).' })
      return
    }
    if (!seller.match(/^0x[0-9a-fA-F]{40}$/)) {
      addLog({ kind: 'err', text: 'Invalid seller address.' })
      return
    }
    if (!cToken || cToken === '0x0000000000000000000000000000000000000000') {
      addLog({ kind: 'err', text: 'Set cToken to your confidential token (cUSDC) from cdefi.' })
      return
    }
    setBusy(true)
    const dealRef = keccak256(stringToBytes(dealLabel || 'deal')) as `0x${string}`
    try {
      const hash = await writeContractAsync({
        address: factory,
        abi: factoryAbiT,
        functionName: 'createEscrow',
        args: [cToken, seller as `0x${string}`, dealRef],
        chain: defaultChain,
      })
      const receipt = await publicClient.waitForTransactionReceipt({ hash })
      for (const lg of receipt.logs) {
        try {
          const d = decodeEventLog({
            abi: factoryAbiT,
            data: lg.data,
            topics: lg.topics as [Hex, ...Hex[]],
            strict: false,
          } as Parameters<typeof decodeEventLog>[0])
          if (d.eventName === 'RwaConfidentialEscrowCreated') {
            setEscrow((d.args as { escrow: `0x${string}` }).escrow)
            addLog({ kind: 'ok', text: `Escrow: ${(d.args as { escrow: string }).escrow}` })
            setBusy(false)
            return
          }
        } catch {
          /* not our event */
        }
      }
      addLog({ kind: 'err', text: 'Could not read escrow address from receipt.' })
    } catch (e) {
      addLog({ kind: 'err', text: String(e) })
    }
    setBusy(false)
  }

  const fundEscrow = async () => {
    if (!walletClient || !writeContractAsync || !publicClient || !escrow) {
      addLog({ kind: 'err', text: 'Connect wallet and create an escrow first.' })
      return
    }
    if (dec == null) {
      addLog({ kind: 'err', text: 'Could not read token decimals. Check cToken address on Arbitrum Sepolia.' })
      return
    }
    setBusy(true)
    try {
      const hc = await createViemHandleClient(walletClient)
      const v = parseUnits(fundAmount, dec)
      const { handle, handleProof } = await hc.encryptInput(v, 'uint256', cToken)
      const h = writeContractAsync({
        address: cToken,
        abi: ircAbiT,
        functionName: 'confidentialTransfer',
        args: [escrow, handle, handleProof as Hex],
        chain: defaultChain,
      })
      const hash = await h
      await publicClient.waitForTransactionReceipt({ hash })
      addLog({ kind: 'ok', text: `Funded confidential escrow. Tx: ${hash}` })
    } catch (e) {
      addLog({ kind: 'err', text: `Fund: ${e instanceof Error ? e.message : String(e)}` })
    }
    setBusy(false)
  }

  const wrapIfNeeded = async () => {
    if (!publicClient || !writeContractAsync || !address) return
    if (dec == null) {
      addLog({ kind: 'err', text: 'Wait for token metadata or set cToken.' })
      return
    }
    const want = parseUnits(fundAmount, dec)
    if (!cToken) return
    setBusy(true)
    try {
      const a = (await publicClient.readContract({
        address: underlyingAddr,
        abi: erc20Abi,
        functionName: 'allowance',
        args: [address, cToken],
      })) as bigint
      if (a < want) {
        const h1 = await writeContractAsync({
          address: underlyingAddr,
          abi: erc20Abi,
          functionName: 'approve',
          args: [cToken, 2n ** 256n - 1n],
          chain: defaultChain,
        })
        await publicClient.waitForTransactionReceipt({ hash: h1 })
        addLog({ kind: 'info', text: 'Approval confirmed.' })
      }
      const h2 = await writeContractAsync({
        address: cToken,
        abi: wrapper7984Abi,
        functionName: 'wrap',
        args: [address, want],
        chain: defaultChain,
      })
      await publicClient.waitForTransactionReceipt({ hash: h2 })
      addLog({ kind: 'ok', text: 'Wrap complete. You can fund the escrow with the same amount.' })
      void refetchErc20()
    } catch (e) {
      addLog({ kind: 'err', text: `Wrap: ${e instanceof Error ? e.message : String(e)}` })
    }
    setBusy(false)
  }

  const doRelease = async () => {
    if (!escrow) return
    setBusy(true)
    try {
      const h = await writeContractAsync({
        address: escrow,
        abi: escAbiT,
        functionName: 'releaseToSeller',
        chain: defaultChain,
      })
      if (publicClient) await publicClient.waitForTransactionReceipt({ hash: h })
      addLog({ kind: 'ok', text: `releaseToSeller: ${h}` })
    } catch (e) {
      addLog({ kind: 'err', text: String(e) })
    }
    setBusy(false)
  }

  const doRefund = async () => {
    if (!escrow) return
    setBusy(true)
    try {
      const h = await writeContractAsync({
        address: escrow,
        abi: escAbiT,
        functionName: 'refundToBuyer',
        chain: defaultChain,
      })
      if (publicClient) await publicClient.waitForTransactionReceipt({ hash: h })
      addLog({ kind: 'ok', text: `refundToBuyer: ${h}` })
    } catch (e) {
      addLog({ kind: 'err', text: String(e) })
    }
    setBusy(false)
  }

  const doReject = async () => {
    if (!escrow) return
    setBusy(true)
    try {
      const h = await writeContractAsync({
        address: escrow,
        abi: escAbiT,
        functionName: 'rejectBySeller',
        chain: defaultChain,
      })
      if (publicClient) await publicClient.waitForTransactionReceipt({ hash: h })
      addLog({ kind: 'ok', text: `rejectBySeller: ${h}` })
    } catch (e) {
      addLog({ kind: 'err', text: String(e) })
    }
    setBusy(false)
  }

  const isBuyer = Boolean(
    address && eBuyer && address.toLowerCase() === String(eBuyer).toLowerCase(),
  )
  const isSeller = Boolean(
    address && eSeller && address.toLowerCase() === String(eSeller).toLowerCase(),
  )
  const settled = Boolean(eReleased) || Boolean(eRefunded)

  return (
    <div className="app">
      <h1>PrivaRWA — Confidential RWA settlement</h1>
      <p className="lead">
        <span className="pill">iExec Nox + ERC-7984</span> On-chain RWA deal escrow: the payment amount
        in confidential cUSDC stays encrypted; settlement paths are public but not the face value. Built
        for the iExec Vibe Coding Challenge.
      </p>

      <div className="wallet-row">
        {!isConnected ? (
          <button
            className="btn"
            type="button"
            disabled={connPend}
            onClick={() => connect({ chainId: defaultChain.id, connector: connectors[0] })}
          >
            {connPend ? 'Connecting…' : 'Connect wallet (injected)'}
          </button>
        ) : (
          <>
            <span className="addr">{address}</span>
            {needSwitch ? (
              <button
                type="button"
                className="btn"
                onClick={() => switchChain({ chainId: defaultChain.id })}
              >
                Switch to Arbitrum Sepolia
              </button>
            ) : null}
            <button type="button" className="btn btn-ghost" onClick={() => disconnect()}>
              Disconnect
            </button>
          </>
        )}
      </div>
      {needSwitch ? <p className="muted">Switch the wallet network to Arbitrum Sepolia (chain {defaultChain.id}).</p> : null}

      <section>
        <h2>Confidential token (cUSDC from cdefi)</h2>
        <p className="muted">{CUSDC_DOC}</p>
        <label htmlFor="ctok">cToken (ERC-7984 wrapper) address</label>
        <input
          id="ctok"
          value={cToken}
          onChange={(e) => setCToken(e.target.value as `0x${string}`)}
          type="text"
          spellCheck={false}
        />
        <p className="muted">
          Token: {cName != null ? String(cName) : '…'} ({cSymbol != null ? String(cSymbol) : '…'}) {dec != null ? `decimals ${dec}` : ''} · public USDC for
          wrap: {String(underlyingAddr).slice(0, 10)}…
        </p>
        <p className="muted">Your public USDC balance: {rawBal != null ? String(rawBal) : '—'} (6 decimals in usual faucet)</p>
        <div className="row">
          <div>
            <label htmlFor="ul">Underlying (optional override)</label>
            <input id="ul" value={underlying} onChange={(e) => setUnderlying(e.target.value as `0x${string}`)} />
          </div>
          <div>
            <label>Wrap into cToken (same amount as fund)</label>
            <button type="button" className="btn btn-ghost" disabled={busy} onClick={() => void wrapIfNeeded()}>
              Approve (if needed) + Wrap
            </button>
          </div>
        </div>
        <div>
          <label>Your confidential balance (Nox handle decrypt via @iexec-nox/handle)</label>
          <div className="row" style={{ alignItems: 'end' }}>
            <p className="muted" style={{ margin: 0 }}>
              Handle: {hBuyer && (hBuyer as string).length > 20
                ? `${(hBuyer as string).slice(0, 18)}…`
                : '—'}
            </p>
            <button type="button" className="btn" onClick={() => void runDecrypt()} disabled={!canDecrypt}>
              Decrypt my cToken balance
            </button>
          </div>
          {plainBuyerBal != null ? <p className="log">{plainBuyerBal}</p> : null}
        </div>
      </section>

      <section>
        <h2>Factory + escrow (one RWA deal)</h2>
        <p className="muted">
          Set `VITE_FACTORY_ADDRESS` in `.env` after you deploy the factory, or paste it here for testing.
        </p>
        <label htmlFor="fa">RwaConfidentialEscrowFactory</label>
        <input
          id="fa"
          value={factory}
          onChange={(e) => setFactory(e.target.value as `0x${string}` | '')}
          type="text"
        />
        <div className="row">
          <div>
            <label htmlFor="s">Seller address</label>
            <input id="s" value={seller} onChange={(e) => setSeller(e.target.value)} placeholder="0x…" />
          </div>
          <div>
            <label htmlFor="d">Off-chain deal label (keccak256 = deal ref)</label>
            <input id="d" value={dealLabel} onChange={(e) => setDealLabel(e.target.value)} />
          </div>
        </div>
        <button type="button" className="btn" onClick={() => void createEscrow()} disabled={busy || !isConnected || needSwitch}>
          Create escrow (I am the buyer)
        </button>
        {escrow ? <p className="muted">Escrow: {escrow}</p> : null}
      </section>

      {escrow ? (
        <section>
          <h2>Fund &amp; settle</h2>
          <p>
            <strong>Fund</strong> sends your wrapped confidential token to the escrow. On-chain observers see a
            transfer to the escrow address, not the amount (ERC-7984 + Nox). Link:{' '}
            <a href="https://docs.iex.ec/nox-protocol/references/js-sdk" target="_blank" rel="noreferrer">
              Nox JS SDK
            </a>
            .
          </p>
          <div className="row">
            <div>
              <label htmlFor="f">Amount to escrow (cToken, same units as you wrapped)</label>
              <input id="f" value={fundAmount} onChange={(e) => setFundAmount(e.target.value)} />
            </div>
            <div style={{ alignSelf: 'end' }}>
              <button type="button" className="btn" onClick={() => void fundEscrow()} disabled={busy || !isConnected || needSwitch}>
                Encrypt + confidentialTransfer to escrow
              </button>
            </div>
          </div>
          {escrow && eBuyer && eSeller ? (
            <p className="muted">
              Buyer: {String(eBuyer)} · Seller: {String(eSeller)} · Released: {Boolean(eReleased) ? 'yes' : 'no'} ·
              Refunded: {Boolean(eRefunded) ? 'yes' : 'no'}
            </p>
          ) : null}
          {settled ? <p className="muted">This deal is already settled on-chain.</p> : null}
          <div className="row" style={{ marginTop: '0.5rem' }}>
            <button
              type="button"
              className="btn"
              disabled={!isBuyer || settled || busy}
              onClick={() => void doRelease()}
            >
              Release to seller (buyer)
            </button>
            <button
              type="button"
              className="btn btn-ghost"
              disabled={!isBuyer || settled || busy}
              onClick={() => void doRefund()}
            >
              Refund to buyer (buyer)
            </button>
            <button
              type="button"
              className="btn btn-ghost"
              disabled={!isSeller || settled || busy}
              onClick={() => void doReject()}
            >
              Reject to buyer (seller)
            </button>
          </div>
        </section>
      ) : null}

      {log.length ? (
        <section>
          <h2>Activity / trace</h2>
          {log.map((l, i) => (
            <p key={i} className="log" data-kind={l.kind}>
              [{l.kind}] {l.text}
            </p>
          ))}
        </section>
      ) : null}

      <p className="muted">
        Explorer: {explorerBase} — search your escrow or cToken. Full AI build log: <code>docs/AI_TRACES.md</code>.
        Hackathon:{' '}
        <a href="https://dorahacks.io/hackathon/vibe-coding-iexec/detail" target="_blank" rel="noreferrer">
          DoraHacks iExec Vibe Coding
        </a>
        . Feedback: <code>feedback.md</code>.
      </p>
    </div>
  )
}
