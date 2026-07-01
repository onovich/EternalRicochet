# Phase 8 PWA Manifest Plan

Date: 2026-07-01
Status: implementation plan
Scope: manifest-first install metadata only; no service worker or offline cache

## Current Deployment Facts

- Vite builds with `base: "/EternalRicochet/"` from `vite.config.js`.
- GitHub Pages deploys the generated `dist/` directory through `.github/workflows/deploy.yml`.
- There is currently no `public/` directory, manifest, local icon asset set, service worker, or Cache API usage.
- `index.html` still references Tailwind and Google Fonts from external CDNs. Phase 8 will not vendor or cache them.

## Manifest Decision

- Add `public/manifest.webmanifest`.
- Link it from `index.html` as `/EternalRicochet/manifest.webmanifest`.
- Use `start_url: "/EternalRicochet/"` and `scope: "/EternalRicochet/"` to match hosted GitHub Pages pathing and local dev parity.
- Use `display: "fullscreen"` to match the existing single-screen arcade app feel.
- Use `orientation: "any"` because the current browser build supports desktop and mobile viewports.
- Use `theme_color: "#00ffff"` and `background_color: "#050505"` to match the neon arcade identity.
- Do not include offline availability claims, service-worker metadata, shortcuts, protocol handlers, share targets, or external icon URLs.

## Icon Decision

- Add local SVG icon assets under `public/icons/`.
- Provide one standard icon entry and one maskable icon entry:
  - `/EternalRicochet/icons/icon.svg`
  - `/EternalRicochet/icons/maskable-icon.svg`
- Reuse `/EternalRicochet/icons/icon.svg` as the page favicon so the browser and install metadata share the same local identity asset.
- Use a dark square background, cyan/fuchsia neon contrast, and a ricochet/bullet motif so the icon remains recognizable at install sizes.
- Keep icon assets static and committed; do not add a runtime dependency or generated `dist/` output.

## Smoke Decision

Add a focused `scripts/smoke-pwa.mjs` and `npm run smoke:pwa`.

The smoke should validate:

- `public/manifest.webmanifest` is parseable JSON.
- Required manifest fields are present and match `/EternalRicochet/` path assumptions.
- Manifest icon entries are local, have expected `src`, `type`, `sizes`, and `purpose`, and resolve to committed files.
- `index.html` links the manifest and includes a matching `theme-color` meta tag.
- After `npm run build`, `dist/manifest.webmanifest` and `dist/icons/*` exist.
- `dist/index.html` keeps the manifest link under `/EternalRicochet/`.
- No service worker registration, Cache API usage, background sync, push notification, offline fallback, backend/provider SDK, or native packaging scope appears in the manifest/readiness surface.

## Documentation Decision

- Update `docs/release-readiness-checklist.md` with manifest-first checks.
- Update README only after final validation passes.
- Add `docs/phase-8-validation-report.md` in the final round.

## Deferred Scope

- Service worker and offline cache strategy.
- CDN asset vendoring.
- Install prompt UI.
- Push notifications, background sync, share targets, protocol handlers, and app shortcuts.
- Backend leaderboard, public leaderboard UI, provider SDKs, credentials, analytics, telemetry, and native packaging.
