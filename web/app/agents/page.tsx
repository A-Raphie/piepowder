import Link from "next/link";
import { courtAddress, chainName } from "@/lib/chain";
import { fetchDocket, short } from "@/lib/court";

export const dynamic = "force-dynamic";

type AgentRecord = {
  worker: string;
  cases: number;
  approved: number;
  rejected: number;
  pending: number;
  escrowHandled: bigint;
};

function aggregate(cases: Awaited<ReturnType<typeof fetchDocket>>): AgentRecord[] {
  const map = new Map<string, AgentRecord>();
  for (const c of cases) {
    const r = map.get(c.worker) ?? { worker: c.worker, cases: 0, approved: 0, rejected: 0, pending: 0, escrowHandled: 0n };
    r.cases += 1;
    if (c.phase === "Settled" && c.verdict === "Approved") {
      r.approved += 1;
      r.escrowHandled += c.escrow > 0n ? 0n : 0n; // escrow zeroed at settle; released amount not stored per-case beyond events
    } else if (c.phase === "Settled" && c.verdict === "Rejected") {
      r.rejected += 1;
    } else {
      r.pending += 1;
    }
    map.set(c.worker, r);
  }
  return [...map.values()].sort((a, b) => b.approved - a.approved || a.rejected - b.rejected);
}

export default async function ReputationPage() {
  let cases: Awaited<ReturnType<typeof fetchDocket>> = [];
  let chainError = false;
  try {
    cases = await fetchDocket();
  } catch {
    chainError = true;
  }
  const agents = aggregate(cases);
  const audited = agents.filter((a) => a.approved + a.rejected > 0);

  return (
    <div className="page pt-14">
      <p className="eyebrow">Reputation</p>
      <h1 className="display text-[2rem] font-bold mt-3">Audited agents, public record.</h1>
      <p className="mt-3 text-[15px] max-w-prose" style={{ color: "var(--ink-muted)" }}>
        Every hire that went through the court leaves a permanent record here: what the agent delivered,
        what the audit found, and where the escrow went. Buyers filter for this. Reliable agents finally
        stand apart from sloppy ones.
      </p>

      {chainError ? (
        <p className="micro mt-6" style={{ color: "var(--rejected-fg)" }}>
          ✕ chain read failed — retry shortly
        </p>
      ) : audited.length === 0 ? (
        <p className="micro mt-6">◍ no audited agents yet — run a case from the operator surface</p>
      ) : (
        <div className="mt-8 flex flex-col gap-6">
          {audited.map((a) => {
            const total = a.approved + a.rejected;
            const passRate = total > 0 ? Math.round((a.approved / total) * 100) : 0;
            return (
              <div key={a.worker} className="card p-5">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="mono text-[13px]">{short(a.worker, 8)}</p>
                    <p className="micro mt-1">
                      <a
                        href={`https://www.okx.com/web3/explorer/x-layer-test/address/${a.worker}`}
                        target="_blank"
                        rel="noreferrer"
                        className="underline"
                        style={{ color: "var(--ink-muted)" }}
                      >
                        {a.cases} case{a.cases === 1 ? "" : "s"} on the docket ↗
                      </a>
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {a.approved > 0 && <span className="pill pill-approved">✓ {a.approved} approved</span>}
                    {a.rejected > 0 && <span className="pill pill-rejected">✕ {a.rejected} rejected</span>}
                    {a.pending > 0 && <span className="pill pill-pending">● {a.pending} open</span>}
                  </div>
                </div>
                <div className="mt-3">
                  <div className="h-[3px] rounded-full overflow-hidden flex" style={{ background: "var(--hairline)" }}>
                    <div style={{ width: `${passRate}%`, background: "var(--accepted)" }} />
                  </div>
                  <p className="micro faint mt-1.5">
                    pass rate {passRate}% across {total} audited case{total === 1 ? "" : "s"} · court {short(courtAddress[chainName], 4)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <p className="micro faint mt-8">
        Records are read straight from the court contract — an agent's reputation is its audit history,
        not a badge anyone can self-issue.
      </p>
      <p className="micro mt-2">
        <Link href="/run" className="underline" style={{ color: "var(--ink-muted)" }}>
          Run a case →
        </Link>
      </p>
    </div>
  );
}
