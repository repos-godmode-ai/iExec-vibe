import { arbitrumSepolia } from 'viem/chains'

export const defaultChain = arbitrumSepolia
export const chainId = arbitrumSepolia.id

/** Get from cdefi.iex.ec or the hackathon: confidential wrapper (ERC-7984) for a test USDC. */
export const cTokenFromEnv = import.meta.env.VITE_CTOKEN_ADDRESS as
  | `0x${string}`
  | undefined
/** You deploy the factory on Arbitrum Sepolia and set this (see /contracts README). */
export const factoryFromEnv = import.meta.env.VITE_FACTORY_ADDRESS as
  | `0x${string}`
  | undefined
export const explorerBase = 'https://sepolia.arbiscan.io'
