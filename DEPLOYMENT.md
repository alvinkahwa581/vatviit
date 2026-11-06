# VaTViT deployment

## Render API

1. Create a Render Web Service from the `alvinkahwa581/vatviit` repository.
2. Render will use `render.yaml`, `npm install`, and `npm start`.
3. Set `DATABASE_URL` to the pooled Neon connection string.
4. Set `RESEND_API_KEY`, `WAITLIST_FROM_EMAIL`, and `WAITLIST_NOTIFY_EMAIL` for email notifications.
5. Set `SENTRY_DSN` after creating a Sentry Node project.

## Frontend API URL

GitHub Pages is static. Set `VATVIT_API_URL` in the frontend deployment process to the Render URL, then point frontend fetch calls at that origin. The current static site remains compatible with the same-origin API when served by Express.

## GitHub Pages

- Publishing source: **Deploy from a branch**, `main`, `/(root)`.
- Keep the site entry point (`index.html`), `assets/`, and root `CNAME` in the publishing directory.
- The custom domain in `CNAME` is `vatvit.site`. Keep the domain's apex A records pointed at GitHub Pages and verify HTTPS is enabled in **Settings → Pages** after DNS changes.
- A successful artifact build does not prove deployment completed. If the deployment job fails while queued, inspect the Pages deployment job and retry it from the failed Actions run; verify the deployed page and `Last-Modified` response afterward.
- If a retry still fails, verify Pages source, latest commit, domain/DNS, certificate status, and that the deployment artifact contains `index.html` and referenced assets before changing DNS or publishing settings.

## Secrets

Never commit `.env` or provider keys. Use Render environment variables and Neon pooled credentials.
