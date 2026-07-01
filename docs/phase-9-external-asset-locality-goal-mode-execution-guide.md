# Phase 9 - External Asset Locality Slice Goal Mode Execution Guide

Date: 2026-07-01
Status: execution guide for the executor
Planner thread: 019f1952-5d38-7941-b681-7ff06c097a8d
Executor thread: 019f1cd9-0ad1-7833-b73b-0831805c494f
Round budget: 14 rounds, with rounds 1-10 for asset inventory, local styling/font work, and smoke guards, rounds 11-13 for buffer fixes, and round 14 for final validation.

## 0. Direct Goal Prompt For The Executor

You are the Eternal Ricochet implementation executor. Use `$donextgoal` to execute this guide.

Goal: after Phase 8 accepted manifest-first PWA readiness, remove the remaining runtime dependency on external render assets so the web release is closer to future offline readiness. The current app still loads Tailwind from `https://cdn.tailwindcss.com` and fonts from `https://fonts.googleapis.com`. This phase should replace those runtime CDN dependencies with local source/build assets or an explicit local fallback, add smoke guards that fail on unexpected external runtime URLs, and document the final asset boundary.

This phase is a local asset/readiness slice only. It must not add service workers, Cache API usage, offline fallback behavior, offline claims, backend/network calls, public leaderboard UI, analytics/telemetry, native packaging, or gameplay/economy changes.

Each round must read this guide and relevant project docs first, run validation for touched files, commit and push after validation passes, and stop if validation, commit, or push fails.

## 1. Required Reading

- `README.md`
- `origin/design.md`
- `docs/phase-8-planner-check-report.md`
- `docs/phase-8-validation-report.md`
- `docs/phase-8-browser-server-smoke.md`
- `docs/phase-8-pwa-manifest-plan.md`
- `docs/phase-8-pwa-manifest-readiness-goal-mode-execution-guide.md`
- `docs/phase-6-platform-social-decision-dossier.md`
- `docs/release-readiness-checklist.md`
- `index.html`
- `src/styles.css`
- `src/main.js`
- `scripts/smoke-pwa.mjs`
- `scripts/smoke-release-gates.mjs`
- `package.json`
- `.github/workflows/deploy.yml`
- `.codex/project-ops-workflow.md`
- `.codex/project-git-workflow.md`

Current accepted facts:

- Phase 8 added manifest-first PWA readiness and explicitly deferred service-worker/offline behavior.
- Current remaining runtime external assets are Tailwind CDN and Google Fonts in `index.html`.
- Future offline/cache work must not begin until external runtime asset locality and cache strategy are deliberately addressed.

Planner decisions for this phase:

- External runtime render assets should be removed before any service-worker/offline phase.
- Prefer a no-runtime-dependency solution.
- Tailwind CDN should be replaced by local CSS or build-time assets. Do not keep `https://cdn.tailwindcss.com`.
- Google Fonts should either be removed in favor of local/system fallbacks or vendored locally with documented source/license. Do not keep `https://fonts.googleapis.com` or runtime `fonts.gstatic.com` fetches.
- If vendoring font files, record the source and license in docs and keep file size reasonable. If that becomes risky or unclear, use local/system font fallbacks instead.

## 2. Scope

1. External asset inventory:
   - Create `docs/phase-9-external-asset-locality.md`.
   - List every runtime external URL in `index.html`, source, public assets, manifest, scripts, and production `dist` after build.
   - Identify whether each is removed, localized, or intentionally retained. The target for this phase is no runtime external render asset URLs in the app shell.

2. Tailwind CDN exit:
   - Remove the Tailwind CDN script from `index.html`.
   - Preserve the current UI layout and behavior.
   - Prefer implementing the used utility styles locally in `src/styles.css` or another committed stylesheet.
   - If a build-time CSS tool is clearly smaller and safer, it may be added as a dev-only dependency, but no runtime dependency may be added. Document the reason.
   - Validate desktop and mobile layouts after the change.

3. Font locality:
   - Remove the Google Fonts runtime link from `index.html`.
   - Preserve a readable arcade visual hierarchy using local assets or robust system fallbacks.
   - If local font files are added, commit them under `public/fonts/` or another clear local asset folder and document source/license.
   - If local font files are not added, update CSS font stacks to use system-safe fallbacks and document the visual tradeoff.

4. Smoke and release guards:
   - Add or extend smoke coverage so `npm run validate` fails if app-shell runtime external URLs return without explicit allowlist approval.
   - Guard at least source `index.html`, `public/manifest.webmanifest`, committed CSS, production `dist/index.html`, and generated production assets where feasible.
   - Keep existing PWA, release, logic, and build smoke passing.

5. Browser/server smoke:
   - Start the local dev server when needed and verify the app still loads at `/EternalRicochet/`.
   - Check menu, canvas, settings, start flow, and a narrow mobile viewport if styling changed substantially.
   - Verify manifest and icons remain fetchable.
   - Verify browser console errors are absent if using the in-app browser.

6. Documentation:
   - Update `docs/release-readiness-checklist.md` with external asset locality checks.
   - Add `docs/phase-9-validation-report.md` in the final round.
   - Update README status after final validation passes.
   - State clearly that offline/service-worker caching remains future scope even after external asset locality improves.

## 3. Non-Scope

- Do not add service workers, service-worker registration, Cache API usage, offline fallback, precache manifests, update prompts, background sync, push notifications, install prompt UI, or offline claims.
- Do not implement Firebase, Supabase, Cloudflare, custom backend, accounts, cloud saves, public leaderboard UI, analytics, telemetry, runtime network submission, or provider SDKs.
- Do not change leaderboard contract behavior except for release smoke coexistence if needed.
- Do not add Capacitor, Cordova, Electron, native projects, app ids, signing material, store metadata, or native packaging workflows.
- Do not add runtime dependencies.
- Do not change core gameplay, physics, enemy balance, economy, upgrade pricing, renderer architecture, manifest hosted-path semantics, or GitHub Pages deployment workflow.
- Do not commit `dist/`, `node_modules/`, screenshots, temporary browser artifacts, local PID files, or unrelated user changes.

## 4. Per-Round Fixed Workflow

Every round reply must include:

- Round goal
- Completed changes
- Debug self-check
- Architecture self-check
- Validation commands and results
- Commit hash and push result
- Next round goal
- Whether a buffer round was consumed

Progression rules:

- Validation failed: do not commit, do not push, do not proceed.
- Validation passed but commit failed: do not proceed.
- Commit passed but push failed: do not proceed.
- Push passed: record commit hash and remote branch, then proceed.

## 5. Commit And Push Workflow

Prefer the project wrappers:

```powershell
C:\Users\Administrator\.codex\skills\project-git-workflow\scripts\git\Status.cmd
C:\Users\Administrator\.codex\skills\project-git-workflow\scripts\git\CommitAndPush.cmd -Message "<message>" -Paths <phase-relevant-files>
```

For implementation rounds, at minimum run:

```powershell
npm run check:src
npm run smoke:logic
npm run build
npm run smoke:release
npm run smoke:pwa
git diff --check
```

For final validation also run:

```powershell
npm run validate
C:\Users\Administrator\.codex\skills\project-ops-workflow\scripts\ops\Validate.cmd
git status --short --branch
```

Do not stage unrelated files.

## 6. Round Plan

### Round 1: Inventory And Locality Plan

- Create `docs/phase-9-external-asset-locality.md`.
- Inventory current external runtime URLs and decide the local replacement path.
- Identify all Tailwind utility classes that must be preserved locally.
- Run `git diff --check`, `npm run check:src`, `npm run smoke:logic`, and `npm run build`.

### Rounds 2-4: Tailwind CDN Exit

- Remove the Tailwind CDN script.
- Replace used layout/typography/color/spacing utility behavior with local CSS or a documented build-time CSS path.
- Keep UI text fitting, buttons/settings/shop layouts, HUD, canvas overlay, and mobile safe-area behavior stable.
- Run build and smoke after each meaningful styling change.

### Rounds 5-6: Font Locality

- Remove the Google Fonts runtime link.
- Add local fonts with source/license documentation or switch to system/local fallback stacks.
- Validate Chinese and English text readability, HUD compactness, menu labels, settings panel, upgrade shop, and game-over UI.

### Rounds 7-8: Smoke Guards

- Add or extend an asset locality smoke, either as `npm run smoke:assets` or integrated into release/PWA smoke.
- Ensure `npm run validate` includes the guard by the final round.
- Guard source and production output against unapproved runtime external URLs.
- Keep manifest, icon, PWA no-service-worker, release debug-gate, and leaderboard boundary checks intact.

### Round 9: Browser/Server Smoke

- Use the project server workflow to verify hosted-path app load.
- Check main menu, settings, upgrade shop, start flow, canvas rendering, and mobile viewport after styling changes.
- Verify manifest/icon fetchability still passes.
- Record evidence in `docs/phase-9-browser-server-smoke.md` if browser/server smoke is run.

### Round 10: Documentation Sync

- Update `docs/phase-9-external-asset-locality.md`, `docs/release-readiness-checklist.md`, and README with the final local asset boundary.
- State that offline/service-worker behavior remains deferred.

### Rounds 11-13: Buffer Fixes

- Use only for validation failures, visual regressions, missing utility coverage, font/source/license issues, docs mismatches, or smoke gaps.
- Do not expand into service worker, offline cache, backend, native packaging, public leaderboard UI, analytics, or gameplay work.

### Round 14: Final Validation And Report

- Run final validation:
  - `git diff --check`
  - `npm run validate`
  - `C:\Users\Administrator\.codex\skills\project-ops-workflow\scripts\ops\Validate.cmd`
  - `git status --short --branch`
- Add `docs/phase-9-validation-report.md`.
- Commit and push final docs/code/assets.
- Report back to planner thread `019f1952-5d38-7941-b681-7ff06c097a8d` with final commit, validation, changed files/assets, external asset boundary, browser/server smoke result, non-scope confirmation, and remaining risks.

## 7. Debug Self-Check

Each round must answer:

- Can the current change be explained by one external asset or one UI styling fixture?
- Can failures be localized to Tailwind replacement CSS, font stack/local font asset, index link, Vite build, release smoke, PWA smoke, or browser layout?
- Are missing local asset, unapproved external URL, production output, desktop/mobile layout, and text readability states covered where relevant?
- If UI styling changed, was a repeatable browser or smoke verification added?
- If build output changed, are emitted assets and paths validated without committing `dist/`?

## 8. Architecture Self-Check

Each round must answer:

- Does Vite/GitHub Pages remain the source of truth for static deployment?
- Are local render assets kept separate from gameplay, renderer logic, leaderboard, meta progression, settings, and manifest semantics?
- Did the phase avoid adding service-worker lifecycle, cache ownership, runtime network behavior, backend provider code, native projects, or runtime dependencies?
- Did the phase preserve Phase 1-8 validation and avoid pulling deferred offline/backend/native/public leaderboard scope into this stage?
- Are unrelated files, generated outputs, and user changes left alone?

## 9. PASS Criteria

All must be true:

- `index.html` no longer references `https://cdn.tailwindcss.com`, `https://fonts.googleapis.com`, or runtime `fonts.gstatic.com`.
- Current UI layout and readability are preserved through local CSS and/or documented local font/fallback decisions.
- `docs/phase-9-external-asset-locality.md` documents the external asset inventory, final local asset boundary, and any font source/license or fallback decision.
- Release/PWA/asset smoke fails on unapproved runtime external app-shell URLs.
- `npm run validate` includes the new or extended asset locality guard and passes.
- Manifest-first PWA readiness remains intact: manifest and icons are still emitted and no service worker/offline behavior is added.
- No service worker, Cache API usage, offline fallback, background sync, push notification, backend, analytics, provider SDK, public leaderboard UI, native packaging, credentials, runtime dependency, gameplay change, or economy change was added.
- `git diff --check` PASS.
- `npm run check:src` PASS.
- `npm run smoke:logic` PASS.
- `npm run build` PASS.
- `npm run smoke:release` PASS.
- `npm run smoke:pwa` PASS.
- `npm run validate` PASS.
- Project `Validate.cmd` PASS.
- Browser/server smoke is run if styling changed materially, or the final report explains why existing automated smoke was sufficient.
- All phase-relevant commits are pushed to `origin/main`.

## 10. Final Report Template

```text
Phase 9 execution completion report

Result: PASS / BLOCKED / PARTIAL
Commits:
- <hash> <message>

Completed files/assets:
- ...

External asset boundary:
- ...

Validation:
- <command>: <result>

Browser/server smoke:
- ...

Non-scope confirmation:
- No service worker/offline/backend/native/provider SDK/analytics/runtime dependency/gameplay changes added.

Remaining risks:
- ...

Buffer rounds consumed:
- ...
```
