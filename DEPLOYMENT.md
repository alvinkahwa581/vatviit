# VaTViT deployment

## Render API

1. Create a Render Web Service from the `alvinkahwa581/vatviit` repository.
2. Render will use `render.yaml`, `npm install`, and `npm start`.
3. Set `DATABASE_URL` to the pooled Neon connection string.
4. Set `RESEND_API_KEY`, `WAITLIST_FROM_EMAIL`, and `WAITLIST_NOTIFY_EMAIL` for email notifications.
5. Set `SENTRY_DSN` after creating a Sentry Node project.

## Frontend API URL

GitHub Pages is static. Set `VATVIT_API_URL` in the frontend deployment process to the Render URL, then point frontend fetch calls at that origin. The current static site remains compatible with the same-origin API when served by Express.

## Secrets

Never commit `.env` or provider keys. Use Render environment variables and Neon pooled credentials.