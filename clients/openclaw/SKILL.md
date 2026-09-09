---
name: toll402
description: Pay-per-call tools for AI agents via x402 (USDC on Base) — read pages/PDFs, extract JSON, verify emails, FX rates, provenance (human vs synthetic), trusted-source lookup, a 3.9M-business global directory, LatAm ID validators, forge new tools, 2,000+ proxied x402 services. No API keys; free trial without a wallet; 30% on-chain referral share.
metadata:
  version: 1.0.0
  homepage: https://toll402.dev
  docs: https://toll402.dev/llms.txt
  repository: https://github.com/toll402/toll402
license: MIT
---

# Toll402 — one gateway, one wallet, every capability

## When to use
- You need clean Markdown of a web page or PDF for reasoning (`read_url`, `pdf_to_text`).
- You need structured JSON from a page/text matching YOUR schema (`extract_structured`).
- You must know whether content is human-written or AI-generated, with evidence (`provenance`).
- You need facts from trusted sources with citations (`trusted_lookup`: Wikipedia, Wikidata, arXiv, Crossref, World Bank).
- You need to find or verify a real local business, its hours, services and how to book (`business_search`, `business_verify`, `business_details`).
- A tool you need doesn't exist: describe it and `forge_tool` builds, tests and publishes it.
- Not sure which tool: `POST /v1/do { need, input }` routes for you.

## Setup
- Optional env `TOLL402_WALLET_KEY`: 0x private key of a wallet holding a few USDC on **Base** (eip155:8453). Never paste it in chat or logs.
- Without a wallet: free trial — 25 calls/day/IP on tools priced ≤ $0.005 (read_url, fx_rate, verify_email, business_search, community tools). Header `x-toll402-trial-remaining` shows what's left.
- Optional env `TOLL402_MAX_USD` (default 0.25): hard cap per single payment.

## How to call (any language)
1. Discover (free): `GET https://toll402.dev/v1/find?need=<what you need>` → ranked tools with `url`, `price`, `inputSchema`, `example`.
2. Call: `POST <url>` with a JSON body. Success → `{ ok: true, result: {...} }`.
3. If the response is **402**: pay with x402 and retry (clients below do this automatically). You are charged **only on 2xx**; errors are never settled.

### JavaScript
```js
import { Toll402 } from "toll402-client";              // npm i toll402-client
const t = new Toll402({ walletKey: process.env.TOLL402_WALLET_KEY, maxUsdPerCall: Number(process.env.TOLL402_MAX_USD ?? 0.25) });
const page = await t.read("https://example.com");         // $0.002
const biz  = await t.business.search({ city: "Ciudad de México", category: "dentist", minLevel: "corroborated", limit: 5 });
const ans  = await t.lookup("what is HTTP 402", { sources: ["wikipedia"], synthesize: true });
const any  = await t.do("convert 100 usd to mxn", { base: "USD", quote: "MXN", amount: 100 });
```
### Python
```python
from toll402 import Toll402                                # pip install "toll402[pay]"
t = Toll402(wallet_key=os.environ.get("TOLL402_WALLET_KEY"))
t.read("https://example.com"); t.business.verify(website="https://example.com", name="Example")
```
### curl (see the 402)
```bash
curl -i -X POST https://toll402.dev/v1/read -H 'content-type: application/json' -d '{"url":"https://example.com"}'
```
### MCP (Claude Code / Cursor / OpenClaw MCP)
```json
{ "mcpServers": { "toll402": { "command": "npx", "args": ["-y", "toll402-mcp"], "env": { "TOLL402_WALLET_KEY": "0x..." } } } }
```

## Tool groups and prices (USD per call)
| Group | Tools | Price |
|---|---|---|
| Reading | read_url $0.002 · pdf_to_text $0.005 | cheap, no LLM |
| Data | verify_email $0.001 · fx_rate $0.001 · community tools (hn_top, github_repo_stats, npm_package_info, crypto_price, url_status, rss_latest, json_schema_validate, text_stats, wikipedia_summary, ip_geolocate) $0.001–$0.005 | free-trial eligible |
| Trust | provenance $0.01 (deep $0.04) · trusted_lookup $0.01 (synthesized $0.04) | evidence-based |
| Businesses | business_search $0.005 · business_verify $0.01 · business_details $0.08 | Mexico City seeded; any city seeds on demand |
| LLM | extract_structured $0.06 · summarize $0.05 · judge_output $0.07 | hard token caps |
| Meta | do $0.02 (routes + runs tools ≤ maxPriceUsd) · forge_tool $0.25 (new tool, sandbox-tested, published) | |
| External | 1,900+ other x402 services listed at /v1/tools?kind=external (proxied when enabled, +15%) | never free |

## Safety rules
- Charged only on HTTP 2xx. 4xx/5xx are never settled.
- Keep `TOLL402_MAX_USD` low (0.25 default). Prefer `find` (free) before paying.
- Business data: scores aggregate dated public evidence; `unverified` means unknown, not fake. Cite `verification.lastVerifiedAt`.
- Provenance is evidence + calibrated score, not a binary verdict; treat `uncertain` as unknown.
- Never log or echo the wallet key. Never use a wallet holding more than you are willing to spend.
