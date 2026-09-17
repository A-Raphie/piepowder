import { getTask, getWorker, type WorkerId } from "@/lib/engine/tasks";
import { runAudit } from "@/lib/engine/audit";
import { newCaseId, openCase, specHash, stampVerdict, settleCase } from "@/lib/sim";
import type { EvidenceBundle } from "@/lib/engine/audit";

export type Step = { step: string; detail: string; tx?: string; at: string };
export type RunResult = {
  caseId: `0x${string}`;
  verdict: string;
  reason: string;
  digest: string;
  bundle: EvidenceBundle;
  timeline: Step[];
};

/**
 * The court lifecycle, shared by the free operator surface (/api/run) and the
 * paid A2MCP service (/api/audit): buyer locks escrow → engine grades the
 * deliverable → auditor stamps the evidence digest → escrow releases/refunds.
 */
export async function runCase(taskId: string, workerId: string): Promise<RunResult> {
  const task = getTask(taskId);
  const worker = getWorker(workerId);
  if (!task || !worker) throw new Error("unknown task or worker");
  if (worker.address.startsWith("0x000000000000000000000000000000000000000")) {
    throw new Error("worker addresses not configured");
  }

  const timeline: Step[] = [];
  const mark = (step: string, detail: string, tx?: string) =>
    timeline.push({ step, detail, tx, at: new Date().toISOString() });

  const { bundle, digest } = runAudit(task, worker.id as WorkerId);
  mark(
    "task assigned",
    `${worker.label} took "${task.title}" — deliverable submitted (${bundle.deliverable.trim().split(/\s+/).length} words)`,
  );
  mark("audit ran", `${bundle.passed}/${bundle.checks.length} checks passed — verdict ${bundle.verdict.toUpperCase()}`);

  const caseId = newCaseId(`${task.id}:${worker.id}`);
  const opened = await openCase({ caseId, worker: worker.address, taskSpecHash: specHash(task.id) });
  mark("escrow locked", "0.0005 OKB locked by the buyer agent on the court", opened.hash);
  if (opened.receipt.status !== "success") throw new Error("openCase reverted");

  const stamped = await stampVerdict({
    caseId,
    approved: bundle.verdict === "Approved",
    evidenceDigest: digest,
    reason: bundle.reason,
  });
  mark("verdict stamped", bundle.reason, stamped.hash);
  if (stamped.receipt.status !== "success") throw new Error("stamp reverted");

  const settled = await settleCase({ caseId });
  mark(
    "settled",
    bundle.verdict === "Approved" ? "escrow released to the hired agent" : "escrow refunded to the buyer in full",
    settled.hash,
  );
  if (settled.receipt.status !== "success") throw new Error("settle reverted");

  return { caseId, verdict: bundle.verdict, reason: bundle.reason, digest, bundle, timeline };
}
