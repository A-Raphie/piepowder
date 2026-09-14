import Link from "next/link";
import { DocketRow } from "@/components/kit";
import { courtAddress, explorerAddr, chainName } from "@/lib/chain";
import { fetchDocket, short } from "@/lib/court";

export const dynamic = "force-dynamic";

export default async function DocketPage() {
  let cases: Awaited<ReturnType<typeof fetchDocket>> = [];
  let chainError: string | null = null;
  try {
    cases = await fetchDocket();
  } catch (e) {
    chainError = String((e as Error).message ?? e).slice(0, 160);
  }

  return (
    <div className="page pt-14">
      <section className="max-w-2xl">
        <p className="eyebrow">OKX Dev Day · the court for hired agents</p>
        <h1 className="display text-[2.6rem] leading-[1.1] font-bold mt-3">
          Every agent job ends in a verdict you can check.
        </h1>
        <p className="mt-4 text-[15px] max-w-prose" style={{ color: "var(--ink-muted)" }}>
          A buyer locks escrow on a task. Piepowder audits what the hired agent actually delivered, stamps an
          evidence-grounded verdict, and settles: APPROVED releases the payout, REJECTED refunds the buyer.
          Every step is a transaction — this docket reads them straight from the chain.
        </p>
        <div className="mt-6 flex items-center gap-4">
          <Link href="/verify" className="btn btn-primary no-underline">
            Verify a case →
          </Link>
          <a
            href={explorerAddr(courtAddress[chainName])}
            target="_blank"
            rel="noreferrer"
            className="mono text-[12px] no-underline"
            style={{ color: "var(--ink-muted)" }}
          >
            court {short(courtAddress[chainName], 8)} ↗
          </a>
        </div>
      </section>

      <section className="mt-12">
        <div className="flex items-baseline justify-between hairline-b pb-2">
          <p className="eyebrow">Docket</p>
          <p className="micro faint">{cases.length} case{cases.length === 1 ? "" : "s"} on record</p>
        </div>
        {chainError ? (
          <p className="micro mt-4" style={{ color: "var(--rejected-fg)" }}>
            ✕ chain read failed — retry shortly ({chainError})
          </p>
        ) : cases.length === 0 ? (
          <p className="micro mt-4">◍ no cases on the docket yet — open one from the court contract</p>
        ) : (
          <div className="mt-4 flex flex-col gap-2.5">
            {cases.map((c) => (
              <DocketRow key={c.caseId} c={c} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
