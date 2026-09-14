# Spike record — X Layer testnet (Sep 14, 2026)

Deploy pipeline proven end-to-end; both case lifecycles executed on the real chain.

## Deployment (v3 — current)

> v3 (0xa7E50b3583F28E31A66259905e815AA992D9704D, deploy block 40939267) supersedes v1/v2:
> adds the on-chain case registry (caseCount/caseAt) + full struct reads (reason, block
> numbers) so the docket needs NO event scanning — the public testnet RPC caps
> eth_getLogs at 100 blocks. Dossier tx links come from 1-block getLogs at the stored
> block numbers. Old deployments below kept for the record.

- Network: X Layer testnet ("terigon"), chain ID **1952**, RPC `https://testrpc.xlayer.tech/terigon`
- PiepowderCourt v1: `0x46AfD188b4A1545f4DF7570C2ad1a0B234acd32A` (superseded)
- Auditor (deployer): `0xde302DdD9B759238Fc45518571a89570c884b2a9`
- Deploy gas: **0.0000207 OKB** — the 0.2 OKB/day faucet budget covers thousands of transactions
- Explorer: https://www.okx.com/web3/explorer/x-layer-test/address/0x46AfD188b4A1545f4DF7570C2ad1a0B234acd32A

## Case 1 — APPROVED (worker paid)

- caseId: `0x43d068120e70a3bacc126cca6d0aec32206792bb55e0af2c267ab797e1e345f0`
- Flow: openCase (0.001 OKB escrow) → stamp Approved (evidence `0x6373ed4b…`) → settle
- Result: worker `0xEe955Ce96E1b536203bC73daFb21a88B49858E48` received 0.001 OKB
- Settle tx (v3): `0x15e2e85ab2dcf89f3e9c5ce8531accd85ad11b6c9d060f3292d51ec0152a589a`

## Case 2 — REJECTED (buyer refunded)

- caseId: `0x5662bbe40e3ff3243793dfa6efdf5be00f4764ea8f87d497082a565f068d7ca9`
- Flow: openCase (0.001 OKB escrow) → stamp Rejected ("failed 3/5 checks…") → settle
- Result: buyer refunded 0.001 OKB
- Settle tx (v3): `0x327c90ee323e474acc34321f2df68cd5dcc3bb849dad8d0995c6b0a1ab01735f`

## Notes

- Testnet RPC occasionally lags reads right after a tx (worker balance read 0 for ~10s) and one
  settle submit needed a retry — treat transient RPC failures as retryable, not fatal.
- Keys: burner (auditor) + worker keypair in `contracts/.env` (gitignored). Testnet only, no value.
