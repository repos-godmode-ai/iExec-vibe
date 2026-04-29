# Feedback on iExec Nox and Confidential Token tools

This document is required for the [iExec Vibe Coding Challenge](https://dorahacks.io/hackathon/vibe-coding-iexec/detail). It reflects use of the Nox protocol, ERC-7984 confidential tokens, and the JavaScript handle SDK during this hackathon build.

## What worked well

- **Nox documentation (Hello World / piggy bank)** gave a clear mental model: `euint256` handles, `Nox.fromExternal`, `Nox.allow` / `Nox.allowThis`, and the off-chain gateway for encryption. The flow from [Hello World](https://docs.iex.ec/nox-protocol/getting-started/hello-world) to a working pattern is approachable for Solidity developers who already know ERC-20.
- **`@iexec-nox/handle`** integrates cleanly with Viem: `createViemHandleClient` picks up chain id `421614` and resolves gateway, NoxCompute, and subgraph URLs without extra wiring. `encryptInput` and `decrypt` are enough to build a real front-end that does not fake balances.
- **ERC-7984 interface and `nox-confidential-contracts`** as a Foundry dependency makes it straightforward to reference `IERC7984` and stay aligned with the standard without copy-pasting ABIs.
- **Public Arbitrum Sepolia deployment** of NoxCompute (see `Nox.sol` in `nox-protocol-contracts`) means the same code path can be tested on a live testnet without a local TEE stack.

## Friction and improvement ideas

- **Discovering wrapper (cToken) addresses** for a specific underlying on Arbitrum Sepolia required using the official [Confidential DeFi demo](https://cdefi.iex.ec) and copying contract addresses from the UI. A single “deployed contracts” table in the docs (chain id, symbol, underlying, wrapper) would speed up integration.
- **Foundry + npm remapping** for `encrypted-types` and multi-repo dependencies is standard for advanced users but can trip first-time builders; a small `foundry.toml` template in the Nox “Build a dApp” guide would help.
- **Operator / `confidentialTransferFrom` for contracts**: Escrow contracts that move the *full* encrypted balance need the token’s operator model or a pattern that passes the live `euint256` from `confidentialBalanceOf` into `confidentialTransferFrom(from, to, amount)` after the token has granted the escrow transient ACL on that handle. The learning curve is worth it, but a short “escrow cookbook” would reduce trial and error.

## Overall

The stack delivers a credible **end-to-end** path: real encryption via the handle gateway, real ERC-7984 transfers on Arbitrum Sepolia, and decryption only for entitled keys. For production RWA, teams will still need legal workflow and key management off-chain, but the on-chain privacy mechanics are in place and composable with standard wallets.
