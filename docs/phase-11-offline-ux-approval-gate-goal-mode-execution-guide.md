# Phase 11 - Offline UX And Service Worker Approval Gate Slice

Planner thread: 019f1952-5d38-7941-b681-7ff06c097a8d
Executor thread: 019f1cd9-0ad1-7833-b73b-0831805c494f
Workspace: D:\WebProjects\EternalRicochet
Created: 2026-07-01T22:44:22.8525164+08:00
Round budget: 10 executor rounds maximum
Planner return target: 019f1952-5d38-7941-b681-7ff06c097a8d

## Objective

Convert Phase 10's offline-cache strategy and no-go list into an approval-ready UX and operations gate for a later service-worker implementation phase. This phase must decide and document the user-facing copy, stale-client rules, rollback/unregister procedure, browser compatibility matrix, and final go/no-go checklist needed before the project may add service-worker runtime code.

This is still not the service-worker implementation phase.

## Current Baseline

- Phase 8 added manifest-first PWA metadata and local icons.
- Phase 9 removed external app-shell render assets and added asset-locality smoke.
- Phase 10 added offline cache strategy and `smoke:offline-readiness` dry-run validation.
- Current release remains online-only. It must not claim offline support.
- Phase 10 PASS report: `docs/phase-10-planner-check-report.md`.

Official source ledger to keep in view:

- MDN Service Worker API: https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API
- MDN Cache API: https://developer.mozilla.org/en-US/docs/Web/API/Cache
- MDN CacheStorage: https://developer.mozilla.org/en-US/docs/Web/API/CacheStorage
- GitHub Pages custom workflows: https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages

If any implementation-facing platform fact is uncertain, recheck official docs and record the checked date. Do not use blog posts as acceptance evidence for platform behavior.

## Required Scope

1. Create `docs/phase-11-offline-ux-approval-gate.md`.
   - State clearly that the current app is online-only and Phase 11 does not change runtime behavior.
   - Define future offline/update UX states:
     - first visit before cache exists
     - cached reload after a future service worker installs
     - offline reload with a valid cache
     - offline reload without a valid cache
     - update available while idle
     - update available during an active run
     - stale client after deploy
     - rollback or unregister recovery
   - Provide concise user-facing copy strings for those future states. Keep them as documentation, not active UI.
   - Define stale-client rules:
     - never interrupt an active run with a reload
     - surface update prompts only in menu, pause, settings, or game-over states
     - prefer explicit user refresh over silent reload
     - keep local score/meta/settings storage independent from cache versions
   - Define future rollback/unregister runbook:
     - disable or remove registration
     - unregister active service workers
     - delete versioned caches owned by the app
     - verify fresh online load on `/EternalRicochet/`
     - keep old cache names listed long enough for cleanup releases
   - Define browser support and validation matrix:
     - Chromium desktop
     - Firefox desktop
     - Safari desktop if available
     - Android Chrome if available
     - iOS Safari as a manual future gate
     - GitHub Pages/custom-domain hosted path parity
   - End with an explicit go/no-go checklist for a later service-worker implementation phase.

2. Add or extend dry-run approval validation.
   - Prefer a small script such as `scripts/smoke-offline-approval-gate.mjs` plus `npm run smoke:offline-gate`.
   - The smoke should validate the Phase 11 gate document has the required sections/copy keys and that runtime source still has no service-worker file, no service-worker registration, no Cache API runtime usage, no Workbox tooling, no offline fallback, and no active offline-support claims.
   - Include the new smoke in `npm run validate` only if it is deterministic and fast.
   - Reuse existing helpers or simple Node standard-library code; do not add dependencies.

3. Update release documentation.
   - Update `docs/release-readiness-checklist.md` with the Phase 11 approval gate and the fact that offline support is still deferred.
   - Update `README.md` status/validation notes if new smoke or docs are added.
   - Do not describe the app as offline-capable.

4. Produce `docs/phase-11-validation-report.md`.
   - Record every changed file, validation command, result, and final go/no-go recommendation.
   - Confirm non-scope explicitly.
   - Include remaining risks and any decision gates that must return to the user/planner.

## Non-Scope

Do not add any of the following in Phase 11:

- service-worker file
- service-worker registration
- `navigator.serviceWorker` runtime usage
- Cache API runtime usage
- offline fallback page
- precache runtime or generated precache manifest
- active update prompt UI
- background sync
- push notifications
- Workbox or other service-worker tooling
- backend, accounts, cloud saves, public leaderboard UI, provider SDK, analytics, telemetry, credentials, env files, native packaging, runtime dependencies
- gameplay, economy, rendering, audio, or meta-progression behavior changes

Documenting future copy and future UX rules is allowed. Shipping active offline/update behavior is not.

## Suggested Round Plan

Round 1:
- Read Phase 10 strategy, Phase 10 planner report, release checklist, README, current smoke scripts, and `package.json`.
- Confirm worktree and remote state before edits.

Round 2:
- Draft `docs/phase-11-offline-ux-approval-gate.md` with UX states, copy, stale-client rules, rollback, browser matrix, and go/no-go checklist.

Round 3:
- Add deterministic approval-gate smoke if it can stay simple and dependency-free.
- Wire it into `package.json` and `npm run validate` if stable.

Round 4:
- Update README and release checklist.

Round 5:
- Run `git diff --check`, `npm run validate`, `npm run smoke:offline-readiness`, and the project ops `Validate.cmd`.
- Run a focused boundary scan for service-worker, Cache API, Workbox, backend, analytics, native packaging, and runtime dependency drift.

Round 6:
- Fix any validation, docs, or boundary issues.

Round 7:
- Write `docs/phase-11-validation-report.md`.

Round 8:
- Run final validation again if code or scripts changed after the first pass.

Round 9:
- Commit and push the phase.

Round 10:
- Send READY_FOR_CHECK back to planner thread 019f1952-5d38-7941-b681-7ff06c097a8d with evidence.

## Required Validation

Run and record:

- `git diff --check`
- `npm run validate`
- `npm run smoke:offline-readiness`
- `C:\Users\Administrator\.codex\skills\project-ops-workflow\scripts\ops\Validate.cmd`
- focused boundary scan covering service-worker files/registration, Cache API runtime, Workbox, offline claims, backend/provider SDK, analytics/telemetry, native packaging, credentials, runtime dependencies, gameplay, and economy changes
- `git status --short --branch`

If a browser/server smoke is useful, run it as supporting evidence, but it is not required unless runtime files or app shell markup changed.

## Acceptance Criteria

- `docs/phase-11-offline-ux-approval-gate.md` exists and is decision-ready.
- Future offline/update/stale-client/rollback copy is documented but not active UI.
- Stale-client UX rules protect active gameplay and local persistence.
- Rollback/unregister runbook is concrete enough for a future implementation phase.
- Browser support matrix identifies iOS Safari and hosted GitHub Pages/custom-domain validation as future gates.
- New or existing smoke keeps service-worker/runtime offline scope out of the current app.
- `npm run validate` and project ops validation pass.
- Final pushed state is clean and aligned with `origin/main`.

## Completion Message Back To Planner

Send this shape back to planner thread 019f1952-5d38-7941-b681-7ff06c097a8d:

```text
READY_FOR_CHECK

Phase 11 - Offline UX And Service Worker Approval Gate Slice is complete in D:\WebProjects\EternalRicochet.

Final commit:
- <hash> <subject>

Validation:
- git diff --check PASS
- npm run validate PASS
- npm run smoke:offline-readiness PASS
- project ops Validate.cmd PASS
- boundary scan PASS
- git status clean/aligned

Reports:
- docs/phase-11-offline-ux-approval-gate.md
- docs/phase-11-validation-report.md

Go/no-go:
- <recommendation for whether a later actual service-worker phase is ready>

Remaining risks:
- <list>

Non-scope confirmation:
- No service-worker file/registration, Cache API runtime, offline fallback, active update prompt UI, Workbox, backend, accounts, analytics, native packaging, runtime dependencies, gameplay, or economy changes added.
```
