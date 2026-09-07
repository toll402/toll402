"""CrewAI adapter: every available Toll402 tool as a CrewAI BaseTool.  pip install "toll402[crewai]" """
from __future__ import annotations

import json
from typing import Any

from .client import Toll402
from .langchain import _pydantic_model


def toll402_crewai_tools(client: Toll402, kinds: list[str] | None = None, max_price_usd: float | None = None):
    from crewai.tools import BaseTool

    kinds_set = set(kinds or ["builtin", "forged", "external"])
    out = []
    for t in client.catalog().get("tools", []):
        if not t.get("available") or t["kind"] not in kinds_set:
            continue
        if max_price_usd is not None and t["priceUsd"] > max_price_usd:
            continue
        model = _pydantic_model(t["name"], t["inputSchema"])
        path = t["path"]

        class _Tool(BaseTool):  # type: ignore[misc,valid-type]
            name: str = t["name"][:64]
            description: str = f"{t['description']} (Toll402 {t['kind']} tool, {t['price']} per call, paid automatically in USDC via x402)"
            args_schema: type = model

            def _run(self, **kwargs: Any) -> str:
                return json.dumps(client.call(path, {k: v for k, v in kwargs.items() if v is not None}))

        out.append(_Tool())
    return out
