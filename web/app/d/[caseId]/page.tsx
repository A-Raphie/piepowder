import Link from "next/link";
import { HashRow, VerdictBanner, edgeClass } from "@/components/kit";
import { courtAddress, explorer, chainName } from "@/lib/chain";
import { fetchCase, fetchCaseTxs, okb, plainEnglish, short, when } from "@/lib/court";

export const dynamic = "force-dynamic";

const PHASE_STEPS = ["Open", "Verdict", "Settled"] as const;

export default async function CaseDossier({ params }: { params: Promise<{ caseId: string }> }) {
  const { caseId } = await params;
  const id = (caseId.startsWith("0x") ? caseId : `0x${caseId}`) as `0x${string}`;
  const c = await fetchCase(id);

  if (!c || c.phase === "None") {
    return (
      <div className="page pt-14">
        <p className="eyebrow">Case</p>
        <h1 className="display text-3xl font-bold mt-3">Not on the docket.</h1>
        <p className="micro mt-3">
          No case {short(id, 10)} in court {short(courtAddress[chainName], 6)}. Check the hash on{" "}
          <Link href="/verify" className="underline" style={{ color: "var(--ink-muted)" }}>
            /verify
          </Link>
          .
        </p>
      </div>
    );
  }

  const txs = await fetchCaseTxs(c);
  const stageIdx = PHASE_STEPS.indexOf(c.phase as (typeof PHASE_STEPS)[number]);

  return (
    <div className="page pt-12">
      <p className="eyebrow">Case dossier</p>
      <p className="mono text-[13px] mt-2 break-all" style={{ color: "var(--ink-muted)" }}>
        {c.caseId}
      </p>

      <VerdictBanner c={c} />

      <div className={`card ${edgeClass(c)} p-6 mt-2`}>
        <p className="text-[15px] max-w-prose">{plainEnglish(c)}</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 mt-6">
          <div>
            <p className="eyebrow">Buyer</p>
            <p className="mono text-[12px] mt-1">{short(c.buyer, 6)}</p>
          </div>
          <div>
            <p className="eyebrow">Hired agent</p>
            <p className="mono text-[12px] mt-1">{short(c.worker, 6)}</p>
          </div>
          <div>
            <p className="eyebrow">Escrow</p>
            <p className="mono text-[12px] mt-1">{c.phase === "Settled" ? "0 (settled)" : okb(c.escrow)}</p>
          </div>
          <div>
            <p className="eyebrow">Settled</p>
            <p className="mono text-[12px] mt-1">{when(c.settledAt)}</p>
          </div>
        </div>
      </div>

      <section className="mt-10">
        <p className="eyebrow">Lifecycle — each step is a transaction</p>
        <div className="flex gap-2 mt-4">
          {PHASE_STEPS.map((s, i) => {
            const done = i <= stageIdx;
            const tx = i === 0 ? txs.open : i === 1 ? txs.stamp : txs.settle;
            const accent = c.verdict === "Rejected" ? "var(--rejected)" : c.verdict === "Approved" ? "var(--accepted)" : "var(--ink-faint)";
            return (
              <div key={s} className="flex-1">
                <div className="h-[3px] rounded-full" style={{ background: done ? (i > 0 ? accent : "var(--ink-faint)") : "var(--hairline)" }} />
                <p className="mono text-[11px] mt-2" style={{ color: done ? "var(--ink)" : "var(--ink-faint)" }}>
                  {i + 1} · {s}
                </p>
                {tx ? (
                  <a href={explorer(tx)} target="_blank" rel="noreferrer" className="micro no-underline" style={{ color: "var(--ink-muted)" }}>
                    {short(tx, 6)} ↗
                  </a>
                ) : (
                  <p className="micro faint">{done ? `block ${[c.openBlock, c.stampBlock, c.settleBlock][i]}` : "not yet"}</p>
                )}
              </div>
            );
          })}
        </div>
      </section>

      <section className="mt-10">
        <p className="eyebrow">Evidence commitment</p>
        <div className="card p-5 mt-3">
          {c.evidenceHash !== "0x0000000000000000000000000000000000000000000000000000000000000000" ? (
            <>
              <HashRow label="Evidence digest (onchain)" hash={c.evidenceHash} />
              <HashRow label="Task spec digest" hash={c.taskSpecHash} />
              <p className="micro mt-3">
                The digest is stamped on X Layer; the full check-by-check bundle it commits to publishes
                alongside the audit engine. The court verifies the commitment, the dossier shows the work.
              </p>
            </>
          ) : (
            <p className="micro">◍ no verdict yet — the evidence digest appears when the auditor stamps</p>
          )}
        </div>
      </section>
    </div>
  );
}
