# PrivaRWA — confidential RWA settlement (iExec Nox)

End-to-end dApp for the [iExec Vibe Coding Challenge](https://dorahacks.io/hackathon/vibe-coding-iexec/detail): a **one-deal RWA escrow** on **Arbitrum Sepolia** that holds **iExec Confidential Token** (ERC-7984) so payment *amounts* stay encrypted on-chain while settlement (release / refund / reject) is transparent.

- **On-chain:** `RwaConfidentialEscrow` + `RwaConfidentialEscrowFactory` (Foundry) using `IERC7984` from [nox-confidential-contracts](https://github.com/iExec-Nox/nox-confidential-contracts) and the Nox SDK from [nox-protocol-contracts](https://github.com/iExec-Nox/nox-protocol-contracts).
- **Off-chain (browser):** [Nox JavaScript SDK](https://docs.iex.ec/nox-protocol/references/js-sdk) (`@iexec-nox/handle`) for `encryptInput` before `confidentialTransfer` and `decrypt` of balance handles.
- **Demo tokens:** use the [Confidential DeFi live demo](https://cdefi.iex.ec) to get test ETH, USDC, and **wrap** to confidential cUSDC, then paste the cUSDC contract address into the app (or set `VITE_CTOKEN_ADDRESS`).

## What evaluators need

| Requirement | Where |
|-------------|--------|
| Nox + Confidential Token | cToken wrap/unwrap + `confidentialTransfer` with encrypted amount |
| No mock-only path | All reads/writes are real Sepolia + gateway calls when configured |
| Arbitrum Sepolia deployment | You deploy the factory; app reads live contracts |
| `feedback.md` | [feedback.md](./feedback.md) |
| Full rules, checklist, glossary | [docs/REQUIREMENTS.md](./docs/REQUIREMENTS.md) |
| **Run the app (prerequisites, two wallets, troubleshooting)** | [docs/GETTING_STARTED.md](./docs/GETTING_STARTED.md) |
| AI / vibe coding trace | [docs/AI_TRACES.md](./docs/AI_TRACES.md) |
| 4 min video | Record a screen capture of: connect → wrap → create escrow → fund (encrypted) → release/refund (record locally; not in repo) |

## Why this problem statement

RWA buyers and issuers need **settlement** without advertising exact ticket sizes in the public mempool. A confidential stablecoin (cUSDC) matches the “private securities / T-Bill–style” builder ideas: **composable, auditable, but not public down to the dollar** until parties choose to disclose. Similar winning hackathon projects combine **TEE or privacy compute + clear user story** (e.g. private credit scoring, blind vaults, institutional discretion).

## Project layout

```
contracts/          Foundry: escrow + factory; lib/ = git submodules
frontend/           Vite + React + Wagmi + @iexec-nox/handle
docs/REQUIREMENTS.md  DoraHacks rules, scope, demo checklist
docs/GETTING_STARTED.md  Prerequisites, env, two-wallet demo, troubleshooting
docs/AI_TRACES.md   Cursor / AI build log
feedback.md         iExec tooling feedback
```

After `git clone`, run:

```bash
git submodule update --init --recursive
```

Then install, test, and build the UI:

```bash
cd frontend && npm install && npm test && npm run lint && npm run build
```

And compile contracts (requires [Foundry](https://book.getfoundry.sh/)):

```bash
cd contracts && forge build
```

`npm test` runs [Vitest](https://vitest.dev/) on pure helpers (address validation, `parseEscrowFromLogs` round-trip with a synthetic log). The browser flow still needs a manual wallet + testnet check.
## Prerequisites

- Node 20+ and `npm`
- [Foundry](https://book.getfoundry.sh/) (`forge`, `cast`)
- MetaMask (or any injected wallet) on **Arbitrum Sepolia** (`chainId` 421614)
- Test **ETH** and (from cdefi faucet) **USDC**; then **wrap** to cUSDC in the official demo and copy the **cToken** address

## Deploy the factory (once)

```bash
cd contracts
export PRIVATE_KEY=0x...   # deployer on Arbitrum Sepolia; fund with test ETH
forge script script/Deploy.s.sol:Deploy --rpc-url https://sepolia-rollup.arbitrum.io/rpc --broadcast
```

Note the `RwaConfidentialEscrowFactory` address. Verify on [Arbiscan Sepolia](https://sepolia.arbiscan.io) if you use an API key:

```bash
export ETHERSCAN_API_KEY=...
forge verify-contract --chain 421614 --verifier arbitrum-sepolia <factory> src/RwaConfidentialEscrowFactory.sol:RwaConfidentialEscrowFactory
```

## Front end (local)

```bash
cd frontend
cp .env.example .env
# Edit: VITE_FACTORY_ADDRESS=0xYourFactory
# Optional: VITE_CTOKEN_ADDRESS, VITE_GITHUB_REPO (for in-app link to docs/REQUIREMENTS.md), VITE_ARBITRUM_SEPOLIA_RPC
npm run dev
```

Open the printed `localhost` URL, connect the wallet, switch to Arbitrum Sepolia, paste cToken if not in `.env`, create an escrow with a **seller** address, **fund** (encrypts amount via Nox), then use **Release** / **Refund** / **Reject** as the appropriate party.

## Production / hosted build

```bash
cd frontend
npm run build
# serve ./frontend/dist/ with any static host; same env vars as above
```

## CI

GitHub Actions (`.github/workflows/ci.yml`) runs `forge build` on `contracts/` and `npm ci && npm test && npm run lint && npm run build` on `frontend/` on pushes to `main` and `cursor/**` branches.


MIT — see [contracts](contracts/src) and `frontend` package metadata.

## Compliance note

This is a **testnet** prototype. Real RWA sale settlement requires legal agreements, KYC, and off-chain attestation. The dApp only demonstrates **technical** confidentiality of token amounts on-chain per iExec Nox and ERC-7984.
