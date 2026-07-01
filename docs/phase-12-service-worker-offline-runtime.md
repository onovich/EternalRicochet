# Phase 12 Service Worker Offline Runtime

Date checked: 2026-07-01
Status: implementation design for the first service-worker runtime slice

## Boundary

Phase 12 is the first phase allowed to add service-worker runtime code. The implementation remains app-shell-only: it may cache the built static shell, hashed CSS/JS, manifest, and local icons, but it must not cache player data, localStorage snapshots, backend/provider/API responses, analytics/telemetry calls, credentials, or cross-origin assets.

The Vite production build output is the source of truth for every precached URL. Generated `dist/` output remains untracked.

## Official Source Ledger

| Topic | Official URL | Date checked | Used for | Phase 12 decision |
| --- | --- | --- | --- | --- |
| Service Worker API | https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API | 2026-07-01 | Secure-context registration, service-worker lifecycle, request interception, update behavior. | Register only in production and only in secure/trusted contexts; defer `skipWaiting` until user action. |
| Cache API | https://developer.mozilla.org/en-US/docs/Web/API/Cache | 2026-07-01 | Explicit request/response cache storage behavior. | Precache only reviewed app-shell URLs and use cache-first only for exact precache hits. |
| CacheStorage | https://developer.mozilla.org/en-US/docs/Web/API/CacheStorage | 2026-07-01 | Named cache open/keys/delete cleanup. | Use a versioned app-shell cache and delete older `eternal-ricochet-*` caches during activation. |
| GitHub Pages custom workflows | https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages | 2026-07-01 | Static artifact deployment through the generated `dist/` directory. | Run service-worker generation after Vite build so Pages uploads `dist/service-worker.js`. |

## Build And Generation

`npm run build` should run:

```powershell
vite build
node scripts/generate-service-worker.mjs
```

The generator must:

- Inspect `dist/index.html`, `dist/assets/`, `dist/manifest.webmanifest`, and `dist/icons/`.
- Require at least one hashed JavaScript bundle and one hashed CSS bundle.
- Generate `dist/service-worker.js` with the current hashed bundle names.
- Use a deterministic version token derived from the current app-shell file names and content metadata.
- Use a cache name shaped like `eternal-ricochet-app-shell-v<token>`.
- Write only same-origin URLs under `/EternalRicochet/`.
- Avoid dev paths, source maps, external URLs, backend/API/provider paths, analytics/telemetry paths, credentials, and localStorage values.

Initial precache candidates:

| Category | URL |
| --- | --- |
| App root | `/EternalRicochet/` |
| App HTML | `/EternalRicochet/index.html` |
| Hashed JS | `/EternalRicochet/assets/index-*.js` |
| Hashed CSS | `/EternalRicochet/assets/index-*.css` |
| Manifest | `/EternalRicochet/manifest.webmanifest` |
| Icon | `/EternalRicochet/icons/icon.svg` |
| Maskable icon | `/EternalRicochet/icons/maskable-icon.svg` |

## Service Worker Runtime

The generated service worker should include:

- `install`: open the current app-shell cache and `addAll` the generated precache URLs. Do not call `skipWaiting` by default.
- `activate`: delete old `eternal-ricochet-*` caches that are not in the current allowlist, then claim clients.
- `message`: accept `SKIP_WAITING` only when a controlled page sends it after explicit user action.
- `fetch`:
  - ignore non-GET requests.
  - ignore cross-origin requests.
  - ignore paths outside `/EternalRicochet/`.
  - ignore backend/provider/API-looking paths, analytics/telemetry-looking paths, credentials, admin/moderation, and auth paths.
  - serve exact precached app-shell assets cache-first.
  - serve same-origin navigations under `/EternalRicochet/` network-first with cached app shell fallback.
  - otherwise use network only.

## Client Registration

`src/logic/offline/serviceWorkerClient.js` should stay thin and separate from cache logic.

Registration rules:

- Call from `src/main.js` after `createGameRuntime` exists.
- Register only when `import.meta.env.PROD` is true.
- Require `"serviceWorker" in navigator`.
- Require `window.isSecureContext === true`, with localhost/127.0.0.1 treated as trusted preview contexts by the browser.
- Register `/EternalRicochet/service-worker.js` with scope `/EternalRicochet/`.
- Fail quietly in unsupported or insecure contexts and never block gameplay startup.
- Do not expose dev debug globals in production.

The client may expose a small status controller to tests and UI code, but it must not own gameplay, settings, leaderboard, or persistence state.

## Update And Deferred-Refresh UX

Use the Phase 11 copy as the source of truth.

Minimum active UI:

- Idle/menu update available: `A new version is ready. Refresh when you are ready.`
- Active-run update available: `A new version is ready after this run.`
- Actions: `Refresh now` and `Later`.

Rules:

- Never auto-reload while `gameState === "PLAYING"`.
- If a worker is waiting during `PLAYING`, record a deferred update and surface the prompt only after the game returns to menu, settings, or game-over state.
- `Refresh now` posts `SKIP_WAITING` to the waiting worker and reloads only after `controllerchange`.
- `Later` dismisses the prompt for the current page session.
- Prompt UI should be a small overlay/status panel outside the canvas and should not block menu/settings/game-over controls.

## Persistence And Data Boundaries

The service worker must not read, write, cache, migrate, export, or delete:

- `eternalRicochetSettings`
- `eternalRicochetMeta`
- `eternalRicochetHighScore`
- leaderboard consent/copy fixtures
- any future backend/provider/user data

Browser smokes must verify these localStorage keys survive install, update, offline reload, and unregister cleanup.

## Rollback And Unregister

The future rollback path is:

1. Disable or remove registration in a follow-up release.
2. Let already controlled clients receive a cleanup-capable worker if needed.
3. Unregister the active service-worker registration for `/EternalRicochet/`.
4. Delete all `eternal-ricochet-*` caches.
5. Reload `/EternalRicochet/` online and confirm the app shell renders from network assets.
6. Confirm settings, high score, credits, and upgrades remain in localStorage.

Phase 12 validation must include a rollback/unregister smoke using the production preview server.

## Hosted Evidence Gate

Local preview can prove service-worker mechanics, but hosted release readiness also needs HTTPS evidence.

Hosted checks must record:

- `https://blog.onovich.com/EternalRicochet/` HTTP status and whether the context is secure.
- `http://blog.onovich.com/EternalRicochet/` behavior, especially whether it redirects to HTTPS.
- `https://onovich.github.io/EternalRicochet/` behavior and whether it redirects to the custom domain.
- Whether `service-worker.js` is available under the hosted `/EternalRicochet/` path after deployment.

If HTTPS hosted evidence is unavailable or partial, Phase 12 must not claim hosted offline release readiness.

## Validation Plan

Required deterministic commands:

- `git diff --check`
- `npm run build`
- `npm run smoke:service-worker`
- `npm run smoke:offline-readiness`
- `npm run smoke:offline-gate`
- `npm run validate`
- `C:\Users\Administrator\.codex\skills\project-ops-workflow\scripts\ops\Validate.cmd`

Required browser evidence:

- first online load
- service-worker registration
- controlled reload
- cache presence
- cached reload
- valid-cache offline reload
- invalid-cache recovery
- update waiting/deferred refresh
- rollback/unregister cleanup
- localStorage preservation

## Limitations

- No Workbox or service-worker tooling dependency.
- No runtime dependency.
- No push notifications or background sync.
- No backend/provider/API caching.
- No gameplay, economy, rendering, audio, meta-progression, leaderboard contract, or settings feature changes beyond the offline status prompt.
- Safari/iOS and Android Chrome evidence remain future manual release gates unless available during Phase 12 validation.
