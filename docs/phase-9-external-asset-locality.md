# Phase 9 External Asset Locality

Date checked: 2026-07-01

## Goal

Phase 9 removes runtime external render assets from the app shell while preserving the Phase 1-8 playable app, manifest-first PWA readiness, and the hosted `/EternalRicochet/` path.

This phase does not add service workers, offline caching, install prompts, backend calls, analytics, provider SDKs, native packaging, gameplay content, or economy changes.

## Runtime External URL Inventory

| Location | URL or source | Current role | Phase 9 decision |
| --- | --- | --- | --- |
| `index.html` | `https://cdn.tailwindcss.com` | Runtime Tailwind compiler and utility CSS provider. | Remove. Replace the utility classes used by the current shell with committed local CSS in `src/styles.css`; do not add a runtime or build-time Tailwind dependency. |
| `index.html` | `https://fonts.googleapis.com/css2?family=Orbitron...Noto+Sans+SC...` | Runtime Google Fonts stylesheet. | Remove. Use local/system font stacks. Do not vendor font files in this phase unless a licensed local source is explicitly approved. |
| Indirect via Google Fonts CSS | `https://fonts.gstatic.com/...` | Runtime font binary fetch caused by the Google Fonts stylesheet. | Removed by deleting the Google Fonts stylesheet. Add smoke coverage so this cannot return unnoticed. |
| `public/manifest.webmanifest` and icon links | `/EternalRicochet/icons/...` | Local install metadata and icons. | Keep local. Preserve absolute hosted-path assumptions from Phase 8. |
| `scripts/start-local.mjs` | `http://127.0.0.1:{port}/EternalRicochet/` | Local development helper URL. | Keep. It is not an app-shell runtime dependency and is outside the external asset guard. |
| `public/icons/*.svg` | `http://www.w3.org/2000/svg` namespace | SVG namespace identifier. | Keep. It is not a network fetch. |
| `package-lock.json` | npm registry metadata URLs | Install metadata. | Keep. They are not runtime app-shell URLs and validation should not scan lockfile metadata for this guard. |
| Existing docs | Official or planning URLs | Documentation evidence. | Keep. Phase 9 guards target app runtime source and production output, not source citations. |

At inventory time, production `dist/` inherited the Tailwind and Google Fonts references after `npm run build`. Final Phase 9 validation now scans built output after those references are removed.

## Tailwind Replacement Strategy

The current app uses Tailwind-style utility class names in `index.html` plus a small number of dynamic classes in:

- `src/view/components/upgradeShop.js`
- `src/view/components/settingsPanel.js`
- `src/logic/engine/hud.js`

Phase 9 will keep the existing DOM and class names stable, then implement a local compatibility subset in `src/styles.css`. This avoids HTML churn and limits risk to visual styling.

The local subset must cover:

- Layout: `absolute`, `relative`, `inset-0`, `top-0`, `left-0`, `z-*`, `w-*`, `h-*`, `max-w-*`, `flex`, `grid`, responsive `sm:`/`md:` grid and type utilities.
- Spacing: `p-*`, `px-*`, `py-*`, `mt-*`, `mb-*`, `mr-*`, `gap-*`, `space-y-*`, `pt-*`.
- Typography: sizes, weights, alignment, tracking, uppercase, transparent clipped gradient text, `font-cyber`, and neon helper classes.
- Color and effects: text, background, border, opacity, gradient, shadow, backdrop blur, transition, transform, hover, and disabled states used by menus, settings, upgrades, HUD, and game-over panels.
- Dynamic state classes: `border-cyan-300`, `bg-cyan-700/50`, `cursor-not-allowed`, `text-gray-500`, `text-gray-700`, and buy-button hover styles.

No new runtime dependency or large rendering dependency is planned.

## Font Locality Strategy

The app will remove the Google Fonts stylesheet and use local/system fallback stacks. The cyber display face will become an approximation based on locally available fonts. This is a deliberate tradeoff for release locality: no external font fetch, no added binary font licensing surface, and no new dependency.

Expected CSS direction:

- Body/UI: prefer common Simplified Chinese and platform UI fonts, then generic sans-serif.
- Cyber labels: prefer locally installed geometric/display-ish fonts when available, then platform UI fonts, then generic sans-serif.

## Smoke Guard Strategy

Add validation that fails when runtime app-shell source or production output contains unapproved external URLs.

Guarded files should include:

- `index.html`
- `src/**/*.js`
- `src/**/*.css`
- `public/manifest.webmanifest`
- `public/icons/*.svg`
- `dist/index.html`
- `dist/assets/**/*.js`
- `dist/assets/**/*.css`

The guard should treat `http://www.w3.org/2000/svg` as an SVG namespace, not a network dependency, and should not scan docs, lockfiles, or local development helper URLs as app-shell runtime dependencies.

The guard must fail for:

- `https://cdn.tailwindcss.com`
- `https://fonts.googleapis.com`
- `https://fonts.gstatic.com`
- Any other unapproved `http://` or `https://` runtime app-shell URL in the guarded source or built app.

## Browser Smoke Targets

After local CSS replaces the CDN and font link, browser/server smoke should verify:

- Main menu renders with title, description, and three primary buttons.
- Settings panel opens, quality selection updates visual state, and close returns to the prior panel.
- Upgrade shop opens and shows credits plus three upgrade rows.
- Start flow hides the menu, shows HUD, and renders the canvas.
- Mobile viewport keeps the menu scrollable and safe-area padding intact.
- Manifest and icon paths remain under `/EternalRicochet/`.

## Final Status

Runtime behavior is local-first for app-shell render assets:

- Tailwind CDN script removed from `index.html`.
- Google Fonts stylesheet removed from `index.html`.
- Local utility CSS subset added to `src/styles.css`.
- CSS font stacks use local/system fallbacks with no runtime font fetch.
- `npm run smoke:assets` is included in `npm run validate` and scans guarded source plus production output for unapproved external runtime URLs.
- Browser/server smoke evidence is recorded in `docs/phase-9-browser-server-smoke.md`.
