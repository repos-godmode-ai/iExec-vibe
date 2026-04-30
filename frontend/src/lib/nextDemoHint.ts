import { isValidEvmAddress } from './address'

export type NextDemoState = {
  isConnected: boolean
  needSwitch: boolean
  chainId: number
  targetChainId: number
  cValid: boolean
  factoryInput: string
  factoryFromEnv?: `0x${string}` | undefined
  escrow: `0x${string}` | null
  wrapStepDone: boolean
  fundStepDone: boolean
  settled: boolean
}

function factoryOk(factoryInput: string, factoryFromEnv: `0x${string}` | undefined): boolean {
  return Boolean(factoryFromEnv) || isValidEvmAddress(factoryInput)
}

/**
 * Single “do this next” line for the demo path. Returns null when on-chain flow is complete.
 */
export function getNextDemoHint(s: NextDemoState): string | null {
  if (!s.isConnected) {
    return 'Connect your wallet using the button above.'
  }
  if (s.needSwitch || s.chainId !== s.targetChainId) {
    return `Switch the wallet to Arbitrum Sepolia (chain ${s.targetChainId}).`
  }
  if (!s.cValid) {
    return 'Paste the cUSDC (ERC-7984) contract address from cdefi.iex.ec, or set VITE_CTOKEN_ADDRESS in frontend/.env.'
  }
  if (!factoryOk(s.factoryInput, s.factoryFromEnv)) {
    return 'Set the deployed RwaConfidentialEscrowFactory address (forge script in README) or VITE_FACTORY_ADDRESS.'
  }
  if (!s.escrow) {
    return 'Enter the seller address and deal label, then create escrow (your wallet is the buyer).'
  }
  if (!s.wrapStepDone) {
    return 'Get cUSDC: use Wrap in this app or cdefi; you need a non-zero confidential balance before funding.'
  }
  if (!s.fundStepDone) {
    return 'Fund the escrow with Encrypt + transfer to escrow (confidential amount).'
  }
  if (!s.settled) {
    return 'Settle: connect as buyer for Release/Refund, or as seller for Reject — until one completes on-chain.'
  }
  return null
}
