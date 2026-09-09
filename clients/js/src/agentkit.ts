/**
 * Coinbase AgentKit adapter: every Toll402 tool as an AgentKit action provider, so agents that
 * already hold USDC on Base can pay per call with the same wallet.
 *   import { customActionProvider } from "@coinbase/agentkit";
 *   import { toll402ActionProviders } from "toll402-client/agentkit";
 *   const providers = await toll402ActionProviders(customActionProvider, new Toll402({ walletKey }));
 *   const agentkit = await AgentKit.from({ walletProvider, actionProviders: [...providers] });
 */
import type { Toll402, CatalogTool } from "./index.js";
import { jsonSchemaToZod } from "./langchain.js";

type CustomActionProvider = (def: { name: string; description: string; schema: unknown; invoke: (walletProvider: unknown, args: Record<string, unknown>) => Promise<string> }) => unknown;

export async function toll402ActionProviders(customActionProvider: CustomActionProvider, client: Toll402, filter?: (t: CatalogTool) => boolean) {
  const tools = (await client.catalog()).tools.filter((t) => t.available && (!filter || filter(t)));
  return tools.map((t) =>
    customActionProvider({
      name: `toll402_${t.name.replace(/[^a-zA-Z0-9_]/g, "_")}`,
      description: `${t.description} (Toll402, ${t.price} per call via x402)`,
      schema: jsonSchemaToZod((t.inputSchema as Record<string, unknown>) ?? { type: "object", properties: {} }),
      invoke: async (_wallet, args) => JSON.stringify(await client.call(t.name, args)),
    }),
  );
}
