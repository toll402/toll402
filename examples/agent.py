# pip install x402 httpx eth-account
import asyncio, os
from eth_account import Account
from x402.clients.httpx import x402HttpxClient

BASE = os.environ.get("TOLL402_URL", "https://toll402.dev")
acct = Account.from_key(os.environ["WALLET_KEY"])  # holds a little USDC on Base

async def main():
    async with x402HttpxClient(account=acct, base_url=BASE) as client:
        r = await client.post("/v1/lookup", json={"query": "HTTP 402 payment required", "sources": ["wikipedia", "wikidata"], "synthesize": False})
        print(r.status_code, r.json()["result"]["passages"][0])

asyncio.run(main())
