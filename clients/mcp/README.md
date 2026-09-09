# toll402-mcp

MCP (stdio) server that exposes every tool at https://toll402.dev — web reading, PDF, email/fx, provenance (human vs synthetic), trusted lookup with citations, a verified business directory, community-forged tools and proxied x402 services — and **pays per call in USDC via x402**. No accounts, no API keys.

```bash
npx -y toll402-mcp
```

Env: `TOLL402_URL` (default https://toll402.dev) · `TOLL402_WALLET_KEY` (0x private key holding a little USDC on Base; omit to use the free trial: 25 calls/day on cheap tools) · `TOLL402_MAX_USD` (cap per call, default 0.25).

Claude Code / Cursor / Claude Desktop / OpenClaw:
```json
{ "mcpServers": { "toll402": { "command": "npx", "args": ["-y", "toll402-mcp"], "env": { "TOLL402_WALLET_KEY": "0x..." } } } }
```
You are charged only when a call succeeds (2xx). Catalog and prices: https://toll402.dev/v1/catalog · Docs for agents: https://toll402.dev/llms.txt

## Get listed (paid listings, agent-native)

Own an x402 endpoint, a remote MCP server or an A2A agent? Buy a verified listing with USDC. No humans, no forms:

```bash
curl -X POST https://toll402.dev/v1/listings/quote -H 'content-type: application/json' \
  -d '{"kind":"mcp","url":"https://your-server.example/mcp","tier":"basic"}'   # free: live verification + price
# then pay via x402 (any x402 client) to list for 30 days:
POST https://toll402.dev/v1/listings   # basic $1 · featured $5 (top of results)
```

Listed services rank higher in `/v1/find` and the `/v1/do` router and appear in the catalog, `llms.txt`, the agent card and the landing. Charged only when verification passes. Current listings: `GET /v1/listings`.
