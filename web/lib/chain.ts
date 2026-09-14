import { createPublicClient, defineChain, http } from "viem";

/**
 * Single source of chain truth. CHAIN env var cuts over testnet|mainnet
 * (reeve pattern). The court surface is a pure chain reader — no wallet,
 * no keys, no indexer. The docket reads the on-chain case registry, so no
 * log scanning is needed anywhere.
 */
export const courtAddress = {
  testnet: "0xa7E50b3583F28E31A66259905e815AA992D9704D",
  mainnet: "0x0000000000000000000000000000000000000000", // set on mainnet day
} as const;

/** First block where the court has code — found by binary search at deploy time. */
export const courtDeployBlock = { testnet: 40939267n, mainnet: 0n } as const;

export const xlayerTestnet = defineChain({
  id: 1952,
  name: "X Layer Testnet",
  nativeCurrency: { name: "OKB", symbol: "OKB", decimals: 18 },
  rpcUrls: { default: { http: ["https://testrpc.xlayer.tech/terigon"] } },
  blockExplorers: {
    default: { name: "OKX Explorer", url: "https://www.okx.com/web3/explorer/x-layer-test" },
  },
  testnet: true,
});

export const xlayerMainnet = defineChain({
  id: 196,
  name: "X Layer",
  nativeCurrency: { name: "OKB", symbol: "OKB", decimals: 18 },
  rpcUrls: { default: { http: ["https://rpc.xlayer.tech"] } },
  blockExplorers: {
    default: { name: "OKX Explorer", url: "https://www.okx.com/web3/explorer/x-layer" },
  },
});

export const chainName = (process.env.CHAIN ?? "testnet") as "testnet" | "mainnet";
export const chain = chainName === "mainnet" ? xlayerMainnet : xlayerTestnet;

export const publicClient = createPublicClient({
  chain,
  transport: http(undefined, { timeout: 12_000, retryCount: 2 }),
});

/** Matches PiepowderCourt.Case — field order is the ABI. */
export const CASE_COMPONENTS = [
  { name: "phase", type: "uint8" },
  { name: "verdict", type: "uint8" },
  { name: "evidenceHash", type: "bytes32" },
  { name: "taskSpecHash", type: "bytes32" },
  { name: "reason", type: "string" },
  { name: "buyer", type: "address" },
  { name: "worker", type: "address" },
  { name: "escrow", type: "uint256" },
  { name: "openedAt", type: "uint64" },
  { name: "settledAt", type: "uint64" },
  { name: "openBlock", type: "uint64" },
  { name: "stampBlock", type: "uint64" },
  { name: "settleBlock", type: "uint64" },
] as const;

export const COURT_ABI = [
  {
    type: "function",
    name: "caseCount",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "uint256" }],
  },
  {
    type: "function",
    name: "caseAt",
    stateMutability: "view",
    inputs: [{ name: "i", type: "uint256" }],
    outputs: [{ type: "bytes32" }],
  },
  {
    type: "function",
    name: "getCase",
    stateMutability: "view",
    inputs: [{ name: "caseId", type: "bytes32" }],
    outputs: [{ name: "c", type: "tuple", components: CASE_COMPONENTS }],
  },
  {
    type: "function",
    name: "auditor",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "address" }],
  },
  {
    type: "event",
    name: "CaseOpened",
    inputs: [
      { name: "caseId", type: "bytes32", indexed: true },
      { name: "buyer", type: "address", indexed: true },
      { name: "worker", type: "address", indexed: true },
      { name: "taskSpecHash", type: "bytes32", indexed: false },
      { name: "escrow", type: "uint256", indexed: false },
    ],
  },
  {
    type: "event",
    name: "VerdictStamped",
    inputs: [
      { name: "caseId", type: "bytes32", indexed: true },
      { name: "verdict", type: "uint8", indexed: false },
      { name: "evidenceHash", type: "bytes32", indexed: false },
      { name: "reason", type: "string", indexed: false },
    ],
  },
  {
    type: "event",
    name: "CaseSettled",
    inputs: [
      { name: "caseId", type: "bytes32", indexed: true },
      { name: "verdict", type: "uint8", indexed: false },
      { name: "amount", type: "uint256", indexed: false },
      { name: "released", type: "bool", indexed: false },
    ],
  },
] as const;

export const explorer = (hash: string) => `${chain.blockExplorers.default.url}/tx/${hash}`;
export const explorerBlock = (b: bigint) => `${chain.blockExplorers.default.url}/block/${b}`;
export const explorerAddr = (a: string) => `${chain.blockExplorers.default.url}/address/${a}`;
