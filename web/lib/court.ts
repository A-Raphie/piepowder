import { formatEther, type AbiEvent } from "viem";
import { courtAddress, publicClient, chainName, COURT_ABI } from "./chain";

export type Phase = "None" | "Open" | "Verdict" | "Settled";
export type Verdict = "None" | "Approved" | "Rejected";

export type CourtCase = {
  caseId: `0x${string}`;
  buyer: string;
  worker: string;
  taskSpecHash: string;
  reason: string;
  evidenceHash: string;
  escrow: bigint;
  phase: Phase;
  verdict: Verdict;
  openedAt: number | null;
  settledAt: number | null;
  openBlock: bigint;
  stampBlock: bigint;
  settleBlock: bigint;
};

const PHASES: Phase[] = ["None", "Open", "Verdict", "Settled"];
const VERDICTS: Verdict[] = ["None", "Approved", "Rejected"];

type RawCase = {
  phase: number;
  verdict: number;
  evidenceHash: string;
  taskSpecHash: string;
  reason: string;
  buyer: string;
  worker: string;
  escrow: bigint;
  openedAt: bigint;
  settledAt: bigint;
  openBlock: bigint;
  stampBlock: bigint;
  settleBlock: bigint;
};

function normalize(id: `0x${string}`, r: RawCase): CourtCase {
  return {
    caseId: id,
    buyer: r.buyer,
    worker: r.worker,
    taskSpecHash: r.taskSpecHash,
    reason: r.reason,
    evidenceHash: r.evidenceHash,
    escrow: r.escrow,
    phase: PHASES[Number(r.phase)] ?? "None",
    verdict: VERDICTS[Number(r.verdict)] ?? "None",
    openedAt: Number(r.openedAt) || null,
    settledAt: Number(r.settledAt) || null,
    openBlock: r.openBlock,
    stampBlock: r.stampBlock,
    settleBlock: r.settleBlock,
  };
}

async function readCase(id: `0x${string}`): Promise<CourtCase | null> {
  const r = await publicClient.readContract({
    abi: COURT_ABI,
    address: courtAddress[chainName],
    functionName: "getCase",
    args: [id],
  });
  const c = r as unknown as RawCase;
  if (Number(c.phase) === 0) return null;
  return normalize(id, c);
}

/**
 * The docket reads the on-chain case registry — caseCount + caseAt + getCase.
 * No event scanning anywhere: the public RPC caps eth_getLogs at 100 blocks.
 */
export async function fetchDocket(): Promise<CourtCase[]> {
  const count = Number(
    await publicClient.readContract({ abi: COURT_ABI, address: courtAddress[chainName], functionName: "caseCount" }),
  );
  if (count === 0) return [];
  const ids = await Promise.all(
    Array.from({ length: count }, (_, i) =>
      publicClient
        .readContract({ abi: COURT_ABI, address: courtAddress[chainName], functionName: "caseAt", args: [BigInt(i)] })
        .then((id) => id as `0x${string}`)
        .catch(() => null),
    ),
  );
  const cases = await Promise.all(
    ids.filter((id): id is `0x${string}` => id !== null).map((id) => readCase(id).catch(() => null)),
  );
  return cases
    .filter((c): c is CourtCase => c !== null && c.phase !== "None")
    .sort((a, b) => (b.openedAt ?? 0) - (a.openedAt ?? 0));
}

export async function fetchCase(caseId: `0x${string}`): Promise<CourtCase | null> {
  return readCase(caseId);
}

/**
 * Transaction hashes for a case's lifecycle. The struct stores the block
 * numbers; a 1-block eth_getLogs per step stays inside the RPC's range cap.
 */
export async function fetchCaseTxs(c: CourtCase): Promise<{ open?: string; stamp?: string; settle?: string }> {
  const address = courtAddress[chainName];
  const grab = async (block: bigint, eventName: "CaseOpened" | "VerdictStamped" | "CaseSettled") => {
    if (block === 0n) return undefined;
    try {
      const event = COURT_ABI.find((a) => a.type === "event" && a.name === eventName);
      if (!event) return undefined;
      const logs = (await publicClient.getLogs({
        address,
        event: event as unknown as AbiEvent,
        fromBlock: block,
        toBlock: block,
      })) as unknown as Array<{ args: { caseId?: `0x${string}` }; transactionHash: string }>;
      return logs.find((l) => l.args.caseId?.toLowerCase() === c.caseId.toLowerCase())?.transactionHash;
    } catch {
      return undefined;
    }
  };
  const [open, stamp, settle] = await Promise.all([
    grab(c.openBlock, "CaseOpened"),
    grab(c.stampBlock, "VerdictStamped"),
    grab(c.settleBlock, "CaseSettled"),
  ]);
  return { open, stamp, settle };
}

export const short = (h: string, n = 6) => `${h.slice(0, 2 + n)}…${h.slice(-4)}`;
export const okb = (wei: bigint) => `${formatEther(wei)} OKB`;
export const when = (ts: number | null) =>
  ts ? new Date(ts * 1000).toISOString().replace("T", " ").slice(0, 16) + " UTC" : "—";

/** Plain-English sentence per state — fief's plainEnglish() doctrine. */
export function plainEnglish(c: CourtCase): string {
  if (c.phase === "Settled") {
    return c.verdict === "Approved"
      ? "The deliverable passed every check, so the escrowed payment was released to the hired agent."
      : "The deliverable failed the audit, so the escrowed payment was refunded to the buyer in full.";
  }
  if (c.phase === "Verdict") {
    return "The auditor stamped a verdict; settlement is queued.";
  }
  if (c.phase === "Open") {
    return "Escrow is locked and the audit is in progress — nothing has moved yet.";
  }
  return "This case has no state on record.";
}
