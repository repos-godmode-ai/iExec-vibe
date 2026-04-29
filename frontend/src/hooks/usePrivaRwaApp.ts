import { useCallback, useMemo, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import {
  useAccount,
  useConnect,
  useChainId,
  useDisconnect,
  usePublicClient,
  useWalletClient,
  useReadContract,
  useWriteContract,
  useSwitchChain,
} from 'wagmi'
import { createViemHandleClient } from '@iexec-nox/handle'
import { type Hex, keccak256, stringToBytes, parseUnits, type Hash } from 'viem'
import {
  cTokenFromEnv,
  factoryFromEnv,
  DEFAULT_UNDERLYING,
  ZERO_ADDRESS,
  defaultChain,
} from '../config'
import { irc7984Abi, rwaEscrowAbi, escrowFactoryAbi, erc20Abi, wrapper7984Abi } from '../abis/contracts'
import { isEmptyHandle, toAddress } from '../lib/address'
import { formatAmountLabel, shortHandle, shortHex } from '../lib/format'
import { parseEscrowFromLogs } from '../lib/parseFactoryEvent'
import { useActivityLog } from './useActivityLog'
import { useWithBusy } from './useWithBusy'

const chain = defaultChain
const cTokenRead = { chainId: chain.id, abi: irc7984Abi, address: ZERO_ADDRESS as `0x${string}` }

function toBigIntish(v: boolean | bigint | number | string): bigint {
  if (typeof v === 'boolean') return v ? 1n : 0n
  if (typeof v === 'bigint') return v
  return BigInt(String(v))
}

export function usePrivaRwaApp() {
  const queryClient = useQueryClient()
  const { address, isConnected } = useAccount()
  const { connect, connectors, isPending: connPend } = useConnect()
  const { disconnect } = useDisconnect()
  const { switchChain } = useSwitchChain()
  const chainId = useChainId()
  const { data: walletClient } = useWalletClient()
  const publicClient = usePublicClient({ chainId: chain.id })
  const { writeContractAsync } = useWriteContract()

  const { log, add, clear: clearLog } = useActivityLog()
  const { busy, run } = useWithBusy()

  const [cToken, setCToken] = useState<`0x${string}`>(() => cTokenFromEnv ?? ZERO_ADDRESS)
  const [factory, setFactory] = useState<`0x${string}` | ''>(factoryFromEnv ?? '')
  const [underlying, setUnderlying] = useState<`0x${string}`>(DEFAULT_UNDERLYING)
  const [escrow, setEscrow] = useState<`0x${string}` | null>(null)
  const [seller, setSeller] = useState('')
  const [dealLabel, setDealLabel] = useState('RWA-001')
  const [fundAmount, setFundAmount] = useState('1')
  const [plainBuyerBal, setPlainBuyerBal] = useState<string | null>(null)
  const [plainEscrowBal, setPlainEscrowBal] = useState<string | null>(null)

  const cValid = Boolean(cToken && cToken !== ZERO_ADDRESS)
  const needSwitch = isConnected && chainId !== chain.id

  const tokenKey: `0x${string}` = cValid ? cToken! : ZERO_ADDRESS
  const cTokenArgs = { ...cTokenRead, address: tokenKey }

  const { data: cName } = useReadContract({ ...cTokenArgs, functionName: 'name', query: { enabled: cValid } })
  const { data: cSymbol } = useReadContract({ ...cTokenArgs, functionName: 'symbol', query: { enabled: cValid } })
  const { data: cDec } = useReadContract({ ...cTokenArgs, functionName: 'decimals', query: { enabled: cValid } })
  const dec = cDec != null ? Number(cDec) : null

  const { data: cWrappingAddr } = useReadContract({
    address: tokenKey,
    chainId: chain.id,
    abi: wrapper7984Abi,
    functionName: 'underlying',
    query: { enabled: cValid },
  })

  /** Prefer on-chain `underlying()`; else manual (default) for custom RPC / testing. */
  const underlyingAddr = cWrappingAddr
    ? (cWrappingAddr as `0x${string}`)
    : underlying

  const { data: rawBal, refetch: refetchErc20 } = useReadContract({
    address: underlyingAddr,
    chainId: chain.id,
    abi: erc20Abi,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: { enabled: !!address && underlyingAddr !== ZERO_ADDRESS },
  })

  const escAddr = escrow ?? ZERO_ADDRESS
  const { data: eBuyer } = useReadContract({
    address: escAddr,
    chainId: chain.id,
    abi: rwaEscrowAbi,
    functionName: 'buyer',
    query: { enabled: !!escrow },
  })
  const { data: eSeller } = useReadContract({
    address: escAddr,
    chainId: chain.id,
    abi: rwaEscrowAbi,
    functionName: 'seller',
    query: { enabled: !!escrow },
  })
  const { data: eReleased } = useReadContract({
    address: escAddr,
    chainId: chain.id,
    abi: rwaEscrowAbi,
    functionName: 'released',
    query: { enabled: !!escrow },
  })
  const { data: eRefunded } = useReadContract({
    address: escAddr,
    chainId: chain.id,
    abi: rwaEscrowAbi,
    functionName: 'refunded',
    query: { enabled: !!escrow },
  })

  const { data: hBuyer } = useReadContract({
    address: tokenKey,
    chainId: chain.id,
    abi: irc7984Abi,
    functionName: 'confidentialBalanceOf',
    args: address ? [address] : undefined,
    query: { enabled: !!address && cValid },
  })
  const { data: hEscrow } = useReadContract({
    address: tokenKey,
    chainId: chain.id,
    abi: irc7984Abi,
    functionName: 'confidentialBalanceOf',
    args: escrow ? [escrow] : undefined,
    query: { enabled: cValid && !!escrow },
  })

  const invalidateReads = useCallback(() => {
    void queryClient.invalidateQueries()
  }, [queryClient])

  const canDecryptBuyer = Boolean(cValid && hBuyer && !isEmptyHandle(hBuyer as Hex))
  const canDecryptEscrow = Boolean(cValid && escrow && hEscrow && !isEmptyHandle(hEscrow as Hex))

  const runDecrypt = useCallback(
    async (target: 'buyer' | 'escrow', handle: Hex) => {
      if (!walletClient) return
      if (isEmptyHandle(handle)) {
        if (target === 'buyer') setPlainBuyerBal('0 (no balance)')
        else setPlainEscrowBal('0 (no balance)')
        return
      }
      const hc = await createViemHandleClient(walletClient)
      const d = await hc.decrypt(handle)
      const v = toBigIntish(d.value)
      if (dec == null) {
        if (target === 'buyer') setPlainBuyerBal(String(v))
        else setPlainEscrowBal(String(v))
        return
      }
      const u = cSymbol != null ? String(cSymbol) : 'tokens'
      if (target === 'buyer') {
        setPlainBuyerBal(formatAmountLabel(v, dec, u))
      } else {
        setPlainEscrowBal(formatAmountLabel(v, dec, u))
      }
    },
    [walletClient, dec, cSymbol],
  )

  const onDecryptBuyer = useCallback(() => {
    if (!cValid) {
      add({ kind: 'err', text: 'Set a valid cToken address.' })
      return
    }
    void run(async () => {
      try {
        await runDecrypt('buyer', hBuyer as Hex)
      } catch (e) {
        add({ kind: 'err', text: `Decrypt failed: ${e instanceof Error ? e.message : String(e)}` })
      }
    })
  }, [cValid, hBuyer, run, runDecrypt, add])

  const onDecryptEscrow = useCallback(() => {
    if (!escrow || !cValid) {
      add({ kind: 'err', text: 'Set cToken and create an escrow first.' })
      return
    }
    void run(async () => {
      try {
        await runDecrypt('escrow', hEscrow as Hex)
      } catch (e) {
        add({
          kind: 'err',
          text: `Escrow decrypt: ${e instanceof Error ? e.message : String(e)} (only buyer/ACL may have access)`,
        })
      }
    })
  }, [escrow, cValid, hEscrow, run, runDecrypt, add])

  const createEscrow = useCallback(() => {
    if (!publicClient || !writeContractAsync) {
      add({ kind: 'err', text: 'Connect wallet and wait for the RPC client.' })
      return
    }
    const f = toAddress(factory)
    if (!f) {
      add({ kind: 'err', text: 'Set a valid factory address (0x + 40 hex chars).' })
      return
    }
    const s = toAddress(seller)
    if (!s) {
      add({ kind: 'err', text: 'Invalid seller address.' })
      return
    }
    if (!cValid) {
      add({ kind: 'err', text: 'Set cToken to your cUSDC from cdefi.' })
      return
    }
    void run(async () => {
      const dealRef = keccak256(stringToBytes(dealLabel || 'deal')) as `0x${string}`
      const hash = (await writeContractAsync({
        address: f,
        abi: escrowFactoryAbi,
        functionName: 'createEscrow',
        args: [cToken, s, dealRef],
        chain,
      })) as Hash
      const receipt = await publicClient.waitForTransactionReceipt({ hash })
      const ex = parseEscrowFromLogs(receipt.logs)
      if (ex) {
        setEscrow(ex)
        add({ kind: 'ok', text: `Escrow: ${ex}` })
        invalidateReads()
        return
      }
      add({ kind: 'err', text: 'Could not parse escrow from tx logs. Open the hash on Arbiscan to verify the factory event.' })
    })
  }, [publicClient, writeContractAsync, factory, seller, cToken, cValid, dealLabel, add, run, invalidateReads])

  const fundEscrow = useCallback(() => {
    if (!walletClient || !escrow) {
      add({ kind: 'err', text: 'Create an escrow first.' })
      return
    }
    if (dec == null) {
      add({ kind: 'err', text: 'Could not read token decimals (check cToken on Arbitrum Sepolia).' })
      return
    }
    void run(async () => {
      if (!publicClient) throw new Error('No public client')
      const hc = await createViemHandleClient(walletClient)
      const v = parseUnits(fundAmount, dec)
      const { handle, handleProof } = await hc.encryptInput(v, 'uint256', cToken)
      const hash = (await writeContractAsync({
        address: cToken,
        abi: irc7984Abi,
        functionName: 'confidentialTransfer',
        args: [escrow, handle, handleProof as Hex],
        chain,
      })) as Hash
      await publicClient.waitForTransactionReceipt({ hash })
      add({ kind: 'ok', text: `Funded escrow. Tx: ${hash}` })
      setPlainEscrowBal(null)
      invalidateReads()
    })
  }, [walletClient, escrow, dec, fundAmount, cToken, publicClient, writeContractAsync, add, run, invalidateReads])

  const wrap = useCallback(() => {
    if (!publicClient || !address) {
      add({ kind: 'err', text: 'Connect wallet' })
      return
    }
    if (dec == null) {
      add({ kind: 'err', text: 'Wait for token metadata or set cToken.' })
      return
    }
    if (!cValid) {
      add({ kind: 'err', text: 'Set cToken first.' })
      return
    }
    const want = parseUnits(fundAmount, dec)
    void run(async () => {
      const a = (await publicClient.readContract({
        address: underlyingAddr,
        abi: erc20Abi,
        functionName: 'allowance',
        args: [address, cToken],
      })) as bigint
      if (a < want) {
        const h1 = (await writeContractAsync({
          address: underlyingAddr,
          abi: erc20Abi,
          functionName: 'approve',
          args: [cToken, 2n ** 256n - 1n],
          chain,
        })) as Hash
        await publicClient.waitForTransactionReceipt({ hash: h1 })
        add({ kind: 'info', text: 'Approval confirmed.' })
      }
      const h2 = (await writeContractAsync({
        address: cToken,
        abi: wrapper7984Abi,
        functionName: 'wrap',
        args: [address, want],
        chain,
      })) as Hash
      await publicClient.waitForTransactionReceipt({ hash: h2 })
      add({ kind: 'ok', text: 'Wrap complete. You can fund the escrow with the same amount.' })
      void refetchErc20()
      invalidateReads()
    })
  }, [
    publicClient,
    address,
    dec,
    fundAmount,
    cValid,
    cToken,
    underlyingAddr,
    writeContractAsync,
    add,
    run,
    refetchErc20,
    invalidateReads,
  ])

  const doEscrowCall = useCallback(
    (fn: 'releaseToSeller' | 'refundToBuyer' | 'rejectBySeller', label: string) => {
      if (!escrow) return
      if (!publicClient) {
        add({ kind: 'err', text: 'No RPC client' })
        return
      }
      void run(async () => {
        const h = (await writeContractAsync({
          address: escrow,
          abi: rwaEscrowAbi,
          functionName: fn,
          chain,
        })) as Hash
        await publicClient.waitForTransactionReceipt({ hash: h })
        add({ kind: 'ok', text: `${label}: ${h}` })
        setPlainEscrowBal(null)
        invalidateReads()
      })
    },
    [escrow, publicClient, writeContractAsync, add, run, invalidateReads],
  )

  const isBuyer = useMemo(
    () => Boolean(address && eBuyer && address.toLowerCase() === String(eBuyer).toLowerCase()),
    [address, eBuyer],
  )
  const isSeller = useMemo(
    () => Boolean(address && eSeller && address.toLowerCase() === String(eSeller).toLowerCase()),
    [address, eSeller],
  )
  const settled = Boolean(eReleased) || Boolean(eRefunded)

  return {
    address,
    isConnected,
    connPend,
    needSwitch,
    connect: () => {
      const c = connectors[0]
      if (c) {
        void connect({ chainId: chain.id, connector: c })
        return
      }
      add({ kind: 'err', text: 'No wallet extension found' })
    },
    disconnect,
    switchToSepolia: () => switchChain({ chainId: chain.id }),
    chain,
    cToken,
    setCToken,
    cName,
    cSymbol,
    dec,
    cValid,
    factory,
    setFactory,
    underlying,
    setUnderlying,
    underlyingAddr,
    rawBal,
    shortHex,
    shortHandle,
    hBuyer: hBuyer as Hex | undefined,
    hEscrow: hEscrow as Hex | undefined,
    canDecryptBuyer,
    canDecryptEscrow,
    plainBuyerBal,
    plainEscrowBal,
    onDecryptBuyer,
    onDecryptEscrow,
    escrow,
    setEscrow,
    seller,
    setSeller,
    dealLabel,
    setDealLabel,
    eBuyer,
    eSeller,
    eReleased,
    eRefunded,
    settled,
    isBuyer,
    isSeller,
    fundAmount,
    setFundAmount,
    createEscrow,
    fundEscrow,
    wrap,
    release: () => doEscrowCall('releaseToSeller', 'releaseToSeller'),
    refund: () => doEscrowCall('refundToBuyer', 'refundToBuyer'),
    reject: () => doEscrowCall('rejectBySeller', 'rejectBySeller'),
    busy,
    log,
    clearLog,
  }
}
