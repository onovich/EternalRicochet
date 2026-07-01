# Phase 10 Offline Cache Strategy

Date checked: 2026-07-01
Status: strategy and dry-run planning only

## Boundary

Phase 10 prepares a future offline-capable PWA phase without shipping offline runtime behavior.

Phase 10 must not add:

- Service-worker files.
- Service-worker registration.
- Cache API runtime usage.
- Offline fallback pages.
- Precache runtime.
- Update prompt UI.
- Background sync or push notifications.
- Workbox or service-worker tooling.
- Backend, analytics, provider SDK, native packaging, runtime dependencies, gameplay changes, or economy changes.

The app remains a static Vite build deployed through GitHub Pages under `/EternalRicochet/`.

## Official Source Ledger

| Topic | Official URL | Date Checked | Used For | Phase 10 Decision |
| --- | --- | --- | --- | --- |
| Service Worker API | https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API | 2026-07-01 | Service-worker lifecycle, request interception, secure-context expectations, and offline risk framing. | Do not register a worker in Phase 10; plan lifecycle and rollback first. |
| Cache API | https://developer.mozilla.org/en-US/docs/Web/API/Cache | 2026-07-01 | Cache object behavior and explicit request/response storage responsibilities. | Future implementation must explicitly decide what to put into cache and when to update/delete it. |
| CacheStorage | https://developer.mozilla.org/en-US/docs/Web/API/CacheStorage | 2026-07-01 | Named cache storage, cache lookup/open/delete planning. | Future implementation must use versioned cache names and cleanup old versions during activation. |
| GitHub Pages custom workflows | https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages | 2026-07-01 | Current static deployment and `dist` artifact publishing path. | Preserve `.github/workflows/deploy.yml`; future service-worker scope must match the deployed `/EternalRicochet/` artifact. |

Project inference: service-worker caching changes the browser request path and can keep stale assets alive after deployment. Therefore, a later implementation phase needs versioning, cache cleanup, update/rollback validation, and hosted-path checks before any service worker is registered.

## Current Build Output Inventory

Command checked:

```powershell
npm run build
```

Current `dist/` output:

| Path | Size | Category | Future cache-candidate decision |
| --- | ---: | --- | --- |
| `dist/index.html` | 11638 bytes | App shell HTML | Candidate, but should use network-first or short-lived handling in a future worker so new releases are discoverable. |
| `dist/assets/index-B20IWOJL.css` | 9677 bytes | Hashed CSS bundle | Strong candidate for cache-first because filename is content-hashed. |
| `dist/assets/index-Dqe4F2dE.js` | 43657 bytes | Hashed JavaScript bundle | Strong candidate for cache-first because filename is content-hashed. |
| `dist/manifest.webmanifest` | 745 bytes | Web app manifest | Candidate; must stay under `/EternalRicochet/`. |
| `dist/icons/icon.svg` | 1832 bytes | Local icon | Candidate; local static asset. |
| `dist/icons/maskable-icon.svg` | 1555 bytes | Local maskable icon | Candidate; local static asset. |

The hashed JS/CSS names are build artifacts and must not be hard-coded in runtime source. A future service worker should derive its precache list from generated build output or a controlled manifest in its implementation phase.

## Candidate Cache Categories

| Category | Examples | Future policy candidate | Why |
| --- | --- | --- | --- |
| App shell HTML | `/EternalRicochet/`, `/EternalRicochet/index.html` | Network-first with cached fallback, or short max-age cache in a future worker. | HTML changes on release and must not trap stale UI forever. |
| Hashed JS/CSS | `/EternalRicochet/assets/index-*.js`, `/EternalRicochet/assets/index-*.css` | Cache-first by exact URL after install. | Vite hashes make changed content receive a new URL. |
| Manifest | `/EternalRicochet/manifest.webmanifest` | Cache with update awareness. | Install metadata is local and small, but stale metadata can confuse installs. |
| Icons | `/EternalRicochet/icons/icon.svg`, `/EternalRicochet/icons/maskable-icon.svg` | Cache-first with versioned cleanup. | Local static assets needed for install metadata. |
| Local static assets | Future approved local images/audio/assets under `/EternalRicochet/` | Cache only after explicit inventory. | Avoid accidental caching of debug or transient files. |

## Must Not Be Cached Yet

Do not cache these in any future plan without a separate approval:

- Future backend data, leaderboard reads, or score submissions.
- Analytics, telemetry, crash reporting, moderation endpoints, or provider SDK calls.
- External resources or cross-origin URLs.
- Credentials, API keys, service-account files, environment files, or admin/moderation secrets.
- Dev endpoints such as `http://127.0.0.1:*`, Vite HMR, `@vite/client`, or source maps intended only for development.
- LocalStorage snapshots, including settings, credits/upgrades, or high score blobs.
- Generated `dist/` directories in git.
- Browser caches outside a named/versioned app cache controlled by a future service worker.

## Hosted Path Assumptions

- Vite `base` is `/EternalRicochet/`.
- `index.html` links the manifest at `/EternalRicochet/manifest.webmanifest`.
- The manifest `id`, `start_url`, and `scope` are `/EternalRicochet/`.
- GitHub Pages publishes the `dist` artifact from `.github/workflows/deploy.yml`.

Future offline validation must test the deployed path, not only root-relative local paths.

## Dry-Run Validation Plan

Phase 10 will add a dry-run script that runs after `npm run build` and inspects `dist/` without committing it.

The dry-run must fail when:

- `dist/` is missing.
- `dist/index.html` is missing.
- No hashed JS or CSS bundle exists under `dist/assets/`.
- Manifest or icons are missing from `dist/`.
- Built asset references do not use `/EternalRicochet/`.
- Unapproved external runtime URLs appear.
- Service-worker files appear.
- Service-worker registration appears in source or production output.
- Cache API runtime usage appears in source or production output.
- Workbox or other service-worker tooling appears.
- Offline support claims appear before the service-worker phase is approved.

The dry-run must pass without modifying gameplay, deployment workflow, runtime dependencies, or generated output tracking.

## Current Go/No-Go

Go for Phase 10 dry-run tooling and documentation.

No-go for service-worker implementation until all of these are approved in a later phase:

- Cache naming/versioning.
- Install/activate/update behavior.
- Old cache cleanup.
- Stale client refresh behavior.
- Rollback/unregister procedure.
- Browser and hosted GitHub Pages validation matrix.
- User-facing offline/update copy.

