import { NextResponse } from "next/server";
import { getTask, getWorker, type WorkerId } from "@/lib/engine/tasks";
import { runAudit } from "@/lib/engine/audit";
import { newCaseId, openCase, specHash, stampVerdict, settleCase } from "@/lib/sim";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

type Step = { step: string; detail: string; tx?: string; at: string };

export async function POST(req: Request) {
  let body: { task?: string; worker?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid JSON body" }, { status: 400 });
  }

  const task = getTask(body.task ?? "");
  const worker = getWorker(body.worker ?? "");
  if (!task || !worker) {
    return NextResponse.json({ error: "unknown task or worker" }, { status: 400 });
  }
  if (worker.address.startsWith("0x000000000000000000000000000000000000000")) {
    return NextResponse.json({ error: "worker addresses not configured" }, { status: 500 });
  }

  const timeline: Step[] = [];
  const mark = (step: string, detail: string, tx?: string) =>
    timeline.push({ step, detail, tx, at: new Date().toISOString() });

  try {
    // 1. the buyer agent delivers — the engine grades the work
    const { bundle, digest } = runAudit(task, worker.id as WorkerId);
    mark(
      "task assigned",
      `${worker.label} took "${task.title}" — deliverable submitted (${bundle.deliverable.trim().split(/\s+/).length} words)`,
    );
    mark(
      "audit ran",
      `${bundle.passed}/${bundle.checks.length} checks passed — verdict ${bundle.verdict.toUpperCase()}`,
    );

    // 2. buyer locks escrow on the case
    const caseId = newCaseId(`${task.id}:${worker.id}`);
    const opened = await openCase({ caseId, worker: worker.address, taskSpecHash: specHash(task.id) });
    mark("escrow locked", "0.0005 OKB locked by the buyer agent on the court", opened.hash);
    if (opened.receipt.status !== "success") throw new Error("openCase reverted");

    // 3. auditor stamps the evidence-grounded verdict
    const stamped = await stampVerdict({ caseId, approved: bundle.verdict === "Approved", evidenceDigest: digest, reason: bundle.reason });
    mark("verdict stamped", bundle.reason, stamped.hash);
    if (stamped.receipt.status !== "success") throw new Error("stamp reverted");

    // 4. settlement: release or refund
    const settled = await settleCase({ caseId });
    mark(
      "settled",
      bundle.verdict === "Approved"
        ? "escrow released to the hired agent"
        : "escrow refunded to the buyer in full",
      settled.hash,
    );
    if (settled.receipt.status !== "success") throw new Error("settle reverted");

    return NextResponse.json({ caseId, verdict: bundle.verdict, reason: bundle.reason, digest, bundle, timeline });
  } catch (e) {
    return NextResponse.json(
      { error: String((e as Error).message ?? e).slice(0, 300), timeline },
      { status: 500 },
    );
  }
}
