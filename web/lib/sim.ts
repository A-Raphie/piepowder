import { createPublicClient, createWalletClient, http, keccak256, toHex, parseEther } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { courtAddress, chain, COURT_ABI } from "./chain";

/**
 * The court's hands: the buyer agent and the auditor transact with real keys.
 * Keys live in env (gitignored). Testnet only until mainnet day.
 */

const rpc = () => http(undefined, { timeout: 20_000, retryCount: 1 });

function wallet(pk: string) {
  const account = privateKeyToAccount(pk.startsWith("0x") ? (pk as `0x${string}`) : (`0x${pk}` as `0x${string}`));
  const client = createWalletClient({ account, chain, transport: rpc() });
  return { account, client };
}

function envKey(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`${name} not set — the court cannot transact`);
  return v;
}

export const ESCROW_WEI = parseEther("0.0005");

export function newCaseId(seed: string): `0x${string}` {
  return keccak256(toHex(`${seed}:${Date.now()}:${Math.random()}`));
}

export async function openCase(opts: { caseId: `0x${string}`; worker: string; taskSpecHash: `0x${string}` }) {
  const { account, client } = wallet(envKey("BUYER_KEY"));
  const hash = await client.writeContract({
    abi: COURT_ABI,
    address: courtAddress[chainNameSafe()],
    functionName: "openCase",
    args: [opts.caseId, opts.worker as `0x${string}`, opts.taskSpecHash],
    value: ESCROW_WEI,
  });
  const receipt = await waitFor(hash);
  return { hash, receipt };
}

export async function stampVerdict(opts: {
  caseId: `0x${string}`;
  approved: boolean;
  evidenceDigest: `0x${string}`;
  reason: string;
}) {
  const { client } = wallet(envKey("AUDITOR_KEY"));
  const hash = await client.writeContract({
    abi: COURT_ABI,
    address: courtAddress[chainNameSafe()],
    functionName: "stamp",
    args: [opts.caseId, opts.approved ? 1 : 2, opts.evidenceDigest, opts.reason],
  });
  const receipt = await waitFor(hash);
  return { hash, receipt };
}

export async function settleCase(opts: { caseId: `0x${string}` }) {
  const { client } = wallet(envKey("AUDITOR_KEY"));
  const hash = await client.writeContract({
    abi: COURT_ABI,
    address: courtAddress[chainNameSafe()],
    functionName: "settle",
    args: [opts.caseId],
  });
  const receipt = await waitFor(hash);
  return { hash, receipt };
}

async function waitFor(hash: string, tries = 20): Promise<{ status: "success" | "reverted" }> {
  const client = createPublicRead();
  for (let i = 0; i < tries; i++) {
    try {
      const r = await client.getTransactionReceipt({ hash: hash as `0x${string}` });
      return { status: r.status === "success" ? "success" : "reverted" };
    } catch {
      await new Promise((res) => setTimeout(res, 1500));
    }
  }
  throw new Error(`tx ${hash} not mined in time — check the explorer`);
}

function chainNameSafe(): "testnet" | "mainnet" {
  return (process.env.CHAIN ?? "testnet") as "testnet" | "mainnet";
}

function createPublicRead() {
  return createPublicClient({ chain, transport: rpc() });
}

export const specHash = (taskSpecId: string) => keccak256(toHex(`piepowder/spec/${taskSpecId}`));
