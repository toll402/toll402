/**
 * toll402-client — one-line access to Toll402 (https://toll402.dev):
 * pay-per-call tools for AI agents over x402 (USDC on Base).
 *
 *   const t = new Toll402({ walletKey: process.env.WALLET_KEY });   // or no key → free trial
 *   await t.read("https://example.com");
 *   await t.do("convert 100 usd to mxn", { base: "USD", quote: "MXN", amount: 100 });
 */
import { wrapFetchWithPaymentFromConfig, decodePaymentResponseHeader } from "@x402/fetch";
import { ExactEvmScheme } from "@x402/evm/exact/client";
import { privateKeyToAccount } from "viem/accounts";

export interface Toll402Options {
  /** 0x-prefixed private key of a wallet holding USDC on Base. Omit to use the free trial (cheap tools, per-IP quota). */
  walletKey?: `0x${string}`;
  /** Gateway URL. Default https://toll402.dev */
  baseUrl?: string;
  /** Hard cap per single payment in USD. Default 0.25 */
  maxUsdPerCall?: number;
  /** CAIP-2 network to pay on. Default "eip155:8453" (Base). Use "eip155:*" to accept any EVM network the server offers. */
  network?: string;
  /** Custom fetch (tests, polyfills). */
  fetch?: typeof fetch;
}

export interface CatalogTool {
  id: string;
  kind: "builtin" | "forged" | "external";
  name: string;
  description: string;
  tags: string[];
  method: string;
  path: string;
  url: string;
  price: string;
  priceUsd: number;
  available: boolean;
  inputSchema: Record<string, unknown>;
  example?: unknown;
  outputExample?: unknown;
  meta?: Record<string, unknown>;
}

export interface Catalog {
  service: string;
  version: string;
  description: string;
  baseUrl: string;
  payment: Record<string, unknown>;
  counts: { builtin: number; forged: number; external: number };
  freeTrial?: { callsPerIpPerDay: number; toolsPricedUpTo: string; note: string } | null;
  tools: CatalogTool[];
}

export interface PaymentInfo {
  success: boolean;
  transaction?: string;
  network?: string;
  payer?: string;
  [k: string]: unknown;
}

export class Toll402Error extends Error {
  constructor(
    message: string,
    public status: number,
    public code: string,
    public price?: string,
    public details?: unknown,
  ) {
    super(message);
    this.name = "Toll402Error";
  }
}

export interface ForgeSpec {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
  outputSchema?: Record<string, unknown>;
  examples: { input: Record<string, unknown>; expectedOutput?: unknown }[];
  allowNetwork?: boolean;
  priceUsd?: number;
  tags?: string[];
  creator?: string;
}

export class Toll402 {
  readonly baseUrl: string;
  readonly address?: string;
  /** Decoded PAYMENT-RESPONSE of the last paid call (undefined for free/trial calls). */
  lastPayment?: PaymentInfo;
  /** Remaining free-trial calls reported by the server on the last call (undefined once you pay). */
  trialRemaining?: number;
  private readonly f: typeof fetch;
  private catalogCache?: { at: number; data: Catalog };

  constructor(opts: Toll402Options = {}) {
    this.baseUrl = (opts.baseUrl ?? "https://toll402.dev").replace(/\/$/, "");
    const base = opts.fetch ?? globalThis.fetch;
    if (opts.walletKey) {
      const account = privateKeyToAccount(opts.walletKey);
      this.address = account.address;
      this.f = wrapFetchWithPaymentFromConfig(base, {
        schemes: [{ network: (opts.network ?? "eip155:8453") as `${string}:${string}`, client: new ExactEvmScheme(account) }],
        spendControls: { maxAmountPerPayment: `$${opts.maxUsdPerCall ?? 0.25}` },
      }) as typeof fetch;
    } else {
      this.f = base;
    }
  }

  // ---- discovery (free) ------------------------------------------------------
  async catalog(opts: { fresh?: boolean } = {}): Promise<Catalog> {
    if (!opts.fresh && this.catalogCache && Date.now() - this.catalogCache.at < 5 * 60_000) return this.catalogCache.data;
    const r = await this.f(`${this.baseUrl}/v1/catalog`);
    if (!r.ok) throw new Toll402Error(`catalog: HTTP ${r.status}`, r.status, "catalog_unavailable");
    const data = (await r.json()) as Catalog;
    this.catalogCache = { at: Date.now(), data };
    return data;
  }

  /** Free: ranked tools for a plain-language need. */
  async find(need: string, opts: { limit?: number; kinds?: ("builtin" | "forged" | "external")[] } = {}) {
    const r = await this.f(`${this.baseUrl}/v1/find`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ need, ...opts }) });
    const j = (await r.json()) as { matches: (CatalogTool & { score: number })[]; forgeHint?: string };
    if (!r.ok) throw new Toll402Error(`find: HTTP ${r.status}`, r.status, "find_failed", undefined, j);
    return j;
  }

  // ---- calls (paid; free trial when no wallet) ----------------------------------
  /** Call any tool by catalog name ("read_url", "hn_top", …), id ("t/hn_top", "x/abc123") or path ("/v1/read"). Returns the tool's `result`. */
  async call<T = unknown>(tool: string, input: Record<string, unknown> = {}): Promise<T> {
    const path = await this.resolvePath(tool);
    const r = await this.f(`${this.baseUrl}${path}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(input) });
    const trial = r.headers.get("x-toll402-trial-remaining");
    this.trialRemaining = trial !== null ? Number(trial) : undefined;
    const pr = r.headers.get("payment-response") ?? r.headers.get("x-payment-response");
    if (pr) {
      try {
        this.lastPayment = decodePaymentResponseHeader(pr) as PaymentInfo;
      } catch {
        /* ignore undecodable header */
      }
    }
    const text = await r.text();
    let body: Record<string, unknown> = {};
    try {
      body = JSON.parse(text) as Record<string, unknown>;
    } catch {
      body = { raw: text };
    }
    if (r.status === 402) {
      throw new Toll402Error(
        (body.message as string) ?? "Payment required: configure walletKey with USDC on Base (or your free-trial quota is exhausted)",
        402,
        "payment_required",
        body.price as string | undefined,
        body,
      );
    }
    if (!r.ok || body.ok === false) {
      throw new Toll402Error((body.message as string) ?? `HTTP ${r.status}`, r.status, (body.error as string) ?? "error", undefined, body);
    }
    return body.result as T;
  }

  /** One endpoint for everything: routes `need` to the best tool and runs it with `input`. */
  async do<T = unknown>(need: string, input: Record<string, unknown>, opts: { maxPriceUsd?: number; tool?: string } = {}) {
    return this.call<{ executed: boolean; tool?: { id: string; name: string; price: string }; result?: T; reason?: string; alternatives?: unknown[] }>("/v1/do", { need, input, ...opts });
  }

  /** Create a new tool from a description + examples; published for every agent on success. */
  forge(spec: ForgeSpec) {
    return this.call<{ published: boolean; tool?: { name: string; url: string; price: string }; attempts: number; results: unknown[]; notes?: string }>("/v1/forge", spec as unknown as Record<string, unknown>);
  }

  read(url: string, opts: { format?: "markdown" | "text" | "both"; includeLinks?: boolean; maxChars?: number } = {}) {
    return this.call<{ url: string; title: string | null; markdown?: string; text?: string; wordCount: number; links?: { text: string; href: string }[] }>("/v1/read", { url, ...opts });
  }
  provenance(url: string, opts: { deep?: boolean } = {}) {
    return this.call<{ humanOriginScore: number; verdict: string; confidence: number; evidence: unknown[]; firstArchived: string | null }>("/v1/provenance", { url, ...opts });
  }
  lookup(query: string, opts: { language?: string; sources?: string[]; maxPassages?: number; synthesize?: boolean } = {}) {
    return this.call<{ answer: { text: string; citations: number[]; confidence: number } | null; passages: unknown[] }>("/v1/lookup", { query, ...opts });
  }
  extract<T = unknown>(input: { url?: string; text?: string; schema: Record<string, unknown>; instructions?: string }) {
    return this.call<{ data: T; source: string | null }>("/v1/extract", input);
  }
  summarize(input: { url?: string; text?: string; style?: "bullets" | "paragraph" | "tldr" | "detailed"; maxWords?: number; language?: string; focus?: string }) {
    return this.call<{ summary: string; title: string | null }>("/v1/summarize", input);
  }
  judge(input: { task: string; candidate: string; reference?: string; criteria?: string[] }) {
    return this.call<{ overall: number; pass: boolean; scores: unknown[]; issues: string[]; suggestions: string[] }>("/v1/judge", input);
  }
  verifyEmail(email: string) {
    return this.call<{ valid: boolean; score: number; disposable: boolean; roleAccount: boolean }>("/v1/email/verify", { email });
  }
  fx(base: string, quote?: string, amount = 1) {
    return this.call<{ base: string; quote?: string; rate?: number; converted?: number; rates?: Record<string, number>; date: string }>("/v1/fx", { base, quote, amount });
  }

  /** Verified business directory. */
  readonly business = {
    search: (q: { query?: string; category?: string; city?: string; cityKey?: string; country?: string; near?: { lat: number; lon: number; radiusKm?: number }; minScore?: number; minLevel?: string; claimedOnly?: boolean; includeEvidence?: boolean; limit?: number; offset?: number }) =>
      this.call<{ total: number; items: unknown[]; region?: unknown }>("/v1/biz/search", q),
    verify: (q: { id?: string; name?: string; website?: string; phone?: string; address?: string; city?: string; country?: string }) =>
      this.call<{ inDirectory: boolean; matches: unknown[]; liveChecks: { score: number; level: string; evidence: unknown[] }; verdict: string }>("/v1/biz/verify", q),
    details: (id: string, opts: { force?: boolean } = {}) => this.call<{ business: unknown; enrichment: unknown; cached: boolean }>("/v1/biz/details", { id, ...opts }),
    /** Free public profile. */
    get: async (id: string) => {
      const r = await this.f(`${this.baseUrl}/v1/biz/${encodeURIComponent(id)}`);
      if (!r.ok) throw new Toll402Error(`business ${id}: HTTP ${r.status}`, r.status, "not_found");
      return r.json() as Promise<Record<string, unknown>>;
    },
  };

  private async resolvePath(tool: string): Promise<string> {
    if (tool.startsWith("/")) return tool;
    if (tool.startsWith("t/") || tool.startsWith("x/")) return `/v1/${tool}`;
    const cat = await this.catalog();
    const hit = cat.tools.find((t) => t.name === tool || t.id === tool);
    if (!hit) throw new Toll402Error(`Unknown tool "${tool}". Use find() to discover tools.`, 404, "unknown_tool");
    return hit.path;
  }
}

export default Toll402;
