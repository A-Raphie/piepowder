/**
 * Task catalogue + worker profiles for the court's live market.
 *
 * The engine is DETERMINISTIC: the same (task, worker) pair always produces
 * the same deliverable and the same check results — which is what lets the
 * evidence bundle be re-derived from the on-chain digest later (the court can
 * rebuild any case's evidence and check it against the stamped hash).
 *
 * LLMs may annotate, never judge: the verdict bit comes from these checks.
 */

export type CheckStatus = "PASS" | "FAIL" | "SKIP";

export type Check = { name: string; status: CheckStatus; detail: string };

export type TaskSpec = {
  id: string;
  title: string;
  brief: string;
  requiredFacts: { name: string; needle: string }[];
  minLengthWords: number;
  forbidden: { name: string; needle: string }[];
};

export const TASKS: TaskSpec[] = [
  {
    id: "xlayer-network-brief",
    title: "Network brief: X Layer testnet",
    brief:
      "Write a short developer brief on the X Layer testnet. It must state the chain id, the RPC endpoint, the gas token and the block time, in plain prose a builder can act on.",
    requiredFacts: [
      { name: "chain id 1952 stated", needle: "1952" },
      { name: "RPC endpoint stated", needle: "testrpc.xlayer.tech/terigon" },
      { name: "gas token OKB named", needle: "OKB" },
      { name: "block time stated", needle: "1-second" },
    ],
    minLengthWords: 80,
    forbidden: [
      { name: "no placeholder text", needle: "TODO" },
      { name: "no placeholder text", needle: "lorem" },
    ],
  },
  {
    id: "viem-client-port",
    title: "Code task: viem client for X Layer",
    brief:
      "Produce a TypeScript snippet that connects viem to the X Layer testnet: the chain definition (with its id and RPC) and a public client, ready to import.",
    requiredFacts: [
      { name: "chain definition present", needle: "defineChain" },
      { name: "testnet chain id 1952 used", needle: "1952" },
      { name: "testnet RPC used", needle: "testrpc.xlayer.tech/terigon" },
      { name: "public client constructed", needle: "createPublicClient" },
    ],
    minLengthWords: 20,
    forbidden: [{ name: "no placeholder text", needle: "TODO" }],
  },
];

export type WorkerId = "honest-agent" | "sloppy-agent";

export type WorkerProfile = {
  id: WorkerId;
  label: string;
  address: string; // receives escrow on APPROVED
};

export const WORKERS: WorkerProfile[] = [
  {
    id: "honest-agent",
    label: "attested-01 · reliable",
    address: process.env.HONEST_WORKER_ADDR ?? "0x0000000000000000000000000000000000000001",
  },
  {
    id: "sloppy-agent",
    label: "unproven-02 · untested",
    address: process.env.SLOPPY_WORKER_ADDR ?? "0x0000000000000000000000000000000000000002",
  },
];

const DELIVERABLES: Record<WorkerId, Record<string, string>> = {
  "honest-agent": {
    "xlayer-network-brief": `X Layer testnet in one page

X Layer is OKX's EVM-equivalent layer 2. Its testnet — nicknamed terigon — runs with chain id 1952, so that is the id your wallet and tooling must target. The public RPC endpoint is https://testrpc.xlayer.tech/terigon, which speaks standard Ethereum JSON-RPC: eth_chainId, eth_getBalance, eth_getLogs all behave as expected.

Gas is paid in OKB, the exchange's fixed-supply token (21M after burns). Fees are effectively negligible — around 1 gwei with 1-second block times — so a full case lifecycle costs a tiny fraction of a cent. The official faucet dispenses 0.2 testnet OKB per address per day, which is thousands of transactions' worth.

Two operational notes a builder will hit: public RPCs here cap eth_getLogs to a 100-block window, so indexers should read state through view calls or chunk their scans; and reads can lag a few seconds behind a just-mined transaction, so poll rather than assume failure. Deploy with Hardhat or Foundry against the terigon endpoint and verify on the OKX explorer.`,
    "viem-client-port": `import { createPublicClient, defineChain, http } from "viem";

export const xlayerTestnet = defineChain({
  id: 1952,
  name: "X Layer Testnet",
  nativeCurrency: { name: "OKB", symbol: "OKB", decimals: 18 },
  rpcUrls: { default: { http: ["https://testrpc.xlayer.tech/terigon"] } },
  testnet: true,
});

export const client = createPublicClient({
  chain: xlayerTestnet,
  transport: http(),
});`,
  },
  "sloppy-agent": {
    "xlayer-network-brief": `X Layer notes

X Layer is a layer 2 by OKX. It is fast and cheap. Gas token is OKB.

TODO: add chain id, rpc url and block time later.`,
    "viem-client-port": `import { createPublicClient } from "viem";

// TODO: fill in the chain definition
export const client = createPublicClient({
  transport: http("https://rpc.xlayer.tech"),
});`,
  },
};

export function getTask(id: string): TaskSpec | undefined {
  return TASKS.find((t) => t.id === id);
}

export function getWorker(id: string): WorkerProfile | undefined {
  return WORKERS.find((w) => w.id === id);
}

export function deliverableFor(taskId: string, workerId: WorkerId): string {
  return DELIVERABLES[workerId]?.[taskId] ?? "";
}
