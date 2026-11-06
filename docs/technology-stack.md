# VaTViT technology direction

## Status

The public production website is still static HTML/CSS/JavaScript, and the production API remains the Node.js/Express app in `server.js`. The React/TypeScript homepage pilot is live separately at `/web-pilot-preview/`. Starter projects now exist for Expo mobile, Mojolicious core services, and a Rails community API. A Python quote validator/paper simulator and an MQL5 read-only quote observer are included for interface exploration only.

These are isolated foundations, not production integrations. No mobile app has been released, no Perl or Ruby service has been deployed, and no new service owns user or account data. The Node API remains authoritative. Do not describe planned account connections, trading, risk controls, or market data as available until each integration is implemented and verified.

## Technology boundaries

| Area | Technology | Current implementation and limits |
| --- | --- | --- |
| Web | React, TypeScript, JavaScript | Isolated Vite homepage preview; the current static site remains the production homepage. |
| Mobile | Expo, React Native, TypeScript | UI-only Android/iOS starter. No authentication, account data, market feed, or order execution. Native signing and store setup remain outstanding. |
| Core services | Perl with Mojolicious | Isolated health/capability endpoints only. No database or production traffic; Node remains authoritative. |
| Community | Ruby on Rails, API-only | Isolated health/status endpoints. No user content, identity integration, custom subdomain, or deployment. |
| Trading data | MQL5 and Python | MQL5 logs quotes read-only; Python validates timezone-aware decimal quotes and calculates simulation-only estimates. No network or broker connection and no live execution. |

## Migration and operating rules

1. Keep the existing website and Node API working while the isolated projects are tested.
2. Define versioned API contracts, data ownership, identity boundaries, and migration/rollback plans before moving any account behavior.
3. Test the mobile and service starters in CI; decide their hosting, DNS, secrets management, database, monitoring, and operations ownership before deployment.
4. Add MQL5/Python broker adapters only after selecting the broker protocol, data policy, risk limits, consent flow, regulatory requirements, audit trail, incident response, and kill switch. Current integration code is read-only/simulation-only.
5. Do not place API keys or broker credentials in mobile/web bundles, source control, or test fixtures.

## Decisions still required before production

Choose service ownership and database/data retention, API authentication and versioning, hosting for the Perl and Rails apps, the community hostname and identity model, mobile signing and release ownership, supported market-data providers, and a broker-specific integration contract. Live order execution needs a separate explicit authorization after risk, compliance, and security review. No external service has been provisioned as part of these starter projects.
