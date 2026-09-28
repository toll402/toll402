"""toll402 — one-line client for Toll402 (https://toll402.dev): 2,600+ pay-per-call tools for AI agents.

Two ways to pay, same prices: a wallet (USDC on Base via x402, no account) or prepaid credits bought by card (API key).
Charged only on success.
"""
from .client import Toll402, Toll402Error, Business

__all__ = ["Toll402", "Toll402Error", "Business"]
__version__ = "0.1.0"
