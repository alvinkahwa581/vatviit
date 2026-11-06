from datetime import datetime, timezone
from decimal import Decimal
import unittest

from vatvit_adapter import parse_quote, preview_market_order


class QuoteParsingTests(unittest.TestCase):
    def test_parses_timezone_aware_quote_without_float_rounding(self):
        quote = parse_quote(
            {
                "symbol": "EURUSD",
                "bid": "1.08231",
                "ask": "1.08235",
                "observed_at": "2026-11-06T10:00:00Z",
            }
        )
        self.assertEqual(Decimal("1.08231"), quote.bid)
        self.assertEqual(datetime(2026, 11, 6, 10, tzinfo=timezone.utc), quote.observed_at)

    def test_rejects_invalid_prices(self):
        with self.assertRaises(ValueError):
            parse_quote(
                {
                    "symbol": "EURUSD",
                    "bid": "1.2",
                    "ask": "1.1",
                    "observed_at": "2026-11-06T10:00:00Z",
                }
            )

    def test_rejects_timestamps_without_timezone(self):
        with self.assertRaises(ValueError):
            parse_quote(
                {
                    "symbol": "EURUSD",
                    "bid": "1.1",
                    "ask": "1.2",
                    "observed_at": "2026-11-06T10:00:00",
                }
            )


class PaperOrderTests(unittest.TestCase):
    def setUp(self):
        self.quote = parse_quote(
            {
                "symbol": "EURUSD",
                "bid": "1.08231",
                "ask": "1.08235",
                "observed_at": "2026-11-06T10:00:00Z",
            }
        )

    def test_buy_preview_uses_ask_and_never_executes(self):
        preview = preview_market_order(self.quote, "buy", 1000)
        self.assertEqual(Decimal("1.08235"), preview.reference_price)
        self.assertEqual(Decimal("1082.35000"), preview.estimated_notional)
        self.assertEqual("simulation_only", preview.execution_mode)

    def test_sell_preview_uses_bid(self):
        preview = preview_market_order(self.quote, "sell", 2)
        self.assertEqual(Decimal("1.08231"), preview.reference_price)

    def test_rejects_non_positive_quantity(self):
        with self.assertRaises(ValueError):
            preview_market_order(self.quote, "buy", 0)


if __name__ == "__main__":
    unittest.main()
