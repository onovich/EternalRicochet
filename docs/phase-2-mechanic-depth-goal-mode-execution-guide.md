# Phase 2 - Mechanic Depth Slice Goal 模式执行指南

日期：2026-07-01
状态：给执行者使用的 Phase 2 开发指令文档
策划者线程：019f1952-5d38-7941-b681-7ff06c097a8d
执行者线程：019f1cd9-0ad1-7833-b73b-0831805c494f
轮次预算：18 轮，1-13 为主实现，14-17 为缓冲修复，18 为最终验证

## 0. 直接给执行者的 Goal Prompt

你是 Eternal Ricochet 当前项目的程序执行者。请使用 `$donextgoal` 执行本指南，目标是在 Phase 1 已完成的可维护运行时上，实现原始路线图 v1.1 的机制深度切片：连击系统、霓虹障碍物、Shooter 敌人，并保持已有轨迹重置、墙面回弹、敌人非击杀回弹不回归。

每一轮必须先读本指南和相关源码，完成该轮目标后运行对应验证，验证通过再提交并推送；验证失败、提交失败或推送失败都不得进入下一轮。

## 1. 必读上下文

- `README.md`
- `origin/design.md`
- `docs/phase-1-validation-report.md`
- `docs/phase-1-planner-check-report.md`
- `src/data/gameConfig.js`
- `src/logic/engine/gameRuntime.js`
- `src/logic/engine/entities.js`
- `src/logic/engine/collisions.js`
- `src/logic/engine/renderer.js`
- `src/logic/engine/hud.js`
- `scripts/smoke-core.mjs`
- `.codex/project-git-workflow.md`
- `.codex/project-ops-workflow.md`

当前事实：

- Phase 1 已经 PASS，核心运行时不再是不可维护单体。
- 弹体发射重置、墙面强回弹、敌人非击杀回弹已有逻辑 smoke 保护。
- 原始设计文档的后续路线图中，v1.1 明确包含 Shooter 敌人、几何障碍物、Combo 系统。
- 本阶段是机制深度切片，不是完整商业化扩展。

## 2. 本阶段要完成什么

1. 连击系统：
   - 在一次子弹发射到回收的周期内统计击杀数。
   - 第 1 个击杀为基础倍率，后续击杀提升倍率，例如 X2、X3。
   - 分数结算要有清晰规则，并通过配置暴露倍率上限或成长方式。
   - HUD 要显示当前连击倍率或连击数，只在有意义时出现，收回子弹、重新开始、游戏结束时重置。
   - 击杀逻辑不得散落在 Renderer 或 HUD 中；运行时或得分系统应是 source of truth。

2. 霓虹障碍物：
   - 在游戏场地内生成少量不可摧毁几何障碍物，优先采用圆形或轴对齐矩形，避免一次引入复杂多边形求解。
   - 障碍物必须有配置化尺寸、数量、出生安全半径、颜色和弹性参数。
   - 子弹撞击障碍物要反弹，并保持 Phase 1 的强回弹手感；不得复活 B/D 轨迹残留问题。
   - 玩家出生点、敌人出生点和障碍物不能产生明显不公平重叠。若敌人碰到障碍物，至少要有基础分离或避让，避免卡死。
   - Renderer 只读障碍物状态并绘制霓虹立柱/障碍，不参与物理结算。

3. Shooter 敌人：
   - 新增一种远程敌人，保持与玩家的中距离压力，而不是只向玩家中心追踪。
   - Shooter 要有可读配置：生命值、速度、射程、射击间隔、投射物速度、颜色、得分。
   - Shooter 投射物要有明确生命周期，可命中玩家造成伤害，可被墙面或障碍物清理或反弹，具体选择必须写入报告。
   - 投射物必须与玩家无敌帧、暂停/游戏结束、重开流程兼容。
   - 不要求本阶段做复杂弹幕，只做一个可验证的最小远程威胁。

4. 验证与文档：
   - 扩展 `scripts/smoke-core.mjs` 或新增同等脚本，覆盖连击重置、障碍物反弹、Shooter 投射物基本行为。
   - 保留 Phase 1 的 fire reset、wall rebound、enemy rebound、cooldown smoke。
   - 更新 README 或阶段报告，准确描述新增机制和仍未做的后续路线图。
   - 如新增 npm script 或 wrapper 覆盖范围变化，同步更新 `.codex` workflow 配置。

## 3. 本阶段不做什么

- 不做局外养成、商店、货币、升级项、PWA、Firebase 排行榜。
- 不迁移到 WebGL、Pixi.js、TypeScript 或完整 ECS。
- 不重做视觉风格、菜单结构、控制方案或 GitHub Pages 部署方式。
- 不引入大型依赖来处理少量几何碰撞，除非明确证明原生实现风险更高。
- 不把 `dist/`、`node_modules/`、临时截图或本地缓存纳入提交。
- 不牺牲 Phase 1 已修复的轨迹起点、强回弹、敌人非击杀反弹。

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

### Rounds 1-2: 机制设计落点与安全网

- 读取 Phase 1 模块边界，确认新增机制应该进入哪些模块。
- 设计 Combo、Obstacle、Shooter 的最小数据模型和配置项。
- 先扩展或规划 smoke 测试入口，确保不会只靠手测。
- 验证命令：`npm run check:src`、`npm run smoke:logic`、`npm run build`。

### Rounds 3-5: 连击系统

- 增加 bullet cycle 或 scoring state，记录一次发射周期内击杀数。
- 将击杀得分接入倍率，保证基础分数和高分存储不破坏。
- HUD 增加连击显示，重开、收回、游戏结束时正确清理。
- 更新 smoke 覆盖连击增长、收回重置、重启重置。

### Rounds 6-9: 障碍物系统

- 增加障碍物配置和实体/数据结构，可按画布尺寸生成固定或半固定布局。
- 实现子弹-障碍物碰撞反弹，复用或扩展碰撞法线/反射工具。
- 处理玩家/敌人与障碍物的基础分离或避让，至少避免明显卡死。
- Renderer 绘制障碍物霓虹表现，保持 Canvas 2D 风格。
- 更新 smoke 覆盖障碍物反弹和出生安全距离。

### Rounds 10-13: Shooter 敌人与投射物

- 增加 Shooter enemy type 和配置，融入现有 spawn 概率曲线。
- 实现 Shooter 走位、射击节奏和投射物生命周期。
- 投射物命中玩家时复用玩家受伤反馈与无敌帧规则。
- 让投射物与墙面/障碍物有明确结算，避免无限残留。
- 更新 smoke 覆盖 Shooter 投射物生成、命中或清理、重开清空。

### Rounds 14-17: 缓冲修复与手感调校

- 只处理主实现中发现的 bug、输入回归、碰撞卡死、HUD 溢出、构建失败、smoke 不稳定。
- 调整配置以保证新机制可感知但不过度惩罚玩家。
- 不新增本阶段范围外功能。

### Round 18: 最终验证

- 完整本地验证：语法检查、逻辑 smoke、构建、项目 Validate wrapper。
- 本地 dev server smoke：菜单、开始、HUD、射击、回收、连击显示、障碍物可见、Shooter 可见或可触发。
- 推送最终提交后，给策划者线程回报 commit、验证、剩余风险。

## 7. Debug 自检

每轮至少回答：

- 本轮机制是否能用一个玩家流程复现？
- 失败能否定位到输入、状态推进、碰撞、渲染、HUD、音频、构建或部署中的具体层？
- 新增状态在 start、restart、game over、bullet collect、bullet refire 时是否清理？
- Combo 是否只由真实击杀推进，没有被粒子、渲染或 HUD 重复计算？
- 障碍物是否会造成玩家出生卡住、敌人堆叠卡住、子弹无限抖动？
- Shooter 投射物是否会在游戏结束或重开后残留？

## 8. 架构自检

每轮至少回答：

- 运行时 state 是否仍是 source of truth，而不是 DOM 或渲染缓存？
- Renderer 是否只读状态，避免改变物理或碰撞结果？
- Input 是否仍只产生意图，不直接修改 Bullet、Enemy、Obstacle 或 Projectile？
- 配置是否集中在 `src/data/gameConfig.js` 或同等数据文件，避免魔法数字散落？
- 新机制是否复用了 Phase 1 的向量和碰撞工具，而不是复制相似算法？
- 本轮是否避免把路线图中的 Phase 2+ Meta、PWA、排行榜等延期功能拉进当前阶段？

## 9. PASS 标准

全部满足才算 PASS：

- Combo 系统可玩、可见、可重置，并有自动化验证。
- 障碍物可见，子弹会与障碍物正确反弹，并不会破坏玩家/敌人基本移动。
- Shooter 敌人可生成、可远程施压，投射物生命周期清晰且不会重开残留。
- Phase 1 的 fire reset、trail reset、wall rebound、enemy rebound、cooldown smoke 仍然 PASS。
- `npm run check:src` PASS。
- `npm run smoke:logic` PASS，并覆盖 Phase 2 新机制。
- `npm run build` PASS。
- 项目 `Validate.cmd` PASS。
- 本地 dev server health check PASS。
- README 或阶段报告准确描述新增机制与剩余风险。
- 所有阶段相关提交已推送到 `origin/main`。

## 10. 最终报告模板

```text
Phase 2 执行完成报告

结果：PASS / BLOCKED / PARTIAL
commit:
- <hash> <message>

完成内容：
- ...

机制验证：
- Combo:
- Obstacle:
- Shooter:
- Phase 1 回归项:

验证命令：
- <command>: <result>

浏览器/线上验证：
- <url or local url>: <result>

剩余风险：
- ...

是否使用缓冲轮：
- ...
```

