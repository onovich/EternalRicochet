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
- `npm run smoke:release`

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
npm run smoke:release
```

The release smoke verifies:

- `dist/index.html` references bundled assets under `/EternalRicochet/`.
- `dist/index.html` does not reference `/src/main.js`.
- The production JavaScript bundle does not expose `eternal-ricochet-debug-state`.
- The production JavaScript bundle does not expose `__ETERNAL_RICOCHET_DEV__`.

Optional local production preview:

```powershell
npm run preview -- --port 4173
```

Open `http://127.0.0.1:4173/EternalRicochet/` and confirm the menu, canvas, settings panel, and start flow still render.

## Persistence Notes

All user-facing release preferences are local-only:

- Settings key: `eternalRicochetSettings`
- Meta progression key: `eternalRicochetMeta`
- High score key: `eternalRicochetHighScore`

Storage is intentionally centralized through engine stores. UI components should call those stores instead of writing `localStorage` directly.

## Out Of Scope For This Release Slice

Do not include these in the Phase 5 release readiness slice:

- Firebase, accounts, cloud saves, remote telemetry, analytics, or global leaderboards.
- PWA service-worker caching or offline update behavior.
- Capacitor, Cordova, Electron, app-store packaging, or native mobile build tooling.
- WebGL, Pixi, shaders, or large rendering dependency migration.
- New gameplay content, enemies, maps, weapons, upgrades, shop economy changes, or real-money systems.

Future social/platform work should be planned as a separate phase with its own persistence, privacy, moderation, and deployment checks.
