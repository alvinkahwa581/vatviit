# VaTViT deployment

## Render API

1. Create a Render Web Service from the `alvinkahwa581/vatviit` repository.
2. Render will use `render.yaml`, `npm install`, and `npm start`.
3. Set `DATABASE_URL` to the pooled Neon connection string. Email verification and authenticator MFA require PostgreSQL; file-based local storage is intentionally not accepted for authentication.
4. Configure `RESEND_API_KEY` and `WAITLIST_FROM_EMAIL` with a verified sender identity in Resend. `WAITLIST_NOTIFY_EMAIL` is only used for waitlist notifications.
5. Set `MFA_ENCRYPTION_KEY` to a new 32-byte key represented as 64 hexadecimal characters. Generate one with `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`, store it only in Render's environment settings, and keep a protected backup. Do not rotate this key without first migrating the encrypted authenticator secrets; losing it requires users to reset authenticator setup.
6. Configure `JWT_SECRET` and `SENTRY_DSN` in Render as appropriate. Never commit `.env` or provider keys.

The MFA migration adds `email_verified` with a default of false. Existing accounts must verify their email and enroll an authenticator before receiving a session token. Validate email delivery and the complete sign-up/login flow in a staging environment before enabling this branch for production traffic. Do not deploy until the database, verified sender, and encryption key are configured.

## Frontend API URL

GitHub Pages is static. The auth page currently uses the Render API URL in `auth-fixes.js`; set `window.VATVIT_API_URL` before that script if the API host changes. The current static site remains compatible with the same-origin API when served by Express.

## GitHub Pages

- Publishing source: **Deploy from a branch**, `main`, `/(root)`.
- Keep the site entry point (`index.html`), `assets/`, and root `CNAME` in the publishing directory.
- The custom domain in `CNAME` is `vatvit.site`. Keep the domain's apex A records pointed at GitHub Pages and verify HTTPS is enabled in **Settings → Pages** after DNS changes.
- A successful artifact build does not prove deployment completed. If the deployment job fails while queued, inspect the Pages deployment job and retry it from the failed Actions run; verify the deployed page and `Last-Modified` response afterward.
- If a retry still fails, verify Pages source, latest commit, domain/DNS, certificate status, and that the deployment artifact contains `index.html` and referenced assets before changing DNS or publishing settings.
