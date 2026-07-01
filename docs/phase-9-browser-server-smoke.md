# Phase 9 Browser And Server Smoke

Date: 2026-07-01
Status: PASS

## Server

Dev server command:

```powershell
C:\Users\Administrator\.codex\skills\project-ops-workflow\scripts\ops\StartDevServer.cmd
```

Started PID: `4044`

Stopped with:

```powershell
C:\Users\Administrator\.codex\skills\project-ops-workflow\scripts\ops\StopDevServer.cmd
```

## HTTP Fetches

| URL | Result |
| --- | --- |
| `http://127.0.0.1:4173/EternalRicochet/` | HTTP 200, `text/html` |
| `http://127.0.0.1:4173/EternalRicochet/manifest.webmanifest` | HTTP 200, `application/manifest+json` |
| `http://127.0.0.1:4173/EternalRicochet/icons/icon.svg` | HTTP 200, `image/svg+xml` |
| `http://127.0.0.1:4173/EternalRicochet/icons/maskable-icon.svg` | HTTP 200, `image/svg+xml` |

## Desktop Browser Smoke

Target: `http://127.0.0.1:4173/EternalRicochet/`

Viewport: `1280x720`

Observed:

- Page title: `无尽回弹 / ETERNAL RICOCHET`.
- Main menu visible and centered: `672x601` at `left 304`, `top 60`.
- Canvas fills viewport: CSS rect `1280x720`, backing size `1280x720`.
- Primary buttons visible: `开始连接 (START)`, `UPGRADES`, `SETTINGS`.
- No Tailwind CDN script tag present.
- No Google Fonts link tag present.
- No browser console errors.

## Settings Panel Smoke

Observed:

- Settings panel visible: `672x266`, `top 227`.
- Quality controls rendered for `HIGH`, `MED`, `LOW`.
- Clicking `LOW` set `aria-pressed="true"`, added `border-cyan-300 bg-cyan-700/50 text-white`, and displayed `QUALITY SAVED`.
- Audio toggle rendered.
- Fullscreen preference button rendered.
- No browser console errors.

## Upgrade Shop Smoke

Observed:

- Upgrade panel visible: `768x234`, `top 243`.
- Credit balance rendered.
- Upgrade list rendered 3 rows.
- No browser console errors.

## Start Flow Smoke

After reload to the main menu and clicking `START`:

- Before start: `ui-layer` display `flex`, `main-menu` display `block`, other panels hidden.
- After start: `ui-layer` display `none`, HUD display `flex`, `main-menu` display `none`.
- Health rendered as three hearts.
- Ammo display rendered `1`.
- Score rendered `0`.
- Canvas CSS rect `1280x720`, backing size `1280x720`.
- No browser console errors.

## Mobile Viewport Smoke

Temporary viewport override: `390x844`, reset after smoke.

Observed:

- Main menu display `block`.
- UI layer display `flex`, `overflow-y: auto`.
- Menu rect: `322x796`, `top 24`, `bottom 820`.
- Menu scrollable: `true`; client height `792`, scroll height `825`.
- Start, upgrades, and settings buttons visible.
- External resource list: empty.
- No browser console errors.

## Notes

- The browser sandbox did not expose `canvas.getContext` through page evaluation, so the canvas check used DOM state, CSS/backing dimensions, start-flow visibility, and console-error evidence.
- Browser smoke did not claim offline behavior, service-worker caching, install prompt behavior, or native packaging readiness.
