# Getting PrivaRWA working (E2E)

This is a **practical** list of what you need for a working **Arbitrum Sepolia** demo. The full rule set is in [REQUIREMENTS.md](./REQUIREMENTS.md).

## 1. One-time setup

| You need | Why |
|----------|-----|
| **Node 20+** and `npm` | Build the Vite app |
| **Foundry** (`forge`) | Compile and deploy the factory |
| **Git submodules** | Nox / OZ dependencies under `contracts/lib/` |
| **Injected wallet** (MetaMask, Rabby, …) | Sign txs and Nox handle operations |

After clone:

```bash
git submodule update --init --recursive
cd contracts && forge build
cd ../frontend && npm install && npm test && npm run build
```

## 2. Testnet money and tokens

| Asset | How |
|-------|-----|
| **ETH on Arbitrum Sepolia** | Faucet (e.g. [cdefi](https://cdefi.iex.ec) or [Arbitrum docs](https://docs.arbitrum.io/)) — pays gas |
| **Test USDC** | From the same **Confidential DeFi** / cdefi flow on Arbitrum Sepolia |
| **cUSDC (cToken, ERC-7984)** | **Wrap** USDC in cdefi or with the app; copy the **cToken contract address** into the UI or `VITE_CTOKEN_ADDRESS` |

Without a real cToken address, `name` / `decimals` reads fail and wrap/fund will not work.

## 3. Deploy the factory (once per team)

```bash
cd contracts
export PRIVATE_KEY=0x...   # funded deployer on chain 421614
forge script script/Deploy.s.sol:Deploy --rpc-url https://sepolia-rollup.arbitrum.io/rpc --broadcast
```

Put the printed **RwaConfidentialEscrowFactory** address in `frontend/.env` as `VITE_FACTORY_ADDRESS=0x...` (or paste in the app).

## 4. Front end

```bash
cd frontend
cp .env.example .env
# Set at least VITE_FACTORY_ADDRESS; optional VITE_CTOKEN_ADDRESS, VITE_ARBITRUM_SEPOLIA_RPC, VITE_GITHUB_REPO
npm run dev
```

Open the app, **connect**, **switch to Arbitrum Sepolia (421614)**, then follow the in-app **“What to do next”** and **Submission checklist**.

## 5. Two addresses (important)

- The **connected wallet** is the **buyer** when you click **Create escrow**.
- **Release** and **Refund** require the **buyer** wallet.
- **Reject** requires the **seller** wallet (the address you typed for the deal).

Use a second profile, hardware wallet, or browser to act as **seller** if you want to demo **Reject**. For only **Release/Refund**, one wallet (buyer) is enough.

## 6. Common issues

| Symptom | Likely cause |
|---------|----------------|
| “Set a valid cToken” / no token name | Wrong or empty cToken; use the address from cdefi on **this** network |
| “Set a valid factory” | Factory not deployed or not pasted in the form / `.env` |
| Tx reverts on wrap | No USDC, wrong underlying, or not enough approval — check public USDC balance in the app |
| Decrypt fails or shows nothing | Nox / wallet not on Sepolia, or you have no ACL to that handle (e.g. escrow for non–buyer) |
| Stuck “need switch” | Add Arbitrum Sepolia in the wallet and pick it for this site |

## 7. What is *not* automated in CI

CI runs `forge build` and `npm test` / `lint` / `build`. It does **not** run a real wallet or the Nox gateway. You still need a **manual** pass on testnet before submission.

---

*For AI-assisted build context, see [AI_TRACES.md](./AI_TRACES.md).*
