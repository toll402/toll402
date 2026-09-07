// npm i @x402/fetch @x402/evm viem
import { wrapFetchWithPaymentFromConfig } from "@x402/fetch";
import { ExactEvmScheme } from "@x402/evm/exact/client";
import { privateKeyToAccount } from "viem/accounts";

const BASE = process.env.TOLL402_URL ?? "https://toll402.dev";
const fetchPaid = wrapFetchWithPaymentFromConfig(fetch, {
  schemes: [{ network: "eip155:8453", client: new ExactEvmScheme(privateKeyToAccount(process.env.WALLET_KEY as `0x${string}`)) }],
  spendControls: { maxAmountPerPayment: "$0.25" },
});

// 1) Discover (free)
const found = await (await fetch(`${BASE}/v1/find?need=is this article written by a human`)).json();
console.log("best tool:", found.matches[0].name, found.matches[0].price);

// 2) One call does it all
const r = await fetchPaid(`${BASE}/v1/do`, {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({ need: "provenance of this article", input: { url: "https://en.wikipedia.org/wiki/Turing_test", deep: false } }),
});
console.log(await r.json());
