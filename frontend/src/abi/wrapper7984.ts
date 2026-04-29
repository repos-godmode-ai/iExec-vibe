/** Minimal ERC-20 to ERC-7984 wrapper (for cdefi cUSDC) */
export const wrapper7984Abi = [
  {
    name: 'wrap',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'bytes32', internalType: 'euint256' }],
  },
  {
    name: 'underlying',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'address' }],
  },
] as const
