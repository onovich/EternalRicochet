# Phase 5 - Release Readiness And Mobile Polish Slice Goal Mode Execution Guide

Date: 2026-07-01
Status: execution guide for the executor
Planner thread: 019f1952-5d38-7941-b681-7ff06c097a8d
Executor thread: 019f1cd9-0ad1-7833-b73b-0831805c494f
Round budget: 16 rounds, with rounds 1-11 for implementation, 12-15 for buffer fixes, and 16 for final validation.

## 0. Direct Goal Prompt For The Executor

You are the Eternal Ricochet implementation executor. Use `$donextgoal` to execute this guide.

Goal: after Phase 4's performance/visual-fidelity slice, implement a conservative v2.0 release-readiness slice that makes the production web build easier to validate and play on desktop/mobile browsers. Add a small settings surface for render quality and audio/fullscreen preferences, harden production-vs-dev behavior, improve mobile viewport/safe-area/fullscreen ergonomics, and document release validation. Preserve all Phase 1/2/3/4 gameplay, meta progression, performance metrics, particle pooling, and smoke coverage.

Do not add Firebase, accounts, cloud saves, global leaderboards, native mobile packaging, Capacitor/Cordova, service-worker caching, or external backend dependencies in this phase. Those are product/architecture decisions for a later explicit phase.

Each round must read this guide and relevant source first, implement only that round's scope, run matching validation, then commit and push after validation passes. Do not proceed to the next round when validation, commit, or push fails.

## 1. Required Reading

- `README.md`
- `origin/design.md`
- `docs/phase-4-validation-report.md`
- `docs/phase-4-planner-check-report.md`
- `src/main.js`
- `index.html`
- `src/data/gameConfig.js`
- `src/logic/engine/gameRuntime.js`
- `src/logic/engine/renderQuality.js`
- `src/logic/engine/performanceMetrics.js`
- `src/logic/engine/particlePool.js`
- `src/logic/engine/metaProgression.js`
- `src/view/components/upgradeShop.js`
- `src/styles.css`
- `scripts/smoke-core.mjs`
- `.codex/project-ops-workflow.md`
- `.codex/project-git-workflow.md`

Current accepted facts:

- Phase 1 fixed maintainability, shot/trail reset, wall/enemy rebound, and non-lethal enemy bounce feel.
- Phase 2 added combo, obstacles, Shooter enemies, and projectiles.
- Phase 3 added local credits, upgrade shop, high-score persistence, and three persistent upgrades.
- Phase 4 added dev metrics, dev stress seed, particle pool, render quality tiers, and Shooter projectile trail feedback.
- Phase 4 accepted remaining risk: quality tier is URL-selected for validation and lacks an in-game settings surface.
- The original v2.0 roadmap mentions Firebase leaderboards, PWA/mobile packaging, and mobile browser improvements. This phase only takes the safe local web-readiness portion.

## 2. Scope

1. Settings model and UI:
   - Add a small settings store with schema versioning and safe localStorage sanitation.
   - Persist render quality preference: `high`, `medium`, `low`, and optionally `auto` only if it can be deterministic and testable.
   - Add an in-game settings panel reachable from menu and game over. Keep it compact and consistent with the existing overlay style.
   - Include audio mute or volume preference if it can be applied through the existing audio module without rewriting audio architecture.
   - Include a fullscreen toggle when `requestFullscreen` is available. It must fail gracefully when unsupported or denied.
   - Settings changes must not corrupt meta progression storage or high score storage.

2. Render-quality source of truth:
   - Keep `src/logic/engine/renderQuality.js` as the quality resolver.
   - Let normal production users choose quality through settings rather than URL-only controls.
   - Keep `?erQuality=` usable as a dev/smoke override when `import.meta.env.DEV` is true, or document and test a safe precedence rule.
   - Runtime should expose selected quality in dev debug state as Phase 4 already does.

3. Mobile browser polish:
   - Improve safe-area handling for HUD, menu, game over, shop, and settings overlays using CSS env safe-area values where helpful.
   - Keep touch controls usable on narrow and short viewports; avoid overlapping critical HUD/menu/settings content.
   - Add minimal fullscreen/mobile affordance text or button only inside the settings/menu surface, not as a landing page.
   - Do not redesign the whole UI, change the core gameplay screen, or add a marketing page.

4. Production/dev hardening:
   - Verify production build does not publish dev debug state, dev stress seed activation, or dev meta seed activation.
   - Keep dev-only test hooks available in Vite dev mode for deterministic smoke.
   - Add or extend smoke coverage for settings storage, quality precedence, production/dev gating, and no-regression gameplay.
   - If a production-preview smoke script is added, update `.codex/project-ops-workflow.json` and docs consistently.

5. Release documentation:
   - Update README with Phase 5 status and validation commands.
   - Add a final Phase 5 validation report.
   - Document what remains for a later explicit v2.0 social/platform phase: Firebase/global leaderboards, PWA service worker, native app packaging, and mobile hardware matrix.

## 3. Non-Scope

- Do not add Firebase, Supabase, accounts, cloud saves, global leaderboards, remote telemetry, analytics, or external backend calls.
- Do not add PWA service-worker caching in this phase. A manifest-only change is allowed only if it is trivial, validated, and does not introduce caching/update risks.
- Do not add Capacitor, Cordova, Electron, app-store packaging, or native mobile build tooling.
- Do not migrate to Pixi/WebGL/shaders or introduce large rendering dependencies.
- Do not add new enemies, weapons, maps, bosses, quests, currencies, paid items, or economy rebalancing.
- Do not rewrite the whole UI or replace the existing neon/CRT identity.
- Do not commit `dist/`, `node_modules/`, temporary screenshots, browser cache, or local PID files.
- Do not sacrifice Phase 1/2/3/4 smoke coverage.

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

- Validation failed: do not commit, do not push, do not proceed to the next round.
- Validation passed but commit failed: do not proceed to the next round.
- Commit passed but push failed: do not proceed to the next round.
- Push passed: record commit hash and remote branch, then proceed.

## 5. Commit And Push Workflow

Prefer the project wrapper:

```powershell
C:\Users\Administrator\.codex\skills\project-git-workflow\scripts\git\Status.cmd
C:\Users\Administrator\.codex\skills\project-git-workflow\scripts\git\CommitAndPush.cmd -Message "<message>" -Paths <phase-relevant-files>
```

At minimum, run before commit:

```powershell
npm run check:src
npm run smoke:logic
npm run build
git diff --check
```

For final validation also run:

```powershell
C:\Users\Administrator\.codex\skills\project-ops-workflow\scripts\ops\Validate.cmd
C:\Users\Administrator\.codex\skills\project-ops-workflow\scripts\ops\StartDevServer.cmd
C:\Users\Administrator\.codex\skills\project-ops-workflow\scripts\ops\StopDevServer.cmd
```

If a new npm script, smoke operation, or dev/preview server operation is added, update `.codex/project-ops-workflow.json`, `.codex/project-ops-workflow.md`, and any relevant README instructions.

## 6. Round Plan

### Rounds 1-2: Settings Store And Quality Preference

- Add a settings data module with schema version, defaults, read/write/sanitize helpers, and smoke coverage.
- Persist render quality and optional audio/fullscreen preferences separately from meta progression.
- Extend `renderQuality` resolution so settings can be the normal source of truth while dev URL override remains deterministic.
- Validate with `npm run check:src`, `npm run smoke:logic`, `npm run build`, and `git diff --check`.

### Rounds 3-5: Settings Panel UI

- Add a compact settings overlay reachable from menu and game over.
- Use segmented controls or buttons for quality options, a toggle for audio, and a fullscreen action if supported.
- Keep the panel accessible and scannable on desktop and mobile widths.
- Make settings apply predictably. If dynamic quality switching is risky, apply on the next run or next reload and state that in UI/report.
- Smoke the UI state transitions and storage effects.

### Rounds 6-8: Mobile Viewport And Fullscreen Polish

- Audit HUD/menu/shop/settings layout at narrow and short viewport sizes.
- Add safe-area-aware spacing and stable dimensions where needed.
- Keep touch controls visible and non-overlapping with core HUD and overlays.
- Add fullscreen request handling through a user gesture and graceful unsupported/denied states.
- Browser smoke should include at least one desktop viewport and one narrow mobile-like viewport when available.

### Rounds 9-10: Production/Dev Gating Hardening

- Verify and, where needed, strengthen that dev debug state, `erStress`, and `erSeedMeta` only work in dev mode.
- Add smoke or static checks for production build behavior. Prefer a deterministic script if possible without adding a heavy browser dependency.
- Confirm production build still works under `/EternalRicochet/` path.

### Round 11: Documentation And Release Checklist

- Update README with Phase 5 status, settings/quality behavior, and release validation commands.
- Add a release checklist section or doc that distinguishes local dev smoke, production build smoke, and future social/platform work.
- Document remaining explicit-decision items: Firebase leaderboard, PWA service worker, native packaging, mobile hardware matrix.

### Rounds 12-15: Buffer Fixes

- Use only for validation failures, layout overlap, storage migration issues, production/dev leakage, browser smoke instability, or docs mismatch.
- Do not add new feature scope during buffer rounds.

### Round 16: Final Validation

- Run the full validation matrix:
  - `npm run check:src`
  - `npm run smoke:logic`
  - `npm run build`
  - `C:\Users\Administrator\.codex\skills\project-ops-workflow\scripts\ops\Validate.cmd`
  - `git diff --check`
  - local dev server health
  - browser smoke for menu/start/fire/recall/shop/settings/quality/mobile viewport/console errors
- Add `docs/phase-5-validation-report.md`.
- Commit and push the final report.
- Report back to planner thread `019f1952-5d38-7941-b681-7ff06c097a8d` with final commit, validation, browser evidence, and remaining risks.

## 7. Debug Self-Check

Each round must answer:

- Can this change be explained through one repeatable user workflow or smoke fixture?
- Can failures be localized to settings storage, quality resolution, renderer, audio, fullscreen API, CSS layout, runtime, build, or browser environment?
- Are defaults, malformed localStorage, unsupported fullscreen, denied fullscreen, invalid quality, and old settings schema handled?
- Do menu, game over, shop, settings, start, fire, recall, and stress/debug flows still work?
- If UI changed, was a repeatable browser or logic smoke added?

## 8. Architecture Self-Check

Each round must answer:

- Does runtime state remain the gameplay source of truth?
- Does renderer remain read-only and avoid owning settings persistence or gameplay logic?
- Are settings storage, meta progression storage, high score storage, and dev debug hooks separated?
- Are dev-only URL seeds and debug surfaces still gated away from production?
- Did the phase avoid pulling Firebase, PWA caching, native packaging, WebGL/Pixi, or unrelated economy/content work into this slice?
- Are unrelated files, generated outputs, and user changes left alone?

## 9. PASS Criteria

All must be true:

- Settings storage is sanitized, versioned, persisted, and covered by smoke.
- Users can choose render quality from an in-game settings surface.
- Existing URL-based quality smoke remains deterministic in dev mode or has a documented/tested replacement.
- Audio/fullscreen settings either work or fail gracefully with clear state handling.
- Mobile/narrow layout has no obvious overlap in menu, HUD, shop, settings, and game over.
- Production build does not expose dev debug state or activate dev-only seeds.
- Phase 1/2/3/4 smoke remains PASS.
- `npm run check:src` PASS.
- `npm run smoke:logic` PASS and covers Phase 5 settings/gating behavior.
- `npm run build` PASS.
- Project `Validate.cmd` PASS.
- Local dev server health check PASS.
- Browser smoke PASS for menu/start/fire/recall/shop/settings/quality/mobile viewport/console errors.
- README and final report accurately describe scope, validation, and remaining v2.0 decisions.
- All phase-relevant commits are pushed to `origin/main`.

## 10. Final Report Template

```text
Phase 5 execution completion report

Result: PASS / BLOCKED / PARTIAL
Commits:
- <hash> <message>

Completed scope:
- ...

Settings and production readiness:
- Settings storage:
- Quality selection:
- Audio/fullscreen:
- Production/dev gating:
- Mobile viewport:

Validation:
- <command>: <result>

Browser smoke:
- <url/viewport/workflow>: <result>

Remaining risks:
- ...

Buffer rounds consumed:
- ...
```

