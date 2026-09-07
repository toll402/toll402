/**
 * LangChain adapter: every available Toll402 tool as a DynamicStructuredTool.
 *   import { toll402Tools } from "toll402-client/langchain";
 *   const tools = await toll402Tools(new Toll402({ walletKey }));
 */
import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";
import type { Toll402, CatalogTool } from "./index.js";

/** Minimal JSON-Schema → zod conversion (objects with string/number/integer/boolean/array/object props, enums, optional). */
export function jsonSchemaToZod(schema: Record<string, unknown>): z.ZodTypeAny {
  const type = schema.type as string | undefined;
  if (schema.enum && Array.isArray(schema.enum)) return z.enum(schema.enum.map(String) as [string, ...string[]]);
  switch (type) {
    case "string":
      return z.string();
    case "number":
      return z.number();
    case "integer":
      return z.number().int();
    case "boolean":
      return z.boolean();
    case "array":
      return z.array(schema.items ? jsonSchemaToZod(schema.items as Record<string, unknown>) : z.unknown());
    case "object": {
      const props = (schema.properties as Record<string, Record<string, unknown>> | undefined) ?? {};
      const required = new Set((schema.required as string[] | undefined) ?? []);
      const shape: Record<string, z.ZodTypeAny> = {};
      for (const [k, v] of Object.entries(props)) {
        let zz = jsonSchemaToZod(v);
        if (typeof v.description === "string") zz = zz.describe(v.description);
        shape[k] = required.has(k) ? zz : zz.optional();
      }
      return Object.keys(shape).length ? z.object(shape).passthrough() : z.record(z.unknown());
    }
    default:
      return z.unknown();
  }
}

export interface Toll402ToolsOptions {
  /** Only these kinds (default: builtin + forged; external excluded unless proxied/available). */
  kinds?: ("builtin" | "forged" | "external")[];
  /** Skip tools priced above this (USD). */
  maxPriceUsd?: number;
  /** Filter by name/id. */
  include?: (t: CatalogTool) => boolean;
}

export async function toll402Tools(client: Toll402, opts: Toll402ToolsOptions = {}) {
  const cat = await client.catalog();
  const kinds = new Set(opts.kinds ?? ["builtin", "forged", "external"]);
  return cat.tools
    .filter((t) => t.available && kinds.has(t.kind) && (opts.maxPriceUsd === undefined || t.priceUsd <= opts.maxPriceUsd) && (opts.include?.(t) ?? true))
    .map(
      (t) =>
        new DynamicStructuredTool({
          name: t.name.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 64),
          description: `${t.description} (Toll402 ${t.kind} tool, ${t.price} per call, paid automatically in USDC via x402)`,
          schema: jsonSchemaToZod(t.inputSchema) as z.ZodObject<z.ZodRawShape>,
          func: async (input: Record<string, unknown>) => JSON.stringify(await client.call(t.path, input)),
        }),
    );
}
