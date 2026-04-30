# Getting PrivaRWA working (E2E)

This is a **practical** list of what you need for a working **Arbitrum Sepolia** demo. The full rule set is in [REQUIREMENTS.md](./REQUIREMENTS.md).

## Official test token pair (Arbitrum Sepolia)

Shared by the iExec team for this stack (you can also deploy a **custom** cUSDC via the [cdefi wizard](https://cdefi-wizard.iex.ec)):

| Token | Address |
|-------|---------|
| **USDC** (underlying) | `0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d` |
| **cUSDC** (ERC-7984) | `0x1CCeC6bC60dB15E4055D43Dc2531BB7D4E5B808e` |

The front end **defaults** to this cUSDC; set `VITE_CTOKEN_ADDRESS` only to override.

## iExec resources (Nox, Hello World, faucets)

- [Nox — getting started](https://docs.iex.ec/nox-protocol/getting-started/welcome)
- [Hello World (E2E Nox)](https://docs.iex.ec/nox-protocol/getting-started/hello-world)
- [cdefi — demo & USDC / wrap / faucet](https://cdefi.iex.ec)
- [cdefi wizard — custom confidential token](https://cdefi-wizard.iex.ec)
- [RLC faucet — Arbitrum Sepolia](https://explorer.iex.ec/arbitrum-sepolia-testnet/account?accountTab=Faucet)
- [@iexec-nox packages on npm](https://www.npmjs.com/org/iexec-nox?activeTab=packages)
- [iExec developer hub (linktree)](https://linktr.ee/iexec.tech)

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
| **ETH on Arbitrum Sepolia** | [cdefi](https://cdefi.iex.ec), [RLC / explorer faucet](https://explorer.iex.ec/arbitrum-sepolia-testnet/account?accountTab=Faucet), or [Arbitrum docs](https://docs.arbitrum.io/) — pays gas |
| **Test USDC** | [cdefi](https://cdefi.iex.ec) faucet / Confidential DeFi flow |
| **cUSDC (cToken)** | App defaults to official address above; **wrap** USDC in-app or in cdefi; use [wizard](https://cdefi-wizard.iex.ec) for your own wrapper |

Without a real cToken address (default or `VITE_CTOKEN_ADDRESS`), `name` / `decimals` reads fail and wrap/fund will not work.

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
