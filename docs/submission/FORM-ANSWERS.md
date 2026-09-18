# Piepowder — OKX Dev Day submission form answers (draft v1, Sep 16)

Form: https://forms.gle/81S2gnFCzqSoeDEA7 · due 25 Sep 23:59 UTC · target submit: 18 Sep EOD
Staged dump + his GO before the click (alarm ritual).

## 1. Team and track

- **Team name:** Piepowder
- **Members:** Ernest Ohagwu (solo) — arnxto@gmail.com
- **Project name:** Piepowder
- **Primary track:** Build a Company (OKX AI: agent services and AI-native businesses)
- **Participation route:** ⚠️ HIS PICK before submit — Remote Build (default; $15K pool, still fully judged) or Singapore finale (unlocks Flash Track + headline awards; travel self-funded, written confirmation required first)

## 2. Project summary

- **Name:** Piepowder — the marketplace court for OKX's A2A agent economy
- **What it is (breakdown):** An audit court for hired agents. A buyer locks escrow on a task; the Piepowder audit engine grades the hired agent's actual deliverable with deterministic checks (replay + spec conformance — never a model's opinion); the auditor stamps the evidence digest and verdict onchain; APPROVED releases escrow to the agent, REJECTED refunds the buyer. Public docket, per-case dossiers, a /verify page that re-runs checks in the reader's own browser, and an agent reputation page built purely from audit history.
- **Intended user:** Buyers hiring unfamiliar agents (need a referee they can audit), reliable agents who can't otherwise differentiate from sloppy ones (want portable proof), and agent marketplaces that need quality adjudication without owning every dispute.
- **Core integration:** Listed on OKX AI as an A2MCP agent service — paid per audit through OKX's x402 Payment Seller SDK, settling on X Layer; court verdicts and settlements stamped on X Layer testnet (chain 1952), readable through public RPC. → service/listing URL: https://www.okx.ai (listing) + https://piepowder.vercel.app/api/audit (endpoint)

## 3. Repository

- https://github.com/A-Raphie/piepowder (flips PUBLIC at submission) — README covers architecture, contract, integration, and the build-window work log.

## 4. Demo video

- 2 min 22 s — piepowder/demo-take/final.mp4 (VO: minimax_273587280617670 @1.0 via ai33; footage: docket → /run live case → dossier → /verify → reputation)

## 5. Product link

- https://piepowder.vercel.app (docket + dossiers + /verify + /agents + /run operator surface; reads the court contract on X Layer testnet)

## 6. Declaration

- Accuracy confirmed; event guidelines accepted. (his click)

## Build-window work log (judges assess only Sep 17–25 work — existing base disclosed)

- Base (pre-window, disclosed): PiepowderCourt v3 contract (case registry + full struct reads), court surface, audit engine v0.1, free /run operator flow — commits ≤ 908df55.
- In-window delta: OKX AI x402 payment rail (/api/audit), A2MCP ASP registration + public listing, real paid hires on the docket, reputation page, submission package. Commit history is the evidence.
