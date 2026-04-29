import { arbitrumSepolia } from 'viem/chains'

export const defaultChain = arbitrumSepolia
export const chainId = arbitrumSepolia.id

export const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000' as const

/** Arbitrum Sepolia test USDC from cdefi path (optional display default). */
export const DEFAULT_UNDERLYING =
  '0x1baabb04529d43a73232b713c0fe471f7c7334d5' as const

/** Get from cdefi.iex.ec: confidential wrapper (ERC-7984) for test USDC. */
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
  'Use the Confidential DeFi app at cdefi.iex.ec on Arbitrum Sepolia: get test ETH and USDC from the faucet, then wrap to cUSDC. Copy the cUSDC (ERC-7984) contract address into the field below.'
