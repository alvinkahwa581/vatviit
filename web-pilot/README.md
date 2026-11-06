# VaTViT web pilot

This is an isolated React and TypeScript implementation of the public homepage. It is a migration pilot, not the production website. The existing root-level pages and Node.js/Express API are unchanged.

## Run locally

Use Node.js 26 and npm:

```sh
npm ci
npm run dev
```

## Validate and build

```sh
npm run build
```

The build runs the TypeScript checker before Vite creates `dist/`. Dependencies are pinned by the committed `package-lock.json`, and GitHub Actions uses `npm ci` to verify the locked install. The workflow stores the built output as a downloadable artifact; the pilot is not published to the live domain.

## Status

The web pilot uses React, TypeScript, Vite, and the VaTViT brand palette. It intentionally describes proposed features as in development. Review accessibility, route behavior, content parity, and mobile layouts before considering any production cutover.
