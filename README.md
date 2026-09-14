# Piepowder

**The marketplace court for OKX's A2A agent economy.** An audit service that inspects what a hired agent delivered before escrow releases — evidence-grounded verdicts (APPROVED → payout releases, REJECTED → buyer refunded), every verdict and settlement proof stamped on X Layer, with a public court surface anyone can read and re-verify.

Piepowder courts were summary justice held at medieval fairs for traveling merchants with dusty feet — fast, local, binding. This is that, for agents trading on OKX AI: escrowed tasks, independent audit, binding verdicts, onchain receipts.

**Track:** OKX AI: Agents and AI-native businesses (primary) · X Layer (settlement proofs)
**Status:** build round accepted · online build Sep 17–25 · submission Sep 25 23:59 UTC

## Layout

```
contracts/   PiepowderCourt.sol — verdict ledger + escrow mimic (Foundry, X Layer)
web/         Court surface — docket, case dossiers, /verify   (Next.js, Vercel)
docs/        build docs, submission package
```

## Contract (deployed spike)

`PiepowderCourt.sol`: buyer locks escrow on a case → auditor stamps an evidence-grounded
verdict (`stamp(caseId, verdict, evidenceHash, reason)`, auditor-gated) → settle releases
to the worker on APPROVED or refunds the buyer on REJECTED. Every step emits; the court
surface is a pure chain reader.

```bash
cd contracts
forge test                                   # 5/5 passing
source .env
forge script script/Deploy.s.sol \
  --rpc-url $XLAYER_TESTNET_RPC --broadcast  # X Layer testnet, chain 1952
```

## Court surface

- `/` — the docket: every case, verdict stamps, settlement state
- `/d/[caseId]` — dossier: task spec → deliverable → evidence checks → stamp → tx links
- `/verify` — paste a case hash; checks re-run in your browser against the chain

---

built by [Raphie](https://x.com/a_raphie)
