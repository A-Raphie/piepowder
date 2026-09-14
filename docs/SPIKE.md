# Spike record — X Layer testnet (Sep 14, 2026)

Deploy pipeline proven end-to-end; both case lifecycles executed on the real chain.

## Deployment

- Network: X Layer testnet ("terigon"), chain ID **1952**, RPC `https://testrpc.xlayer.tech/terigon`
- **PiepowderCourt: `0x46AfD188b4A1545f4DF7570C2ad1a0B234acd32A`**
- Auditor (deployer): `0xde302DdD9B759238Fc45518571a89570c884b2a9`
- Deploy gas: **0.0000207 OKB** — the 0.2 OKB/day faucet budget covers thousands of transactions
- Explorer: https://www.okx.com/web3/explorer/x-layer-test/address/0x46AfD188b4A1545f4DF7570C2ad1a0B234acd32A

## Case 1 — APPROVED (worker paid)

- caseId: `0x43d068120e70a3bacc126cca6d0aec32206792bb55e0af2c267ab797e1e345f0`
- Flow: openCase (0.001 OKB escrow) → stamp Approved (evidence `0x6373ed4b…`) → settle
- Result: worker `0xEe955Ce96E1b536203bC73daFb21a88B49858E48` received 0.001 OKB
- Settle tx: `0xd4d7cf5b65e452192c86de68f36b8ca80097a2cc9c6a24707340b3509d1b0b45`

## Case 2 — REJECTED (buyer refunded)

- caseId: `0x5662bbe40e3ff3243793dfa6efdf5be00f4764ea8f87d497082a565f068d7ca9`
- Flow: openCase (0.001 OKB escrow) → stamp Rejected ("failed 3/5 checks…") → settle
- Result: buyer refunded 0.001 OKB
- Settle tx: `0x7c4f346cde04f4bc74e9fec0b5360c487cd7bb7a92b9dd4ef43502dd5280c87c`

## Notes

- Testnet RPC occasionally lags reads right after a tx (worker balance read 0 for ~10s) and one
  settle submit needed a retry — treat transient RPC failures as retryable, not fatal.
- Keys: burner (auditor) + worker keypair in `contracts/.env` (gitignored). Testnet only, no value.
