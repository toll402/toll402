/**
 * Vercel AI SDK adapter: every available Toll402 tool as an AI SDK `tool()`.
 *   import { toll402AiTools } from "toll402-client/ai";
 *   const tools = await toll402AiTools(new Toll402({ walletKey }));
 *   generateText({ model, tools, prompt })
 */
import { tool, jsonSchema, type ToolSet } from "ai";
import type { Toll402, CatalogTool } from "./index.js";

export interface Toll402AiToolsOptions {
  kinds?: ("builtin" | "forged" | "external")[];
  maxPriceUsd?: number;
  include?: (t: CatalogTool) => boolean;
}

export async function toll402AiTools(client: Toll402, opts: Toll402AiToolsOptions = {}) {
  const cat = await client.catalog();
  const kinds = new Set(opts.kinds ?? ["builtin", "forged", "external"]);
  const out: ToolSet = {};
  for (const t of cat.tools) {
    if (!t.available || !kinds.has(t.kind)) continue;
    if (opts.maxPriceUsd !== undefined && t.priceUsd > opts.maxPriceUsd) continue;
    if (opts.include && !opts.include(t)) continue;
    const name = t.name.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 64);
    out[name] = tool({
      description: `${t.description} (Toll402 ${t.kind} tool, ${t.price} per call, paid automatically in USDC via x402)`,
      parameters: jsonSchema<Record<string, unknown>>(t.inputSchema as never),
      execute: async (input: Record<string, unknown>) => client.call(t.path, input),
    });
  }
  return out;
}
