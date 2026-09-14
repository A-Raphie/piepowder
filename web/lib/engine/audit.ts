import { keccak256, toHex } from "viem";
import type { Check } from "./tasks";
import { TASKS, deliverableFor, getTask, type TaskSpec, type WorkerId } from "./tasks";

/**
 * The audit engine. Deterministic: (taskSpec, deliverable) → checks → verdict.
 * The verdict bit comes only from check results — never from a model's opinion.
 * The evidence bundle is canonical JSON; its keccak256 digest is what the court
 * stamps, so anyone can re-run the engine and compare against the chain.
 */

export type EvidenceBundle = {
  engine: string;
  auditedAt: string;
  task: { id: string; title: string; brief: string };
  spec: { requiredFacts: { name: string; needle: string }[]; minLengthWords: number; forbidden: { name: string; needle: string }[] };
  deliverable: string;
  checks: Check[];
  passed: number;
  failed: number;
  verdict: "Approved" | "Rejected";
  reason: string;
};

export function runAudit(task: TaskSpec, workerId: WorkerId): { bundle: EvidenceBundle; digest: `0x${string}` } {
  const deliverable = deliverableFor(task.id, workerId);
  const checks: Check[] = [];
  const words = deliverable.trim().split(/\s+/).filter(Boolean).length;

  for (const fact of task.requiredFacts) {
    const ok = deliverable.includes(fact.needle);
    checks.push({
      name: fact.name,
      status: ok ? "PASS" : "FAIL",
      detail: ok ? `found "${fact.needle}" in the deliverable` : `"${fact.needle}" is absent from the deliverable`,
    });
  }
  checks.push({
    name: `meets minimum length (${task.minLengthWords} words)`,
    status: words >= task.minLengthWords ? "PASS" : "FAIL",
    detail: `${words} words submitted`,
  });
  for (const f of task.forbidden) {
    const bad = deliverable.toLowerCase().includes(f.needle.toLowerCase());
    checks.push({
      name: f.name,
      status: bad ? "FAIL" : "PASS",
      detail: bad ? `found "${f.needle}" in the deliverable` : "clean",
    });
  }

  const failed = checks.filter((c) => c.status === "FAIL").length;
  const passed = checks.length - failed;
  const verdict: EvidenceBundle["verdict"] = failed === 0 ? "Approved" : "Rejected";
  const failedNames = checks.filter((c) => c.status === "FAIL").map((c) => c.name);
  const reason =
    failed === 0
      ? `passed ${passed}/${checks.length} checks: every required fact present, length met, no placeholders`
      : `failed ${failed}/${checks.length} checks: ${failedNames.slice(0, 3).join("; ")}`;

  const bundle: EvidenceBundle = {
    engine: "piepowder-audit@0.1.0",
    auditedAt: new Date().toISOString(),
    task: { id: task.id, title: task.title, brief: task.brief },
    spec: {
      requiredFacts: task.requiredFacts,
      minLengthWords: task.minLengthWords,
      forbidden: task.forbidden,
    },
    deliverable,
    checks,
    passed,
    failed,
    verdict,
    reason,
  };

  return { bundle, digest: keccak256(toHex(canonicalJson(bundle))) };
}

/** Stable-key-order JSON — the canonical form the digest commits to.
 *  auditedAt is deliberately EXCLUDED: the commitment covers the checkable
 *  content only, so the bundle re-derives identically at any later time. */
export function canonicalJson(bundle: EvidenceBundle): string {
  return JSON.stringify({
    engine: bundle.engine,
    task: bundle.task,
    spec: bundle.spec,
    deliverable: bundle.deliverable,
    checks: bundle.checks,
    passed: bundle.passed,
    failed: bundle.failed,
    verdict: bundle.verdict,
    reason: bundle.reason,
  });
}

/** Re-derive: which (task, worker) produced this digest? Deterministic engine ⇒ findable. */
export function deriveBundleForDigest(digest: string): EvidenceBundle | null {
  for (const task of TASKS) {
    for (const workerId of ["honest-agent", "sloppy-agent"] as WorkerId[]) {
      const { bundle, digest: d } = runAudit(task, workerId);
      if (d.toLowerCase() === digest.toLowerCase()) return bundle;
    }
  }
  return null;
}
