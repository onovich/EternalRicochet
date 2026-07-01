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

## Future Cache Naming And Versioning

A later service-worker phase should use explicit versioned cache names. Do not use a single permanent cache name.

Recommended naming shape:

```text
eternal-ricochet-app-v<release>
eternal-ricochet-runtime-v<release>
```

Initial policy:

- `app` cache: app shell HTML, hashed JS/CSS, manifest, and icons.
- `runtime` cache: reserved for future approved runtime fetches only; keep empty until there is an explicit use case.
- Version source: a release/build identifier controlled by the build or release process, not a magic string edited inside gameplay modules.
- Cache keys: deployed URLs under `/EternalRicochet/`.
- Cleanup: during activation, delete old `eternal-ricochet-*` cache names that are not in the current allowlist.

Do not cache localStorage values or score/meta/settings snapshots in these caches.

## Future Install And Activate Expectations

Future `install` behavior:

- Open the current versioned app cache.
- Add the approved build-output asset list.
- Treat missing required app-shell assets as install failure.
- Avoid caching dev-only paths, Vite HMR paths, source maps unless explicitly approved, or cross-origin resources.
- Avoid `skipWaiting()` unless the update UX and stale-client behavior are explicitly designed.

Future `activate` behavior:

- Delete old versioned caches outside the current allowlist.
- Claim clients only if the refresh/update UX has been tested.
- Keep local settings, high score, credits, and upgrades untouched.
- Record activation/update behavior in browser smoke evidence.

Future fetch behavior:

- Hashed JS/CSS/icons can use cache-first by exact URL.
- HTML should prefer network-first or a short-lived strategy so new releases are discoverable.
- Backend, analytics, leaderboard, telemetry, moderation, and provider calls must bypass the cache unless a later phase explicitly approves otherwise.
- Failed network requests must not corrupt local progression.

## Future Update And Stale-Client Plan

Stale cache risk is a release blocker for any future offline-capable phase.

A later implementation should define:

- How the app detects a newly installed worker waiting to activate.
- Whether users see a refresh prompt, automatic reload, or no UI.
- How long old tabs may keep the old worker.
- Whether `skipWaiting()` is safe for this single-screen game.
- How an interrupted update behaves if a player is mid-run.
- How a new release invalidates old hashed assets and removes old cache names.

Suggested conservative default:

- Do not interrupt an active run.
- Surface a simple refresh option only at menu or game-over surfaces.
- Keep local persistence schema independent from service-worker version.

## Future Rollback Shape

Rollback must be designed before a worker ships because old service workers can continue controlling clients after a broken release.

Minimum rollback procedure for a future service-worker phase:

1. Ship a release that removes or disables service-worker registration.
2. Serve a replacement/no-op worker only if needed to reach already controlled clients.
3. In that worker, delete all known `eternal-ricochet-*` cache names during activation.
4. Call `registration.unregister()` from a deliberate rollback path only after user-impact and browser support are verified.
5. Keep the hosted web release playable from network assets under `/EternalRicochet/`.
6. Verify local settings, meta progression, and high score remain intact.
7. Document how long users may need to refresh or close tabs before the rollback takes effect.

Rollback must not delete localStorage progress unless a separate user-approved migration explicitly requires it.

## Future Go/No-Go Gates For Service Worker

Go only if all are true:

- Build-output asset inventory is deterministic.
- Cache naming/versioning is approved.
- Install/activate/fetch/update/rollback behavior is documented.
- Browser smoke covers first load, cached reload, offline reload, update, cleanup, hard refresh, unregister rollback, and hosted-path parity.
- User-facing copy avoids claiming offline support until the browser evidence passes.

No-go if any are true:

- Any external runtime dependency returns.
- Any backend/network feature is introduced without separate consent and cache bypass rules.
- There is no tested rollback path.
- Local persistence can be lost or overwritten by service-worker update behavior.

## Future Service-Worker Validation Matrix

This matrix belongs to a later implementation phase. Phase 10 records it as a go/no-go checklist only.

| Check | Local dev server | Preview server | GitHub Pages hosted | Automation target | Manual/browser evidence |
| --- | --- | --- | --- | --- | --- |
| First network load | Required | Required | Required | Verify HTTP 200 for app shell, manifest, icons, JS, CSS. | Page renders menu and no console errors. |
| Service-worker registration | Later phase only | Later phase only | Later phase only | Verify exactly one intended registration under `/EternalRicochet/`. | Browser Application panel or equivalent confirms scope. |
| Install cache population | Later phase only | Later phase only | Later phase only | Verify expected cache names and candidate URLs. | DevTools cache inspection screenshot or log. |
| Cached reload | Later phase only | Later phase only | Later phase only | Reload after install and verify app shell still renders. | Menu/settings/start flow works after reload. |
| Offline reload | Not reliable with Vite dev HMR | Required | Required | Disable network and reload `/EternalRicochet/`. | App shell loads from cache and clearly communicates offline state if needed. |
| Update vN to vN+1 | Required with two local builds | Required | Required before release | Build two versions, verify new hashed assets are fetched. | Old tab receives designed refresh behavior. |
| Old cache cleanup | Required | Required | Required | Verify old `eternal-ricochet-*` caches are removed after activation. | Cache list shows only current allowlist. |
| Hard refresh | Required | Required | Required | Verify hard refresh does not break registration or asset paths. | Browser still reaches latest hosted release. |
| Unregister rollback | Required | Required | Required before release | Disable registration, unregister, delete caches, reload. | App remains playable from network assets. |
| Hosted path parity | Required | Required | Required | Confirm all cached URLs start with `/EternalRicochet/`. | Custom domain and GitHub Pages project path both work. |
| External asset locality | Required | Required | Required | Reuse `npm run smoke:assets` and `npm run smoke:offline-readiness`. | No unexpected cross-origin requests. |
| Local settings persistence | Required | Required | Required | Set render quality/audio/fullscreen, update worker, verify unchanged. | Settings panel reflects persisted values. |
| Meta/high-score persistence | Required | Required | Required | Earn credits/high score, update worker, verify local storage unchanged. | Game-over and upgrade shop still display expected values. |
| Browser compatibility | Optional | Required | Required | Chromium automated baseline. | Manual Chrome/Edge/Firefox checks; Safari/iOS only when available. |
| No backend caching | Required if backend exists | Required if backend exists | Required if backend exists | Verify provider/API URLs bypass service-worker cache. | Network panel confirms no stale backend responses. |

## Future Automation Split

Automate first:

- Build-output cache candidate inventory.
- Hosted path checks.
- Manifest/icon presence.
- No external runtime URLs.
- No service-worker registration until explicitly approved.
- No Cache API usage until explicitly approved.
- No Workbox/runtime dependency drift.
- Production build no debug hooks.

Require browser/manual evidence after a service worker exists:

- Actual service-worker lifecycle state.
- Offline reload.
- Cache contents.
- Update and stale-client behavior.
- Unregister rollback.
- Browser-specific install/offline behavior.
- iOS/Safari behavior if mobile PWA release is in scope.

## Future Test Fixtures

A later implementation can use these deterministic fixtures:

- Build A: baseline release with `CACHE_VERSION = A`.
- Build B: same app shell with a harmless text/build-id change and `CACHE_VERSION = B`.
- Local served path: `http://127.0.0.1:4173/EternalRicochet/`.
- Preview served path: `npm run preview -- --port 4173`.
- Hosted path: the GitHub Pages project URL or custom domain under `/EternalRicochet/`.

Acceptance must compare Build A and Build B cache state, not just single-version first load.
