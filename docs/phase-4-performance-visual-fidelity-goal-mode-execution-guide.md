# Phase 4 - Performance And Visual Fidelity Slice Goal 模式执行指南

日期：2026-07-01
状态：给执行者使用的 Phase 4 开发指令文档
策划者线程：019f1952-5d38-7941-b681-7ff06c097a8d
执行者线程：019f1cd9-0ad1-7833-b73b-0831805c494f
轮次预算：18 轮，1-13 为主实现，14-17 为缓冲修复，18 为最终验证

## 0. 直接给执行者的 Goal Prompt

你是 Eternal Ricochet 当前项目的程序执行者。请使用 `$donextgoal` 执行本指南，目标是在 Phase 3 已完成的局外养成闭环上，实现原始路线图 v1.3 的性能与表现力切片：建立可重复性能基线，降低 Canvas 2D 高 glow/high particle 场景的风险，加入质量档位和对象池/渲染优化，并在不破坏 Phase 1/2/3 核心玩法与存档的前提下提升视觉反馈。

每一轮必须先读本指南和相关源码，完成该轮目标后运行对应验证，验证通过再提交并推送；验证失败、提交失败或推送失败都不得进入下一轮。

## 1. 必读上下文

- `README.md`
- `origin/design.md`
- `docs/phase-3-validation-report.md`
- `docs/phase-3-planner-check-report.md`
- `src/data/gameConfig.js`
- `src/logic/engine/gameRuntime.js`
- `src/logic/engine/renderer.js`
- `src/logic/engine/entities.js`
- `src/logic/engine/collisions.js`
- `src/logic/engine/metaProgression.js`
- `src/logic/engine/hud.js`
- `src/main.js`
- `index.html`
- `scripts/smoke-core.mjs`
- `.codex/project-git-workflow.md`
- `.codex/project-ops-workflow.md`

当前事实：

- Phase 1 已完成核心重构、轨迹重置、墙/敌人回弹。
- Phase 2 已完成 combo、障碍物、Shooter 和 projectile。
- Phase 3 已完成 localStorage 货币、升级商店和三项升级。
- 原始路线图 v1.3 提到 Canvas 2D `shadowBlur` 高成本、Renderer 迁移和 Bloom/色差等后处理。
- 本阶段采取保守切片：先建立指标、优化 Canvas 2D、对象池和质量档位；不直接强推 Pixi/WebGL 大迁移，除非阶段内证据证明 Canvas 2D 无法满足目标且 planner 明确同意。

## 2. 本阶段要完成什么

1. 性能基线与可观测性：
   - 增加 dev-only 性能统计，例如平均 frame time、最近最差 frame、实体数量、粒子数量、projectile 数量、quality tier。
   - 增加 deterministic stress/smoke 入口或脚本，能在本地浏览器稳定制造高粒子/高敌人/高 projectile 场景。
   - 性能统计只能作为 dev/debug 数据，不要污染正式 UI。
   - README 或阶段报告要记录 baseline 和优化后指标，至少说明采样方式。

2. 对象池与分配控制：
   - 优先为粒子系统做对象池，因为粒子是高频生成/销毁热点。
   - 如果证据显示 projectile 或 enemy 也有明显分配压力，可做小范围池化，但不要一次重写所有实体管理。
   - 对象池必须有容量上限、清空/重置 API、重开游戏清理逻辑和 smoke 覆盖。
   - 不允许为了池化破坏现有碰撞、得分、升级、Game Over 或 restart 流程。

3. Canvas 2D 渲染优化：
   - 降低重复 `shadowBlur` 和昂贵路径绘制的成本，优先使用配置化质量档、缓存/复用绘制路径、减少过度 glow。
   - 为低性能档提供可控降级：粒子上限、glow 强度、屏幕震动/尾迹长度或同类参数。
   - 保持原有霓虹风格和 CRT CSS，不做营销页或 UI 大改版。
   - Renderer 仍然只读 runtime state，不参与物理、得分、存档或输入。

4. 表现力小幅增强：
   - 在不增加大量运行成本的前提下增强可读性：例如升级效果提示、combo/kill 高光、projectile 可读轨迹、障碍物命中反馈。
   - 后处理可用 CSS/canvas 轻量方式实现。完整 Bloom/Chromatic shader 只作为调研记录或后续 Phase 候选，不强行落地。

5. 验证与文档：
   - 保留并扩展 `npm run smoke:logic`，覆盖对象池、质量档和性能统计基础行为。
   - 本地 browser smoke 必须覆盖 start/HUD/fire/recall/shop不回归、stress/debug metrics 可读、无控制台错误。
   - 更新 README 或阶段报告，准确描述优化范围、未做 WebGL/Pixi 迁移的原因、剩余性能风险。

## 3. 本阶段不做什么

- 不做 Firebase、排行榜、账号、PWA、Capacitor 或商店分发。
- 不直接迁移到 Pixi.js/WebGL/自写 shader，除非有明确数据和 planner 追加同意。
- 不引入大型渲染依赖或构建复杂 shader pipeline。
- 不重做核心玩法、控制方案、局外养成经济、商店结构或 GitHub Pages 部署方式。
- 不新增本阶段外敌人、武器、地图、Boss 或复杂任务系统。
- 不把 `dist/`、`node_modules/`、临时截图或本地缓存纳入提交。
- 不牺牲 Phase 1/2/3 已验证的核心 smoke。

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

如果新增 npm script、dev-server smoke 或性能脚本，必须同步更新 `.codex/project-ops-workflow.json` 与 `.codex/project-git-workflow.json`。

## 6. 分轮安排

### Rounds 1-2: 性能基线与 smoke 入口

- 增加 dev-only metrics 状态，记录 frame time、实体/粒子/projectile 数量和质量档。
- 设计 stress seed 或 browser smoke 入口，能稳定触发可观测高负载。
- 扩展 logic smoke 覆盖 metrics 聚合和质量档配置。
- 验证命令：`npm run check:src`、`npm run smoke:logic`、`npm run build`。

### Rounds 3-5: 粒子对象池

- 将粒子创建/回收集中到池或 particle system 模块。
- 设置容量上限和溢出策略，例如丢弃最老或不再生成。
- 确保 restart、Game Over、菜单粒子和命中粒子都正确复用/清空。
- 更新 smoke 覆盖 pool acquire/release/reset/capacity。

### Rounds 6-8: Renderer 质量档与 glow 成本控制

- 增加 `renderQuality` 配置，至少支持 high/medium/low 或 auto/default。
- 将 glow 强度、粒子上限、尾迹长度或可读视觉参数纳入质量档。
- 避免 Renderer 写 runtime state；Renderer 只读质量配置和实体状态。
- Browser smoke 验证低质量档和默认档均可启动且无控制台错误。

### Rounds 9-11: 轻量视觉增强

- 增强 combo、升级效果、projectile 或障碍物反馈中的一到两项，保持成本可控。
- 不做完整 shader 后处理；如做 CSS/canvas 轻量后处理，必须能开关并有降级。
- 更新 smoke 或 debug state 确认开关/质量档不破坏玩法。

### Rounds 12-13: 迁移评估与文档

- 基于指标写明是否需要 WebGL/Pixi 迁移，以及如果迁移，建议的下一步边界。
- 更新 README/报告：记录优化前后指标、未迁移原因、剩余性能风险。
- 不在本阶段临时引入 Pixi/WebGL 依赖。

### Rounds 14-17: 缓冲修复与体验收口

- 只处理性能 smoke 不稳定、对象池生命周期错误、低质量档视觉不可读、移动端布局或构建失败。
- 不新增本阶段范围外功能。

### Round 18: 最终验证

- 完整本地验证：语法检查、逻辑 smoke、构建、项目 Validate wrapper。
- 本地 dev server/browser smoke：菜单、开始、射击、召回、商店入口不回归、stress metrics 可读、质量档可用、控制台无错误。
- 推送最终提交后，给策划者线程回报 commit、验证、剩余风险。

## 7. Debug 自检

每轮至少回答：

- 本轮优化是否能用一个可重复 stress 或用户流程解释？
- 失败能否定位到 metrics、pool、renderer、quality tier、runtime、HUD、构建或浏览器环境中的具体层？
- start、restart、Game Over、shop、bullet collect、projectile lifecycle 是否仍稳定？
- 对象池是否会复用脏状态或泄漏 active 对象？
- 低质量档是否仍然保持游戏可读？
- Phase 1/2/3 smoke 是否仍然绿色？

## 8. 架构自检

每轮至少回答：

- 运行时 state 是否仍是 source of truth，而不是 DOM 或渲染缓存？
- Renderer 是否仍只读状态，避免改变物理、得分、存档或输入？
- metrics 是否是 dev/debug 观察数据，而不是玩法逻辑依赖？
- 对象池是否集中管理生命周期，避免散落 new/recycle 逻辑？
- 配置是否集中在 `src/data/gameConfig.js` 或同等数据文件，避免魔法数字散落？
- 本轮是否避免把 WebGL/Pixi、排行榜、PWA 等延期功能拉进当前阶段？

## 9. PASS 标准

全部满足才算 PASS：

- Dev-only performance metrics 可读，并有自动或半自动验证。
- 粒子对象池或等效分配控制落地，有容量上限、reset 行为和 smoke 覆盖。
- Renderer 质量档落地，默认视觉不退化，低质量档可启动且可读。
- 至少一项低成本视觉反馈增强完成，并可开关或随质量档降级。
- Phase 1/2/3 smoke 仍然 PASS。
- `npm run check:src` PASS。
- `npm run smoke:logic` PASS，并覆盖 Phase 4 新机制。
- `npm run build` PASS。
- 项目 `Validate.cmd` PASS。
- 本地 dev server health check PASS。
- Browser smoke PASS，覆盖 start/fire/recall/shop不回归/stress metrics/console。
- README 或阶段报告准确描述优化范围、指标、未做 WebGL/Pixi 迁移的原因和剩余风险。
- 所有阶段相关提交已推送到 `origin/main`。

## 10. 最终报告模板

```text
Phase 4 执行完成报告

结果：PASS / BLOCKED / PARTIAL
commit:
- <hash> <message>

完成内容：
- ...

性能与表现验证：
- Metrics:
- Particle pool / allocation:
- Quality tiers:
- Visual feedback:
- Phase 1/2/3 回归项:

验证命令：
- <command>: <result>

浏览器/线上验证：
- <url or local url>: <result>

迁移评估：
- WebGL/Pixi 是否建议进入下一阶段:
- 原因:

剩余风险：
- ...

是否使用缓冲轮：
- ...
```

