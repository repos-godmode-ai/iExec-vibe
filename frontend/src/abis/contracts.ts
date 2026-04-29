import irc from './ierc7984.json'
import escrow from './rwaEscrow.json'
import factory from './escrowFactory.json'
import { erc20Abi } from '../abi/erc20'
import { wrapper7984Abi } from '../abi/wrapper7984'
import type { Abi } from 'viem'

export const irc7984Abi = irc as unknown as Abi
export const rwaEscrowAbi = escrow as unknown as Abi
export const escrowFactoryAbi = factory as unknown as Abi
export { erc20Abi, wrapper7984Abi }
