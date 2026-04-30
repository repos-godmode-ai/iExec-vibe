import { arbitrumSepolia } from 'viem/chains'

export const defaultChain = arbitrumSepolia
export const chainId = arbitrumSepolia.id

export const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000' as const

/**
 * Arbitrum Sepolia test USDC (from iExec / cdefi; you may deploy a custom pair instead).
 * @see https://cdefi.iex.ec
 */
export const DEFAULT_UNDERLYING =
  '0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d' as const

/**
 * Default cUSDC (ERC-7984) on Arbitrum Sepolia when `VITE_CTOKEN_ADDRESS` is unset.
 * You can deploy a custom wrapper via cdefi wizard — override via env or UI.
 */
export const DEFAULT_CTOKEN =
  '0x1CCeC6bC60dB15E4055D43Dc2531BB7D4E5B808e' as const

/** Override defaults from `.env` / CI (optional). */
export const cTokenFromEnv = import.meta.env.VITE_CTOKEN_ADDRESS as
  | `0x${string}`
  | undefined
/** Deployed RwaConfidentialEscrowFactory on Arbitrum Sepolia. */
export const factoryFromEnv = import.meta.env.VITE_FACTORY_ADDRESS as
  | `0x${string}`
  | undefined
export const explorerBase = 'https://sepolia.arbiscan.io'

/** If set, README / checklist links in the app point to your public repo. */
export const GITHUB_REPO_URL = (import.meta.env.VITE_GITHUB_REPO as string | undefined)?.replace(/\/$/, '')

export const CUSDC_HELP =
  'Use the Confidential DeFi demo at cdefi.iex.ec (faucet included) on Arbitrum Sepolia: get test ETH and USDC, then wrap to cUSDC. Defaults below match the official pair; you can paste another cToken or deploy your own via the cdefi wizard.'

/** Curated links from iExec (Nox docs, Hello World, faucets, npm, wizard). */
export const IEXEC_DEVELOPER_LINKS: ReadonlyArray<{ label: string; href: string }> = [
  { label: 'Nox — Getting started', href: 'https://docs.iex.ec/nox-protocol/getting-started/welcome' },
  { label: 'Hello World (E2E Nox flow)', href: 'https://docs.iex.ec/nox-protocol/getting-started/hello-world' },
  { label: 'cdefi — demo & faucet', href: 'https://cdefi.iex.ec' },
  { label: 'cdefi wizard (custom cUSDC)', href: 'https://cdefi-wizard.iex.ec' },
  { label: 'RLC faucet (Arbitrum Sepolia)', href: 'https://explorer.iex.ec/arbitrum-sepolia-testnet/account?accountTab=Faucet' },
  { label: '@iexec-nox on npm', href: 'https://www.npmjs.com/org/iexec-nox?activeTab=packages' },
  { label: 'iExec developer hub (linktree)', href: 'https://linktr.ee/iexec.tech' },
]
