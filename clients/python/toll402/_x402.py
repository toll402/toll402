"""Optional x402 payment session (requests-based, sync). Install with: pip install "toll402[pay]"."""
from __future__ import annotations


def paid_session(wallet_key: str, network: str = "eip155:8453", max_usd_per_call: float = 0.25):
    try:
        import requests
        from eth_account import Account
        from x402 import SchemeRegistration, x402ClientConfig
        from x402.http.clients.requests import wrapRequestsWithPaymentFromConfig
        from x402.mechanisms.evm import EthAccountSigner
        from x402.mechanisms.evm.exact import ExactEvmScheme
    except ImportError as e:  # pragma: no cover
        raise ImportError('Paying requires the payment extras: pip install "toll402[pay]"  (x402[requests,evm], eth-account)') from e

    account = Account.from_key(wallet_key)
    signer = EthAccountSigner(account)
    config = x402ClientConfig(schemes=[SchemeRegistration(network=network, client=ExactEvmScheme(signer=signer))])
    try:  # spend controls exist in recent SDKs; fall back silently if the signature differs
        from x402 import SpendControls  # type: ignore

        config = x402ClientConfig(
            schemes=[SchemeRegistration(network=network, client=ExactEvmScheme(signer=signer))],
            spend_controls=SpendControls(max_amount_per_payment=f"${max_usd_per_call}"),  # type: ignore[arg-type]
        )
    except Exception:
        pass
    session = wrapRequestsWithPaymentFromConfig(requests.Session(), config)
    return session, account.address
