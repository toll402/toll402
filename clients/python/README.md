# toll402 (Python)

One-line access to [Toll402](https://toll402.dev): pay-per-call tools for AI agents over x402 (USDC on Base).
No API keys. Without a wallet you get the free trial (cheap tools, per-IP daily quota); with one, every call pays itself.

```bash
pip install toll402            # free trial / discovery
pip install "toll402[pay]"     # + x402 payments (x402[requests,evm], eth-account)
```

```python
from toll402 import Toll402

t = Toll402(wallet_key=os.environ.get("WALLET_KEY"))     # omit → free trial

t.read("https://example.com")                                   # page → Markdown ($0.002)
t.do("convert 100 usd to mxn", {"base": "USD", "quote": "MXN", "amount": 100})
t.provenance("https://some-article")                            # human or synthetic? evidence + score
t.lookup("HTTP 402", sources=["wikipedia", "wikidata"])         # trusted sources with citations
t.business.search(city="Ciudad de México", category="dentist", minLevel="corroborated")
t.call("hn_top", {"n": 5})                                      # any catalog tool by name
t.last_payment      # settlement of the last paid call (tx hash on Base)
t.trial_remaining   # free-trial calls left today
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
