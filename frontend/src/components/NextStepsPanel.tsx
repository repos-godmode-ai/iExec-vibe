import { defaultChain } from '../config'

type Props = {
  nextHint: string | null
}

/**
 * One-line “what to do next” for the E2E demo, plus a note when the on-chain path is done.
 */
export function NextStepsPanel({ nextHint }: Props) {
  return (
    <section className="next-steps" aria-label="Next step for the demo">
      <h2>What to do next</h2>
      {nextHint != null ? (
        <>
          <p className="next-steps-hint" style={{ marginTop: 0 }}>
            {nextHint}
          </p>
          <p className="muted" style={{ marginBottom: 0 }}>
            You need <strong>two accounts</strong> to exercise every button: this wallet is the <strong>buyer</strong>;{' '}
            use another address as <strong>seller</strong> (Release / Refund need buyer; Reject needs seller).
            Network must be <strong>Arbitrum Sepolia</strong> (chain {defaultChain.id}).
          </p>
        </>
      ) : (
        <p className="next-steps-hint next-steps-hint--ok" style={{ marginTop: 0, marginBottom: 0 }}>
          On-chain flow is complete for this deal. For submission: record a ≤4 min video, keep{' '}
          <code>feedback.md</code> in the repo, and post on X per <code>docs/REQUIREMENTS.md</code>.
        </p>
      )}
    </section>
  )
}
