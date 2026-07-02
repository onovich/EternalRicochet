# Phase 13 Charged Multiball Mobility

Date: 2026-07-02
Status: implementation notes for the user-reopened gameplay-only slice

## Boundary

The user explicitly reopened Eternal Ricochet for this gameplay-only phase after the Phase 12 freeze. This phase may change local gameplay mechanics, HUD text, local meta-progression upgrades, logic smoke coverage, and browser smoke docs.

This phase must not implement backend leaderboards, real network submission, accounts, cloud saves, analytics, telemetry, credentials, provider SDKs, native packaging, PWA route expansion, push/background sync, or generated `dist/` commits.

The Phase 12 service-worker runtime remains app-shell-only. Gameplay source changes may alter the generated JS bundle through normal `npm run build`, but cache strategy and service-worker scope should not expand.

## Current Runtime Audit

| Area | Current shape | Phase 13 implication |
| --- | --- | --- |
| Config | Tunables live in `GAME_CONFIG` in `src/data/gameConfig.js`. | Add charge, dash, ultimate, moving-obstacle, multiball, and pickup gates here first. |
| Input | `src/logic/engine/input.js` tracks WASD, Space recall, mouse pending shot, right-click recall, and touch sticks. | Space must become dash; keyboard recall moves to `R`; mouse/touch fire needs charge start/release state. |
| Bullet | `src/logic/engine/entities.js` owns one `Bullet` with `fireFrom`, `update`, recall, trail, and enemy cooldown map. | Add charge speed input and active-frame/travel pickup gates; introduce a bullet pool while preserving single-ball behavior at zero upgrade level. |
| Runtime | `src/logic/engine/gameRuntime.js` stores one `bullet`, passes it to collisions/renderer/HUD/debug/performance. | Replace singleton operations with collection helpers: available bullet, active bullets, per-bullet events, ammo counts, and debug summaries. |
| Obstacles | `level.js` creates static obstacles from normalized layout entries; `Obstacle` stores fixed position. | Layout entries become deterministic moving definitions with origin, path type, velocity metadata, and bounded updates. |
| Collisions | `collisions.js` has wall, obstacle, enemy, player, and projectile collision helpers. Enemy kill currently damps without rebound first. | Apply enemy rebound for killed and surviving enemies; moving obstacle bounce should reflect relative to obstacle velocity when available. |
| Meta progression | `metaProgression.js` creates default upgrade state from config, sanitizes all configured upgrades, and builds effective run config for three upgrades. | New upgrades can reuse this generic persistence path, with added effective run config fields for ball count and ultimate charges. |
| HUD | `hud.js` shows hp, score, combo, and `0/1` ammo from `bulletActive`. | Show available/total balls and ultimate charges. |
| Renderer | `renderer.js` draws one bullet, aim line, static obstacles, and touch joysticks. | Draw every active bullet, moving-obstacle motion hints, dash/ultimate feedback where useful, and charge indicator near aim line. |
| Shop | `upgradeShop.js` renders all configured upgrades and has per-id descriptions for the first three upgrades. | Add multiball and ultimate descriptions; keep card grid readable. |
| Smoke | `scripts/smoke-core.mjs` is the main dependency-free gameplay and persistence smoke. | Add pure coverage for charge speed clamp, moving paths, rebound kill/survive, upgrades, ultimate, dash evasion, and pickup gates. |

## Implementation Shape

### Config

Add conservative defaults under `player`, `bullet`, `obstacles`, `ultimate`, and `metaProgression.upgrades`.

- Charge: min/max power, frames to max, min/max shot speed.
- Dash: cooldown, duration, speed, invulnerability frames, fallback direction behavior.
- Pickup: settled speed threshold, minimum active frames, minimum travel distance.
- Obstacles: movement enabled, path definitions, amplitude/speed limits, spawn-safe bounds.
- Ultimate: radial clear radius, base uses, score behavior, feedback counts.
- Upgrades: `multiball` and `ultimateCap` with max levels, costs, and per-level effects.

### Bullet Collection

Keep `Bullet` as the per-ball entity. Add runtime helpers instead of turning the whole runtime inside out:

- `createBullets(total, config)` or equivalent initialization helper.
- `getAvailableBullet()` for firing.
- `getActiveBullets()` for update/collision/render.
- `getAmmoState()` for HUD and debug.

At multiball level 0, total balls must remain 1 and legacy behavior should feel unchanged.

### Charged Firing

Input should expose a shot request object rather than only an angle:

```text
{ angle, chargeFrames, chargeRatio, chargePower, source }
```

Mouse left down starts charge; release queues shot. Touch right-stick drag starts charge and release queues the shot. Quick release maps to minimum power. Held charge clamps at max power.

`Bullet.fireFrom(origin, angle, options)` should accept charge power or explicit speed and set launch velocity between configured min/max speeds.

### Moving Obstacles

`Obstacle` should retain an origin and expose `update(frame, bounds)` or receive deterministic path data from `level.js`.

Supported path types can be small and readable:

- horizontal patrol
- vertical patrol
- orbit
- ellipse
- lissajous

Each obstacle stores previous position and `vx/vy` so bullet collision can reflect relative to obstacle motion. Bounds clamping must account for radius and `edgePadding`.

### Enemy Rebound

`resolveBulletEnemyCollision` should rebound before kill handling. If the enemy dies, apply configured kill damping after the rebound. Cooldown behavior remains per bullet and per enemy id.

### Ultimate

Runtime tracks per-run charges derived from effective run config. `F` consumes one charge when available. Radial clear removes enemies and enemy projectiles within radius, emits feedback, and awards score for enemies through existing `addScore` so combo rules remain consistent.

### Dash

Space queues dash. Dash direction priority:

1. current movement vector
2. last non-zero movement vector
3. aim direction
4. rightward fallback

During dash/evasion frames, player/enemy and player/projectile damage should no-op while preserving collision cleanup behavior where appropriate.

### Pickup

A non-recalling bullet can be picked up when it is slow enough and touching the player, but only after both immediate-pickup gates pass:

- minimum active frames
- minimum travel distance from origin

Recall pickup remains allowed through its existing tighter recall padding.

## Validation Plan

Round-level validation should use focused commands, with `git diff --check` before every commit. The final matrix must include:

- `npm run validate`
- `npm run smoke:logic`
- `npm run smoke:service-worker`
- `C:\Users\Administrator\.codex\skills\project-ops-workflow\scripts\ops\Validate.cmd`
- focused boundary scan for backend/provider/network/native/analytics/telemetry/credential tokens
- browser gameplay smoke for charged shot, moving obstacle visibility, multiball ammo, ultimate, Space dash, low-speed pickup, and no console errors

## Open Feel Decisions

- Multiball should add one ball per level, capped by config, with all balls using the same recall and pickup rules.
- Radial clear will award score using existing `addScore(enemy.scoreVal)` for each cleared enemy, preserving combo behavior. If this proves too swingy in smoke or browser play, document the adjustment.
- Dash should prioritize readability over speedrunning exploits: short duration, clear cooldown, and invulnerability only while dashing.
- Moving obstacles should be deterministic by frame count, not random, so smoke tests can assert positions and bounds.
