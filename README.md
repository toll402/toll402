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
