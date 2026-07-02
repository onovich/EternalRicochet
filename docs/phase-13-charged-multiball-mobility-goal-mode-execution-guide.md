# Phase 13 Charged Multiball Mobility Goal 模式执行指南

日期：2026-07-02T12:13:45.7946966+08:00
状态：给执行者使用的 Phase 13 开发指令文档
Planner thread: 019f1952-5d38-7941-b681-7ff06c097a8d
Executor thread: 019f1cd9-0ad1-7833-b73b-0831805c494f
Workspace: D:\WebProjects\EternalRicochet
Round budget: 16 executor rounds maximum
Planner return target: 019f1952-5d38-7941-b681-7ff06c097a8d

## 0. 直接给执行者的 Goal Prompt

Use `$donextgoal` to execute Phase 13 in `D:\WebProjects\EternalRicochet`.

Goal: implement the user-approved gameplay expansion for charged shots, moving ricochet obstacles, universal enemy rebound, multiball upgrades, ultimate-use upgrades, a radial clear ultimate, Space dash with evasion, and better low-speed bullet pickup. This phase reopens the project only for these gameplay mechanics after the Phase 12 freeze. Keep the work local/offline and gameplay-only.

You must validate and push each completed round before moving to the next round. Do not implement backend leaderboards, real network submission, native packaging, new platform phases, or additional roadmap scope.

## 1. 必读上下文

- `docs/phase-12-planner-check-report.md`
- `docs/post-phase-12-project-freeze.md`
- `docs/phase-12-validation-report.md`
- `docs/release-readiness-checklist.md`
- `README.md`
- `Role.md`
- `src/data/gameConfig.js`
- `src/logic/engine/input.js`
- `src/logic/engine/entities.js`
- `src/logic/engine/collisions.js`
- `src/logic/engine/gameRuntime.js`
- `src/logic/engine/level.js`
- `src/logic/engine/metaProgression.js`
- `src/logic/engine/hud.js`
- `src/logic/engine/renderer.js`
- `src/view/components/upgradeShop.js`
- `index.html`
- `scripts/smoke-core.mjs`
- `scripts/smoke-service-worker.mjs`
- `scripts/smoke-release-gates.mjs`
- `scripts/smoke-pwa.mjs`

Route and product context:

- The user explicitly reopened work on 2026-07-02 for the seven gameplay requirements in this guide.
- The Phase 12 freeze remains the default after this phase unless the user explicitly continues again.
- Backend leaderboard work remains unapproved candidate/forbidden scope only.
- Service-worker/PWA runtime from Phase 12 must stay intact; this phase should only change app-shell content through normal Vite build output.

## 2. 本阶段要完成什么

Implement these user requirements as one coherent gameplay slice:

1. Charged shots.
   - Mouse: left button down starts charging, release fires.
   - Touch: right-stick aim/drag should support a bounded charge window before release.
   - Charge has minimum and maximum power; quick release fires at minimum power.
   - Charge cannot grow infinitely and must be config-driven.
   - Render a clear charge indicator near the player/aim line.
   - Firing should pass charge power into `Bullet.fireFrom` and map it to velocity between configured min/max shot speed.

2. Moving ricochet obstacles.
   - Existing obstacle layout becomes deterministic moving obstacle definitions.
   - Movement should be rich but readable: use a small set of ordered path types such as orbit, ellipse, horizontal patrol, vertical patrol, and lissajous-style offset.
   - Obstacles must stay within arena bounds and avoid obvious player-spawn traps.
   - Collision response should remain stable with moving obstacles. If practical, account for obstacle velocity by reflecting bullet velocity relative to the obstacle surface.
   - Renderer should make motion legible without clutter.

3. Universal enemy rebound.
   - Bullet must rebound when it hits an enemy whether the enemy is killed or survives.
   - On kill, apply rebound first, then any configured kill damping to the reflected velocity.
   - Keep enemy hit cooldowns so one overlap does not multi-hit repeatedly.

4. Multiball upgrade.
   - Add a persistent upgrade that increases the player's total ball count, with a clear cap.
   - Runtime should manage a collection of bullets rather than a single `bullet`.
   - The player can fire while at least one bullet is available.
   - HUD ammo should show available/total balls.
   - Recall and pickup behavior must work with multiple active balls without cross-contaminating trails or cooldowns.

5. Ultimate-use upgrade and radial clear ultimate.
   - Add a persistent upgrade that increases per-run ultimate uses, with a clear cap.
   - Add one ultimate: radial clear around the player.
   - Default key recommendation: `F` for ultimate. Keep it configurable in input logic.
   - Radial clear should remove enemies/projectiles within a configured radius, create feedback, and consume one charge.
   - Award score for killed enemies through existing scoring/combo rules unless that creates balance/test instability; record the chosen behavior.
   - HUD should show ultimate charges.

6. Space dash with evasion.
   - Space becomes dash.
   - Dash uses current movement vector; if there is no movement vector, use aim direction or last movement direction.
   - Dash has cooldown, duration, distance/speed, and invulnerability/evasion frames.
   - Player must avoid damage from enemy/projectile collisions while dashing.
   - Rebind keyboard recall to `R`; keep right-click and touch tap recall. Update menu copy.

7. Low-speed bullet pickup improvement.
   - A bullet that looks stopped should be collectible when the player touches it.
   - Add a higher stopped/settled collect threshold than the current `collectSpeedSq` if needed.
   - Prevent immediate pickup right after firing by adding a minimum active-frame and/or minimum travel-distance gate.
   - Multi-ball pickup should affect only the collected bullet and update HUD ammo.

## 3. 本阶段不做什么

Do not add or change:

- backend services
- real leaderboard network submission
- account/cloud save/provider SDK work
- analytics, telemetry, credentials, API keys, or env files
- backend/provider/API/service-worker caching changes beyond generated app shell output
- push notifications or background sync
- native packaging, Capacitor, Cordova, Electron, app-store metadata
- PWA install prompt expansion
- new enemy families beyond incidental test fixtures
- new monetization or real-money systems
- large rendering dependency migration, Pixi/WebGL/shader work
- unrelated refactors or generated `dist/` commits

## 4. 每轮固定工作流

每轮回复必须包含：

- 本轮目标
- 本轮完成内容
- Debug 自检
- 架构自检
- 已运行验证命令与结果
- commit hash 与 push 结果
- 下一轮目标
- 是否消耗缓冲轮

Debug 自检必须覆盖：

- Can the current change be explained by a smallest gameplay fixture or user workflow?
- Can failures be localized to input, player state, bullet pool, obstacle motion, collision response, scoring, upgrades, HUD, renderer, smoke, browser, or service-worker build output?
- Are success, failure, empty-ammo, max-charge, min-charge, active-run, cooldown, zero-charge, no-ultimate, stopped-ball, immediate-pickup prevention, and multi-ball states covered where relevant?
- If UI changed, was repeatable smoke or browser verification added?
- If persistence changed, are sanitize/read/write/seed/effective-run boundaries covered?

架构自检必须覆盖：

- Does `GAME_CONFIG` remain the source of truth for tunable gameplay values?
- Do input, entity state, collision logic, renderer, HUD, and meta progression remain separated?
- Does the bullet pool avoid duplicating unrelated runtime orchestration logic?
- Do upgrades remain local-only and store-compatible through `metaProgression` sanitization?
- Did the phase avoid backend/provider/native/PWA-roadmap scope?
- Are unrelated files, generated `dist/` output, and user changes left alone?

## 5. 每轮通过后提交推送工作流

推进规则：

- 验证失败：不得提交推送，不得进入下一轮。
- 验证通过但提交失败：不得进入下一轮。
- 提交成功但推送失败：不得进入下一轮。
- 推送成功：记录 commit hash 和远端分支，然后进入下一轮。

Prefer the repository workflow wrapper:

```powershell
C:\Users\Administrator\.codex\skills\project-git-workflow\scripts\git\CommitAndPush.cmd -Message "<message>" -Paths <phase-relevant-files>
```

Do not stage unrelated untracked files or generated `dist/` output.

## 6. 分轮安排

Round 1:
- Read required context, confirm git/remote state, inspect current input/collision/upgrade/runtime/HUD structures.
- Write any small implementation notes into `docs/phase-13-charged-multiball-mobility.md`.

Round 2:
- Add config schema for charge, dash, moving obstacles, multiball upgrade, ultimate upgrade, and low-speed pickup gates.
- Keep defaults conservative and local-only.

Round 3:
- Refactor bullet runtime from one `bullet` to a bullet collection/pool while preserving current single-ball behavior at level 0.
- Update HUD ammo state and debug state.

Round 4:
- Implement charged mouse/touch firing and renderer charge indicator.
- Add smoke coverage for min/max charge speed and quick-release minimum.

Round 5:
- Implement moving obstacles and deterministic path update.
- Add smoke coverage for path determinism, bounds, and collision stability.

Round 6:
- Implement universal enemy rebound on kill and non-kill.
- Add smoke coverage for both killed and surviving enemy rebound.

Round 7:
- Add multiball upgrade persistence, shop copy, effective run config, and smoke coverage.
- Ensure seeded meta state can set the new upgrade.

Round 8:
- Add ultimate-use upgrade, per-run ultimate charges, radial clear behavior, HUD display, scoring choice, and smoke coverage.

Round 9:
- Add Space dash with evasion and recall rebind to `R` plus right-click/touch tap.
- Add smoke coverage for dash cooldown, invulnerability/evasion, and recall still functioning.

Round 10:
- Improve low-speed pickup with min active-frame/travel gate.
- Add smoke coverage for near-stopped pickup and immediate-pickup prevention.

Round 11:
- Update visible menu/HUD text, upgrade descriptions, debug state, and browser smoke affordances.
- Keep text fitting on mobile and desktop.

Round 12:
- Run full `npm run validate`, focused boundary scans, and local browser smoke for charge, multiball, dash, ultimate, moving obstacles, and pickup.

Round 13:
- Buffer fix round for gameplay feel, smoke failures, and mobile/touch input regressions.

Round 14:
- Buffer fix round for UI/HUD layout, service-worker build smoke, or upgrade persistence issues.

Round 15:
- Final validation and docs sync.

Round 16:
- Final report, commit, push, and READY_FOR_CHECK back to planner.

## 7. PASS 标准

Phase 13 can be marked PASS only if all are true:

- Charged shots use bounded min/max power and quick release fires at minimum power.
- Ball launch speed reflects charge and remains clamped by config.
- Moving obstacles follow deterministic, readable, bounded paths.
- Bullet rebounds after enemy hits whether the enemy survives or dies.
- Multiball upgrade increases total ball count with a cap; HUD and debug state expose available/total balls.
- Ultimate-use upgrade increases per-run charges with a cap; radial clear consumes charges and clears nearby enemies/projectiles.
- Space dash provides cooldown-bound evasion and does not conflict with recall.
- Keyboard recall works through `R`; right-click/touch recall still works.
- Near-stopped bullets can be picked up on contact, while immediate post-shot pickup is prevented.
- Meta progression sanitization, purchase, seeding, and effective run config cover all new upgrades.
- `scripts/smoke-core.mjs` covers the new mechanics.
- Browser smoke covers at least: charged shot, Space dash, multiball ammo, radial clear, moving obstacle visibility, low-speed pickup, and no console errors.
- `npm run validate` passes, including service-worker and PWA smoke after gameplay bundle changes.
- `C:\Users\Administrator\.codex\skills\project-ops-workflow\scripts\ops\Validate.cmd` passes.
- Focused boundary scan confirms no backend/provider/network/native/analytics/telemetry/credential scope.
- Final pushed state is clean and aligned with `origin/main`.

## 8. 最终报告模板

Send this shape back to planner thread 019f1952-5d38-7941-b681-7ff06c097a8d:

```text
READY_FOR_CHECK

Phase 13 - Charged Multiball Mobility Slice is complete in D:\WebProjects\EternalRicochet.

Final commit:
- <hash> <subject>

Implemented:
- <charged shot, moving obstacle, rebound, multiball, ultimate, dash, pickup summary>

Validation:
- git diff --check PASS
- npm run validate PASS
- npm run smoke:logic PASS
- npm run smoke:service-worker PASS
- project ops Validate.cmd PASS
- browser gameplay smoke PASS
- focused boundary scan PASS
- git status clean/aligned

Reports:
- docs/phase-13-charged-multiball-mobility.md
- docs/phase-13-validation-report.md

Remaining risks:
- <list>

Non-scope confirmation:
- No backend/provider SDK, real leaderboard network submission, accounts, cloud saves, analytics/telemetry, credentials/env files, push/background sync, native packaging, PWA route expansion, gameplay roadmap beyond this phase, or generated dist commits added.
```
