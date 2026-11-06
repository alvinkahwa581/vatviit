# VaTViT technology direction

## Status

This document records the intended direction, not a description of a completed migration. Today, the public website is built with static HTML, CSS, and browser JavaScript. The existing API is a Node.js/Express application (`server.js`) deployed as a Node service. The proposed React, Perl, Ruby, Python, and MQL5 components are not currently the deployed application stack.

Keep the current website and API operational while the new stack is introduced incrementally. Do not claim that planned integrations, services, broker connections, or regulatory capabilities are available until they are implemented and verified.

## Intended technology boundaries

| Area | Intended technology | Responsibility and status |
| --- | --- | --- |
| Web interface | React, TypeScript, and JavaScript | Build the modern web interface. Migrate incrementally, starting with an isolated frontend pilot; retain the current static pages until the replacement passes parity checks. |
| Mobile interface | React Native with TypeScript | Intended direction for a mobile application. Select the app tooling and delivery approach before implementation. |
| Core backend and microservices | Perl | Intended for future core services. The existing Node.js/Express API remains in place until service boundaries, API contracts, operational requirements, and a safe migration are established. The Perl framework is not yet selected. |
| Community subdomains | Ruby | Intended for community-specific services and infrastructure, isolated from trading and account services. The Ruby framework, hosting, identity integration, and ownership boundaries remain to be decided. |
| Trading-system integration | MQL5 and Python | MQL5 for MetaTrader Expert Advisor integration; Python for adapters and data processing. These are planned integrations, not production trading access. |

## Migration sequence

1. **Baseline and contracts:** inventory existing routes, authentication, data ownership, frontend behavior, and deployments. Define versioned service contracts and tests before replacing any API behavior.
2. **Web pilot:** introduce a TypeScript/React frontend as an isolated application. Recreate one low-risk public page first, preserving metadata, keyboard access, responsive behavior, accessibility, and current brand styles. Keep static pages and their URLs available while the pilot is evaluated.
3. **Web rollout:** migrate additional pages only after the pilot builds, passes accessibility and route checks, and has a verified deployment and rollback path. Do not move account or trading flows until their API and security behavior is covered by tests.
4. **Backend services:** identify independently deployable service boundaries, then introduce Perl services behind stable, tested contracts. Migrate one bounded responsibility at a time; keep the Node API as a compatibility layer until each replacement is proven.
5. **Community and trading integrations:** design Ruby community services separately. Define explicit interfaces and safety controls for MQL5 connectivity and Python data jobs before connecting to any broker or account.
6. **Operations and cutover:** establish secrets management, environment separation, logging, metrics, alerting, backups, access control, and rollback procedures for each runtime before production use.

## Decisions still required

Choose the React web build tool and application structure; confirm the React Native delivery framework; select Perl and Ruby frameworks; define service communication and event transport; and specify the MQL5/Python integration protocol, data validation, failure handling, and deployment ownership. Resolve these choices against the existing API and hosting constraints before creating production services.

## Acceptance criteria for the first web pilot

- The current live site and its existing pages continue to work during the pilot.
- The pilot builds reproducibly from a lockfile and deploys independently before any domain cutover.
- Page content, titles, canonical URLs, and navigation remain correct.
- Keyboard, mobile viewport, and automated accessibility checks pass.
- No production API or account behavior is moved without contract tests and a rollback path.
