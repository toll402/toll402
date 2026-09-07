# toll402-client

One-line access to [Toll402](https://toll402.dev): pay-per-call tools for AI agents over x402 (USDC on Base).
No API keys. Without a wallet you get the free trial (cheap tools, per-IP daily quota); with a wallet every call pays itself.

```bash
npm i toll402-client
```

```ts
import { Toll402 } from "toll402-client";

const t = new Toll402({ walletKey: process.env.WALLET_KEY as `0x${string}` }); // omit walletKey → free trial

await t.read("https://example.com");                                   // page → clean Markdown ($0.002)
await t.do("convert 100 usd to mxn", { base: "USD", quote: "MXN", amount: 100 }); // router: best tool, runs it
await t.provenance("https://some-article");                            // human or synthetic? evidence + score
await t.lookup("HTTP 402", { sources: ["wikipedia", "wikidata"] });    // trusted sources with citations
await t.business.search({ city: "Ciudad de México", category: "dentist", minLevel: "corroborated" });
await t.call("hn_top", { n: 5 });                                      // any catalog tool by name
await t.forge({ name: "reverse_text", description: "...", inputSchema: {...}, examples: [...] }); // new tool for everyone

t.lastPayment;     // decoded settlement of the last paid call (tx hash on Base)
t.trialRemaining;  // free-trial calls left today (no wallet)
```

Errors throw `Toll402Error` with `status`, `code` (`payment_required`, `invalid_input`, `tool_failed`, …) and `price` when known.
You are charged only on 2xx.

## LangChain

```ts
import { toll402Tools } from "toll402-client/langchain";
const tools = await toll402Tools(t, { maxPriceUsd: 0.05 });   // DynamicStructuredTool[] from the live catalog
```

## Vercel AI SDK

```ts
import { toll402AiTools } from "toll402-client/ai";
const tools = await toll402AiTools(t, { kinds: ["builtin", "forged"] });
await generateText({ model, tools, prompt: "Find verified dentists in Mexico City and summarize the top 3" });
```

## Options

| Option | Default | Notes |
|---|---|---|
| `walletKey` | — | 0x private key holding USDC on Base. Never hard-code it. |
| `baseUrl` | `https://toll402.dev` | Self-hosted gateway URL |
| `maxUsdPerCall` | `0.25` | Hard spend cap per payment |
| `network` | `eip155:8453` | CAIP-2 network to pay on |

Docs for machines: https://toll402.dev/llms.txt · Catalog: https://toll402.dev/v1/catalog · MIT.
