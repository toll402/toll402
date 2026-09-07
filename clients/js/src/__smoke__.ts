import { Toll402 } from "./index.js";
const t = new Toll402({ baseUrl: process.env.TOLL402_URL ?? "https://toll402.dev" }); // no wallet → free trial
const cat = await t.catalog();
console.log("catalog:", cat.service, cat.counts, "freeTrial:", cat.freeTrial?.callsPerIpPerDay);
const f = await t.find("convert usd to mxn");
console.log("find:", f.matches.slice(0, 3).map((m) => `${m.name} ${m.price}`).join(" | "));
const fx = await t.call<{ rate: number; converted: number }>("fx_rate", { base: "USD", quote: "MXN", amount: 10 });
console.log("fx_rate:", fx, "trialRemaining:", t.trialRemaining);
const d = await t.do<{ converted: number }>("convert 5 us dollars to mexican pesos", { base: "USD", quote: "MXN", amount: 5 }).catch((e) => ({ error: e.code, status: e.status }));
console.log("do:", JSON.stringify(d).slice(0, 200));
