import { NextResponse } from "next/server";
import { gatePaidRequest } from "@/lib/x402";
import { runCase } from "@/lib/runCase";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

/**
 * The LISTED service (A2MCP): POST /api/audit behind an x402 paywall.
 * A buyer agent sends payment → the audit runs → a real court case is opened,
 * stamped, and settled on X Layer → the settlement proof rides back in headers.
 * This is the Build-a-Company "working service via OKX AI" surface.
 */
export async function POST(req: Request) {
  const gate = await gatePaidRequest(req);
  if (gate.kind === "unconfigured") {
    return NextResponse.json(
      { error: "payment rail not configured — set OKX facilitator keys" },
      { status: 503 },
    );
  }
  if (gate.kind === "payment-required") {
    return NextResponse.json(gate.body, { status: gate.status, headers: gate.headers });
  }

  let body: { task?: string; worker?: string };
  try {
    body = await req.json();
  } catch {
    body = {};
  }
  // Default hire: the unproven agent — auditors earn their keep on suspect work.
  const task = body.task ?? "xlayer-network-brief";
  const worker = body.worker ?? "sloppy-agent";

  try {
    const result = await runCase(task, worker);
    const settleHeaders = await gate.process({ request: gate.context } as never);
    return NextResponse.json(
      {
        caseId: result.caseId,
        verdict: result.verdict,
        reason: result.reason,
        digest: result.digest,
        evidence: `/api/evidence/${result.caseId}`,
        timeline: result.timeline,
      },
      { headers: settleHeaders.headers },
    );
  } catch (e) {
    return NextResponse.json({ error: String((e as Error).message ?? e).slice(0, 300) }, { status: 500 });
  }
}
