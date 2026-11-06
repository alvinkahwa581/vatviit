from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime
from decimal import Decimal, InvalidOperation
from typing import Any, Mapping
import re

_SYMBOL = re.compile(r"^[A-Z0-9._-]{1,24}$")


@dataclass(frozen=True)
class MarketQuote:
    symbol: str
    bid: Decimal
    ask: Decimal
    observed_at: datetime


def parse_quote(payload: Mapping[str, Any]) -> MarketQuote:
    symbol = payload.get("symbol")
    if not isinstance(symbol, str) or not _SYMBOL.fullmatch(symbol):
        raise ValueError("symbol must be 1-24 uppercase ticker characters")

    try:
        bid = Decimal(str(payload["bid"]))
        ask = Decimal(str(payload["ask"]))
    except (KeyError, InvalidOperation, ValueError) as error:
        raise ValueError("bid and ask must be valid decimal values") from error

    if not bid.is_finite() or not ask.is_finite() or bid < 0 or ask < bid:
        raise ValueError("quote prices must be finite, non-negative, and ask >= bid")

    timestamp = payload.get("observed_at")
    if not isinstance(timestamp, str):
        raise ValueError("observed_at must be an ISO 8601 timestamp")
    try:
        observed_at = datetime.fromisoformat(timestamp.replace("Z", "+00:00"))
    except ValueError as error:
        raise ValueError("observed_at must be an ISO 8601 timestamp") from error
    if observed_at.tzinfo is None or observed_at.utcoffset() is None:
        raise ValueError("observed_at must include a timezone")

    return MarketQuote(symbol=symbol, bid=bid, ask=ask, observed_at=observed_at)
