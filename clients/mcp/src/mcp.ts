#!/usr/bin/env node
/**
 * toll402-mcp — MCP (stdio) server that exposes every Toll402 tool to an agent and
 * pays for calls automatically with x402 from a wallet you control.
 *
 * Env:
 *   TOLL402_URL         base URL of the Toll402 server (default https://toll402.dev)
 *   TOLL402_WALLET_KEY  0x-prefixed EVM private key holding USDC on Base (omit for free instances)
 *   TOLL402_MAX_USD     max USD per single payment (default 0.25)
 */
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import { wrapFetchWithPaymentFromConfig } from "@x402/fetch";
import { ExactEvmScheme } from "@x402/evm/exact/client";
import { privateKeyToAccount } from "viem/accounts";

const BASE = (process.env.TOLL402_URL ?? "https://toll402.dev").replace(/\/$/, "");
const KEY = process.env.TOLL402_WALLET_KEY as `0x${string}` | undefined;
const MAX_USD = process.env.TOLL402_MAX_USD ?? "0.25";

type CatalogTool = { name: string; path: string; price: string; description: string; inputSchema: Record<string, unknown>; available?: boolean; kind?: string };
type Catalog = { service: string; tools: CatalogTool[]; payment: { network?: string; networkName?: string; testnet?: boolean } };

async function main() {
  const res = await fetch(`${BASE}/v1/catalog`);
  if (!res.ok) throw new Error(`Could not load catalog from ${BASE}: HTTP ${res.status}`);
  const catalog = (await res.json()) as Catalog;
  catalog.tools = catalog.tools.filter((t) => t.available !== false);
  const byName = new Map(catalog.tools.map((t) => [t.name, t]));

  let paidFetch: typeof fetch = fetch;
  if (KEY) {
    const account = privateKeyToAccount(KEY);
    paidFetch = wrapFetchWithPaymentFromConfig(fetch, {
      schemes: [{ network: "eip155:*", client: new ExactEvmScheme(account) }],
      spendControls: { maxAmountPerPayment: `$${MAX_USD}` },
    }) as typeof fetch;
    console.error(`toll402-mcp: paying from ${account.address} on ${catalog.payment.networkName ?? "?"} (max $${MAX_USD}/call)`);
  } else {
    console.error("toll402-mcp: TOLL402_WALLET_KEY not set — calls will fail with 402 unless the server is free");
  }

  const server = new Server({ name: "toll402", version: "0.1.0" }, { capabilities: { tools: {} } });

  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: catalog.tools.map((t) => ({
      name: t.name,
      description: `[${t.kind ?? "tool"}] ${t.description} (costs ${t.price} per call, paid automatically in USDC via x402)`,
      inputSchema: t.inputSchema as { type: "object"; properties?: Record<string, unknown> },
    })),
  }));

  server.setRequestHandler(CallToolRequestSchema, async (req) => {
    const t = byName.get(req.params.name);
    if (!t) return { isError: true, content: [{ type: "text", text: `Unknown tool ${req.params.name}` }] };
    const r = await paidFetch(`${BASE}${t.path}`, {
      method: "POST",
      headers: { "content-type": "application/json", "user-agent": "toll402-mcp/0.3.4", ...(process.env.TOLL402_REF ? { "x-toll402-ref": process.env.TOLL402_REF } : {}), ...(KEY ? { "x-toll402-agent": privateKeyToAccount(KEY).address } : {}) },
      body: JSON.stringify(req.params.arguments ?? {}),
    });
    const text = await r.text();
    if (!r.ok) return { isError: true, content: [{ type: "text", text: `HTTP ${r.status}: ${text.slice(0, 2000)}` }] };
    let out = text;
    try {
      const j = JSON.parse(text);
      out = JSON.stringify(j.result ?? j, null, 2);
    } catch {
      /* leave as-is */
    }
    const paid = r.headers.get("payment-response") ? `\n\n[paid ${t.price} via x402]` : "";
    return { content: [{ type: "text", text: out + paid }] };
  });

  await server.connect(new StdioServerTransport());
  console.error(`toll402-mcp: ${catalog.tools.length} tools from ${BASE} ready`);
}

main().catch((e) => {
  console.error("toll402-mcp fatal:", e);
  process.exit(1);
});
