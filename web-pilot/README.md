# VaTViT web pilot

This is an isolated React and TypeScript implementation of the public homepage. It is a migration pilot, not the production website. The existing root-level pages and Node.js/Express API are unchanged.

## Preview

The pilot is published independently at [vatvit.site/web-pilot-preview](https://vatvit.site/web-pilot-preview/). The existing homepage and API remain unchanged. The preview is marked `noindex` and is not a production cutover.

## Run locally

Use Node.js 26 and npm:

```sh
npm ci
npm run dev
```

## Validate and build

```sh
npm run build
npm run build:preview
```

Both builds run the TypeScript checker first. `build` outputs to `dist/`; `build:preview` outputs the independently hosted pilot files to `../web-pilot-preview/`. Dependencies are pinned by the committed `package-lock.json`, and GitHub Actions uses `npm ci` to verify the locked install.

## Status

The web pilot uses React, TypeScript, Vite, and the VaTViT brand palette. It intentionally describes proposed features as in development. Review accessibility, route behavior, content parity, and mobile layouts before considering any production cutover.
