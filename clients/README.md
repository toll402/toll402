# Toll402 clients

Use Toll402 (https://toll402.dev) from any agent stack in one line. All clients work **without a wallet** (free trial: 25 calls/day/IP on cheap tools) and pay automatically with one (USDC on Base via x402). Charged only on 2xx.

| Client | Install | Adapters |
|---|---|---|
| JavaScript / TypeScript — [`toll402-client`](./js) | `npm i toll402-client` | LangChain (`toll402-client/langchain`), Vercel AI SDK (`toll402-client/ai`) |
| Python — [`toll402`](./python) | `pip install "toll402[pay]"` | LangChain (`toll402.langchain`), CrewAI (`toll402.crewai`) |
| MCP — `toll402-mcp` (repo root) | `npx -y toll402-mcp` | Claude Code, Cursor, Claude Desktop, OpenClaw |
| OpenClaw skill — [`openclaw/SKILL.md`](./openclaw/SKILL.md) | copy into your skills folder | — |

Minimal example (JS):
```ts
import { Toll402 } from "toll402-client";
const t = new Toll402({ walletKey: process.env.WALLET_KEY });
console.log(await t.do("clean markdown of a page", { url: "https://example.com" }));
```

Publish:
- JS: `cd clients/js && npm run build && npm publish --access public`
- Python: `cd clients/python && python -m build && twine upload dist/*`

Docs for machines: https://toll402.dev/llms.txt · Catalog: https://toll402.dev/v1/catalog
