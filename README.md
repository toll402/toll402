# Toll402 SDKs — pay-per-call tools for AI agents

[Toll402](https://toll402.dev) is a gateway where AI agents get 2,600+ tools and pay per call: web reading, PDF, email/fx, **provenance** (human vs synthetic), **trusted lookup** with citations, a **4.6M-business verified directory**, 50+ national ID validators, community-forged tools, **2,400+ provider API endpoints** (SEO keyword/backlink data, social profiles and posts, people/company enrichment, ads, stocks and crypto, image/video generation) and 2,800+ proxied x402 services. Two ways to pay, same prices: a wallet (USDC on Base via [x402](https://x402.org), no account) or **prepaid credits bought by card** at https://toll402.dev/credits (API key). Charged only on success.

| Package | Install | Use |
|---|---|---|
| MCP server | `npx -y toll402-mcp` | Claude Code, Cursor, Claude Desktop, OpenClaw |
| JavaScript SDK | `npm i toll402-client` | plain, LangChain, Vercel AI SDK |
| Python SDK | `pip install toll402` | plain, LangChain, CrewAI |
| OpenClaw skill | `clients/openclaw/SKILL.md` | |

Docs for agents: https://toll402.dev/llms.txt · Catalog: https://toll402.dev/v1/catalog · OpenAPI: https://toll402.dev/openapi.json · Quickstart snippets: https://toll402.dev/v1/quickstart

## Install (MCP)

Standard config for Claude Code, Cursor, Claude Desktop, Windsurf, OpenClaw and any MCP client (prepaid credits key from https://toll402.dev/credits):

```json
{
  "mcpServers": {
    "toll402": {
      "command": "npx",
      "args": ["-y", "toll402-mcp"],
      "env": {
        "TOLL402_API_KEY": "tk_..."
      }
    }
  }
}
```

With a wallet instead of credits (USDC on Base, pays per call via x402):

```json
{
  "mcpServers": {
    "toll402": {
      "command": "npx",
      "args": ["-y", "toll402-mcp"],
      "env": {
        "TOLL402_WALLET_KEY": "0x...",
        "TOLL402_MAX_USD": "0.25"
      }
    }
  }
}
```

Remote, no install (send `x-toll402-key` or x402 headers on the connection):

```json
{
  "mcpServers": {
    "toll402": {
      "url": "https://toll402.dev/mcp",
      "headers": {
        "x-toll402-key": "tk_..."
      }
    }
  }
}
```

## Paying, in one paragraph
Two rails. **Credits**: the operator buys a balance by card at https://toll402.dev/credits and the agent sends the key as the `x-toll402-key` header; each 2xx response reports `x-toll402-charged` and `x-toll402-balance`, and `GET /v1/account` lists every debit. **x402**: POST a JSON body to any tool URL; if you get `402`, the `PAYMENT-REQUIRED` header (base64 JSON) says the price in USDC on Base (`eip155:8453`) and the pay-to address; sign an EIP-3009 `transferWithAuthorization` for that amount and retry with a `PAYMENT-SIGNATURE` header. Either way you are charged only when the call returns 2xx.

## Examples
See `examples/agent.ts` and `examples/agent.py`.

The gateway itself is operated by Toll402 and is not distributed. Issues and feature requests: open an issue here.

## Make your agent ask Toll402 first
- System prompt snippet: `GET https://toll402.dev/v1/system-prompt` (also in llms.txt and on the landing page).
- The MCP servers (stdio `npx -y toll402-mcp` and remote `https://toll402.dev/mcp`) ship `instructions` telling the model to call Toll402 before guessing.
- Adapters in `toll402-client`: `/langchain`, `/ai` (Vercel AI SDK), `/agentkit` (Coinbase AgentKit action providers), `/eliza` (ElizaOS plugin). Python: `toll402.langchain`, `toll402.crewai`.
- Crawlable pages: `https://toll402.dev/catalog` (by category and platform, e.g. `/catalog/tiktok`), `https://toll402.dev/directory/<cc>/<city>/<category>` and `https://toll402.dev/tools/<name>`, each with JSON-LD and an agent call block.
- Discovery files: `/llms.txt`, `/.well-known/agent-card.json`, `/.well-known/mcp.json`, `/.well-known/ai-plugin.json`, `/.well-known/api-catalog`, `/agents.json`, `/openapi.json`, `/sitemap.xml`.

## Get listed (paid listings, agent-native)

Own an x402 endpoint, a remote MCP server or an A2A agent? Buy a verified listing (x402 or credits), no humans, no forms: `POST https://toll402.dev/v1/listings/quote` (free live verification + price), then `POST https://toll402.dev/v1/listings` via any x402 client or with your credits key. basic $1 · featured $5 per 30 days. Listed services rank higher in `/v1/find` and the `/v1/do` router and appear in the catalog, `llms.txt`, the agent card and the landing. Charged only when verification passes. Current listings: `GET https://toll402.dev/v1/listings`.
