# Phase 11 Offline UX And Service Worker Approval Gate

Date checked: 2026-07-01
Status: approval gate only

## Boundary

Eternal Ricochet remains online-only in Phase 11. This phase does not change runtime behavior, does not register a service worker, does not use the Cache API at runtime, and does not claim that the app can load without network access.

The purpose of this document is to make a later service-worker phase decision-ready. Future offline/update behavior may be implemented only after the copy, stale-client rules, rollback procedure, and browser validation matrix below are accepted.

## Official Source Ledger

| Topic | Official URL | Date checked | Used for | Phase 11 decision |
| --- | --- | --- | --- | --- |
| Service Worker API | https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API | 2026-07-01 | Service-worker lifecycle, request interception, update risk, and scope planning. | Do not register a worker until UX, stale-client, and rollback gates are approved. |
| Cache API | https://developer.mozilla.org/en-US/docs/Web/API/Cache | 2026-07-01 | Future request/response cache behavior and explicit cache population. | Require a reviewed cache candidate list before any offline runtime work. |
| CacheStorage | https://developer.mozilla.org/en-US/docs/Web/API/CacheStorage | 2026-07-01 | Named cache access and cleanup planning. | Require versioned `eternal-ricochet-*` cache names plus old-cache cleanup. |
| GitHub Pages custom workflows | https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages | 2026-07-01 | Static artifact deployment and hosted path parity. | Validate `/EternalRicochet/` behavior on both project-page and custom-domain routes before release. |

Project inference: because a service worker can keep serving old app assets after a deploy, update and rollback UX are release blockers, not polish items.

## Future UX State Copy

These strings are documentation for a later implementation phase. They must not appear in active UI until that phase ships and passes browser validation.

| Future state | User-facing copy | Action affordance | Notes |
| --- | --- | --- | --- |
| First visit before cache exists | `Online setup required. Eternal Ricochet will finish loading from the network.` | No offline action. | Only show if a future worker needs to explain the first network load. |
| Cached reload after a future service worker installs | `Ready for faster reloads on this device.` | `OK` | Do not say the game works without network until offline reload validation passes. |
| Offline reload with a valid cache | `Network unavailable. Loaded the saved game shell for this device.` | `Play local run` and `Retry network` | Must keep local score, meta progression, and settings untouched. |
| Offline reload without a valid cache | `Network unavailable and this device does not have a saved game shell yet.` | `Retry` | Do not show a broken canvas or stale partial UI. |
| Update available while idle | `A new version is ready. Refresh when you are ready.` | `Refresh now` and `Later` | Menu, settings, pause, or game-over surfaces only. |
| Update available during an active run | `A new version is ready after this run.` | `Finish run first` | Never interrupt an active run with a reload. |
| Stale client after deploy | `This tab is running an older version. Refresh from the menu when you are ready.` | `Refresh from menu` | Prefer explicit refresh over silent reload. |
| Rollback or unregister recovery | `A compatibility fix is available. Refresh online to repair this installation.` | `Refresh online` | Keep copy calm and avoid suggesting local progress was removed. |

## Stale-Client Rules

- Never interrupt an active run with an automatic reload.
- Surface update prompts only in menu, pause, settings, or game-over states.
- Prefer explicit user refresh over silent reload.
- Keep local score, meta progression, and settings storage independent from cache versions.
- Treat cache version as app-shell state only; it must not migrate or erase localStorage.
- A waiting worker must not call `skipWaiting()` until the active-run UX has been validated.
- A controlled old tab may remain playable until the player exits the run.
- Any future update prompt must have a clear "later" path that keeps the current run intact.

## Future Rollback And Unregister Runbook

Use this runbook only in a later service-worker phase or emergency rollback release.

1. Disable or remove service-worker registration from the app shell.
2. If already controlled clients need cleanup, ship a deliberate cleanup release that can reach them.
3. Unregister active service workers for the `/EternalRicochet/` scope.
4. Delete versioned caches owned by the app, including all approved `eternal-ricochet-*` cache names.
5. Keep old cache-name constants listed in release docs long enough for cleanup releases to remove them.
6. Verify a fresh online load at `/EternalRicochet/` on the GitHub Pages project path.
7. Verify the custom-domain route resolves the same app shell and manifest paths.
8. Confirm local score, credits, upgrades, render quality, audio, and fullscreen preferences remain intact.
9. Record browser evidence before marking rollback complete.

Rollback must never delete localStorage progress unless a separate user-approved data migration requires it.

## Browser Support And Validation Matrix

| Surface | Required before service-worker release | Evidence needed | Phase 11 status |
| --- | --- | --- | --- |
| Chromium desktop | First online load, install, cached reload, offline valid-cache reload, update prompt, stale-client flow, unregister rollback. | Automated smoke plus browser evidence. | Future gate. |
| Firefox desktop | Same user flows as Chromium, with manual cache/update inspection if automation differs. | Browser evidence. | Future gate. |
| Safari desktop if available | First load, cached reload, update prompt, offline reload, rollback. | Manual browser evidence. | Future gate. |
| Android Chrome if available | Install/open from hosted path, reload, offline valid-cache reload, update and rollback. | Real-device or emulator evidence. | Future gate. |
| iOS Safari | Manual future gate for install/open, offline reload, update visibility, and storage preservation. | Real-device evidence before mobile PWA release. | Future gate. |
| GitHub Pages project path | `/EternalRicochet/` first load, asset URLs, manifest, service-worker scope, cache keys, update, rollback. | Hosted smoke and browser evidence. | Future gate. |
| Custom-domain hosted path | Same behavior as project path, including redirects and manifest scope. | Hosted browser evidence. | Future gate. |

## Future Service-Worker Go/No-Go Checklist

Go only if all items are true:

- User-facing copy above is approved by the user/planner.
- Cache candidate inventory is generated from build output and reviewed.
- Versioned cache names and old-cache cleanup rules are approved.
- Install, activate, fetch, update, stale-client, and rollback behavior are documented.
- Active gameplay is protected from forced refresh.
- Local persistence keys remain independent from service-worker versions.
- Browser validation covers Chromium, Firefox, Safari where available, Android Chrome where available, iOS Safari as a manual future gate, and hosted path parity.
- Rollback/unregister recovery has been tested from an already controlled client.
- `npm run validate`, offline readiness smoke, approval-gate smoke, and hosted-path checks pass.

No-go if any item is true:

- The release lacks a tested unregister/rollback path.
- The update flow can reload during an active run.
- The future worker can cache backend, analytics, telemetry, provider SDK, credential, or external URLs without a separate approval.
- Runtime code claims offline capability before offline browser evidence exists.
- Cache cleanup can delete or overwrite local score, meta progression, or settings.
- Service-worker scope does not match the deployed `/EternalRicochet/` path.

## Phase 11 Go/No-Go Recommendation

Go for documentation and approval-gate validation in Phase 11.

No-go for a service-worker implementation in Phase 11. The next implementation phase may start only after this approval gate is accepted and the user/planner explicitly approves adding service-worker runtime code.

## Non-Scope Confirmation

Phase 11 does not add:

- Service-worker files or registration.
- `navigator.serviceWorker` runtime usage.
- Cache API runtime usage.
- Offline fallback pages.
- Precache runtime or generated precache manifests.
- Active update prompt UI.
- Background sync or push notifications.
- Workbox or service-worker tooling.
- Backend, accounts, cloud saves, public leaderboard UI, provider SDKs, analytics, telemetry, credentials, env files, native packaging, or runtime dependencies.
- Gameplay, economy, rendering, audio, or meta-progression behavior changes.
