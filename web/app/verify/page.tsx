"use client";

import { useState } from "react";
import { createPublicClient, http, defineChain, formatEther } from "viem";

/**
 * /verify — the curb pattern: re-run the checks in YOUR browser against the
 * public RPC. Nothing on this page is taken on faith from the docket.
 */

const xlayerTestnet = defineChain({
  id: 1952,
  name: "X Layer Testnet",
  nativeCurrency: { name: "OKB", symbol: "OKB", decimals: 18 },
  rpcUrls: { default: { http: ["https://testrpc.xlayer.tech/terigon"] } },
  testnet: true,
});

const COURT = "0xa7E50b3583F28E31A66259905e815AA992D9704D";
const ABI = [
  {
    type: "function",
    name: "getCase",
    stateMutability: "view",
    inputs: [{ name: "caseId", type: "bytes32" }],
    outputs: [
      {
        name: "c",
        type: "tuple",
        components: [
          { name: "phase", type: "uint8" },
          { name: "verdict", type: "uint8" },
          { name: "evidenceHash", type: "bytes32" },
          { name: "taskSpecHash", type: "bytes32" },
          { name: "reason", type: "string" },
          { name: "buyer", type: "address" },
          { name: "worker", type: "address" },
          { name: "escrow", type: "uint256" },
          { name: "openedAt", type: "uint64" },
          { name: "settledAt", type: "uint64" },
          { name: "openBlock", type: "uint64" },
          { name: "stampBlock", type: "uint64" },
          { name: "settleBlock", type: "uint64" },
        ],
      },
    ],
  },
] as const;

type Check = { name: string; status: "PASS" | "FAIL" | "SKIP"; detail: string };

const PHASES = ["None", "Open", "Verdict", "Settled"] as const;
const VERDICTS = ["None", "Approved", "Rejected"] as const;

export default function VerifyPage() {
  const [input, setInput] = useState("");
  const [checks, setChecks] = useState<Check[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run() {
    setError(null);
    setChecks(null);
    const raw = input.trim();
    if (!/^0x[0-9a-fA-F]{64}$/.test(raw)) {
      setError("Paste a 32-byte case hash (0x + 64 hex chars). The docket links each case's hash.");
      return;
    }
    setBusy(true);
    try {
      const client = createPublicClient({ chain: xlayerTestnet, transport: http() });
      const r = (await client.readContract({ address: COURT, abi: ABI, functionName: "getCase", args: [raw as `0x${string}`] })) as unknown as {
        phase: number;
        verdict: number;
        evidenceHash: string;
        escrow: bigint;
        settledAt: bigint;
      };
      const phase = PHASES[Number(r.phase)];
      const verdict = VERDICTS[Number(r.verdict)];
      const evidenceHash = r.evidenceHash as string;
      const escrow = r.escrow as bigint;
      const settledAt = Number(r.settledAt);
      const out: Check[] = [
        { name: "Case exists on court", status: phase !== "None" ? "PASS" : "FAIL", detail: phase === "None" ? "contract returns phase None — no case with this hash" : `phase ${phase}` },
      ];
      if (phase !== "None") {
        out.push({
          name: "Verdict stamped by auditor",
          status: verdict !== "None" ? "PASS" : "SKIP",
          detail: verdict !== "None" ? `verdict ${verdict}` : "case is open — no verdict yet, nothing to check",
        });
        if (verdict !== "None") {
          out.push({
            name: "Evidence digest committed",
            status: evidenceHash === 0n.toString() ? "FAIL" : "PASS",
            detail: evidenceHash === 0n.toString() ? "no digest on the stamp" : `0x${evidenceHash.slice(2, 12)}…`,
          });
        }
        out.push({
          name: "Escrow settled correctly",
          status: phase === "Settled" ? (escrow === 0n ? "PASS" : "FAIL") : "SKIP",
          detail: phase === "Settled" ? (escrow === 0n ? `escrow released on ${settledAt ? new Date(settledAt * 1000).toISOString().slice(0, 10) : "chain"}` : `${formatEther(escrow)} OKB still locked`) : "case not settled yet — escrow still in escrow",
        });
      }
      setChecks(out);
    } catch (e) {
      setError(String((e as Error).message ?? e).slice(0, 180));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="page pt-14 max-w-3xl">
      <p className="eyebrow">Verify</p>
      <h1 className="display text-[2rem] font-bold mt-3">Don’t take the docket’s word for it.</h1>
      <p className="mt-3 text-[15px] max-w-prose" style={{ color: "var(--ink-muted)" }}>
        Paste a case hash. These checks re-run in your browser against the public X Layer RPC — same
        contract, no server in between. What the chain says is all the court says.
      </p>

      <div className="flex gap-2 mt-6">
        <input
          className="court-input"
          placeholder="0x… case hash from the docket"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && run()}
        />
        <button className="btn btn-primary shrink-0" onClick={run} disabled={busy}>
          {busy ? "reading chain…" : "run checks"}
        </button>
      </div>
      {error && (
        <p className="micro mt-3" style={{ color: "var(--rejected-fg)" }}>
          ✕ {error}
        </p>
      )}

      {checks && (
        <div className="card mt-6 p-5">
          {checks.map((c) => (
            <div key={c.name} className="flex items-baseline gap-3 py-2 hairline-b last:border-none">
              <span className={`mono text-sm ${c.status === "PASS" ? "glyph-approved" : c.status === "FAIL" ? "glyph-rejected" : "glyph-pending"}`}>
                {c.status === "PASS" ? "✓" : c.status === "FAIL" ? "✕" : "◐"}
              </span>
              <div>
                <p className="text-[14px]">{c.name}</p>
                <p className="micro mt-0.5">{c.detail}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      <p className="micro faint mt-6">Or check it yourself in a terminal: cast call {COURT} "getCase(bytes32)" &lt;caseHash&gt; --rpc-url https://testrpc.xlayer.tech/terigon</p>
    </div>
  );
}
