# toll402 (Python)

One-line access to [Toll402](https://toll402.dev): 2,600+ pay-per-call tools for AI agents (web, PDF, provenance, verified business directory, ID validators, and SEO/social/enrichment/ads/market-data provider APIs).
Every call is paid: either from a wallet (USDC on Base via x402, no account) or from prepaid credits bought by card at https://toll402.dev/credits (API key `tk_…`, header `x-toll402-key`). Charged only on 2xx.

```bash
pip install toll402            # discovery + credits (API key)
pip install "toll402[pay]"     # + x402 payments (x402[requests,evm], eth-account)
```

```python
from toll402 import Toll402

t = Toll402(api_key=os.environ.get("TOLL402_API_KEY"))    # prepaid credits (card)
# or: Toll402(wallet_key=os.environ.get("WALLET_KEY"))      # x402 (wallet)

t.read("https://example.com")                                   # page → Markdown ($0.002)
t.do("convert 100 usd to mxn", {"base": "USD", "quote": "MXN", "amount": 100})
t.provenance("https://some-article")                            # human or synthetic? evidence + score
t.lookup("HTTP 402", sources=["wikipedia", "wikidata"])         # trusted sources with citations
t.business.search(city="Ciudad de México", category="dentist", minLevel="corroborated")
t.call("hn_top", {"n": 5})                                      # any catalog tool by name
t.last_payment      # settlement of the last paid call (tx hash on Base)
t.last_charge       # {'usd', 'balance_usd', 'call_id'} of the last credits-paid call

# credits key only
t.review(True, reason="exact numbers")                          # rate the last call; moves ranking
t.calls(days=7)                                                 # history, with stored answers (24 h)
job = t.generate("p/replicate.image-gen.flux-schnell", {"input": {"prompt": "a red kite"}})  # async task, waits
job["result"]["urls"]                                           # failed tasks are refunded
t.create_key("research-bot", daily_cap_usd=2)                   # owner key: one key per agent
```

Errors raise `Toll402Error` with `.status`, `.code` (`payment_required`, `invalid_input`, `tool_failed`, …) and `.price`. Charged only on 2xx.

## LangChain
```python
from toll402.langchain import toll402_tools
tools = toll402_tools(t, max_price_usd=0.05)      # StructuredTool list from the live catalog
```
## CrewAI
```python
from toll402.crewai import toll402_crewai_tools
tools = toll402_crewai_tools(t, kinds=["builtin", "forged"])
```
Docs for machines: https://toll402.dev/llms.txt · MIT.
