# Phase 12 Browser Service Worker Smoke

Date checked: 2026-07-01
Scope: local production-preview service-worker runtime plus hosted path evidence

## Environment

- Local build commit under test: `4ee6b20`
- Local preview URL: `http://127.0.0.1:4174/EternalRicochet/`
- Browser: system Chrome launched by Playwright in a temporary browser profile with service workers enabled.
- In-app browser note: the in-app browser probe could open the app, but its evaluated context did not expose the normal `navigator`/`navigator.serviceWorker`/`caches` globals needed for service-worker inspection. The service-worker evidence below therefore uses the standalone Chrome smoke.

## Local Production Preview Evidence

| Scenario | Result | Evidence |
| --- | --- | --- |
| First online load and controlled reload | PASS | `window.isSecureContext === true` on `127.0.0.1`; registration scope was `http://127.0.0.1:4174/EternalRicochet/`; active worker state was `activated`; the reloaded page had a controller. |
| App-shell cache presence | PASS | Cache `eternal-ricochet-app-shell-v3c22fd336ab3` existed with 7 entries: `/EternalRicochet/`, `/EternalRicochet/index.html`, `/EternalRicochet/assets/index-B3z5pkSf.js`, `/EternalRicochet/assets/index-BZJejE9v.css`, `/EternalRicochet/manifest.webmanifest`, `/EternalRicochet/icons/icon.svg`, `/EternalRicochet/icons/maskable-icon.svg`. |
| Persistence during install/reload | PASS | `eternalRicochetSettings`, `eternalRicochetMeta`, and `eternalRicochetHighScore` survived registration and reload. Test values were quality `low`, muted audio, 77 credits, upgrades `1/1/1`, and high score `4321`. |
| Cached reload while online | PASS | Repeated reloads stayed controlled and retained the same app-shell cache entries. |
| Waiting update prompt while idle | PASS | A synthetic next-version worker reached `installed`/waiting; the page showed `A new version is ready. Refresh when you are ready.` with `Refresh now` and `Later`. |
| Explicit refresh update | PASS | Clicking `Refresh now` sent `SKIP_WAITING`, activated the waiting worker, removed the old app-shell cache, and preserved localStorage values. |
| Deferred update during active play | PASS | While the HUD was visible and the menu was hidden, the waiting update prompt stayed hidden and the deferred text was `A new version is ready after this run.` |
| Valid-cache offline reload | PASS | With the browser context offline and the app-shell cache intact, reloading `/EternalRicochet/` rendered the menu, remained controlled, and preserved the 7 cached app-shell URLs plus localStorage values. |
| Invalid-cache offline reload | PASS | After deleting app-shell caches while offline, navigation failed with `net::ERR_FAILED`, which is the expected no-cache failure mode. |
| Online recovery after invalid cache | PASS | Returning online after the invalid-cache failure rendered the app and refilled the app-shell cache with all 7 expected URLs. |
| Rollback/unregister cleanup | PASS | Unregistering the `/EternalRicochet/` service-worker registration and deleting `eternal-ricochet-*` caches left `0` registrations and `[]` app caches; localStorage values remained. |
| Online reload after unregister cleanup | PASS | The app rendered from network assets after unregister cleanup. As expected for a first page after unregister, it was not yet controlled at the measurement point. |

Console note: two `Failed to load resource: net::ERR_FAILED` entries occurred during the intentional invalid-cache offline navigation. No unrelated page console errors were observed.

## Hosted Path Evidence

| URL | Result | Evidence |
| --- | --- | --- |
| `https://blog.onovich.com/EternalRicochet/` | PASS | `curl.exe -I --max-time 20` returned `HTTP/1.1 200 OK`, `Server: GitHub.com`, `Content-Type: text/html`, and `Content-Length: 11582`. This is a secure HTTPS app-shell URL. |
| `https://blog.onovich.com/EternalRicochet/service-worker.js` | PASS | `curl.exe -I --max-time 20` returned `HTTP/1.1 200 OK`, `Content-Type: application/javascript`, and `Content-Length: 3024`. Downloaded content included `CACHE_NAME`, `PRECACHE_URLS`, `/EternalRicochet/assets/index-B3z5pkSf.js`, `/EternalRicochet/assets/index-BZJejE9v.css`, `/EternalRicochet/manifest.webmanifest`, `SKIP_WAITING`, and `precacheAppShell`. |
| `http://blog.onovich.com/EternalRicochet/` | RISK | `curl.exe -I --max-time 20` returned `HTTP/1.1 200 OK` rather than redirecting to HTTPS. Service-worker release links should use the HTTPS URL only; the runtime secure-context guard prevents registration on insecure HTTP contexts. |
| `https://onovich.github.io/EternalRicochet/` | PARTIAL | `curl.exe -I --max-time 20` failed in this environment with `curl: (35) Recv failure: Connection was reset`. This URL is not counted as hosted offline evidence for Phase 12. |

## Go/No-Go

Recommendation: GO for the Phase 12 app-shell-only service-worker runtime on the HTTPS custom-domain path after final validation passes.

Remaining release gates:

- Do not advertise offline readiness on the HTTP custom-domain URL unless hosting is changed to force HTTPS.
- Do not claim mobile Safari or Android Chrome offline release readiness until those browser families are manually validated.
- Treat `https://onovich.github.io/EternalRicochet/` as unvalidated in this environment because the connection reset during hosted smoke.
- Keep the post-Phase 12 project freeze: do not plan or start Phase 13 unless the user explicitly reopens the project.
