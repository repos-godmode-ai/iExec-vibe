# PrivaRWA — requirements and alignment

This file keeps the **DoraHacks / iExec Vibe Coding Challenge** rules and our **project scope** in one place so the team, reviewers, and future you stay aligned.

**Official brief:** [iExec Vibe Coding Challenge on DoraHacks](https://dorahacks.io/hackathon/vibe-coding-iexec/detail)

---

## 1. Challenge rules (must ship)

| # | Requirement | How PrivaRWA satisfies it | Evidence |
|---|-------------|---------------------------|----------|
| 1 | **Nox + Confidential Token** — app must use iExec Nox and Confidential Tokens with a real role (e.g. rewards, governance, private payment, in-app currency, access control) | **Private payment / settlement:** users hold **ERC-7984 cUSDC**, fund an escrow with **encrypted amount** (`encryptInput` + `confidentialTransfer`), settle with `confidentialTransferFrom` from the escrow contract | Front end + `RwaConfidentialEscrow` + `RwaConfidentialEscrowFactory` |
| 2 | **No mock-only data** — end-to-end must not rely on fake chain data for submission | Flow uses **Arbitrum Sepolia** RPC, real cToken, real Nox gateway when you connect a wallet | Run on testnet with real addresses |
| 3 | **Deployed on Arbitrum Sepolia or Arbitrum** | **Factory + escrow** are meant to be deployed to **421614**; default RPC and Wagmi chain are Sepolia | `forge script` in README; env `VITE_FACTORY_ADDRESS` |
| 4 | **`feedback.md` in the repo** | [../feedback.md](../feedback.md) | Committed file |
| 5 | **4 minute max demo video** | Not in git — you record: connect → network → cToken → (optional) deploy factory → create escrow → wrap → fund → release/refund | Loom / screen record |
| 6 | **Public GitHub** — open code, README, how to run | This repo | — |
| 7 | **Functional front-end** | Vite + React + Wagmi + `@iexec-nox/handle` | `frontend/` |
| 8 | **Post on X** for submission: short text, **demo video**, **repo link**, tag **@iEx_ec** and **@Chain_GPT** | You post after video is ready | [Challenge “How to Participate”](https://dorahacks.io/hackathon/vibe-coding-iexec/detail) |
| 9 | **Vibe coding** (Cursor, Claude, etc.) — encouraged, not a substitute for working software | [docs/AI_TRACES.md](./AI_TRACES.md) | Trace doc |

**Optional (sponsor):** **ChainGPT** — contact on Telegram for API credits if you add LLM features; not required for core Nox integration.

---

## 2. Evaluation criteria (from the brief)

| Criterion | What judges look for | PrivaRWA focus |
|-----------|----------------------|----------------|
| E2E, no mocks | Real testnet + real encryption path | Arbitrum Sepolia + Nox handle SDK |
| Deployment | On Sepolia or Arbitrum | Deploy `RwaConfidentialEscrowFactory` to **421614** |
| `feedback.md` | Honest notes on Nox / tools | [feedback.md](../feedback.md) |
| Video | ≤4 min, shows the dApp | You record |
| **Technical** | Use of **Confidential Token + Nox** | Encrypted fund + escrow settlement |
| **Real-world use** | RWA / DeFi problem | **Private ticket size** for a single RWA **deal** (escrow) |
| **Code quality** | Readable, maintainable | Foundry + typed TS, CI |
| **UX** | Usable, clear | Wallet, errors, explorer links, checklist in UI |

---

## 3. Project scope (in / out)

**In scope (this repo):**

- Smart contracts: per-deal escrow + factory; **IERC7984** only (no partial ERC-3643 / 7540 unless you add full spec later).
- Front end: connect, cToken, wrap, create escrow, fund, decrypt (where ACL allows), release / refund / reject.
- Docs: README, `feedback.md`, `AI_TRACES.md`, this file.

**Out of scope (unless you expand later):**

- Mainnet **Arbitrum One** (NoxCompute address may still be `address(0)` in `Nox.sol` for 42161 — use **Sepolia** for the hackathon).
- Legal KYC, securities law, or production RWA off-chain process — **testnet demo only**.

---

## 4. What you need before a successful demo (checklist)

### Accounts and assets

- [ ] Wallet (MetaMask / Rabby) with **Arbitrum Sepolia** added (`chainId` **421614**)
- [ ] **Sepolia ETH** for gas (faucet via [cdefi](https://cdefi.iex.ec) or [Arbitrum bridge docs](https://docs.arbitrum.io/))
- [ ] **Test USDC** and **cUSDC (cToken)** from the **Confidential DeFi** flow at [cdefi.iex.ec](https://cdefi.iex.ec) (copy the **cToken** contract address into the app)
- [ ] A **second address** to act as **seller** (or use another browser profile / hardware wallet)

### On-chain (deployer wallet)

- [ ] Deploy **RwaConfidentialEscrowFactory** (`cd contracts` + `forge script` — see [README](../README.md))
- [ ] Set `VITE_FACTORY_ADDRESS` in `frontend/.env` (or paste factory in the UI)

### Submission package

- [ ] **GitHub** public, README runs end-to-end
- [ ] **`feedback.md`** present
- [ ] **Video** ≤4 minutes: show real txs (not UI-only)
- [ ] **X post**: description + video + repo link + **@iEx_ec** + **@Chain_GPT**
- [ ] (Optional) **DoraHacks** BUIDL / form if the platform asks for a link in addition to X

---

## 5. Glossary (same language as the brief)

- **Nox** — iExec confidential layer: TEE, handles, ACL.
- **Confidential Token (ERC-7984)** — balances and transfer **amounts** are encrypted on-chain; **cUSDC** is a wrapped form of test USDC in the official demo.
- **Handle** — 32-byte pointer to encrypted data; **Nox JS SDK** creates proofs for `confidentialTransfer`.
- **Vibe coding** — AI-assisted dev (e.g. Cursor); document in [AI_TRACES.md](./AI_TRACES.md).

---

*Last updated to match the DoraHacks page structure (Challenge, Deliverables, Evaluation, How to Participate). If the org changes deadlines or rules, update this file and the README.*
