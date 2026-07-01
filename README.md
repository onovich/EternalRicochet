# Eternal Ricochet

Eternal Ricochet is a single-screen neon arcade survival game built around one reusable ricocheting bullet, enemy waves, recall combat, CRT styling, and Web Audio sound effects.<br/>**Eternal Ricochet 是一款单屏霓虹街机生存游戏，核心围绕一颗可反弹、可召回的子弹、敌潮、生存战斗、CRT 视觉和 Web Audio 音效展开。**

The project has been initialized as a Vite-powered static web app for local development, GitHub source control, and GitHub Pages deployment.<br/>**本项目已经初始化为基于 Vite 的静态 Web 应用，可用于本地开发、GitHub 源码管理和 GitHub Pages 部署。**

## Status

- The original prototype is preserved in `origin/index.html` and `origin/design.md`.<br/>**原始原型保留在 `origin/index.html` 和 `origin/design.md`。**
- The runnable app entry is now `index.html` plus `src/main.js`.<br/>**当前可运行入口为 `index.html` 与 `src/main.js`。**
- The gameplay runtime now starts through `createGameRuntime` in `src/logic/engine/gameRuntime.js`; `src/logic/engine/legacyGame.js` remains as a compatibility facade.<br/>**游戏运行时现在通过 `src/logic/engine/gameRuntime.js` 中的 `createGameRuntime` 启动；`src/logic/engine/legacyGame.js` 保留为兼容入口。**
- Core responsibilities are split across named modules for config, vector math, input, audio, HUD, entities, collisions, rendering, and runtime orchestration.<br/>**核心职责已拆分到配置、向量数学、输入、音频、HUD、实体、碰撞、渲染和运行时组织模块。**
- Bullet firing now resets position, velocity, recall state, trail history, and enemy-hit cooldowns through `Bullet.fireFrom`; wall and enemy rebound behavior is config-driven.<br/>**子弹发射现在通过 `Bullet.fireFrom` 重置位置、速度、召回状态、轨迹和敌人命中冷却；墙面和敌人反弹行为由配置控制。**
- Phase 1 completion evidence is recorded in `docs/phase-1-validation-report.md`.<br/>**Phase 1 完成证据已记录在 `docs/phase-1-validation-report.md`。**
- Phase 3 completion evidence is recorded in `docs/phase-3-validation-report.md`; local meta progression now covers credits, an upgrade shop, and three persistent upgrades.<br/>**Phase 3 完成证据记录在 `docs/phase-3-validation-report.md`；本地局外养成现在覆盖货币、升级商店和三项持久升级。**
- Phase 4 completion evidence is recorded in `docs/phase-4-validation-report.md`; the runtime now includes dev metrics, a dev stress seed, a particle pool, render quality tiers, and lightweight Shooter projectile trail feedback.<br/>**Phase 4 完成证据记录在 `docs/phase-4-validation-report.md`；运行时现在包含开发指标、开发压力种子、粒子池、渲染质量档位和轻量 Shooter 弹体拖尾反馈。**
- Phase 5 planning is recorded in `docs/phase-5-release-readiness-goal-mode-execution-guide.md`; the next slice targets release readiness, settings, production/dev gating, and mobile browser polish.<br/>**Phase 5 规划记录在 `docs/phase-5-release-readiness-goal-mode-execution-guide.md`；下一切片聚焦发布就绪、设置入口、生产/开发门控和移动浏览器体验加固。**

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

- `npm install` completed successfully with no reported vulnerabilities.<br/>**`npm install` 已成功完成，未报告漏洞。**
- `npm run check:src` checks every JavaScript source and script file.<br/>**`npm run check:src` 会检查所有 JavaScript 源码和脚本文件。**
- `npm run smoke:logic` covers bullet fire reset, wall rebound, enemy rebound, combo, obstacles, Shooter projectiles, meta progression, performance metrics, render quality, and particle pooling.<br/>**`npm run smoke:logic` 覆盖子弹发射重置、墙面反弹、敌人反弹、连击、障碍物、Shooter 弹体、局外养成、性能指标、渲染质量和粒子池。**
- `npm run build` completed successfully and generated `dist/index.html` plus bundled assets.<br/>**`npm run build` 已成功完成，并生成 `dist/index.html` 及打包资源。**
- Browser smoke testing confirmed menu/start, HUD, canvas rendering, click shooting, recall/collect, upgrade shop open/close, low-quality stress metrics, particle cap behavior, and no page console errors on the local dev server.<br/>**浏览器 smoke 测试确认了菜单启动、HUD、Canvas 渲染、点击射击、召回/拾取、升级商店打开关闭、低质量压力指标、粒子上限行为，以及本地开发服务器页面控制台无错误。**
