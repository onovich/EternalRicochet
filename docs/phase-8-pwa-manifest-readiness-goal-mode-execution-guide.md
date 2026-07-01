# Phase 8 - PWA Manifest-First Readiness Slice Goal Mode Execution Guide

Date: 2026-07-01
Status: execution guide for the executor
Planner thread: 019f1952-5d38-7941-b681-7ff06c097a8d
Executor thread: 019f1cd9-0ad1-7833-b73b-0831805c494f
Round budget: 12 rounds, with rounds 1-8 for manifest/assets/smoke work, rounds 9-11 for buffer fixes, and round 12 for final validation.

## 0. Direct Goal Prompt For The Executor

You are the Eternal Ricochet implementation executor. Use `$donextgoal` to execute this guide.

Goal: after Phase 7 accepted the local-only leaderboard contract prototype, implement the safest remaining platform slice from the Phase 6 dossier: PWA manifest-first readiness with no offline service worker. This phase should add install metadata, local app icon assets, manifest/release smoke checks, and documentation that clearly defers offline caching until a later approved cache and asset-vendoring strategy exists.

This phase must not add a service worker, offline caching, push notifications, background sync, backend/network calls, Firebase/Supabase/Cloudflare/custom backend code, public leaderboard UI, accounts, analytics/telemetry, native packaging, Capacitor/Cordova/Electron, credentials, or runtime dependencies.

Each round must read this guide and relevant project docs first, run validation for touched files, commit and push after validation passes, and stop if validation, commit, or push fails.

## 1. Required Reading

- `README.md`
- `origin/design.md`
- `docs/phase-7-planner-check-report.md`
- `docs/phase-7-validation-report.md`
- `docs/phase-7-leaderboard-contract.md`
- `docs/phase-6-platform-social-decision-dossier.md`
- `docs/phase-6-validation-report.md`
- `docs/release-readiness-checklist.md`
- `package.json`
- `index.html`
- `.github/workflows/deploy.yml`
- `scripts/smoke-release-gates.mjs`
- `.codex/project-ops-workflow.md`
- `.codex/project-git-workflow.md`

Current accepted facts:

- Phase 5 made the local web release shippable and documented that external CDN references remain.
- Phase 6 compared platform lanes and listed PWA manifest-first readiness as the safe alternative to backend leaderboard work.
- Phase 7 completed a local-only leaderboard contract and did not approve any backend/public submission lane.
- Backend leaderboard work remains blocked by provider, privacy, moderation, public display, cost, credential, and rollback approval gates.

Planner decision for this phase:

- Use the existing product name `Eternal Ricochet`.
- Use a short name no longer than typical install surfaces, such as `Ricochet`.
- Use the existing neon arcade visual identity for icons and theme colors.
- Add manifest/install readiness only. Explicitly defer service-worker caching and offline claims.

## 2. Scope

1. Manifest metadata:
   - Add a static web app manifest, preferably `public/manifest.webmanifest` so Vite copies it to `dist/manifest.webmanifest`.
   - Link it from `index.html` using a path that works under the GitHub Pages base `/EternalRicochet/` and local dev parity.
   - Include name, short name, description, start URL, scope, display mode, orientation if appropriate, theme color, background color, and icon entries.
   - Add a `theme-color` meta tag if absent.

2. Local icon assets:
   - Add committed local icon assets under `public/`, for example `public/icons/`.
   - Icons should read as Eternal Ricochet at install size: neon arcade contrast, ricochet/bullet motif, and legible silhouette.
   - Prefer no new runtime dependency. If generating PNGs, use a deterministic local generation script or platform tool and commit the resulting assets.
   - Include at least one standard install icon and one maskable/safe-area icon entry when feasible.
   - Do not reference external CDN assets from the manifest.

3. PWA manifest smoke:
   - Add `npm run smoke:pwa` or fold equivalent checks into the release smoke.
   - Validate manifest JSON, required fields, icon files, icon MIME/path assumptions, start URL/scope/base-path behavior, and absence of service-worker/offline claims.
   - Ensure `npm run validate` includes the PWA smoke by the final round.
   - Keep `npm run smoke:release` proving production asset pathing and dev debug gates.

4. Hosted path and browser smoke:
   - Verify the production build emits the manifest and icons.
   - Start local dev or preview server when needed and fetch the manifest/icons at `/EternalRicochet/` parity paths.
   - If using the in-app browser, check that the manifest link is present and fetchable. Do not require a real install prompt if the embedded browser does not expose it.

5. Documentation:
   - Update `docs/release-readiness-checklist.md` with manifest-first checks and the explicit no-service-worker/no-offline boundary.
   - Add `docs/phase-8-validation-report.md` in the final round.
   - Update README status after final validation passes.
   - Document that current external CDN references are not cached and that offline behavior remains future scope.

## 3. Non-Scope

- Do not add service workers, service-worker registration, Cache API usage, offline fallbacks, precache manifests, update prompts, background sync, push notifications, or offline claims.
- Do not vendor Tailwind, Google Fonts, CDN resources, or other external assets unless the planner updates this guide.
- Do not implement Firebase, Supabase, Cloudflare, custom backend, accounts, cloud saves, public leaderboard UI, analytics, telemetry, runtime network submission, or provider SDKs.
- Do not change leaderboard contract behavior except for release smoke coexistence if needed.
- Do not add Capacitor, Cordova, Electron, native projects, app ids, signing material, store metadata, or native packaging workflows.
- Do not add runtime dependencies unless the planner explicitly approves a revised guide.
- Do not change core gameplay, physics, enemy balance, economy, upgrade pricing, renderer architecture, or GitHub Pages deployment semantics.
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

### Round 1: Manifest Plan And Asset Shape

- Inspect current `index.html`, Vite base/path behavior, deployment workflow, and release smoke.
- Decide manifest path, icon paths, metadata, and smoke structure.
- Add a short doc note or checklist draft if useful.
- Run `git diff --check`, `npm run check:src`, `npm run smoke:logic`, and `npm run build`.

### Rounds 2-3: Manifest And Icons

- Add the manifest and local icon assets.
- Link the manifest and theme color from `index.html`.
- Confirm the build emits the manifest and icons.
- Do not add service-worker code or offline claims.

### Rounds 4-5: PWA Smoke

- Add manifest smoke checks and include them in `npm run validate`.
- Check required manifest fields, icon files, base path, production dist output, and no-service-worker boundary.
- Preserve existing release smoke behavior.

### Round 6: Browser/Server Smoke

- Use the project local server workflow when needed.
- Verify the app still loads at `http://127.0.0.1:4173/EternalRicochet/` or the active fallback port.
- Verify manifest link and icon resources are fetchable.
- If the embedded browser blocks installability signals, record the limitation and use DOM/fetch evidence.

### Round 7: Documentation Sync

- Update README and `docs/release-readiness-checklist.md` with manifest-first evidence and remaining offline/cache risks.
- Keep external CDN/offline vendoring explicitly future scope.

### Round 8: Regression And Boundary Guard

- Ensure smoke coverage protects against accidental service worker registration, Cache API usage, offline claims, native tooling, provider SDKs, and new dependencies.
- Run `npm run validate` before committing.

### Rounds 9-11: Buffer Fixes

- Use only for validation failures, manifest/icon path issues, browser smoke limitations, docs mismatches, or scope leaks.
- Do not expand into offline caching, asset vendoring, backend, native packaging, or gameplay work.

### Round 12: Final Validation And Report

- Run final validation:
  - `git diff --check`
  - `npm run validate`
  - `C:\Users\Administrator\.codex\skills\project-ops-workflow\scripts\ops\Validate.cmd`
  - `git status --short --branch`
- Add `docs/phase-8-validation-report.md`.
- Commit and push final docs/code/assets.
- Report back to planner thread `019f1952-5d38-7941-b681-7ff06c097a8d` with final commit, validation, files changed, non-scope confirmation, browser/server smoke result, and remaining risks.

## 7. Debug Self-Check

Each round must answer:

- Can the current change be explained by one manifest/icon/build fixture?
- Can failures be localized to manifest JSON, icon asset, index link, Vite base path, release smoke, local server, or browser support?
- Are missing icon, invalid manifest, wrong base path, production build, no-service-worker, and browser limitation states covered where relevant?
- If UI changed, was a repeatable browser smoke verification added?
- If build output changed, are emitted assets and paths validated without committing `dist/`?

## 8. Architecture Self-Check

Each round must answer:

- Does GitHub Pages/Vite remain the source of truth for static web deployment?
- Did the phase avoid adding service-worker lifecycle, cache ownership, runtime network behavior, backend provider code, or native projects?
- Are manifest/icon assets kept separate from gameplay, renderer, leaderboard, meta progression, and settings logic?
- Did the phase avoid pulling deferred offline, asset vendoring, backend leaderboard, native packaging, analytics, or gameplay scope into this stage?
- Are unrelated files, generated outputs, and user changes left alone?

## 9. PASS Criteria

All must be true:

- A web app manifest exists, is linked from `index.html`, and is emitted by production build.
- Manifest metadata uses the existing `Eternal Ricochet` identity and works with `/EternalRicochet/` hosted-path assumptions.
- Local icon assets exist and are referenced by the manifest.
- PWA/manifest smoke is included in `npm run validate` and passes.
- Production build and release smoke still pass.
- Browser/server smoke verifies app load plus manifest/icon fetchability, or records a concrete embedded-browser limitation with equivalent DOM/fetch evidence.
- Documentation clearly states manifest-first readiness and explicitly defers service-worker caching/offline behavior.
- No service worker, Cache API usage, offline fallback, background sync, push notification, backend, analytics, provider SDK, public leaderboard UI, native packaging, credentials, runtime dependency, or gameplay/economy change was added.
- `git diff --check` PASS.
- `npm run check:src` PASS.
- `npm run smoke:logic` PASS.
- `npm run build` PASS.
- `npm run smoke:release` PASS.
- `npm run validate` PASS.
- Project `Validate.cmd` PASS.
- All phase-relevant commits are pushed to `origin/main`.

## 10. Final Report Template

```text
Phase 8 execution completion report

Result: PASS / BLOCKED / PARTIAL
Commits:
- <hash> <message>

Completed files/assets:
- ...

Manifest boundary:
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
