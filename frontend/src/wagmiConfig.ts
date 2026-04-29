import { createConfig, http } from 'wagmi'
import { arbitrumSepolia } from 'viem/chains'
import { injected } from 'wagmi/connectors'

const rpc = import.meta.env.VITE_ARBITRUM_SEPOLIA_RPC as string | undefined

export const wagmiConfig = createConfig({
  chains: [arbitrumSepolia],
  connectors: [injected()],
  transports: {
    [arbitrumSepolia.id]: http(
      rpc && rpc.length > 0 ? rpc : 'https://sepolia-rollup.arbitrum.io/rpc',
    ),
  },
})
