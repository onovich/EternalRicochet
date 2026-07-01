# Release Readiness Checklist

Date: 2026-07-01
Scope: Eternal Ricochet v2.0 conservative browser release readiness

## Local Dev Smoke

Run the deterministic local checks first:

```powershell
npm run validate
```

This runs:

- `npm run check:src`
- `npm run smoke:logic`
- `npm run build`
- `npm run smoke:assets`
- `npm run smoke:offline-readiness`
- `npm run smoke:service-worker`
- `npm run smoke:offline-gate`
- `npm run smoke:release`
- `npm run smoke:pwa`

Then run a browser smoke against the dev server:

```powershell
npm run dev -- --port 4173
```

Open `http://127.0.0.1:4173/EternalRicochet/` and verify:

- Main menu renders with `START`, `UPGRADES`, and `SETTINGS`.
- Settings opens from the menu and can save render quality, audio muted, and fullscreen preference attempts.
- Render quality persists through reload when selected through settings.
- In development only, `?erQuality=high|medium|low` overrides the saved quality setting.
- On a narrow mobile-sized viewport, the settings panel remains within the viewport or scrolls through `#ui-layer`.
- Fullscreen may report `FULLSCREEN BLOCKED` in automated or embedded browsers; that is acceptable if it leaves `fullscreenPreferred=false` and no console errors are emitted.

## Production Build Smoke

Create a fresh production build:

```powershell
npm run build
npm run smoke:assets
npm run smoke:offline-readiness
npm run smoke:service-worker
npm run smoke:offline-gate
npm run smoke:release
```

The asset locality smoke verifies:

- `index.html`, `src/**/*.js`, `src/**/*.css`, manifest metadata, local SVG icons, `dist/index.html`, and built JS/CSS assets contain no unapproved external runtime HTTP(S) URLs.
- Tailwind CDN, Google Fonts CSS, and Google Fonts binary host regressions fail validation.
- The SVG namespace `http://www.w3.org/2000/svg` is treated as metadata, not as a network dependency.

The offline-readiness dry-run verifies:

- `dist/index.html`, hashed JS/CSS bundles, `dist/manifest.webmanifest`, and both local SVG icons exist after build.
- Built JS/CSS asset references use the hosted `/EternalRicochet/` path.
- The production manifest keeps `id`, `start_url`, and `scope` at `/EternalRicochet/`.
- `dist/service-worker.js` exists after build and precaches only the app shell, hashed bundles, manifest, and local icons.
- The only service-worker file is the generated `dist/service-worker.js`; source/public service-worker files, Workbox tooling, unapproved external runtime URLs, provider/backend paths, push notifications, and background sync still fail validation.
- This static check does not replace browser evidence for registration, update, offline reload, recovery, or rollback behavior.

The offline approval-gate smoke verifies:

- `docs/phase-11-offline-ux-approval-gate.md` documents the future offline/update UX states, copy strings, stale-client rules, rollback/unregister runbook, browser validation matrix, and go/no-go checklist.
- Phase 12 runtime behavior remains inside the approved app-shell-only service-worker gate.
- Registration remains production-only, secure-context guarded, and scoped to `/EternalRicochet/`.
- Deferred refresh copy remains limited to `A new version is ready. Refresh when you are ready.` and `A new version is ready after this run.`
- `package.json` still has no runtime dependencies and keeps dev dependencies limited to Vite.

The service-worker smoke verifies:

- `dist/service-worker.js` has a versioned `eternal-ricochet-app-shell-v*` cache name.
- The precache list contains `/EternalRicochet/`, `/EternalRicochet/index.html`, hashed JS/CSS, the manifest, and both local icons.
- The generated runtime ignores cross-origin and non-GET requests, excludes backend/provider/auth/analytics/telemetry/credential-looking paths, and has no Workbox/importScripts/runtime dependency usage.
- The client registers `/EternalRicochet/service-worker.js` with scope `/EternalRicochet/` only in production secure contexts.

The release smoke verifies:

- `dist/index.html` references bundled assets under `/EternalRicochet/`.
- `dist/index.html` does not reference `/src/main.js`.
- `dist/manifest.webmanifest` is emitted.
- `dist/icons/icon.svg` and `dist/icons/maskable-icon.svg` are emitted.
- `dist/index.html` references the manifest and local icon under `/EternalRicochet/`.
- The production JavaScript bundle does not expose `eternal-ricochet-debug-state`.
- The production JavaScript bundle does not expose `__ETERNAL_RICOCHET_DEV__`.

## PWA Manifest And Runtime Smoke

Phase 8 added manifest-first install metadata. Phase 12 adds the first app-shell-only service-worker runtime:

```powershell
npm run smoke:pwa
```

The PWA smoke verifies:

- `public/manifest.webmanifest` is parseable and uses the `Eternal Ricochet` / `Ricochet` identity.
- `start_url`, `scope`, manifest link, and icon links use the `/EternalRicochet/` hosted path.
- Local SVG icon assets exist for a standard icon and a maskable icon.
- Production `dist/` output contains the manifest and icon assets after `npm run build`.
- Production `dist/` output contains the generated Phase 12 service worker while still excluding push notification, background sync, backend/provider SDK, native packaging, analytics, telemetry, and install-prompt scope.

Tailwind and Google Fonts runtime CDN references were removed in Phase 9. Phase 12 offline behavior is limited to the reviewed app shell and local static assets.

Phase 10 adds offline-cache strategy and dry-run readiness checks only. Do not describe the release as offline-capable until a later explicit service-worker phase implements and validates first load, cached reload, offline reload, update cleanup, rollback/unregister, and hosted-path parity.

Phase 11 adds an offline UX and service-worker approval gate only. It documents future copy, stale-client rules, rollback/unregister procedure, and browser validation requirements, but still does not add service-worker runtime behavior or active update UI.

Phase 12 implements that approved runtime and records browser evidence in `docs/phase-12-browser-service-worker-smoke.md`. Do not claim mobile offline readiness until Safari/iOS and Android Chrome are manually validated.

Optional local production preview:

```powershell
npm run preview -- --port 4173
```

Open `http://127.0.0.1:4173/EternalRicochet/` and confirm the menu, canvas, settings panel, and start flow still render.

Then, for service-worker release readiness, use a production preview browser smoke to verify:

- First online load, service-worker registration, and controlled reload.
- App-shell cache contains exactly the hosted root, index, hashed JS/CSS, manifest, and two local icons.
- Valid-cache offline reload renders the app shell.
- Invalid-cache offline navigation fails cleanly, then online reload refills the app-shell cache.
- Waiting updates show the idle prompt, defer while `gameState === "PLAYING"`, and activate only after `Refresh now`.
- Unregister/delete rollback leaves no `eternal-ricochet-*` caches and preserves localStorage values.

## Persistence Notes

All user-facing release preferences are local-only:

- Settings key: `eternalRicochetSettings`
- Meta progression key: `eternalRicochetMeta`
- High score key: `eternalRicochetHighScore`

Storage is intentionally centralized through engine stores. UI components should call those stores instead of writing `localStorage` directly.

## Out Of Scope For This Release Slice

Do not expand Phase 12 release readiness into:

- Firebase, accounts, cloud saves, remote telemetry, analytics, or global leaderboards.
- Backend/provider/API caching, player-data caching, localStorage migration/export, HTTP offline support claims, install prompt UI, push notifications, background sync, or update behavior outside the approved deferred-refresh prompt.
- Capacitor, Cordova, Electron, app-store packaging, or native mobile build tooling.
- WebGL, Pixi, shaders, or large rendering dependency migration.
- New gameplay content, enemies, maps, weapons, upgrades, shop economy changes, or real-money systems.

After Phase 12 closes, active roadmap work stops unless the user explicitly reopens the project. Backend leaderboard work remains an unapproved candidate only.
