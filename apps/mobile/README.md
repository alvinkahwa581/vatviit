# VaTViT mobile app foundation

Expo + React Native + TypeScript starter for Android and iOS. This preview is UI-only: it does not sign in, connect accounts, fetch market data, or place trades.

## Run

Use Node.js 26 and npm:

```sh
npm install
npm start
```

Run `npm run typecheck` to check TypeScript and `npm run build:android` to export the Android JavaScript bundle. Native signing, store listings, EAS project ownership, app identifiers, and release credentials have not been configured.

## Safety boundary

The tabs are placeholders, not available financial features. Do not add credentials or live broker calls to the mobile bundle. Any future account integration needs an authenticated server API, explicit consent, and independently reviewed access controls.
