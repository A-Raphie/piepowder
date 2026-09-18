import { OKXFacilitatorClient } from "@okxweb3/x402-core";
// server classes live on the /server subpath
import { x402ResourceServer, x402HTTPResourceServer, type HTTPAdapter, type HTTPProcessResult, type HTTPRequestContext } from "@okxweb3/x402-core/server";
import { ExactEvmScheme } from "@okxweb3/x402-evm/exact/server";
import type { HTTPTransportContext } from "@okxweb3/x402-core/server";

/**
 * The payment rail for the listed Piepowder audit service (A2MCP).
 * OKX's hosted facilitator (Broker) verifies + settles x402 payments on
 * X Layer testnet (eip155:1952); funds flow buyer → payTo, never through us.
 * Framework-agnostic x402HTTPResourceServer wired to a Next Request adapter —
 * no Express needed.
 */

const NETWORK = "eip155:196"; // marketplace listings must receive on X Layer mainnet
export const PAY_TO = process.env.PAY_TO_ADDRESS ?? "0x340c1F8d16B427c8f364607E013c4c117b9a286B";
export const AUDIT_PRICE = "$0.01";
export const AUDIT_ENDPOINT = "POST /api/audit";

export function paymentConfigured(): boolean {
  return Boolean(process.env.OKX_API_KEY && process.env.OKX_SECRET_KEY && process.env.OKX_PASSPHRASE);
}

let httpServer: x402HTTPResourceServer | null = null;
let initPromise: Promise<x402HTTPResourceServer> | null = null;

async function getServer(): Promise<x402HTTPResourceServer> {
  if (httpServer) return httpServer;
  if (!initPromise) {
    initPromise = (async () => {
      const facilitator = new OKXFacilitatorClient({
        apiKey: process.env.OKX_API_KEY!,
        secretKey: process.env.OKX_SECRET_KEY!,
        passphrase: process.env.OKX_PASSPHRASE!,
      });
      const resourceServer = new x402ResourceServer(facilitator);
      resourceServer.register(NETWORK, new ExactEvmScheme());
      const hs = new x402HTTPResourceServer(resourceServer, {
        // reviewers and wallets probe with GET — serve the challenge either way
        "GET /api/audit": {
          accepts: [
            {
              scheme: "exact",
              network: NETWORK,
              payTo: PAY_TO,
              price: AUDIT_PRICE,
            },
          ],
          description: "Piepowder audit — deterministic deliverable audit with an onchain court verdict",
          mimeType: "application/json",
        },
        [AUDIT_ENDPOINT]: {
          accepts: [
            {
              scheme: "exact",
              network: NETWORK,
              payTo: PAY_TO,
              price: AUDIT_PRICE,
            },
          ],
          description: "Piepowder audit — deterministic deliverable audit with an onchain court verdict",
          mimeType: "application/json",
        },
      });
      await hs.initialize();
      httpServer = hs;
      return hs;
    })();
  }
  return initPromise;
}

class NextAdapter implements HTTPAdapter {
  constructor(private req: Request) {}
  getHeader(name: string): string | undefined {
    return this.req.headers.get(name) ?? undefined;
  }
  getMethod(): string {
    return this.req.method;
  }
  getPath(): string {
    return new URL(this.req.url).pathname;
  }
  getUrl(): string {
    return this.req.url;
  }
  getAcceptHeader(): string {
    return this.req.headers.get("accept") ?? "*/*";
  }
  getUserAgent(): string {
    return this.req.headers.get("user-agent") ?? "";
  }
  getBody(): unknown {
    return undefined; // payment processing only needs headers; body parsed by the handler
  }
}

export type PaidGate =
  | { kind: "unconfigured" }
  | { kind: "payment-required"; status: number; headers: Record<string, string>; body: unknown }
  | { kind: "verified"; context: HTTPRequestContext; process: (transportContext?: HTTPTransportContext) => Promise<{ headers: Record<string, string> }> };

/** Gate a request behind x402: 402 challenge, or verified + settle-on-success. */
export async function gatePaidRequest(req: Request): Promise<PaidGate> {
  if (!paymentConfigured()) return { kind: "unconfigured" };
  const server = await getServer();
  const adapter = new NextAdapter(req);
  const result: HTTPProcessResult = await server.processHTTPRequest({
    adapter,
    path: new URL(req.url).pathname,
    method: req.method,
    paymentHeader: adapter.getHeader("payment-signature") || adapter.getHeader("x-payment"),
    routePattern: AUDIT_ENDPOINT,
  });
  if (result.type === "payment-error") {
    return {
      kind: "payment-required",
      status: result.response.status,
      headers: result.response.headers as Record<string, string>,
      body: result.response.body ?? { error: "payment required" },
    };
  }
  if (result.type === "no-payment-required") {
    // Route mismatch would land here — treat as unconfigured misfire, never serve free.
    return { kind: "unconfigured" };
  }
  return {
    kind: "verified",
    context: { adapter, path: new URL(req.url).pathname, method: req.method },
    process: async (transportContext?: HTTPTransportContext) => {
      const settle = await server.processSettlement(
        result.paymentPayload,
        result.paymentRequirements,
        result.declaredExtensions,
        transportContext,
      );
      if (settle.success !== true) {
        throw new Error(`settlement failed: ${"errorReason" in settle ? String(settle.errorReason) : "unknown"}`);
      }
      return { headers: settle.headers as Record<string, string> };
    },
  };
}
