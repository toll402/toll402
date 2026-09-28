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

Remote, no install (send `x-toll402-key` or x402 headers on the connection; `?key=tk_…` in the URL for clients that cannot set headers):

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

## Tools

16 first-party tools, 167 community-forged tools and 2,466 provider API endpoints, all exposed as MCP tools (the provider endpoints through `find` and `do`). Prices are per call; charged only on success.

### First-party

- **read_url** ($0.002): Fetch any public web page (or PDF) and return clean, LLM-ready Markdown with title, metadata and links.
- **pdf_to_text** ($0.005): Download a PDF from a URL and return its full text, page count and title.
- **verify_email** ($0.001): Validate an email address: syntax, MX/A records, disposable-domain, free-provider and role-account detection, with a 0-100 score.
- **fx_rate** ($0.001): Exchange rate between two ISO currencies (ECB reference rates), optionally converting an amount.
- **extract_structured** ($0.06): Turn a web page or raw text into JSON that matches YOUR JSON Schema.
- **summarize** ($0.05): Faithful summary of a URL or text in the style, length and language you choose.
- **judge_output** ($0.07): Independent LLM-as-judge: scores a candidate output against a task and criteria (0-100), with pass/fail, issues and suggestions.
- **provenance** ($0.01): Human or synthetic? Provenance evidence for a URL: archive first-capture date, domain age, authorship markup, curated source tier, AI disclosures and stylometric signals, aggregated into a calibrated 0-100 human-origin score with every piece of evidence.
- **trusted_lookup** ($0.01): Answer from TRUSTED sources only (Wikipedia, Wikidata, arXiv, Crossref/DOI, World Bank): returns passages with URL, reliability tier and retrieval time for citation.
- **business_search** ($0.005): Global business directory for agents (any city in the world; unknown cities are seeded on demand).
- **business_verify** ($0.01): Is this business real, and is its contact info live? Give an id, website, phone or name: matches it against the directory and runs live checks now (site up, name on site, phone on site, domain age, phone format).
- **business_details** ($0.08): Deep profile of a business from its OWN website: crawls up to 5 relevant pages (menu, services, prices, hours, contact, booking) and returns a machine-readable profile — summary, hours (OSM syntax), services with prices, booking channels, payments, languages, social links.
- **business_shortlist** ($0.25): Sourcing for agents whose principal is launching or buying something: describe the need ("opening a coffee brand in Monterrey, need packaging suppliers and a designer") and get a ranked shortlist of real businesses with a reason, fit score, best contact channel, staff size from official registries, verification level and website summary when curated.
- **list_service** ($1): Buy a verified listing for YOUR x402 endpoint, remote MCP server or A2A agent — paid by the agent in USDC, no humans.
- **forge_tool** ($0.25): Create a NEW tool from a description, an input schema and test examples.
- **do** ($0.02): One endpoint for everything (OpenRouter-style): describe what you need and pass the input; Toll402 picks the best tool from the whole catalog (built-in, community-forged, external x402 services) and runs it.

### Community-forged (sample)

- **github_repo_stats** ($0.003): Stars, forks, open issues, license and last push for a GitHub repo via https://api.github.com/repos/<owner>/<repo>.
- **ip_geolocate** ($0.002): Country, region, city, timezone and ASN for an IPv4/IPv6 address via https://ipapi.co/<ip>/json/.
- **hn_top** ($0.005): Top N Hacker News stories (title, url, score) via https://hacker-news.firebaseio.com/v0/topstories.json and /v0/item/<id>.json.
- **rss_latest** ($0.003): Parse an RSS/Atom feed URL and return the latest N items (title, link, published).
- **npm_package_info** ($0.003): Latest version, description, license, weekly downloads (via api.npmjs.org) and homepage for an npm package.
- **text_stats** ($0.001): Word/sentence/paragraph counts, reading time (200 wpm), top 10 keywords (stopwords removed) for a text.
- **url_status** ($0.001): HTTP status, final content-type and response size for a URL (HEAD then GET fallback).
- **wikipedia_summary** ($0.002): Summary extract and canonical URL for a Wikipedia topic via https://<lang>.wikipedia.org/api/rest_v1/page/summary/<title>.
- **json_schema_validate** ($0.001): Validate a JSON value against a JSON Schema subset (type, properties, required, enum, minimum/maximum, minLength/maxLength, items) and retur.
- **crypto_price** ($0.002): Spot price in USD for a crypto asset symbol using https://api.coinbase.com/v2/prices/<SYMBOL>-USD/spot.
- **jsonld_extract** ($0.003): Fetches a public URL, extracts all <script type="application/ld+json"> blocks, parses them as JSON, and returns the parsed objects along wit.
- **mst_vn_validate** ($0.001): Offline structural validator for a Vietnamese Enterprise/Tax Code (Mã số thuế, MST).
- **partita_iva_validate** ($0.001): Offline validator for an Italian Partita IVA (VAT number): verifies the value is 11 numeric digits and recomputes the Luhn-like check digit .
- **pan_in_validate** ($0.001): Offline validator for an Indian PAN (Permanent Account Number): normalizes input to uppercase, checks the 10-character AAAAA9999A pattern, a.
- **siren_validate** ($0.001): Offline validator for a French SIREN (9-digit business identifier).
- **cin_in_validate** ($0.001): Offline structural validator for an Indian CIN (Corporate Identity Number, 21 characters).
- **vat_fr_validate** ($0.001): Offline validator for a French VAT number (TVA intracommunautaire, e.g.
- **cpr_dk_validate** ($0.001): Offline validator/normalizer for a Danish CPR-nummer (personal identification number, format DDMMYY-SSSS).
- **cvr_dk_validate** ($0.001): Offline validator for a Danish CVR-nummer (8-digit business registration number issued by the Danish Business Authority).
- **rrn_be_validate** ($0.001): Offline validator for a Belgian National Register Number (Rijksregisternummer / Numéro de registre national), format YYMMDDXXXCC.

…and 147 more forged tools plus 2,466 provider API endpoints (SEO, social, enrichment, ads, market data, AI generation): browse at https://toll402.dev/catalog or call `find` with what you need.

## Get listed (paid listings, agent-native)

Own an x402 endpoint, a remote MCP server or an A2A agent? Buy a verified listing (x402 or credits), no humans, no forms: `POST https://toll402.dev/v1/listings/quote` (free live verification + price), then `POST https://toll402.dev/v1/listings` via any x402 client or with your credits key. basic $1 · featured $5 per 30 days. Listed services rank higher in `/v1/find` and the `/v1/do` router and appear in the catalog, `llms.txt`, the agent card and the landing. Charged only when verification passes. Current listings: `GET https://toll402.dev/v1/listings`.
