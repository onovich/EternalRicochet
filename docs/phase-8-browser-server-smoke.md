# Phase 8 Browser And Server Smoke

Date: 2026-07-01
Scope: local dev server hosted-path parity for manifest-first PWA readiness

## Server

- Command: `C:\Users\Administrator\.codex\skills\project-ops-workflow\scripts\ops\StartDevServer.cmd`
- Result: PASS
- Server PID root: `18072`
- Health URL: `http://127.0.0.1:4173/EternalRicochet/`

## HTTP Fetch Evidence

All checks used `Invoke-WebRequest -UseBasicParsing` against the local dev server.

| URL | Result | Evidence |
| --- | --- | --- |
| `http://127.0.0.1:4173/EternalRicochet/` | PASS | HTTP 200; content contained the app HTML and Vite dev client under `/EternalRicochet/`. |
| `http://127.0.0.1:4173/EternalRicochet/manifest.webmanifest` | PASS | HTTP 200; `Content-Type: application/manifest+json`; content length 745 bytes. |
| `http://127.0.0.1:4173/EternalRicochet/icons/icon.svg` | PASS | HTTP 200; `Content-Type: image/svg+xml`; content length 1832 bytes. |
| `http://127.0.0.1:4173/EternalRicochet/icons/maskable-icon.svg` | PASS | HTTP 200; `Content-Type: image/svg+xml`; content length 1555 bytes. |

## Browser Installability Limitation

No real install prompt was required or asserted in this embedded/local validation lane. Phase 8 verifies manifest link/resource fetchability and production output instead of browser-specific install UI behavior.

## Cleanup

- Command: `C:\Users\Administrator\.codex\skills\project-ops-workflow\scripts\ops\StopDevServer.cmd`
- Result: PASS; stopped the process tree rooted at PID `18072`.

## Boundary

- No service worker registration was added.
- No Cache API, offline fallback, push notification, background sync, backend, analytics, provider SDK, native packaging, runtime dependency, gameplay, or economy change was added.
