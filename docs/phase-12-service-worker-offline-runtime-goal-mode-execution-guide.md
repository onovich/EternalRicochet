# Phase 12 Service Worker Offline Runtime Goal 模式执行指南

日期：2026-07-01T23:08:32.8017195+08:00
状态：给执行者使用的 Phase 12 开发指令文档
Planner thread: 019f1952-5d38-7941-b681-7ff06c097a8d
Executor thread: 019f1cd9-0ad1-7833-b73b-0831805c494f
Workspace: D:\WebProjects\EternalRicochet
Round budget: 16 executor rounds maximum
Planner return target: 019f1952-5d38-7941-b681-7ff06c097a8d

## 0. 直接给执行者的 Goal Prompt

Use `$donextgoal` to execute Phase 12 in `D:\WebProjects\EternalRicochet`.

Goal: implement the first real offline-capable PWA runtime for Eternal Ricochet by adding production service-worker generation, production-only registration, versioned app-shell caching, explicit update/deferred-refresh behavior, rollback/unregister validation, and browser evidence. Keep the implementation app-shell-only: cache only the built static app shell and local manifest/icon assets, never backend/provider/user data.

You must validate and push each completed round before moving to the next round. If any required service-worker browser evidence cannot be produced, stop and report BLOCKED instead of claiming PASS.

## 1. 必读上下文

- `docs/phase-11-planner-check-report.md`
- `docs/phase-11-offline-ux-approval-gate.md`
- `docs/phase-11-validation-report.md`
- `docs/phase-10-offline-cache-strategy.md`
- `docs/release-readiness-checklist.md`
- `README.md`
- `package.json`
- `.github/workflows/deploy.yml`
- `src/main.js`
- `src/App.js`
- `src/logic/engine/gameRuntime.js`
- `src/logic/engine/hud.js`
- `scripts/smoke-offline-readiness.mjs`
- `scripts/smoke-offline-approval-gate.mjs`
- `scripts/smoke-pwa.mjs`
- `scripts/smoke-release-gates.mjs`

Official source ledger to recheck if behavior is uncertain:

- MDN Service Worker API: https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API
- MDN Cache API: https://developer.mozilla.org/en-US/docs/Web/API/Cache
- MDN CacheStorage: https://developer.mozilla.org/en-US/docs/Web/API/CacheStorage
- GitHub Pages custom workflows: https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages

Planner-approved assumptions:

- Phase 11 approval gate is accepted.
- Phase 12 may add service-worker runtime code for the first time.
- Use no Workbox or new runtime dependency.
- Generate the deployed service worker from current `dist/` output after `vite build`, so hashed JS/CSS assets are accurate.
- Register only in production builds and only when the browser supports service workers in a secure or local trusted context.
- Hosted offline capability must not be advertised unless HTTPS hosted evidence passes.

## 2. 本阶段要完成什么

1. Production service-worker generation.
   - Add a dependency-free Node script such as `scripts/generate-service-worker.mjs`.
   - Run it after Vite build so `dist/service-worker.js` contains the current hashed JS/CSS bundle names.
   - Update `npm run build` so GitHub Pages deployment uploads the generated service worker automatically.
   - Use a versioned cache name such as `eternal-ricochet-app-shell-v<date-or-build-token>`.
   - Precache only same-origin app-shell candidates under `/EternalRicochet/`: app root or `index.html`, hashed JS/CSS, manifest, and local SVG icons.
   - Include old-cache cleanup in `activate`.
   - Support explicit `SKIP_WAITING` only after the client asks for it.

2. Production-only registration and status client.
   - Add a small client module such as `src/logic/offline/serviceWorkerClient.js`.
   - Call it from `src/main.js` after the runtime exists.
   - Register `/EternalRicochet/service-worker.js` with scope `/EternalRicochet/`.
   - Register only when `import.meta.env.PROD`, `serviceWorker in navigator`, and the context is secure/trusted.
   - If registration is unsupported or insecure, fail quietly and leave gameplay unchanged.
   - Do not expose dev debug globals in production.

3. Update/deferred-refresh UX.
   - Use the Phase 11 copy as the source of truth.
   - Add a minimal status/prompt surface only if it can be integrated without disrupting gameplay.
   - Never auto-reload during `PLAYING`.
   - If a new worker is waiting during an active run, defer the refresh prompt until menu, settings, or game-over state.
   - Use explicit user action for refresh now; keep a "later" path.
   - Preserve local score, high score, credits, upgrades, quality, audio, and fullscreen preference keys.

4. Fetch strategy.
   - Cache-first for exact precached app-shell assets.
   - Navigation network-first with cached app shell fallback only for same-origin navigations under `/EternalRicochet/`.
   - Network-only for non-GET requests, cross-origin requests, unknown paths, backend/provider/API-looking paths, analytics/telemetry-looking paths, and credentials.
   - Do not cache leaderboard/provider/backend responses, even if future code adds them.

5. Smoke and validation updates.
   - Replace no-service-worker assertions in existing smoke scripts with Phase 12 assertions.
   - Add `npm run smoke:service-worker` or equivalent deterministic static smoke.
   - Static smoke must validate generated `dist/service-worker.js`, cache name/version, precache URLs, registration path/scope, no external URLs, no forbidden providers, no push/background sync, no Workbox, and no runtime dependencies.
   - Keep `npm run validate` as the single full local gate.
   - Keep Phase 11 approval-gate smoke useful by making it validate gate conformance, not "no service worker forever".

6. Browser and hosted evidence.
   - Use a production build plus preview server for local browser checks.
   - Verify first online load, service-worker registration, controlled reload, cached reload, valid-cache offline reload, invalid-cache recovery, update waiting/deferred refresh, rollback/unregister cleanup, and localStorage preservation where feasible.
   - Record evidence in `docs/phase-12-browser-service-worker-smoke.md`.
   - Hosted path smoke must check HTTPS custom-domain behavior before claiming hosted offline capability.
   - If mobile/iOS evidence is unavailable, mark it as remaining release risk and do not claim mobile offline release readiness.

7. Documentation and final report.
   - Update README and release readiness checklist.
   - Add `docs/phase-12-service-worker-offline-runtime.md` with implementation design, cache list, UX behavior, rollback notes, and limitations.
   - Add `docs/phase-12-validation-report.md`.

## 3. 本阶段不做什么

Do not add:

- Workbox or service-worker tooling dependencies
- runtime dependencies
- backend, accounts, cloud saves, public leaderboard UI, provider SDKs, analytics, telemetry, credentials, or env files
- network submission or provider caching
- push notifications
- background sync
- install prompt UI expansion beyond what is needed for update/deferred refresh
- native packaging, Capacitor, Cordova, Electron, app-store metadata, or PWA store packaging
- gameplay, economy, rendering, audio, meta-progression, leaderboard contract, or settings feature changes unrelated to offline status
- caching of localStorage values or generated user data

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

- Can the current change be explained by the smallest relevant browser/service-worker workflow?
- Can failures be localized to generator, build output, registration, install, activate, fetch, cache, update, rollback, browser, hosted path, or UI layer?
- Are success, failure, empty-cache, stale-cache, unsupported-browser, insecure-context, and incompatible-browser states covered where relevant?
- If UI changed, was repeatable smoke or browser verification added?
- If storage or cache state changed, are import/export/validate/cleanup boundaries covered?

架构自检必须覆盖：

- Does Vite build output remain the source of truth for precache candidates?
- Does runtime registration remain thin and separate from service-worker cache logic?
- Are app-shell cache, localStorage persistence, leaderboard contract, settings, and gameplay runtime state separated?
- Did the phase avoid pulling backend/provider/native/push/background-sync scope into this stage?
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

Do not stage unrelated untracked files or generated `dist/` output unless the repository already intentionally tracks that generated file.

## 6. 分轮安排

Round 1:
- Read required context, confirm current git/remote state, inspect build/deploy path, and recheck official docs only where needed.
- Confirm secure-context implications and hosted path assumptions.

Round 2:
- Design implementation details in `docs/phase-12-service-worker-offline-runtime.md`: cache candidates, versioning, fetch strategy, update UX, rollback, validation plan.

Round 3:
- Add production service-worker generator and wire it after Vite build.
- Validate generated `dist/service-worker.js` locally.

Round 4:
- Add production-only registration client and minimal status model.
- Keep unsupported/insecure contexts quiet and gameplay unchanged.

Round 5:
- Add/update small UI surface for update/deferred refresh, using Phase 11 copy.
- Ensure active gameplay is never interrupted.

Round 6:
- Update static smoke scripts for Phase 12 semantics and add `smoke:service-worker`.
- Include it in `npm run validate`.

Round 7:
- Run full local validation and fix static/build issues.

Round 8:
- Run local production preview browser smoke for first load, registration, controlled reload, cache presence, and basic update path.

Round 9:
- Run offline browser smoke for valid-cache reload and invalid-cache recovery.
- If tooling cannot simulate offline, stop and report BLOCKED with exact missing capability.

Round 10:
- Run rollback/unregister browser smoke and localStorage preservation checks.

Round 11:
- Check hosted HTTPS/custom-domain path behavior and record whether hosted offline validation is PASS, PARTIAL, or BLOCKED.

Round 12:
- Update README, release checklist, and browser smoke report.

Round 13:
- Buffer fix round for service-worker lifecycle or browser evidence issues.

Round 14:
- Buffer fix round for smoke/validation/docs drift.

Round 15:
- Final validation matrix and boundary scans.

Round 16:
- Final report, commit, push, and READY_FOR_CHECK back to planner.

## 7. PASS 标准

Phase 12 can be marked PASS only if all are true:

- `npm run build` generates `dist/service-worker.js` from the current build output.
- Production bundle registers `/EternalRicochet/service-worker.js` with scope `/EternalRicochet/` only in supported secure/trusted contexts.
- Versioned cache names and old-cache cleanup are implemented.
- The fetch strategy is app-shell-only and does not cache cross-origin, backend/provider/API, analytics, telemetry, credential, or non-GET requests.
- Update/deferred-refresh behavior never interrupts active gameplay.
- Local score, high score, credits, upgrades, settings, audio, quality, and fullscreen preference storage are preserved across service-worker install/update/rollback smokes.
- `npm run validate` passes and includes service-worker static smoke.
- Browser evidence covers first online load, controlled reload, cached reload, valid-cache offline reload, invalid-cache recovery, update/deferred refresh, rollback/unregister, and local persistence preservation.
- Hosted HTTPS path evidence is recorded. If hosted evidence is partial, the final report must not claim hosted offline release readiness.
- `git diff --check` and project ops `Validate.cmd` pass.
- Final pushed state is clean and aligned with `origin/main`.

## 8. 最终报告模板

Send this shape back to planner thread 019f1952-5d38-7941-b681-7ff06c097a8d:

```text
READY_FOR_CHECK

Phase 12 - Service Worker Offline Runtime Slice is complete in D:\WebProjects\EternalRicochet.

Final commit:
- <hash> <subject>

Implemented:
- <service-worker generator/registration/cache/update/browser/doc summary>

Validation:
- git diff --check PASS
- npm run validate PASS
- npm run smoke:service-worker PASS
- npm run smoke:offline-readiness PASS
- npm run smoke:offline-gate PASS
- project ops Validate.cmd PASS
- local production preview browser smoke PASS
- offline browser smoke PASS/PARTIAL/BLOCKED with reason
- rollback/unregister smoke PASS/PARTIAL/BLOCKED with reason
- hosted HTTPS/custom-domain smoke PASS/PARTIAL/BLOCKED with reason
- git status clean/aligned

Reports:
- docs/phase-12-service-worker-offline-runtime.md
- docs/phase-12-browser-service-worker-smoke.md
- docs/phase-12-validation-report.md

Remaining risks:
- <list>

Non-scope confirmation:
- No Workbox, runtime dependencies, backend/provider caching, analytics/telemetry, credentials, push, background sync, native packaging, gameplay, economy, rendering, audio, meta-progression, or unrelated feature changes added.
```
