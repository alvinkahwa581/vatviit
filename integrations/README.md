# Trading integration foundations

This area is intentionally limited to read-only quote validation and simulated paper-order estimates. The Python adapter has no network or broker client. The MQL5 Expert Advisor reads quotes and writes them only to the MetaTrader Experts log; it contains no trade-send or position-modification calls.

No credentials, account identifiers, or real orders belong in these prototypes. Live trading is out of scope until the broker protocol, data ownership, user consent, risk limits, regulatory review, monitoring, and rollback process are defined and explicitly approved.

Run Python tests with:

```sh
python -m unittest discover -s integrations/python/tests -v
```

MQL5 compilation and Strategy Tester validation require MetaTrader 5 on a supported Windows environment and are not available in the repository CI runner.
