"use client";

import { useState } from "react";
import Link from "next/link";

/**
 * The operator surface: run a live case end-to-end against the real court —
 * buyer agent locks escrow, the audit engine grades a hired agent's actual
 * deliverable, the auditor stamps the verdict on X Layer, escrow settles.
 * Judges read the docket; this is where hands-on happens.
 */

type Step = { step: string; detail: string; tx?: string; at: string };
type RunResult = { caseId: string; verdict: string; reason: string; digest: string; timeline: Step[] };

const TASKS = [
  { id: "xlayer-network-brief", title: "Network brief: X Layer testnet" },
  { id: "viem-client-port", title: "Code task: viem client for X Layer" },
];
const WORKERS = [
  { id: "honest-agent", label: "attested-01 · reliable" },
  { id: "sloppy-agent", label: "unproven-02 · untested" },
];

const STEP_NAMES = ["task assigned", "audit ran", "escrow locked", "verdict stamped", "settled"];

export default function RunPage() {
  const [task, setTask] = useState(TASKS[0].id);
  const [worker, setWorker] = useState(WORKERS[0].id);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<RunResult | null>(null);

  async function run() {
    setBusy(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ task, worker }),
      });
      const j = await res.json();
      if (!res.ok) {
        setError(j.error ?? `run failed (${res.status})`);
        if (j.timeline) setResult({ caseId: "—", verdict: "—", reason: "—", digest: "", timeline: j.timeline });
      } else {
        setResult(j);
      }
    } catch (e) {
      setError(String((e as Error).message ?? e).slice(0, 200));
    } finally {
      setBusy(false);
    }
  }

  const doneSteps = result?.timeline ?? [];
  const activeStep = busy ? Math.min(Math.floor((Date.now() % 100000) / 4000) % STEP_NAMES.length, STEP_NAMES.length - 1) : -1;

  return (
    <div className="page pt-14 max-w-3xl">
      <p className="eyebrow">Operator surface</p>
      <h1 className="display text-[2rem] font-bold mt-3">Run a live case.</h1>
      <p className="mt-3 text-[15px] max-w-prose" style={{ color: "var(--ink-muted)" }}>
        Pick a task and a hired agent. The buyer locks real escrow on X Layer, the audit engine grades the
        actual deliverable, the verdict stamps onchain, and escrow releases or refunds — then the case sits
        on the public docket with every tx attached.
      </p>

      <div className="card p-6 mt-8">
        <div className="grid sm:grid-cols-2 gap-6">
          <div>
            <p className="eyebrow">Task</p>
            <div className="mt-2 flex flex-col gap-2">
              {TASKS.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTask(t.id)}
                  className="text-left text-[13px] px-3 py-2 rounded-md cursor-pointer"
                  style={{
                    border: `1px solid ${task === t.id ? "var(--ink-faint)" : "var(--hairline)"}`,
                    background: task === t.id ? "var(--surface-2)" : "transparent",
                    color: "var(--ink)",
                  }}
                >
                  {t.title}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="eyebrow">Hired agent</p>
            <div className="mt-2 flex flex-col gap-2">
              {WORKERS.map((w) => (
                <button
                  key={w.id}
                  onClick={() => setWorker(w.id)}
                  className="text-left text-[13px] px-3 py-2 rounded-md cursor-pointer"
                  style={{
                    border: `1px solid ${worker === w.id ? "var(--ink-faint)" : "var(--hairline)"}`,
                    background: worker === w.id ? "var(--surface-2)" : "transparent",
                    color: "var(--ink)",
                  }}
                >
                  <span className="mono">{w.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-6 flex items-center gap-4">
          <button className="btn btn-primary" onClick={run} disabled={busy}>
            {busy ? "court in session…" : "open case & run audit"}
          </button>
          <span className="micro faint">escrow 0.0005 OKB · ~6 tx on X Layer testnet</span>
        </div>
      </div>

      {busy && (
        <div className="card p-5 mt-6">
          {STEP_NAMES.map((s, i) => (
            <div key={s} className="flex items-center gap-3 py-1.5">
              <span className={`mono text-sm ${i < activeStep ? "glyph-approved" : i === activeStep ? "glyph-pending" : "glyph-pending"}`}>
                {i < activeStep ? "✓" : i === activeStep ? "◐" : "·"}
              </span>
              <span className="micro" style={{ color: i <= activeStep ? "var(--ink)" : "var(--ink-faint)" }}>
                {s}
              </span>
            </div>
          ))}
        </div>
      )}

      {error && (
        <p className="micro mt-6" style={{ color: "var(--rejected-fg)" }}>
          ✕ {error}
        </p>
      )}

      {result && result.caseId !== "—" && (
        <div className="card p-6 mt-6">
          <div className="flex items-center justify-between">
            <p className="eyebrow">Case complete</p>
            <span className={`pill ${result.verdict === "Approved" ? "pill-approved" : "pill-rejected"}`}>
              {result.verdict === "Approved" ? "✓ APPROVED" : "✕ REJECTED"}
            </span>
          </div>
          <p className="mono text-[12px] mt-3 break-all" style={{ color: "var(--ink-muted)" }}>
            {result.caseId}
          </p>
          <div className="mt-4">
            {result.timeline.map((s) => (
              <div key={s.step} className="flex items-baseline gap-3 py-1.5 hairline-b">
                <span className="glyph-approved mono text-sm">✓</span>
                <div>
                  <p className="text-[13px]">{s.step}</p>
                  <p className="micro mt-0.5">
                    {s.detail}
                    {s.tx && (
                      <>
                        {" · "}
                        <a href={`https://www.okx.com/web3/explorer/x-layer-test/tx/${s.tx}`} target="_blank" rel="noreferrer" className="underline" style={{ color: "var(--ink-muted)" }}>
                          tx ↗
                        </a>
                      </>
                    )}
                  </p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-5 flex items-center gap-4">
            <Link href={`/d/${result.caseId}`} className="btn btn-primary no-underline">
              View on the docket →
            </Link>
            <a
              href={`/api/evidence/${result.caseId}`}
              target="_blank"
              rel="noreferrer"
              className="mono text-[12px] no-underline"
              style={{ color: "var(--ink-muted)" }}
            >
              evidence bundle ↗
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
