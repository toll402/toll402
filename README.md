# ⛩ Toll402 — the OpenRouter for AI-agent tools

> **Open core.** This repository is the private gateway core. The public SDKs, MCP server, examples and protocol docs live at https://github.com/toll402/toll402 and on npm (`toll402-mcp`, `toll402-client`).

**One gateway. One wallet. Every capability.** AI agents pay per call in USDC over the
[x402 protocol](https://x402.org) (HTTP 402) — no signup, no API keys, no humans in the loop.

```
agent ──POST /v1/do {need, input}──▶ Toll402 ──routes──▶ built-in tool
                                        │               community-forged tool (sandboxed)
                                        │               external x402 service (proxied, +markup)
                                        └── 402 → agent signs USDC → verify → settle on Base → your wallet
```

Three layers, all behind the same toll booth:

| Layer | What | How it grows |
|---|---|---|
| **Built-in tools** | read_url, pdf_to_text, verify_email, fx_rate, provenance, trusted_lookup, extract_structured, summarize, judge_output | we add them |
| **Forged tools** (infinite tools) | an agent describes a tool + examples → `/v1/forge` generates the code, tests it in a WebAssembly sandbox, publishes it at `/v1/t/<name>` for everyone | agents add them |
| **External services** | every x402 service in the Bazaar on Base/USDC is discovered, curated and (optionally) proxied through Toll402 with a markup | the ecosystem adds them |

Plus the two things agents lack most: **provenance** (is this content human or synthetic? verifiable evidence, not a guess)
and **trusted_lookup** (answers only from tier-1 sources with citations).

### Engine 4 — verified business directory (the "source of truth" layer)
Agents that book, quote or buy need to know: is this business real, is it open, how do I reach it?
Toll402 keeps a directory of businesses with **dated verification evidence** and a score, grown **on demand**:

- **Sources**: OpenStreetMap, Wikidata, official registries (INEGI DENUE for Mexico via `INEGI_TOKEN`), the business's own website,
  optional third-party places index (Apify actors via `APIFY_TOKEN`, demand-gated and budget-capped), and owner claims. Never scraped review sites.
- **Verification** (`src/biz/verify.ts`): presence in each source, live website + name/phone on site, domain age (RDAP), phone format, hours, geocoding,
  owner claim (DNS TXT). Score 0-100 → level `unverified | listed | corroborated | verified | owner_verified`; a background worker re-checks by `nextCheckAt`.
- **On-demand coverage** (`src/biz/regions.ts`): search any city by name; unknown regions are geocoded (Nominatim), registered and queued for ingestion.
- **Tools**: `business_search` $0.005 · `business_verify` $0.01 · `business_details` $0.08 (crawls the business's own site into hours/services/prices/booking JSON) ·
  free `GET /v1/biz/:id`, `GET /v1/biz/coverage`, `GET /v1/biz/stats`.
- **Owners** (free, the moat): `POST /v1/biz/claim` → DNS TXT `_toll402` → `POST /v1/biz/claim/verify` → `PUT /v1/biz/:id/profile` with a machine-readable profile.
- **Operator**: `POST /admin/biz/seed { city | cityKey, categories?, force? }`, `GET /admin/biz/seed` (jobs + coverage).

## Endpoints

Free: `/` · `/llms.txt` · `/openapi.json` · `/v1/catalog` · `/v1/tools?kind=&q=&limit=&offset=` · `/v1/find?need=` · `/v1/quickstart` · `/v1/stats` · `/.well-known/agent-card.json` · `GET /v1/t/:slug` · `GET /v1/x/:id`

Paid (x402, USDC on Base; charged only on 2xx):

| Tool | Endpoint | Price | Notes |
|---|---|---|---|
| do (router) | `POST /v1/do` | $0.02 | picks + runs the best tool ≤ maxPriceUsd |
| read_url | `POST /v1/read` | $0.002 | page/PDF → clean Markdown |
| pdf_to_text | `POST /v1/pdf` | $0.005 | |
| verify_email | `POST /v1/email/verify` | $0.001 | |
| fx_rate | `POST /v1/fx` | $0.001 | |
| provenance | `POST /v1/provenance` | $0.01 / $0.04 deep | human-vs-synthetic evidence |
| trusted_lookup | `POST /v1/lookup` | $0.01 / $0.04 synthesized | Wikipedia, Wikidata, arXiv, Crossref, World Bank |
| extract_structured | `POST /v1/extract` | $0.06 | LLM |
| summarize | `POST /v1/summarize` | $0.05 | LLM |
| judge_output | `POST /v1/judge` | $0.07 | LLM |
| forge_tool | `POST /v1/forge` | $0.25 | LLM, up to 3 attempts |
| forged tools | `POST /v1/t/<name>` | set by creator ($0.001–$0.05) | sandboxed |
| external services | `POST /v1/x/<id>` | upstream + 15% | needs hot wallet |

## Run

```bash
npm install
cp .env.example .env         # PAY_TO_ADDRESS (Base address), optional ANTHROPIC_API_KEY
npm run dev                  # http://localhost:4402
npm test                     # 21 integration checks incl. sandbox, router, 402 handshake, dynamic prices
```

Key env vars (full list in `.env.example`):

| Var | Purpose |
|---|---|
| `PAY_TO_ADDRESS` | where USDC lands (any Base address; an exchange USDC-on-Base deposit address works) |
| `X402_NETWORK` | `eip155:8453` Base mainnet · `eip155:84532` Base Sepolia |
| `FACILITATOR_URL` | `https://facilitator.payai.network` (mainnet, no keys) · `https://x402.org/facilitator` (testnet) · or set `CDP_API_KEY_ID/SECRET` for Coinbase's |
| `ANTHROPIC_API_KEY`, `LLM_MODEL` | enables LLM tools; default `claude-sonnet-5` |
| `LLM_BUDGET_USD` | LLM tools pause automatically when estimated spend reaches this (default 50); `POST /admin/topup` resets |
| `TOLL402_HOT_WALLET_KEY` | wallet that pays upstream when proxying external services (fund with USDC on Base) |
| `EXTERNAL_MARKUP_PCT`, `EXTERNAL_MAX_USD` | markup on proxied services (15) and max upstream price accepted (0.5) |
| `ADMIN_TOKEN` | protects `/admin/*` |
| `INEGI_TOKEN` | enables DENUE (official Mexican establishment registry) ingestion |
| `APIFY_TOKEN`, `APIFY_PLACES`, `APIFY_BUDGET_USD`, `APIFY_SEED_MIN_DEMAND` | optional Apify actors as a places source; spend only where agents already paid ≥ N searches, capped by budget |
| `BIZ_VERIFY_WORKER`, `BIZ_VERIFY_INTERVAL_MS`, `BIZ_VERIFY_BATCH` | background re-verification of businesses |

### Creator revenue share (no payouts)
Forge a tool with `creator: "0x…"` and `FORGE_CREATOR_SHARE` (default 70%) of settled calls to it are paid **directly** to that wallet: the 402's pay-to address alternates deterministically between the creator and the operator, so the protocol does the split and nobody runs payouts.

### External service health
Upstream x402 services are probed every 3 h (`/admin/health-external` on demand); dead ones sink in ranking and show `meta.healthy=false`.

### Guaranteed margins
At boot, every LLM tool's **worst-case** cost (max input chars × max output tokens at the configured model's rates) is checked
against its price; the server refuses to start if any tool could lose money (`src/lib/pricing.ts`). Real usage is logged per call
and compared with revenue at `/v1/stats` → `llm.budget`.

## Use it from an agent

```ts
import { wrapFetchWithPaymentFromConfig } from "@x402/fetch";
import { ExactEvmScheme } from "@x402/evm/exact/client";
import { privateKeyToAccount } from "viem/accounts";
const fetchPaid = wrapFetchWithPaymentFromConfig(fetch, { schemes: [{ network: "eip155:8453", client: new ExactEvmScheme(privateKeyToAccount(process.env.WALLET_KEY)) }] });
const r = await fetchPaid("https://toll402.dev/v1/do", { method: "POST", headers: { "content-type": "application/json" },
  body: JSON.stringify({ need: "clean markdown of a page", input: { url: "https://example.com" } }) });
```
More: `examples/agent.ts`, `examples/agent.py`, and `GET /v1/quickstart`.

**MCP** (Claude Code, Cursor, Claude Desktop, OpenClaw): `npx -y toll402-mcp` with `TOLL402_URL` and `TOLL402_WALLET_KEY`.
The MCP server mirrors the live catalog (built-in + forged + proxied external) and pays automatically (cap `TOLL402_MAX_USD`).

## Forge a tool (infinite tools)

```json
POST /v1/forge
{ "name": "hn_top", "description": "Top N Hacker News stories via hacker-news.firebaseio.com",
  "inputSchema": { "type": "object", "properties": { "n": { "type": "integer" } }, "required": ["n"] },
  "examples": [{ "input": { "n": 3 } }], "priceUsd": 0.005 }
```
Generated code runs in QuickJS (WebAssembly) inside a separate OS process: no filesystem, no Node APIs, guarded `fetch`
(public hosts only, 2 MB, 10 s, ≤ 20 calls), memory and CPU-time limits. It is published only if every example passes.

## Deploy (Fly.io)

```bash
brew install flyctl && fly auth login
fly launch --copy-config --no-deploy          # uses fly.toml (app "toll402")
fly volumes create toll402_data -s 1 -r iad
fly secrets set PAY_TO_ADDRESS=0x... ANTHROPIC_API_KEY=sk-ant-... ADMIN_TOKEN=$(openssl rand -hex 16)
fly deploy
fly certs add toll402.dev                     # then add the A/AAAA records it prints at your registrar
```
Docker and plain-VPS also work (`Dockerfile`; `npm run build && npm start`). Set `PUBLIC_URL=https://toll402.dev`.

## Layout

```
src/server.ts        Hono app: discovery, x402 middleware (fixed + dynamic prices), execution, admin
src/registry.ts      unified registry (builtin | forged | external) + lexical ranking
src/catalog.ts       built-in tools, prices, LLM cost profiles, boot-time profitability check
src/tools/*          read, pdf, email, fx, extract, summarize, judge, provenance, lookup, forge, route
src/forge/           sandbox host (child process) + runner (QuickJS/WASM + guarded fetch)
src/external.ts      Bazaar discovery, curation, paid proxying with markup
src/lib/             safeFetch (SSRF guard), html, llm, pricing, budget, sources (tiered registry), zodToJsonSchema
src/db.ts            node:sqlite ledger: calls, payments, forged_tools, external_tools, llm_costs
src/mcp.ts           toll402-mcp (stdio) — MCP server with x402 auto-payment
scripts/             wallet, test-tools (integration), smoke (real paid call), seed-tools (forge starter tools)
```

## Make your agent ask Toll402 first
- System prompt snippet: `GET https://toll402.dev/v1/system-prompt` (also in llms.txt and on the landing page).
- MCP servers (stdio and remote) ship `instructions` telling the model to call Toll402 before guessing.
- Adapters in `toll402-client`: `toll402-client/langchain`, `toll402-client/ai` (Vercel AI SDK), `toll402-client/agentkit` (Coinbase AgentKit action providers), `toll402-client/eliza` (ElizaOS plugin). Python: `toll402.langchain`, `toll402.crewai`.
- Crawlable pages: `/directory/<cc>/<city>/<category>` for the whole directory and `/tools/<name>` for every tool, each with JSON-LD and an agent call block.
- Discovery files: `/llms.txt`, `/.well-known/agent-card.json`, `/.well-known/mcp.json`, `/.well-known/ai-plugin.json`, `/.well-known/api-catalog`, `/agents.json`, `/openapi.json`, `/sitemap.xml`.

## Get listed (paid listings, agent-native)

Own an x402 endpoint, a remote MCP server or an A2A agent? Buy a verified listing with USDC. No humans, no forms:

```bash
curl -X POST https://toll402.dev/v1/listings/quote -H 'content-type: application/json' \
  -d '{"kind":"mcp","url":"https://your-server.example/mcp","tier":"basic"}'   # free: live verification + price
# then pay via x402 (any x402 client) to list for 30 days:
POST https://toll402.dev/v1/listings   # basic $1 · featured $5 (top of results)
```

Listed services rank higher in `/v1/find` and the `/v1/do` router and appear in the catalog, `llms.txt`, the agent card and the landing. Charged only when verification passes. Current listings: `GET /v1/listings`.
