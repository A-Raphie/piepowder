import Link from "next/link";
import type { CourtCase, Phase, Verdict } from "@/lib/court";
import { okb, plainEnglish, short, when } from "@/lib/court";

/**
 * The court kit. Doctrine (from fief D1/D8 + mandate's verdict banner):
 * a verdict is one word plus the sentence that produced it, never colour
 * alone — glyph + label + border edge + fill all repeat the semantic, so a
 * greyscale screenshot still reads. Green/red appear nowhere else.
 */

export const VERDICT_GLYPH: Record<Verdict | Phase, string> = {
  Approved: "✓",
  Rejected: "✕",
  None: "—",
  Open: "●",
  Verdict: "◐",
  Settled: "■",
};

export function VerdictPill({ verdict, phase }: { verdict: Verdict; phase: Phase }) {
  if (phase === "Settled" && verdict === "Approved") return <span className="pill pill-approved">✓ APPROVED</span>;
  if (phase === "Settled" && verdict === "Rejected") return <span className="pill pill-rejected">✕ REJECTED</span>;
  if (phase === "Verdict") return <span className="pill pill-pending">◐ VERDICT STAMPED</span>;
  return <span className="pill pill-pending">● OPEN — AUDITING</span>;
}

export function edgeClass(c: CourtCase): string {
  if (c.phase === "Settled" && c.verdict === "Approved") return "stamp-edge-approved";
  if (c.phase === "Settled" && c.verdict === "Rejected") return "stamp-edge-rejected";
  return "stamp-edge-pending";
}

/** The signature surface: the verdict word, oversized, with its sentence. */
export function VerdictBanner({ c }: { c: CourtCase }) {
  const word = c.phase === "Settled" || c.phase === "Verdict" ? (c.verdict === "Approved" ? "APPROVED" : c.verdict === "Rejected" ? "REJECTED" : "UNRULED") : "OPEN";
  const cls = word === "APPROVED" ? "glyph-approved" : word === "REJECTED" ? "glyph-rejected" : "glyph-pending";
  return (
    <section className="py-8">
      <p className="eyebrow">Verdict</p>
      <p className={`verdict-word ${cls} mt-2`}>{word}</p>
      <p className="mt-3 max-w-prose text-[15px]" style={{ color: "var(--ink-muted)" }}>
        {c.reason ?? plainEnglish(c)}
      </p>
    </section>
  );
}

/** Register row — the docket line (linen grammar on noir tokens). Whole row is the link. */
export function DocketRow({ c }: { c: CourtCase }) {
  return (
    <Link href={`/d/${c.caseId}`} className={`rowlink ${edgeClass(c)} px-5 py-4 no-underline`} style={{ color: "var(--ink)" }}>
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <span className={`mono text-sm ${c.verdict === "Approved" && c.phase === "Settled" ? "glyph-approved" : c.verdict === "Rejected" && c.phase === "Settled" ? "glyph-rejected" : "glyph-pending"}`}>
            {c.phase === "Settled" ? VERDICT_GLYPH[c.verdict] : VERDICT_GLYPH[c.phase]}
          </span>
          <div className="min-w-0">
            <p className="mono text-[13px] truncate">{short(c.caseId, 10)}</p>
            <p className="micro truncate mt-0.5">
              worker {short(c.worker, 4)} · {okb(c.escrow || 0n)} escrow
            </p>
          </div>
        </div>
        <div className="text-right shrink-0">
          <VerdictPill verdict={c.verdict} phase={c.phase} />
          <p className="micro faint mt-1">{when(c.openedAt)}</p>
        </div>
      </div>
    </Link>
  );
}

/** Hash with copy affordance kept honest: link to the explorer instead of fake copy buttons. */
export function HashRow({ label, hash, href }: { label: string; hash: string; href?: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-2 hairline-b">
      <span className="eyebrow">{label}</span>
      {href ? (
        <a href={href} target="_blank" rel="noreferrer" className="mono text-[12px] no-underline" style={{ color: "var(--ink-muted)" }}>
          {short(hash, 10)} ↗
        </a>
      ) : (
        <span className="mono text-[12px]" style={{ color: "var(--ink-muted)" }}>
          {short(hash, 10)}
        </span>
      )}
    </div>
  );
}
