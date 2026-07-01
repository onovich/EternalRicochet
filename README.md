# Eternal Ricochet

Eternal Ricochet is a single-screen neon arcade survival game built around one reusable ricocheting bullet, enemy waves, recall combat, CRT styling, and Web Audio sound effects.<br/>**Eternal Ricochet 是一款单屏霓虹街机生存游戏，核心围绕一颗可反弹、可召回的子弹、敌潮、生存战斗、CRT 视觉和 Web Audio 音效展开。**

The project has been initialized as a Vite-powered static web app for local development, GitHub source control, and GitHub Pages deployment.<br/>**本项目已经初始化为基于 Vite 的静态 Web 应用，可用于本地开发、GitHub 源码管理和 GitHub Pages 部署。**

## Status

- The original prototype is preserved in `origin/index.html` and `origin/design.md`.<br/>**原始原型保留在 `origin/index.html` 和 `origin/design.md`。**
- The runnable app entry is now `index.html` plus `src/main.js`.<br/>**当前可运行入口为 `index.html` 与 `src/main.js`。**
- The gameplay loop has been moved into `src/logic/engine/legacyGame.js` as a preserved engine baseline.<br/>**游戏主循环已迁入 `src/logic/engine/legacyGame.js`，作为保留行为的引擎基线。**
- `src/data`, `src/logic/hooks`, `src/view/screens`, and `src/view/components` provide the first migration boundaries, but the game logic is not yet fully decomposed into small engine modules.<br/>**`src/data`、`src/logic/hooks`、`src/view/screens` 和 `src/view/components` 已建立第一层迁移边界，但游戏逻辑尚未完全拆成细粒度引擎模块。**
- The active refactor and ricochet-feel execution guide is `docs/maintenance-physics-p1-goal-mode-execution-guide.md`.<br/>**当前重构与回弹手感执行指南为 `docs/maintenance-physics-p1-goal-mode-execution-guide.md`。**

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
- `npm run build` completed successfully and generated `dist/index.html` plus bundled assets.<br/>**`npm run build` 已成功完成，并生成 `dist/index.html` 及打包资源。**
- Browser smoke testing confirmed the menu, restart flow, HUD, canvas rendering, and no browser console errors on the local dev server.<br/>**浏览器 smoke 测试已确认菜单、重启流程、HUD、Canvas 渲染正常，本地开发服务器无浏览器控制台错误。**
