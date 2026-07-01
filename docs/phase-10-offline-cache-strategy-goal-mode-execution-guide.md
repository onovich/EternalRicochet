# Phase 10 - Offline Cache Strategy And Dry-Run Slice Goal Mode Execution Guide

Date: 2026-07-01
Status: execution guide for the executor
Planner thread: 019f1952-5d38-7941-b681-7ff06c097a8d
Executor thread: 019f1cd9-0ad1-7833-b73b-0831805c494f
Round budget: 12 rounds, with rounds 1-8 for strategy, dry-run tooling, docs, and validation, rounds 9-11 for buffer fixes, and round 12 for final validation.

## 0. Direct Goal Prompt For The Executor

You are the Eternal Ricochet implementation executor. Use `$donextgoal` to execute this guide.

Goal: after Phase 9 removed runtime external render assets, prepare the project for a future offline-capable PWA without crossing the service-worker implementation gate. This phase must produce a precise offline cache strategy, build-output asset inventory, dry-run validation script, update/rollback plan, and go/no-go criteria for a later explicit service-worker phase.

Do not register or ship a service worker in Phase 10. Do not add Cache API usage, offline fallbacks, precache runtime code, push/background sync, install prompts, backend/network calls, native packaging, analytics, public leaderboard UI, gameplay changes, or economy changes.

Each round must read this guide and relevant project docs first, run validation for touched files, commit and push after validation passes, and stop if validation, commit, or push fails.

## 1. Required Reading

- `README.md`
- `origin/design.md`
- `docs/phase-9-planner-check-report.md`
- `docs/phase-9-validation-report.md`
- `docs/phase-9-browser-server-smoke.md`
- `docs/phase-9-external-asset-locality.md`
- `docs/phase-8-validation-report.md`
- `docs/phase-6-platform-social-decision-dossier.md`
- `docs/release-readiness-checklist.md`
- `index.html`
- `public/manifest.webmanifest`
- `src/styles.css`
- `scripts/smoke-assets.mjs`
- `scripts/smoke-pwa.mjs`
- `scripts/smoke-release-gates.mjs`
- `package.json`
- `vite.config.js`
- `.github/workflows/deploy.yml`
- `.codex/project-ops-workflow.md`
- `.codex/project-git-workflow.md`

Official references to recheck and cite in the strategy doc:

- MDN Service Worker API: https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API
- MDN Cache API: https://developer.mozilla.org/en-US/docs/Web/API/Cache
- MDN CacheStorage: https://developer.mozilla.org/en-US/docs/Web/API/CacheStorage
- GitHub Pages custom workflows: https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages

Current accepted facts:

- Phase 8 added manifest-first PWA readiness.
- Phase 9 removed Tailwind CDN and Google Fonts runtime app-shell dependencies.
- `npm run validate` now covers logic, build, asset locality, release, and PWA manifest smoke.
- The project is closer to offline readiness but still must not claim offline support until a service worker is explicitly approved, implemented, and validated.

Planner decisions for this phase:

- Produce strategy and dry-run validation only.
- Keep service-worker registration out of source, `index.html`, and production output.
- Treat stale-cache rollback as a first-class acceptance topic before any future service-worker implementation.
- Use generated build-output inventory data for planning, but do not commit `dist/`.

## 2. Scope

1. Offline cache strategy document:
   - Create `docs/phase-10-offline-cache-strategy.md`.
   - Define candidate cache categories: app shell HTML, hashed JS/CSS, manifest, icons, and any local static assets.
   - Define what must not be cached yet, including future backend data, leaderboard submissions, analytics, external resources, secrets, dev endpoints, and localStorage snapshots.
   - Record official source URLs and checked date.
   - Include an explicit "no service worker in Phase 10" boundary.

2. Build-output inventory dry-run:
   - Add a script such as `scripts/smoke-offline-readiness.mjs`.
   - It should run after `npm run build` and inspect `dist/` without committing it.
   - It should produce deterministic checks for expected cache candidates, hosted `/EternalRicochet/` paths, hashed asset detection, manifest/icon presence, and absence of unapproved external runtime URLs.
   - It should fail if a service worker file or registration appears.
   - Add `npm run smoke:offline-readiness` or similarly named command.
   - Include the new smoke in `npm run validate` by the final round.

3. Update and rollback plan:
   - Document a future cache naming/versioning strategy.
   - Document install/activate/update cleanup expectations for a later implementation.
   - Define rollback shape: disable registration, unregister old worker, clear versioned caches, and keep hosted web release playable.
   - Define how stale clients should be detected or told to refresh in a future phase.

4. Validation matrix for the future service-worker phase:
   - Define required checks before implementation: first load, reload from cache, update from vN to vN+1, old cache cleanup, offline reload, hard refresh, unregister rollback, hosted-path parity, browser compatibility, and no interference with local settings/meta/high-score.
   - Include local dev server, preview server, and GitHub Pages hosted checks where feasible.

5. Documentation sync:
   - Update `docs/release-readiness-checklist.md` with offline-readiness dry-run checks.
   - Add `docs/phase-10-validation-report.md` in the final round.
   - Update README status only after final validation passes.

## 3. Non-Scope

- Do not add a service worker file, service-worker registration, Cache API usage in runtime code, offline fallback page, precache runtime, update prompt UI, background sync, push notifications, or offline support claims.
- Do not add Workbox or other service-worker tooling dependencies.
- Do not implement Firebase, Supabase, Cloudflare, custom backend, accounts, cloud saves, runtime network submission, public leaderboard UI, analytics, telemetry, provider SDKs, credentials, API keys, or environment files.
- Do not add Capacitor, Cordova, Electron, native packaging, signing material, store metadata, or native project files.
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
npm run smoke:assets
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

### Round 1: Official Source And Asset Inventory

- Recheck official sources listed above.
- Create `docs/phase-10-offline-cache-strategy.md`.
- Record current `dist/` asset categories after build and cache candidate reasoning.
- Run `git diff --check`, `npm run check:src`, `npm run smoke:logic`, and `npm run build`.

### Rounds 2-3: Dry-Run Offline Readiness Smoke

- Add the dry-run script.
- Verify expected `dist` artifacts, hosted paths, hashed JS/CSS, manifest/icons, asset locality, and no service-worker registration/file.
- Add an npm script, then include it in `npm run validate` by the end of Round 3.
- Keep `dist/` uncommitted.

### Round 4: Rollback And Update Strategy

- Document future cache names, versioning, install/activate behavior, cleanup, update prompts or refresh expectations, and rollback/unregister shape.
- Keep this as documentation only.

### Round 5: Future Service-Worker Validation Matrix

- Document first-load, cached reload, offline reload, update, old-cache cleanup, unregister rollback, local storage persistence, hosted-path parity, and browser matrix checks.
- Identify which checks can be automated later and which require manual/browser evidence.

### Round 6: Release Checklist And README Sync

- Update release checklist with offline-readiness dry-run.
- Update README only if the phase is ready to describe as completed.
- Preserve wording that the app is not yet offline-capable.

### Rounds 7-8: Boundary Hardening

- Ensure smoke checks fail on service-worker files, registrations, Cache API usage, Workbox, offline claims, and new dependencies.
- Run `npm run validate` before committing.

### Rounds 9-11: Buffer Fixes

- Use only for validation failures, docs ambiguity, stale asset assumptions, smoke gaps, or source citation issues.
- Do not expand into service worker implementation, offline caching, backend, native packaging, analytics, public leaderboard UI, or gameplay work.

### Round 12: Final Validation And Report

- Run final validation:
  - `git diff --check`
  - `npm run validate`
  - `C:\Users\Administrator\.codex\skills\project-ops-workflow\scripts\ops\Validate.cmd`
  - `git status --short --branch`
- Add `docs/phase-10-validation-report.md`.
- Commit and push final docs/code.
- Report back to planner thread `019f1952-5d38-7941-b681-7ff06c097a8d` with final commit, validation, changed files, offline-readiness dry-run result, non-scope confirmation, go/no-go recommendation, and remaining risks.

## 7. Debug Self-Check

Each round must answer:

- Can the current change be explained by one build artifact category, cache decision, or dry-run check?
- Can failures be localized to official-source drift, build inventory, hosted path, manifest/icon emission, service-worker boundary, release smoke, PWA smoke, or docs?
- Are missing asset, stale cache risk, update/rollback, no-service-worker, no-offline-claim, and generated `dist` states covered where relevant?
- If validation behavior changed, was it added to `npm run validate` and documented?
- If build output was inspected, was `dist/` left uncommitted?

## 8. Architecture Self-Check

Each round must answer:

- Does Vite/GitHub Pages remain the source of truth for static deployment?
- Is offline strategy separated from runtime gameplay, renderer logic, leaderboard, meta progression, settings, and local persistence?
- Did the phase avoid adding service-worker lifecycle code, Cache API runtime ownership, backend provider code, native projects, or runtime dependencies?
- Did the phase preserve Phase 1-9 validation and avoid pulling deferred service-worker/backend/native/public leaderboard scope into this stage?
- Are unrelated files, generated outputs, and user changes left alone?

## 9. PASS Criteria

All must be true:

- `docs/phase-10-offline-cache-strategy.md` exists and documents official source URLs, cache candidates, exclusions, update/rollback strategy, future validation matrix, and no-service-worker boundary.
- A dry-run offline-readiness smoke exists and is included in `npm run validate`.
- Dry-run smoke inspects production `dist` after build, validates expected asset candidates, hosted paths, manifest/icons, external asset locality, and fails on service-worker files/registration or Cache API runtime usage.
- Release checklist documents offline-readiness dry-run and states that offline capability is not shipped.
- No service worker file, service-worker registration, Cache API runtime usage, offline fallback, precache runtime, push/background sync, install prompt UI, Workbox/dependency, backend, analytics, provider SDK, native packaging, credential, runtime dependency, gameplay change, or economy change was added.
- `git diff --check` PASS.
- `npm run check:src` PASS.
- `npm run smoke:logic` PASS.
- `npm run build` PASS.
- `npm run smoke:assets` PASS.
- `npm run smoke:release` PASS.
- `npm run smoke:pwa` PASS.
- `npm run validate` PASS.
- Project `Validate.cmd` PASS.
- All phase-relevant commits are pushed to `origin/main`.

## 10. Final Report Template

```text
Phase 10 execution completion report

Result: PASS / BLOCKED / PARTIAL
Commits:
- <hash> <message>

Completed files:
- ...

Offline-readiness boundary:
- ...

Validation:
- <command>: <result>

Go/no-go recommendation:
- ...

Non-scope confirmation:
- No service worker/offline runtime/backend/native/provider SDK/analytics/runtime dependency/gameplay changes added.

Remaining risks:
- ...

Buffer rounds consumed:
- ...
```
