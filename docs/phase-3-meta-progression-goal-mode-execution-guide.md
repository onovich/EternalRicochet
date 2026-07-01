# Phase 3 - Meta Progression Slice Goal 模式执行指南

日期：2026-07-01
状态：给执行者使用的 Phase 3 开发指令文档
策划者线程：019f1952-5d38-7941-b681-7ff06c097a8d
执行者线程：019f1cd9-0ad1-7833-b73b-0831805c494f
轮次预算：18 轮，1-13 为主实现，14-17 为缓冲修复，18 为最终验证

## 0. 直接给执行者的 Goal Prompt

你是 Eternal Ricochet 当前项目的程序执行者。请使用 `$donextgoal` 执行本指南，目标是在 Phase 2 已完成的机制深度切片上，实现原始路线图 v1.2 的局外养成最小闭环：本地货币、升级商店、三项可购买升级，并保持 Phase 1/2 的核心战斗、连击、障碍物、Shooter 与 projectile smoke 不回归。

每一轮必须先读本指南和相关源码，完成该轮目标后运行对应验证，验证通过再提交并推送；验证失败、提交失败或推送失败都不得进入下一轮。

## 1. 必读上下文

- `README.md`
- `origin/design.md`
- `docs/phase-2-validation-report.md`
- `docs/phase-2-planner-check-report.md`
- `src/data/gameConfig.js`
- `src/logic/engine/gameRuntime.js`
- `src/logic/engine/scoring.js`
- `src/logic/engine/entities.js`
- `src/logic/engine/hud.js`
- `src/logic/engine/renderer.js`
- `src/main.js`
- `index.html`
- `scripts/smoke-core.mjs`
- `.codex/project-git-workflow.md`
- `.codex/project-ops-workflow.md`

当前事实：

- Phase 1 已经完成可维护核心和回弹手感修复。
- Phase 2 已经完成 combo、障碍物、Shooter 和 projectile 的最小可玩切片。
- 原始路线图下一步是 v1.2 Meta-Progression：localStorage 货币、商店/升级界面、引力强化、穿甲弹头、能量护盾。
- 本阶段只做本地单机局外养成闭环，不做账号、云同步、排行榜或付费系统。

## 2. 本阶段要完成什么

1. 本地货币与结算：
   - 在一局结束时将本局得分按清晰规则转换为货币，例如 `creditsEarned = floor(score / N)`，规则必须配置化。
   - 使用 `localStorage` 保存总货币、升级等级和必要版本号。
   - 读写存档必须容错：空存档、旧格式、坏 JSON、负数或超大值都不能让游戏崩溃。
   - 游戏结束界面要显示本局得分、获得货币和当前总货币。

2. 升级商店界面：
   - 在菜单或游戏结束界面提供 `UPGRADES` / 商店入口。
   - 商店应显示三项升级、当前等级、下一等级价格、效果摘要、购买按钮和余额。
   - 购买成功要立即更新余额/等级；余额不足、满级、坏存档都要有稳定 UI 状态。
   - UI 可以使用现有 DOM/CSS 风格，不重做整体菜单，不新增复杂页面路由。

3. 三项升级效果：
   - 引力强化：提升召回加速度或召回拖拽表现，需配置化并能在 runtime 中应用。
   - 穿甲弹头：减少击杀敌人后的速度衰减或提升命中后保能，需避免无限加速。
   - 能量护盾：提升玩家最大 HP，建议每级 +1，但要有上限。
   - 每项升级都要有明确等级上限、价格曲线和效果曲线。
   - 升级效果只影响新开局或明确的重启边界；不要在一局进行中产生难以解释的半状态。

4. 验证与文档：
   - 扩展 `scripts/smoke-core.mjs` 或新增同等脚本，覆盖存档解析、货币结算、购买成功/失败、升级效果应用。
   - 保留 Phase 1/2 smoke：fire reset、trail reset、wall rebound、enemy rebound、cooldown、combo、obstacles、Shooter projectile lifecycle。
   - 更新 README 或阶段报告，准确描述新增局外成长和剩余风险。
   - 如新增 npm script 或 wrapper 覆盖范围变化，同步更新 `.codex` workflow 配置。

## 3. 本阶段不做什么

- 不做 Firebase、全球排行榜、账号系统、云存档、真实货币、广告或任何联网经济。
- 不做 PWA、Capacitor、App Store / APK 打包。
- 不迁移到 WebGL、Pixi.js、TypeScript 或完整 ECS。
- 不新增本阶段外敌人、武器、地图、Boss 或复杂任务系统。
- 不重做美术风格、核心控制方案或 GitHub Pages 部署方式。
- 不把 `dist/`、`node_modules/`、临时截图或本地缓存纳入提交。
- 不牺牲 Phase 1/2 已修复和已验证的战斗核心。

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

推进规则：

- 验证失败：不得提交推送，不得进入下一轮。
- 验证通过但提交失败：不得进入下一轮。
- 提交成功但推送失败：不得进入下一轮。
- 推送成功：记录 commit hash 和远端分支，再进入下一轮。

## 5. 每轮通过后提交推送工作流

优先使用项目 git wrapper：

```powershell
C:\Users\Administrator\.codex\skills\project-git-workflow\scripts\git\Status.cmd
C:\Users\Administrator\.codex\skills\project-git-workflow\scripts\git\CommitAndPush.cmd -Message "<message>" -Paths <phase-relevant-files>
```

提交前至少运行：

```powershell
npm run check:src
npm run smoke:logic
npm run build
```

项目级整体验证优先使用：

```powershell
C:\Users\Administrator\.codex\skills\project-ops-workflow\scripts\ops\Validate.cmd
```

如果新增 dev-server 或 smoke wrapper 覆盖项，必须同步更新 `.codex/project-ops-workflow.json` 与 `.codex/project-git-workflow.json`。

## 6. 分轮安排

### Rounds 1-2: 存档模型与安全网

- 设计 `metaProgression` 配置、存档 schema、默认值和版本字段。
- 新增持久化模块，例如 `src/logic/engine/metaProgression.js`，集中处理 localStorage 读写、sanitize、purchase、earn credits。
- 扩展 smoke 覆盖空存档、坏 JSON、购买成功、余额不足、满级。
- 验证命令：`npm run check:src`、`npm run smoke:logic`、`npm run build`。

### Rounds 3-5: 货币结算与 Game Over 集成

- 在 endGame 或结算边界计算并保存本局货币。
- Game Over UI 显示本局获得货币和总货币。
- 重开游戏不重复发放同一局奖励。
- 更新 smoke 覆盖一局结算只发放一次。

### Rounds 6-9: 商店 UI

- 在主菜单或 Game Over 菜单加入升级入口和返回按钮。
- 渲染三项升级卡片/行，显示等级、价格、效果和购买状态。
- 购买后刷新 UI 和本地存档，不需要刷新页面。
- 保持移动端和桌面布局不遮挡开始/重启流程。

### Rounds 10-13: 升级效果应用

- 引力强化应用到 `Bullet` 或 runtime config，保持配置化。
- 穿甲弹头应用到击杀后速度衰减/保能，保持速度 clamp。
- 能量护盾应用到 `Player` 最大 HP 和 HUD。
- 确保升级效果只在新开局边界读取，避免一局中途突变。
- 更新 smoke 覆盖每项升级对 runtime 参数或实体状态的影响。

### Rounds 14-17: 缓冲修复与体验收口

- 只处理主实现中发现的存档损坏、重复发币、UI 溢出、移动端遮挡、验证不稳定、构建失败。
- 调整价格和收益曲线到可体验但不过快毕业。
- 不新增本阶段范围外功能。

### Round 18: 最终验证

- 完整本地验证：语法检查、逻辑 smoke、构建、项目 Validate wrapper。
- 本地 dev server smoke：菜单、开始、游戏结束或可控结算、商店打开、购买成功/失败状态、升级后新局效果、控制台无错误。
- 推送最终提交后，给策划者线程回报 commit、验证、剩余风险。

## 7. Debug 自检

每轮至少回答：

- 本轮机制是否能用一个玩家流程复现？
- 失败能否定位到存档、结算、商店 UI、升级应用、运行时、渲染、构建或部署中的具体层？
- 空存档、坏存档、余额不足、满级、重开、Game Over、刷新页面后状态是否稳定？
- 货币是否只在一局结束时发放一次？
- 升级是否只在明确边界应用，不产生半局突变？
- Phase 1/2 核心战斗 smoke 是否仍然绿色？

## 8. 架构自检

每轮至少回答：

- 运行时 state 是否仍是 source of truth，而不是 DOM 或渲染缓存？
- localStorage 读写是否集中在 meta progression 模块，避免散落在 UI/renderer 中？
- 商店 UI 是否只调用明确的 purchase/apply API，不直接改实体内部状态？
- 配置是否集中在 `src/data/gameConfig.js` 或同等数据文件，避免魔法数字散落？
- 新机制是否复用了现有 HUD/runtime 边界，而不是把菜单、存档和战斗逻辑混在一起？
- 本轮是否避免把排行榜、PWA、云存档、WebGL 等延期功能拉进当前阶段？

## 9. PASS 标准

全部满足才算 PASS：

- 本地货币能从 Game Over 结算保存，且不会重复结算同一局。
- 商店 UI 可打开、返回、显示余额/等级/价格/效果，并处理购买成功、余额不足和满级状态。
- 引力强化、穿甲弹头、能量护盾三项升级能购买、持久化，并在新局中产生可验证效果。
- 存档读取对空值、坏 JSON 和旧格式有容错。
- Phase 1/2 smoke 仍然 PASS。
- `npm run check:src` PASS。
- `npm run smoke:logic` PASS，并覆盖 Phase 3 新机制。
- `npm run build` PASS。
- 项目 `Validate.cmd` PASS。
- 本地 dev server health check PASS。
- README 或阶段报告准确描述新增机制与剩余风险。
- 所有阶段相关提交已推送到 `origin/main`。

## 10. 最终报告模板

```text
Phase 3 执行完成报告

结果：PASS / BLOCKED / PARTIAL
commit:
- <hash> <message>

完成内容：
- ...

机制验证：
- Currency:
- Shop:
- Upgrade effects:
- Phase 1/2 回归项:

验证命令：
- <command>: <result>

浏览器/线上验证：
- <url or local url>: <result>

剩余风险：
- ...

是否使用缓冲轮：
- ...
```

