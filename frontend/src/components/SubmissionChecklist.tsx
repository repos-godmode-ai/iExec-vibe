import { defaultChain, explorerBase, factoryFromEnv, GITHUB_REPO_URL } from '../config'
import { isValidEvmAddress } from '../lib/address'
import type { ReactNode } from 'react'

type Props = {
  isConnected: boolean
  needSwitch: boolean
  chainId: number
  cValid: boolean
  factory: string
  escrow: `0x${string}` | null
  wrapStepDone: boolean
  fundStepDone: boolean
  settled: boolean
}

function doneLabel(done: boolean) {
  return done ? 'Done' : 'Open'
}

export function SubmissionChecklist({
  isConnected,
  needSwitch,
  chainId,
  cValid,
  factory,
  escrow,
  wrapStepDone,
  fundStepDone,
  settled,
}: Props) {
  const onSepolia = isConnected && !needSwitch && chainId === defaultChain.id
  const factoryFromUser = isValidEvmAddress(factory)
  const factoryOk = Boolean(factoryFromEnv) || factoryFromUser

  const itemStates = [onSepolia, cValid, factoryOk, Boolean(escrow), wrapStepDone, fundStepDone, settled]
  const doneCount = itemStates.filter(Boolean).length

  const items: { id: string; done: boolean; children: ReactNode }[] = [
    {
      id: 'chain',
      done: onSepolia,
      children: (
        <>
          Wallet on <strong>Arbitrum Sepolia</strong> (chain {defaultChain.id})
        </>
      ),
    },
    {
      id: 'ctoken',
      done: cValid,
      children: (
        <>
          <strong>cToken</strong> (ERC-7984) from cdefi — set in app or <code>VITE_CTOKEN_ADDRESS</code>
        </>
      ),
    },
    {
      id: 'factory',
      done: factoryOk,
      children: (
        <>
          <strong>Factory</strong> deployed — set <code>VITE_FACTORY_ADDRESS</code> or paste in the form
        </>
      ),
    },
    {
      id: 'escrow',
      done: Boolean(escrow),
      children: (
        <>
          <strong>Escrow</strong> created for a deal
        </>
      ),
    },
    {
      id: 'wrap',
      done: wrapStepDone,
      children: (
        <>
          <strong>Wrap</strong> USDC → cUSDC (session or you already have cUSDC — balance handle on-chain)
        </>
      ),
    },
    {
      id: 'fund',
      done: fundStepDone,
      children: (
        <>
          <strong>Fund</strong> escrow with encrypted amount (Nox); also counts if escrow already holds cUSDC
        </>
      ),
    },
    {
      id: 'settle',
      done: settled,
      children: (
        <>
          <strong>Release / refund / reject</strong> so the deal is settled on-chain
        </>
      ),
    },
  ]

  return (
    <section className="checklist" aria-label="Submission checklist">
      <h2>Submission checklist (DoraHacks / iExec)</h2>
      <p className="muted" style={{ marginTop: 0 }}>
        Progress for an end-to-end demo. Full rules:{' '}
        {GITHUB_REPO_URL ? (
          <a
            href={`${GITHUB_REPO_URL}/blob/main/docs/REQUIREMENTS.md`}
            target="_blank"
            rel="noreferrer"
          >
            docs/REQUIREMENTS.md
          </a>
        ) : (
          <code>docs/REQUIREMENTS.md</code>
        )}{' '}
        in the repo. Also ship <code>feedback.md</code>, a ≤4 min video, and an X post tagging @iEx_ec and
        @Chain_GPT.         Set <code>VITE_GITHUB_REPO</code> in <code>frontend/.env</code> to turn the doc link
        clickable.
      </p>
      <p className="checklist-progress" role="status" aria-label="Checklist progress">
        {doneCount} of {itemStates.length} complete
      </p>
      <ul className="checklist-list">
        {items.map((row) => (
          <li key={row.id} className={row.done ? 'checklist-item checklist-item--done' : 'checklist-item'}>
            <span className="checklist-pill" aria-hidden>
              {doneLabel(row.done)}
            </span>
            <span>{row.children}</span>
          </li>
        ))}
      </ul>
      <p className="muted" style={{ marginBottom: 0 }}>
        {(() => {
          if (!onSepolia || !cValid || !factoryOk) {
            return 'Connect, switch to Arbitrum Sepolia, set a valid cToken, and set the factory (env or form).'
          }
          if (!escrow) {
            return 'Create an escrow with seller and deal ref.'
          }
          if (!wrapStepDone) {
            return 'Wrap USDC to cUSDC in cdefi or with the app (or you already have a cUSDC balance on-chain).'
          }
          if (!fundStepDone) {
            return 'Fund the escrow with an encrypted transfer (or the escrow already holds cUSDC).'
          }
          if (!settled) {
            return null
          }
          return 'On-chain path is complete. Export your video, keep the repo public, and post on X with @iEx_ec and @Chain_GPT.'
        })()}{' '}
        {onSepolia && cValid && factoryOk && escrow && fundStepDone && !settled ? (
          <>
            Complete <strong>release</strong>, <strong>refund</strong>, or <strong>reject</strong> on-chain, then
            record a ≤4 min demo video. Commit <code>feedback.md</code> and post on X (see{' '}
            {GITHUB_REPO_URL ? (
              <a href={`${GITHUB_REPO_URL}/blob/main/docs/REQUIREMENTS.md`} target="_blank" rel="noreferrer">
                requirements
              </a>
            ) : (
              'docs/REQUIREMENTS.md'
            )}
            ).{' '}
          </>
        ) : null}{' '}
        <a href={explorerBase} target="_blank" rel="noreferrer">
          Arbiscan Sepolia
        </a>
      </p>
    </section>
  )
}
