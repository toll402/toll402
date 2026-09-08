"""Sync client for Toll402. Without a wallet you get the free trial (cheap tools, per-IP quota); with one, calls pay themselves."""
from __future__ import annotations

import json
import time
from dataclasses import dataclass
from typing import Any, Optional

import httpx
UA = {"user-agent": "toll402-python/0.1.1"}

DEFAULT_BASE = "https://toll402.dev"


class Toll402Error(Exception):
    def __init__(self, message: str, status: int, code: str, price: str | None = None, details: Any = None):
        super().__init__(message)
        self.status, self.code, self.price, self.details = status, code, price, details

    def __repr__(self) -> str:  # pragma: no cover
        return f"Toll402Error({self.status}, {self.code}: {self})"


@dataclass
class _Resp:
    status: int
    headers: dict
    text: str


class Toll402:
    def __init__(self, wallet_key: Optional[str] = None, base_url: str = DEFAULT_BASE, max_usd_per_call: float = 0.25, network: str = "eip155:8453", timeout: float = 120.0):
        self.base_url = base_url.rstrip("/")
        self.timeout = timeout
        self.last_payment: dict | None = None
        self.trial_remaining: int | None = None
        self.address: str | None = None
        self._catalog: tuple[float, dict] | None = None
        self._http = httpx.Client(timeout=timeout, headers=UA)
        self._paid = None
        if wallet_key:
            from ._x402 import paid_session

            self._paid, self.address = paid_session(wallet_key, network=network, max_usd_per_call=max_usd_per_call)
        self.business = Business(self)

    # ---- transport ------------------------------------------------------------
    def _post(self, path: str, body: dict) -> _Resp:
        url = f"{self.base_url}{path}"
        if self._paid is not None:
            r = self._paid.post(url, json=body, timeout=self.timeout, headers=UA)
            return _Resp(r.status_code, {k.lower(): v for k, v in r.headers.items()}, r.text)
        r = self._http.post(url, json=body)
        return _Resp(r.status_code, {k.lower(): v for k, v in r.headers.items()}, r.text)

    def _get(self, path: str) -> Any:
        r = self._http.get(f"{self.base_url}{path}")
        if r.status_code >= 400:
            raise Toll402Error(f"GET {path}: HTTP {r.status_code}", r.status_code, "http_error")
        return r.json()

    # ---- discovery (free) -----------------------------------------------------
    def catalog(self, fresh: bool = False) -> dict:
        if not fresh and self._catalog and time.time() - self._catalog[0] < 300:
            return self._catalog[1]
        data = self._get("/v1/catalog")
        self._catalog = (time.time(), data)
        return data

    def find(self, need: str, limit: int = 8, kinds: list[str] | None = None) -> dict:
        body: dict = {"need": need, "limit": limit}
        if kinds:
            body["kinds"] = kinds
        r = self._http.post(f"{self.base_url}/v1/find", json=body)
        j = r.json()
        if r.status_code >= 400:
            raise Toll402Error(f"find: HTTP {r.status_code}", r.status_code, "find_failed", details=j)
        return j

    # ---- calls ----------------------------------------------------------------
    def call(self, tool: str, input: dict | None = None) -> Any:
        """Call any tool by catalog name ('read_url', 'hn_top'), id ('t/hn_top', 'x/abc'), or path ('/v1/read'). Returns its `result`."""
        path = self._resolve(tool)
        r = self._post(path, input or {})
        tr = r.headers.get("x-toll402-trial-remaining")
        self.trial_remaining = int(tr) if tr is not None else None
        pr = r.headers.get("payment-response") or r.headers.get("x-payment-response")
        if pr:
            try:
                import base64

                self.last_payment = json.loads(base64.b64decode(pr + "=" * (-len(pr) % 4)))
            except Exception:
                self.last_payment = {"raw": pr}
        try:
            body = json.loads(r.text)
        except Exception:
            body = {"raw": r.text}
        if r.status == 402:
            raise Toll402Error(body.get("message", "Payment required: pass wallet_key with USDC on Base, or your free-trial quota is exhausted"), 402, "payment_required", body.get("price"), body)
        if r.status >= 400 or body.get("ok") is False:
            raise Toll402Error(body.get("message", f"HTTP {r.status}"), r.status, body.get("error", "error"), details=body)
        return body.get("result")

    def do(self, need: str, input: dict, max_price_usd: float | None = None, tool: str | None = None) -> dict:
        body: dict = {"need": need, "input": input}
        if max_price_usd is not None:
            body["maxPriceUsd"] = max_price_usd
        if tool:
            body["tool"] = tool
        return self.call("/v1/do", body)

    def forge(self, spec: dict) -> dict:
        return self.call("/v1/forge", spec)

    def read(self, url: str, **opts: Any) -> dict:
        return self.call("/v1/read", {"url": url, **opts})

    def provenance(self, url: str, deep: bool = True) -> dict:
        return self.call("/v1/provenance", {"url": url, "deep": deep})

    def lookup(self, query: str, **opts: Any) -> dict:
        return self.call("/v1/lookup", {"query": query, **opts})

    def extract(self, schema: dict, url: str | None = None, text: str | None = None, instructions: str | None = None) -> dict:
        body: dict = {"schema": schema}
        if url:
            body["url"] = url
        if text:
            body["text"] = text
        if instructions:
            body["instructions"] = instructions
        return self.call("/v1/extract", body)

    def summarize(self, url: str | None = None, text: str | None = None, **opts: Any) -> dict:
        return self.call("/v1/summarize", {k: v for k, v in {"url": url, "text": text, **opts}.items() if v is not None})

    def judge(self, task: str, candidate: str, reference: str | None = None, criteria: list[str] | None = None) -> dict:
        body: dict = {"task": task, "candidate": candidate}
        if reference:
            body["reference"] = reference
        if criteria:
            body["criteria"] = criteria
        return self.call("/v1/judge", body)

    def verify_email(self, email: str) -> dict:
        return self.call("/v1/email/verify", {"email": email})

    def fx(self, base: str, quote: str | None = None, amount: float = 1) -> dict:
        body: dict = {"base": base, "amount": amount}
        if quote:
            body["quote"] = quote
        return self.call("/v1/fx", body)

    def _resolve(self, tool: str) -> str:
        if tool.startswith("/"):
            return tool
        if tool.startswith("t/") or tool.startswith("x/"):
            return f"/v1/{tool}"
        for t in self.catalog().get("tools", []):
            if t.get("name") == tool or t.get("id") == tool:
                return t["path"]
        raise Toll402Error(f'Unknown tool "{tool}". Use find() to discover tools.', 404, "unknown_tool")


class Business:
    """Verified business directory."""

    def __init__(self, client: Toll402):
        self._c = client

    def search(self, **q: Any) -> dict:
        return self._c.call("/v1/biz/search", q)

    def verify(self, **q: Any) -> dict:
        return self._c.call("/v1/biz/verify", q)

    def details(self, id: str, force: bool = False) -> dict:
        return self._c.call("/v1/biz/details", {"id": id, "force": force})

    def get(self, id: str) -> dict:
        """Free public profile."""
        from urllib.parse import quote

        return self._c._get(f"/v1/biz/{quote(id, safe='')}")
