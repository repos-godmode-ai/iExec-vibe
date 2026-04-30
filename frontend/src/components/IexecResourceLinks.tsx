import { IEXEC_DEVELOPER_LINKS } from '../config'

/**
 * iExec / Nox official resources (docs, Hello World, cdefi, wizard, faucet, npm).
 */
export function IexecResourceLinks() {
  return (
    <section className="iexec-links" aria-label="iExec developer resources">
      <h2>iExec developer resources</h2>
      <p className="muted" style={{ marginTop: 0 }}>
        Use <strong>Hello World</strong> to verify Nox end-to-end, then return here for the RWA escrow flow. Custom
        confidential tokens are supported — see the cdefi wizard.
      </p>
      <ul className="iexec-links-list">
        {IEXEC_DEVELOPER_LINKS.map((l) => (
          <li key={l.href}>
            <a href={l.href} target="_blank" rel="noreferrer">
              {l.label}
            </a>
          </li>
        ))}
      </ul>
    </section>
  )
}
