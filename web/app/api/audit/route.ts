import { NextResponse } from "next/server";
import { gatePaidRequest, type PaidGate } from "@/lib/x402";
import { runCase } from "@/lib/runCase";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

/**
 * The LISTED service (A2MCP): /api/audit behind an x402 paywall.
 * A buyer agent sends payment → the audit runs → a real court case is opened,
 * stamped, and settled on X Layer → the settlement proof rides back in headers.
 * This is the Build-a-Company "working service via OKX AI" surface.
 */
async function gate(req: Request): Promise<Response | PaidGate> {
  const paid = await gatePaidRequest(req);
  if (paid.kind === "unconfigured") {
    return NextResponse.json(
      { error: "payment rail not configured — set OKX facilitator keys" },
      { status: 503, headers: { "cache-control": "no-store" } },
    );
  }
  if (paid.kind === "payment-required") {
    const headers = { ...paid.headers, "cache-control": "no-store" };
    return NextResponse.json(paid.body, { status: paid.status, headers });
  }
  return paid;
}

/** Reviewers and wallets may probe with GET — the challenge is served either way. */
export async function GET(req: Request) {
  const g = await gate(req);
  if (g instanceof Response) return g;
  return NextResponse.json({ service: "Piepowder audit", method: "POST", note: "send payment then POST here" }, { headers: { "cache-control": "no-store" } });
}

export async function POST(req: Request) {
  const g = await gate(req);
  if (g instanceof Response) return g;
  if (g.kind !== "verified") {
    return NextResponse.json({ error: "payment gate failed" }, { status: 503, headers: { "cache-control": "no-store" } });
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
    const settleHeaders = await g.process({ request: g.context } as never);
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
