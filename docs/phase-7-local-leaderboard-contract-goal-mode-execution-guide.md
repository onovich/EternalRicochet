# Phase 7 - Local Leaderboard Contract Prototype Slice Goal Mode Execution Guide

Date: 2026-07-01
Status: execution guide for the executor
Planner thread: 019f1952-5d38-7941-b681-7ff06c097a8d
Executor thread: 019f1cd9-0ad1-7833-b73b-0831805c494f
Round budget: 12 rounds, with rounds 1-8 for main implementation and docs, rounds 9-11 for buffer fixes, and round 12 for final validation.

## 0. Direct Goal Prompt For The Executor

You are the Eternal Ricochet implementation executor. Use `$donextgoal` to execute this guide.

Goal: after Phase 6 accepted the platform/social decision dossier, build the smallest safe local-only leaderboard contract prototype. This phase must define the future leaderboard data contract, add pure validation/sanitization helpers, provide a local mocked provider adapter, cover consent and failure-state copy, and add smoke coverage. It must not add a real backend, real public leaderboard, accounts, credentials, runtime network calls, service workers, manifests, native packaging, analytics, or new platform dependencies.

The prototype should make future backend work easier without committing the project to a provider. Keep gameplay, physics, meta progression, settings persistence, scoring, rendering, and release behavior stable except where a minimal local contract hook or smoke fixture is needed.

Each round must read this guide and relevant project docs first, run validation for touched files, commit and push after validation passes, and stop if validation, commit, or push fails.

## 1. Required Reading

- `README.md`
- `origin/design.md`
- `docs/phase-6-planner-check-report.md`
- `docs/phase-6-validation-report.md`
- `docs/phase-6-platform-social-decision-dossier.md`
- `docs/phase-6-platform-social-decision-goal-mode-execution-guide.md`
- `docs/phase-5-validation-report.md`
- `docs/release-readiness-checklist.md`
- `package.json`
- `index.html`
- `src/main.js`
- `src/logic/engine/gameRuntime.js`
- `src/logic/engine/highScore.js`
- `src/logic/engine/metaProgression.js`
- `src/logic/engine/settings.js`
- `scripts/smoke-core.mjs`
- `scripts/smoke-release-gates.mjs`
- `.codex/project-ops-workflow.md`
- `.codex/project-git-workflow.md`

Current accepted facts:

- Phase 1 fixed the maintainable core, bullet fire reset, trajectory origin, and stronger ricochet feel.
- Phase 2 added combo, obstacles, Shooter enemies, and projectiles.
- Phase 3 added local meta progression and upgrades.
- Phase 4 added performance metrics, stress seed, particle pool, quality tiers, and projectile trail feedback.
- Phase 5 added local settings, release gate smoke, and mobile browser polish.
- Phase 6 accepted the platform/social decision dossier and recommended a local-only leaderboard contract prototype before any backend decision.

## 2. Scope

1. Contract documentation:
   - Create `docs/phase-7-leaderboard-contract.md`.
   - Define the future leaderboard submission shape, retrieval shape, consent boundaries, failure states, and rejected data.
   - Include fields such as score, optional display name, anonymous/local player label, submitted timestamp or local generated time, game version/build id, run duration or frame count, optional client nonce, and contract version.
   - Explicitly prohibit uploading localStorage dumps, upgrade inventory, settings, device identifiers, analytics, IP-derived claims, browser fingerprinting data, or personal data beyond a user-provided display name.

2. Pure contract helpers:
   - Add a small isolated module under the existing logic structure, for example `src/logic/leaderboard/`.
   - Include pure helpers for sanitizing display names, validating score payloads, normalizing leaderboard entries, and returning structured error codes.
   - Keep helpers provider-agnostic and deterministic. They should not read DOM, localStorage, network, audio, renderer, physics, or global runtime state directly.
   - Use plain JavaScript modules consistent with the existing codebase.

3. Local mocked provider:
   - Add an in-memory or explicitly local mock provider that consumes the contract helpers.
   - It may simulate success, validation failure, duplicate/invalid payload, network-unavailable, and disabled/consent-required states.
   - It must not call `fetch`, `XMLHttpRequest`, `WebSocket`, SDKs, service workers, external URLs, or cloud APIs.
   - It must not persist public leaderboard data unless the guide is updated by planner approval. Existing local high score persistence remains separate.

4. Consent and copy boundaries:
   - Add consent/failure-state copy as constants or docs, not as a live public submission UI unless the implementation remains fully local/mock and materially improves smoke coverage.
   - Clearly distinguish local score storage from any future public leaderboard submission.
   - Make refusal/failure messages deterministic enough to test.

5. Smoke and release coverage:
   - Extend `npm run smoke:logic` or add a focused script that is included in existing validation.
   - Cover valid payloads, invalid scores, display-name sanitization, overlong/empty names, consent-required/disabled provider states, mocked unavailable failure, and separation from meta progression/settings/local high score storage.
   - Keep `npm run smoke:release` proving production build pathing and dev debug gates.

6. Documentation and handoff:
   - Add `docs/phase-7-validation-report.md` in the final round.
   - Update README status with Phase 7 completion evidence only after final validation passes.
   - If any implementation choice is deliberately local/mock, document why it remains safe under Phase 6 decision gates.

## 3. Non-Scope

- Do not implement Firebase, Supabase, Cloudflare, custom backend, accounts, cloud saves, real public leaderboards, analytics, telemetry, or network submission.
- Do not call `fetch`, `XMLHttpRequest`, `WebSocket`, external SDKs, or provider APIs.
- Do not create cloud projects, credentials, API keys, environment files, secrets, GitHub repository settings, or deployment tokens.
- Do not add service workers, app manifests, offline caching, install prompts, PWA icons, Capacitor, Cordova, Electron, native packaging, signing, app-store metadata, or mobile store workflows.
- Do not add runtime dependencies unless the planner explicitly approves a revised guide.
- Do not upload, serialize, or couple localStorage, meta progression, settings, audio preferences, fullscreen preferences, or upgrade state to leaderboard payloads.
- Do not add public display UI, moderation dashboards, suspicious-score policy enforcement, or score deletion workflows beyond documentation/copy stubs.
- Do not change core gameplay, physics, enemy balance, economy, upgrade pricing, renderer architecture, or release deployment.
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

### Round 1: Contract Shape And File Placement

- Read the Phase 6 dossier and locate the existing high score, meta progression, and settings boundaries.
- Create `docs/phase-7-leaderboard-contract.md` with the proposed local-only contract shape and no-go boundaries.
- Decide module placement for provider-agnostic leaderboard helpers.
- Run `git diff --check`, `npm run check:src`, and `npm run smoke:logic`.

### Rounds 2-3: Pure Validation Helpers

- Add deterministic contract helpers for payload validation, display-name sanitization, entry normalization, and error-code construction.
- Cover normal, empty, invalid, overlong, stale/version-mismatched, and suspicious-but-not-enforced states where useful.
- Keep every helper free of DOM, storage, network, renderer, physics, and runtime dependencies.
- Add or extend smoke fixtures.

### Rounds 4-5: Mock Provider Boundary

- Add a local mocked provider adapter that accepts valid contract payloads and returns structured local/mock results.
- Add deterministic modes for disabled, consent required, unavailable, rejected, and success.
- Confirm no runtime network APIs or provider SDKs were added.
- Keep local high score persistence untouched unless a small read-only fixture is needed for smoke.

### Round 6: Consent And Failure Copy

- Add copy constants or docs for future consent, public display warning, disabled state, unavailable state, validation failure, duplicate/rejected state, and privacy boundary.
- Smoke-test that copy keys or error codes are stable.
- Do not add a live network submission UI.

### Round 7: Integration Guard And Regression Coverage

- Extend smoke coverage to verify leaderboard contract code stays separated from settings, meta progression, local high score storage, and runtime network APIs.
- Add boundary scans or release-smoke assertions if useful.
- Run `npm run validate` locally before committing this round.

### Round 8: Documentation Sync

- Update `docs/phase-7-leaderboard-contract.md` with the final local/mock implementation boundary.
- Update README only if the phase is ready to be described as implemented.
- Prepare `docs/phase-7-validation-report.md` draft but do not mark PASS until final validation succeeds.

### Rounds 9-11: Buffer Fixes

- Use only for validation failures, docs mismatches, scope leaks, test gaps, or review feedback.
- Do not expand into backend, PWA, native, accounts, analytics, public UI, moderation tooling, or gameplay work.

### Round 12: Final Validation And Report

- Run final validation:
  - `git diff --check`
  - `npm run validate`
  - `C:\Users\Administrator\.codex\skills\project-ops-workflow\scripts\ops\Validate.cmd`
  - `git status --short --branch`
- Add or finalize `docs/phase-7-validation-report.md`.
- Commit and push final docs/code.
- Report back to planner thread `019f1952-5d38-7941-b681-7ff06c097a8d` with final commit, validation, files changed, non-scope confirmation, and remaining risks.

## 7. Debug Self-Check

Each round must answer:

- Can the current change be explained by one small contract fixture or mocked provider workflow?
- Can failures be localized to validation helper, mocked provider, copy boundary, smoke script, or documentation?
- Are success, failure, disabled, consent-required, invalid, empty, overlong, and unavailable states covered where relevant?
- If UI changed, was a repeatable UI or browser smoke verification added?
- If state changed, are validation and serialization boundaries covered without uploading unrelated local data?

## 8. Architecture Self-Check

Each round must answer:

- Does the existing game runtime remain the source of truth for gameplay state and score?
- Are leaderboard contract helpers separated from renderer, physics, audio, HUD, settings, meta progression, and local high score persistence?
- Does the mocked provider avoid choosing or importing a future real backend provider?
- Did the phase avoid pulling deferred backend, PWA, native, account, analytics, moderation, or public display scope into this stage?
- Are unrelated files, generated outputs, and user changes left alone?

## 9. PASS Criteria

All must be true:

- `docs/phase-7-leaderboard-contract.md` exists and documents payload schema, rejected data, consent boundaries, provider-agnostic behavior, failure states, and future implementation notes.
- Pure leaderboard contract helpers exist in an isolated logic module.
- A local mocked provider exists and supports success plus disabled, consent-required, unavailable, validation-failure, and rejected states.
- Smoke coverage exercises contract validation, display-name handling, mocked provider states, and separation from settings/meta/high-score storage.
- No backend, credentials, provider SDK, network call, service worker, manifest, native tooling, analytics, runtime dependency, public leaderboard UI, moderation tooling, or platform integration was added.
- `git diff --check` PASS.
- `npm run check:src` PASS.
- `npm run smoke:logic` PASS.
- `npm run build` PASS.
- `npm run smoke:release` PASS.
- `npm run validate` PASS.
- Project `Validate.cmd` PASS.
- README and final report accurately reflect Phase 7 output.
- All phase-relevant commits are pushed to `origin/main`.

## 10. Final Report Template

```text
Phase 7 execution completion report

Result: PASS / BLOCKED / PARTIAL
Commits:
- <hash> <message>

Completed files:
- ...

Implemented contract boundary:
- ...

Validation:
- <command>: <result>

Non-scope confirmation:
- No backend/network/credentials/service worker/manifest/native tooling/provider SDK/public leaderboard UI added.

Remaining risks:
- ...

Buffer rounds consumed:
- ...
```
