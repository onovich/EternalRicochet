# Eternal Ricochet

Eternal Ricochet is a single-screen neon arcade survival game built around one reusable ricocheting bullet, enemy waves, recall combat, CRT styling, and Web Audio sound effects.<br/>**Eternal Ricochet 是一款单屏霓虹街机生存游戏，核心围绕一颗可反弹、可召回的子弹、敌潮、生存战斗、CRT 视觉和 Web Audio 音效展开。**

The project has been initialized as a Vite-powered static web app for local development, GitHub source control, and GitHub Pages deployment.<br/>**本项目已经初始化为基于 Vite 的静态 Web 应用，可用于本地开发、GitHub 源码管理和 GitHub Pages 部署。**

## Status

- Phase 5 completion evidence is recorded in `docs/phase-5-validation-report.md`; the runtime now includes a local settings panel, saved render quality/audio/fullscreen preferences, mobile safe-area polish, and release gate smoke checks.
- Phase 6 completion evidence is recorded in `docs/phase-6-validation-report.md`; the project now has a decision-ready platform/social dossier for local-only, backend leaderboard, PWA, and native packaging lanes, with user approval gates before any integration.
- Phase 7 completion evidence is recorded in `docs/phase-7-validation-report.md`; the project now has a local-only leaderboard contract prototype with pure helpers, mocked provider behavior, consent/failure copy, smoke coverage, and no backend/network integration.
- Phase 8 completion evidence is recorded in `docs/phase-8-validation-report.md`; the project now has manifest-first PWA readiness with local icons and smoke checks, while service-worker/offline behavior remains deferred.
- Phase 9 completion evidence is recorded in `docs/phase-9-validation-report.md`; runtime Tailwind CDN and Google Fonts references have been removed, local utility CSS now covers the app shell, and `npm run validate` guards against unapproved external app-shell URLs.
- Phase 10 completion evidence is recorded in `docs/phase-10-validation-report.md`; the project now has an offline-cache strategy and dry-run readiness validation without registering a service worker or claiming offline support.
- Phase 11 completion evidence is recorded in `docs/phase-11-validation-report.md`; the project now has an offline UX/service-worker approval gate, future copy/stale-client/rollback/browser validation docs, and `npm run smoke:offline-gate` before any service-worker implementation.
- Phase 12 completion evidence is recorded in `docs/phase-12-validation-report.md`; the service-worker runtime now has app-shell-only production caching, production-only registration, deferred-refresh UX, rollback validation, and browser/hosted evidence.
- Project route boundary: after Phase 12 closes, active roadmap work stops. No Phase 13, backend leaderboard, real network submission, native packaging, new gameplay, new systems, or additional platform phase should be planned unless the user explicitly reopens the project.

- The original prototype is preserved in `origin/index.html` and `origin/design.md`.<br/>**原始原型保留在 `origin/index.html` 和 `origin/design.md`。**
- The runnable app entry is now `index.html` plus `src/main.js`.<br/>**当前可运行入口为 `index.html` 与 `src/main.js`。**
- The gameplay runtime now starts through `createGameRuntime` in `src/logic/engine/gameRuntime.js`; `src/logic/engine/legacyGame.js` remains as a compatibility facade.<br/>**游戏运行时现在通过 `src/logic/engine/gameRuntime.js` 中的 `createGameRuntime` 启动；`src/logic/engine/legacyGame.js` 保留为兼容入口。**
- Core responsibilities are split across named modules for config, vector math, input, audio, HUD, entities, collisions, rendering, and runtime orchestration.<br/>**核心职责已拆分到配置、向量数学、输入、音频、HUD、实体、碰撞、渲染和运行时组织模块。**
- Bullet firing now resets position, velocity, recall state, trail history, and enemy-hit cooldowns through `Bullet.fireFrom`; wall and enemy rebound behavior is config-driven.<br/>**子弹发射现在通过 `Bullet.fireFrom` 重置位置、速度、召回状态、轨迹和敌人命中冷却；墙面和敌人反弹行为由配置控制。**
- Phase 1 completion evidence is recorded in `docs/phase-1-validation-report.md`.<br/>**Phase 1 完成证据已记录在 `docs/phase-1-validation-report.md`。**
- Phase 3 completion evidence is recorded in `docs/phase-3-validation-report.md`; local meta progression now covers credits, an upgrade shop, and three persistent upgrades.<br/>**Phase 3 完成证据记录在 `docs/phase-3-validation-report.md`；本地局外养成现在覆盖货币、升级商店和三项持久升级。**
- Phase 4 completion evidence is recorded in `docs/phase-4-validation-report.md`; the runtime now includes dev metrics, a dev stress seed, a particle pool, render quality tiers, and lightweight Shooter projectile trail feedback.<br/>**Phase 4 完成证据记录在 `docs/phase-4-validation-report.md`；运行时现在包含开发指标、开发压力种子、粒子池、渲染质量档位和轻量 Shooter 弹体拖尾反馈。**

## Run Locally

Install dependencies once.<br/>**首次运行前安装依赖。**

```powershell
npm install
```

Start the Vite dev server and open the URL printed by Vite. For GitHub Pages parity, use the `/EternalRicochet/` path.<br/>**启动 Vite 开发服务器，并打开 Vite 输出的地址。为了与 GitHub Pages 路径一致，请使用 `/EternalRicochet/` 路径。**

```powershell
npm run dev
```

On Windows, `RunLocal.cmd` starts the app with fallback ports and opens the browser automatically.<br/>**在 Windows 上，`RunLocal.cmd` 会使用备用端口策略启动应用，并自动打开浏览器。**

```powershell
.\RunLocal.cmd
```

## Build

Create the static production build in `dist/`.<br/>**在 `dist/` 中生成静态生产构建。**

```powershell
npm run build
```

The build has been verified locally with Vite and emits asset paths under `/EternalRicochet/` for project-page hosting.<br/>**构建已通过本地 Vite 验证，并为项目页托管输出 `/EternalRicochet/` 前缀资源路径。**

## Deployment

GitHub Pages deployment is configured through `.github/workflows/deploy.yml` using the official Pages actions.<br/>**GitHub Pages 部署已通过 `.github/workflows/deploy.yml` 配置，使用官方 Pages Actions。**

The repository Pages settings currently resolve the site to `http://blog.onovich.com/EternalRicochet/`; `https://onovich.github.io/EternalRicochet/` redirects to that custom domain.<br/>**当前仓库 Pages 设置会将站点解析到 `http://blog.onovich.com/EternalRicochet/`；`https://onovich.github.io/EternalRicochet/` 会跳转到该自定义域名。**

## Repository

Remote repository:<br/>**远端仓库：**

```text
git@github.com:onovich/EternalRicochet.git
```

## Validation

- `npm run validate` runs source checks, logic smoke, production build, asset locality smoke, offline readiness smoke, service-worker smoke, offline approval-gate smoke, release gate smoke, and PWA manifest/runtime smoke.
- `npm run smoke:assets` checks guarded runtime source and production output for unapproved external app-shell URLs, including Tailwind CDN and Google Fonts regressions.
- `npm run smoke:offline-readiness` inspects built `dist/` cache candidates and the generated `dist/service-worker.js`, then fails on source/public service-worker files, Workbox tooling, unapproved external runtime URLs, provider/backend scope, or missing hosted-path assets.
- `npm run smoke:service-worker` checks cache versioning, precache URLs, registration path/scope, secure-context gating, update copy, and forbidden runtime/dependency boundaries.
- `npm run smoke:offline-gate` checks the Phase 11 approval document and confirms the Phase 12 runtime stays inside the approved app-shell-only service-worker gate.
- `npm run smoke:release` checks production asset pathing, manifest asset emission, and verifies dev debug hooks are not exposed in the production bundle.
- `npm run smoke:pwa` checks manifest metadata, local icon assets, hosted `/EternalRicochet/` paths, production `dist/` output, and the Phase 12 service-worker boundary.

- `npm install` completed successfully with no reported vulnerabilities.<br/>**`npm install` 已成功完成，未报告漏洞。**
- `npm run check:src` checks every JavaScript source and script file.<br/>**`npm run check:src` 会检查所有 JavaScript 源码和脚本文件。**
- `npm run smoke:logic` covers bullet fire reset, wall rebound, enemy rebound, combo, obstacles, Shooter projectiles, meta progression, performance metrics, render quality, particle pooling, local leaderboard contract validation, mocked provider states, consent copy, and boundary guards.<br/>**`npm run smoke:logic` 覆盖子弹发射重置、墙面反弹、敌人反弹、连击、障碍物、Shooter 弹体、局外养成、性能指标、渲染质量、粒子池、本地排行榜合约验证、模拟 provider 状态、同意文案和边界护栏。**
- `npm run build` completed successfully and generated `dist/index.html` plus bundled assets.<br/>**`npm run build` 已成功完成，并生成 `dist/index.html` 及打包资源。**
- Browser smoke testing confirmed menu/start, HUD, canvas rendering, click shooting, recall/collect, upgrade shop open/close, low-quality stress metrics, particle cap behavior, and no page console errors on the local dev server.<br/>**浏览器 smoke 测试确认了菜单启动、HUD、Canvas 渲染、点击射击、召回/拾取、升级商店打开关闭、低质量压力指标、粒子上限行为，以及本地开发服务器页面控制台无错误。**
