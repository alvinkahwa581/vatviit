from __future__ import annotations

from dataclasses import dataclass
from decimal import Decimal
from typing import Literal

from .quotes import MarketQuote

Side = Literal["buy", "sell"]


@dataclass(frozen=True)
class PaperFill:
    symbol: str
    side: Side
    quantity: int
    reference_price: Decimal
    estimated_notional: Decimal
    execution_mode: str = "simulation_only"


def preview_market_order(quote: MarketQuote, side: Side, quantity: int) -> PaperFill:
    if side not in ("buy", "sell"):
        raise ValueError("side must be 'buy' or 'sell'")
    if isinstance(quantity, bool) or not isinstance(quantity, int) or quantity <= 0:
        raise ValueError("quantity must be a positive integer")

    reference_price = quote.ask if side == "buy" else quote.bid
    return PaperFill(
        symbol=quote.symbol,
        side=side,
        quantity=quantity,
        reference_price=reference_price,
        estimated_notional=reference_price * quantity,
    )
