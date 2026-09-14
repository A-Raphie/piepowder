import { NextResponse } from "next/server";
import { courtAddress, publicClient, chainName, COURT_ABI } from "@/lib/chain";
import { deriveBundleForDigest } from "@/lib/engine/audit";

export const dynamic = "force-dynamic";

/**
 * Evidence, re-derived. The engine is deterministic, so the court can rebuild
 * the full check-by-check bundle for any stamped case and the caller can
 * compare its digest against the one on the chain. If the hash doesn't match
 * any engine run, this says so — that's the audit trail working, not failing.
 */
export async function GET(_req: Request, { params }: { params: Promise<{ caseId: string }> }) {
  const { caseId } = await params;
  const id = (caseId.startsWith("0x") ? caseId : `0x${caseId}`) as `0x${string}`;
  try {
    const c = await publicClient.readContract({
      abi: COURT_ABI,
      address: courtAddress[chainName],
      functionName: "getCase",
      args: [id],
    });
    const record = c as unknown as { phase: number; evidenceHash: string };
    if (Number(record.phase) === 0) {
      return NextResponse.json({ error: "unknown case" }, { status: 404 });
    }
    const bundle = deriveBundleForDigest(record.evidenceHash);
    if (!bundle) {
      return NextResponse.json(
        {
          note: "stamped digest does not re-derive from the current engine catalogue",
          digestOnChain: record.evidenceHash,
        },
        { status: 404 },
      );
    }
    return NextResponse.json({ caseId: id, digestOnChain: record.evidenceHash, bundle });
  } catch (e) {
    return NextResponse.json({ error: String((e as Error).message ?? e).slice(0, 200) }, { status: 500 });
  }
}
