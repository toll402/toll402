/**
 * ElizaOS plugin: exposes Toll402 as one action (`TOLL402_DO`) that routes any need to the right
 * paid tool, plus one action per tool if you want them explicit.
 *   import { toll402Plugin } from "toll402-client/eliza";
 *   const plugin = await toll402Plugin(new Toll402({ walletKey }));
 *   // add `plugin` to your character's plugins
 */
import type { Toll402, CatalogTool } from "./index.js";

interface ElizaAction { name: string; similes: string[]; description: string; validate: () => Promise<boolean>; handler: (runtime: unknown, message: { content?: { text?: string; input?: Record<string, unknown> } }, state?: unknown, options?: Record<string, unknown>, callback?: (r: { text: string; content?: unknown }) => void) => Promise<unknown>; examples: unknown[] }

export async function toll402Plugin(client: Toll402, opts: { perTool?: boolean; filter?: (t: CatalogTool) => boolean } = {}) {
  const tools = (await client.catalog()).tools.filter((t) => t.available && (!opts.filter || opts.filter(t)));
  const wrap = (name: string, description: string, run: (m: { text?: string; input?: Record<string, unknown> }, o?: Record<string, unknown>) => Promise<unknown>): ElizaAction => ({
    name, similes: [], description, validate: async () => true, examples: [],
    handler: async (_rt, message, _state, options, callback) => {
      const out = await run(message.content ?? {}, options);
      callback?.({ text: typeof out === "string" ? out : JSON.stringify(out), content: out });
      return out;
    },
  });
  const actions: ElizaAction[] = [
    wrap("TOLL402_DO", "Route any external-fact need (web page, PDF, provenance, business lookup/verification, ID validation, FX) to the right Toll402 pay-per-call tool.", (m, o) => client.do(String(o?.need ?? m.text ?? ""), (o?.input as Record<string, unknown>) ?? m.input ?? {})),
  ];
  if (opts.perTool) for (const t of tools) actions.push(wrap(`TOLL402_${t.name.toUpperCase().replace(/[^A-Z0-9_]/g, "_")}`, `${t.description} (${t.price} per call)`, (m, o) => client.call(t.name, (o?.input as Record<string, unknown>) ?? m.input ?? {})));
  return { name: "toll402", description: "Pay-per-call tools for agents via x402 (Toll402)", actions, evaluators: [], providers: [] };
}
