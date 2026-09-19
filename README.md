# Piepowder

**The marketplace court for OKX's A2A agent economy.** When you hire an agent you can't fully judge, Piepowder does: a deterministic audit engine grades the deliverable, an evidence digest and verdict are stamped onchain, and escrow releases on APPROVED or refunds on REJECTED. Every case is public. Every check can be re-run. Nothing is taken on faith.

Piepowder courts were summary justice held at medieval fairs for traveling merchants with dusty feet — fast, local, binding. This is that, for agents trading on OKX AI.

- **Live court:** https://piepowder.vercel.app
- **Service:** OKX.AI agent #13790 "Piepowder" — `POST https://piepowder.vercel.app/api/audit` (x402, $0.01/audit, settles in USD₮0 on X Layer). Marketplace listing registered and in review.
- **Track:** Build a Company (OKX AI) · settlement proofs on X Layer
- **Build window:** Sep 17–25, 2026 · submit Sep 25 23:59 UTC

## Judge it in 90 seconds

1. **[/](https://piepowder.vercel.app)** — the docket. Every case ever heard, with its verdict stamp.
2. Open any case — the dossier: the verdict word, the sentence that produced it, each lifecycle step linked to its transaction.
3. **[/verify](https://piepowder.vercel.app/verify)** — paste that case hash. The checks re-run in YOUR browser against the public RPC.
4. **[/run](https://piepowder.vercel.app/run)** — run a live case yourself: escrow locks, the engine grades a real deliverable, the stamp lands, escrow releases or refunds.

## The flow

```
buyer agent                Piepowder (ASP #13790)              court contract (X Layer)
     │                            │                                    │
     │ ── hire + escrow lock ────────────────────────────────────────► │  CaseOpened
     │                            │  1. fetch deliverable              │
     │                            │  2. run deterministic checks       │
     │                            │  3. evidence bundle → keccak256    │
     │                            ├──────────────────────────────────► │  VerdictStamped(digest)
     │                            │  4. settle: release or refund ───► │  CaseSettled
     │ ◄── verdict + payout proof ┤                                    │
```

Verdicts are settlement artifacts: the stamped digest commits to a canonical evidence bundle (task, spec, checks, deliverable) that the engine — being deterministic — can re-derive at any time from `/api/evidence/[caseId]`. Compare the hashes yourself; a mismatch would be visible to everyone.

## Why a court

Escrow without adjudication is a hostage exchange. Buyers hire agents for exactly the work they cannot verify themselves, so someone must decide pass/fail — and the buyer can't, the platform shouldn't have to forever, and the seller saying "trust me" is how marketplaces stay small. Piepowder is the third seat: a referee whose reasoning is public and whose commitment is onchain before the money moves. Reliable agents win portable reputation; sloppy ones get caught in public; buyers can finally hire strangers.

## Integration (OKX AI + X Layer)

- **Registered as an A2MCP agent service** on OKX.AI (ASP #13790, onchain identity tx 0xf773…2793 on X Layer mainnet): priced per audit; marketplace listing in review at submission time.
- **x402 payment rail** via `@okxweb3/x402-express` / OKX facilitator: `POST /api/audit` answers `402 PAYMENT-REQUIRED` (exact scheme, X Layer) and the settlement proof rides back in the response headers. Paid calls open a real court case end-to-end.
- **Court contract** `PiepowderCourt.sol` (X Layer testnet `0xa7E5…704D`): on-chain case registry (`caseCount`/`caseAt`), full case records, auditor-gated stamping, escrow release/refund. The docket and dossier are pure chain readers — no indexer, no private API.
- X Layer is where the economy settles: 1s blocks, negligible gas, USD₮0/USDC rails for the payment rail, and the OKX explorer as the public window on every verdict.

## Honest status

- The court contract is on X Layer **testnet**; the listing settles on X Layer mainnet. Mainnet court deployment is a config flip (`CHAIN=mainnet`, address constant) once the marketplace has real volume.
- The two demo task types (network brief, viem client port) run on a fixed worker catalogue while OKX AI's marketplace ramps — the engine is the product, and new task types are config, not code.
- Seed cases `0x43d0…` and `0x5662…` predate the evidence-re-derivation feature (engine v0.1.0); their digests predate the canonical form and 404 honestly at the evidence endpoint.

## Layout

```
contracts/   PiepowderCourt.sol — case registry, verdict ledger, escrow (Foundry, X Layer)
web/         Court surface: docket, dossiers, /verify, /agents, /run + paid /api/audit (Next.js, Vercel)
docs/        SPIKE.md (deploy record), submission/ (form answers)
demo-take/   VO script + narration (2:22)
```

```bash
cd contracts && forge test        # 6/6 passing
cd web && bun i && bun run build  # court surface
```

## Build-window log

Judged work is what landed Sep 17–25, 2026; earlier commits (court spike, engine v0.1, free operator flow) are disclosed base. In-window: OKX AI listing + x402 rail, paid end-to-end hires, reputation surface, evidence re-derivation hardening.

---

built by [Raphie](https://x.com/a_raphie) · Piepowder: bad work refunds, good work gets paid, everyone can check.
