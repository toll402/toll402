"""LangChain adapter: every available Toll402 tool as a StructuredTool.  pip install "toll402[langchain]" """
from __future__ import annotations

import json
from typing import Any

from .client import Toll402


def _pydantic_model(name: str, schema: dict):
    from pydantic import Field, create_model

    types = {"string": str, "number": float, "integer": int, "boolean": bool, "array": list, "object": dict}
    fields: dict[str, Any] = {}
    required = set(schema.get("required", []))
    for k, v in (schema.get("properties") or {}).items():
        py = types.get(v.get("type"), Any)
        desc = v.get("description", "")
        fields[k] = (py if k in required else py | None, Field(... if k in required else None, description=desc))
    return create_model(f"{name}_input", **fields) if fields else create_model(f"{name}_input", input=(dict, Field(default_factory=dict)))


def toll402_tools(client: Toll402, kinds: list[str] | None = None, max_price_usd: float | None = None):
    from langchain_core.tools import StructuredTool

    kinds_set = set(kinds or ["builtin", "forged", "external"])
    tools = []
    for t in client.catalog().get("tools", []):
        if not t.get("available") or t["kind"] not in kinds_set:
            continue
        if max_price_usd is not None and t["priceUsd"] > max_price_usd:
            continue
        path = t["path"]

        def _run(_path=path, **kwargs: Any) -> str:
            return json.dumps(client.call(_path, {k: v for k, v in kwargs.items() if v is not None}))

        tools.append(
            StructuredTool.from_function(
                func=_run,
                name=t["name"][:64],
                description=f"{t['description']} (Toll402 {t['kind']} tool, {t['price']} per call, paid automatically in USDC via x402)",
                args_schema=_pydantic_model(t["name"], t["inputSchema"]),
            )
        )
    return tools
