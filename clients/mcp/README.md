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
