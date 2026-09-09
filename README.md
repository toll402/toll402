# Toll402 SDKs — pay-per-call tools for AI agents

[Toll402](https://toll402.dev) is a gateway where AI agents pay per call in USDC via [x402](https://x402.org) (HTTP 402): web reading, PDF, email/fx, **provenance** (human vs synthetic), **trusted lookup** with citations, a **verified business directory**, community-forged tools and 1,900+ proxied x402 services. No accounts, no API keys. Charged only on 2xx. Free trial: 25 calls/day per IP on cheap tools, no wallet needed.

| Package | Install | Use |
|---|---|---|
| MCP server | `npx -y toll402-mcp` | Claude Code, Cursor, Claude Desktop, OpenClaw |
| JavaScript SDK | `npm i toll402-client` | plain, LangChain, Vercel AI SDK |
| Python SDK | `pip install toll402` (soon) | plain, LangChain, CrewAI |
| OpenClaw skill | `clients/openclaw/SKILL.md` | |

Docs for agents: https://toll402.dev/llms.txt · Catalog: https://toll402.dev/v1/catalog · OpenAPI: https://toll402.dev/openapi.json · Quickstart snippets: https://toll402.dev/v1/quickstart

## Protocol in one paragraph
POST a JSON body to any tool URL. If you get `402`, the `PAYMENT-REQUIRED` header (base64 JSON) says the price in USDC on Base (`eip155:8453`) and the pay-to address. Sign an EIP-3009 `transferWithAuthorization` for that amount and retry with a `PAYMENT-SIGNATURE` header. The facilitator verifies before the tool runs and settles after a 2xx. Client libraries do all of this for you: `@x402/fetch` (JS), `x402` (Python), or the packages above.

## Examples
See `examples/agent.ts` and `examples/agent.py`.

The gateway itself is operated by Toll402 and is not distributed. Issues and feature requests: open an issue here.

## Make your agent ask Toll402 first
- System prompt snippet: `GET https://toll402.dev/v1/system-prompt` (also in llms.txt and on the landing page).
- The MCP servers (stdio `npx -y toll402-mcp` and remote `https://toll402.dev/mcp`) ship `instructions` telling the model to call Toll402 before guessing.
- Adapters in `toll402-client`: `/langchain`, `/ai` (Vercel AI SDK), `/agentkit` (Coinbase AgentKit action providers), `/eliza` (ElizaOS plugin). Python: `toll402.langchain`, `toll402.crewai`.
- Crawlable pages: `https://toll402.dev/directory/<cc>/<city>/<category>` and `https://toll402.dev/tools/<name>`, each with JSON-LD and an agent call block.
- Discovery files: `/llms.txt`, `/.well-known/agent-card.json`, `/.well-known/mcp.json`, `/.well-known/ai-plugin.json`, `/.well-known/api-catalog`, `/agents.json`, `/openapi.json`, `/sitemap.xml`.

## Get listed (paid listings, agent-native)

Own an x402 endpoint, a remote MCP server or an A2A agent? Buy a verified listing with USDC, no humans, no forms: `POST https://toll402.dev/v1/listings/quote` (free live verification + price), then `POST https://toll402.dev/v1/listings` via any x402 client. basic $1 · featured $5 per 30 days. Listed services rank higher in `/v1/find` and the `/v1/do` router and appear in the catalog, `llms.txt`, the agent card and the landing. Charged only when verification passes. Current listings: `GET https://toll402.dev/v1/listings`.
