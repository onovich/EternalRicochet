# Phase 1 - Maintainable Core And Ricochet Feel Goal 模式执行指南

日期：2026-07-01
状态：给执行者使用的 Phase 1 开发指令文档
策划者线程：019f1952-5d38-7941-b681-7ff06c097a8d
执行者线程：019f1cd9-0ad1-7833-b73b-0831805c494f
轮次预算：16 轮，1-12 为主实现，13-15 为缓冲修复，16 为最终验证

## 0. 直接给执行者的 Goal Prompt

你是 Eternal Ricochet 当前项目的程序执行者。请使用 `$donextgoal` 执行本指南，目标是在不改变游戏主题与现有核心玩法的前提下，把当前 `legacyGame.js` 原型重构到可长期维护的结构，并修复球轨迹起点错误、增强球弹力、实现未击杀敌人时的反弹。

每一轮必须先读本指南和相关源码，完成该轮目标后运行对应验证，验证通过再提交并推送；验证失败、提交失败或推送失败都不得进入下一轮。

## 1. 必读上下文

- `README.md`
- `origin/design.md`
- `src/logic/engine/legacyGame.js`
- `src/data/gameMetadata.js`
- `src/main.js`
- `.codex/project-git-workflow.md`
- `.codex/project-ops-workflow.md`

当前事实：

- 项目已经是 Vite 静态站，但核心逻辑仍集中在 `src/logic/engine/legacyGame.js`。
- README 已说明现在只是建立了迁移边界，并未完成真正的引擎拆分。
- 原始设计文档要求逻辑、表现、输入、音频、UI 分层；本阶段要把这个方向落到实际代码。

## 2. 本阶段要完成什么

1. 重构方向：
   - 将 `legacyGame.js` 拆成可维护模块，优先拆出配置、数学/几何、输入、音频、实体、碰撞、渲染、HUD/UI 桥接、游戏运行时。
   - 保留一个清晰的启动入口，例如 `createGameRuntime` 或同等函数，让 `src/main.js` 只负责 DOM ready、shell 检查和启动。
   - 建立明确的数据流：输入生成意图，运行时推进状态，碰撞改变实体，渲染只读状态。
   - 保持 Canvas 2D 与 DOM HUD 的用户可见表现，不做大视觉改版。

2. 轨迹问题：
   - 复现并定位用户描述的场景：A 点发射到 B 点停下；玩家在 B 点回收后移动到 D；从 D 向 E 发射时，轨迹不应从 B 开始。
   - 判断是弹体运动状态错误，还是仅 `trail` 绘制状态残留。
   - 修复时必须建立不变量：每次射击都从本次发射点重置弹体位置、速度、召回状态、轨迹缓存和任何上一轮命中/冷却状态。
   - 建议将射击逻辑改为 `bullet.fireFrom({ x: player.x, y: player.y }, angle)` 或同等 API，内部清空并初始化 trail。

3. 弹力与敌人反弹：
   - 墙面弹性要比现有手感更强。当前墙面反弹后还有 `0.85` 衰减，执行者可调整为更高保能值，并加入最低有效反弹速度或速度 clamp，避免强反弹造成无限加速。
   - 子弹击中敌人但未击杀时，应基于碰撞法线产生反弹，而不是只做 `bullet.vx *= 0.8; bullet.vy *= 0.8`。
   - 非击杀命中要有可感知反馈：音效、粒子、轻微屏震或 hit stop 可以保留/增强，但不得让子弹在同一敌人上每帧重复多次伤害。
   - 建议加入短命中冷却或分离步骤，防止反弹后仍重叠导致多次结算。

4. 验证与文档：
   - 更新 README 的架构状态，准确描述已拆分模块与后续仍未完成的部分。
   - 如重构后 `.codex` 验证命令不再覆盖实际入口，更新项目 ops/git workflow 配置。
   - 本地验证必须包含构建、语法检查、浏览器 smoke。线上发布若触发，需确认 Pages workflow 状态。

## 3. 本阶段不做什么

- 不新增 Shooter 敌人、地形、Combo、升级商店、PWA、Firebase 排行榜。
- 不迁移到 WebGL、Pixi.js、TypeScript 或完整 ECS，除非发现不这样无法完成本阶段目标。
- 不重做美术风格、菜单布局或核心控制方案。
- 不把 `dist/`、`node_modules/`、临时截图或本地缓存纳入提交。
- 不为了重构而改变玩家生命、敌人生成曲线、分数规则等未被本需求点名的平衡项。

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
node --check src/logic/engine/legacyGame.js
npm run build
```

如果重构后 `legacyGame.js` 不再是主要文件，需要把语法检查扩展到所有 `src/**/*.js`，并同步更新 `.codex/project-git-workflow.json` 与 `.codex/project-ops-workflow.json`。

## 6. 分轮安排

### Rounds 1-2: 现状诊断与安全网

- 读取核心源码，画出当前输入、弹体、敌人、粒子、HUD、渲染依赖图。
- 用最小方式复现轨迹问题，记录重现步骤。
- 增加轻量可重复验证：可选择浏览器 smoke 脚本、debug overlay 开关、或纯逻辑测试夹具。重点覆盖 Bullet fire/collect/trail 和 enemy hit rebound。
- 验证命令：语法检查、`npm run build`、本地浏览器 smoke。

### Rounds 3-5: 第一层模块拆分

- 抽出 `src/data/gameConfig.js` 或同等配置文件，集中速度、弹性、半径、颜色、spawn 参数、trail 长度。
- 抽出数学/几何工具，例如向量长度、normalize、reflect、clampSpeed、distance。
- 抽出 `audio`、`input`、`uiHud` 模块，运行时通过注入使用它们。
- 保证每轮后游戏仍能启动、菜单可进游戏、HUD 可更新。

### Rounds 6-8: 实体与碰撞边界

- 抽出 Bullet、Player、Enemy、Particle 或同等实体模块。
- 把敌人碰撞和弹体反弹逻辑从 `Enemy.update` 中移出，放到碰撞/系统层，减少实体之间直接写全局状态。
- 建立 Bullet 发射/回收 API，不允许外部直接散落设置 `active/x/y/vx/vy/trail/isRecalling`。
- 实现并验证每次发射重置 trail，不再出现 D 点发射但从 B 点绘制轨迹。

### Rounds 9-10: 弹性与非击杀反弹

- 调整墙面反弹保能参数，提供策划可读配置名，例如 `wallRestitution`。
- 实现敌人未击杀时的反弹：基于敌人中心到弹体中心的碰撞法线反射速度；当法线退化时使用反向速度作为 fallback。
- 处理重叠分离和短冷却，避免同一碰撞多次结算。
- 保持击杀敌人时仍能穿透/削速或按设计保留现有击杀手感，但必须记录选择。

### Rounds 11-12: 渲染与运行时收敛

- 将 Renderer 只读状态绘制，与 state update 分离。
- 将 `startGame` 重命名或包裹成更清晰的 runtime 启动 API。
- 清理过时注释和 mojibake 注释；如改中文注释，确保 UTF-8 无 BOM。
- 更新 README 架构状态和运行说明。

### Rounds 13-15: 缓冲修复

- 只处理主实现中发现的 bug、移动端控制回归、构建失败、Pages 路径问题、或 smoke 不稳定。
- 不新增本阶段范围外功能。

### Round 16: 最终验证

- 完整本地验证：语法检查、构建、本地浏览器 smoke。
- 验证用户三项需求：可维护重构落地、轨迹起点修复、弹力增强和非击杀反弹。
- 推送最终提交后，给策划者线程回报 commit、验证、剩余风险。

## 7. Debug 自检

每轮至少回答：

- 这个改动能否用最小用户流程解释和复现？
- 失败能否定位到输入、状态推进、碰撞、渲染、HUD、音频、构建或部署中的具体层？
- 是否覆盖了成功、失败、空状态、旧状态残留、重启后状态、移动端/桌面输入差异？
- 如果 UI 或 Canvas 变化，是否做了可重复 smoke 或截图验证？
- 如果状态边界变化，fire、collect、recall、hit、game over、restart 是否都有清晰归属？

## 8. 架构自检

每轮至少回答：

- 当前 source of truth 是否仍是运行时 state，而不是 DOM 或渲染缓存？
- Renderer 是否只读状态，避免改变物理或碰撞结果？
- Input 是否只产生意图，避免直接修改 Bullet/Enemy 内部状态？
- Bullet/Enemy 是否避免互相散落写全局变量？
- 本轮是否避免把路线图中的延期功能拉进当前阶段？
- 是否只提交本阶段相关文件，未纳入 `dist/`、`node_modules/` 或无关用户改动？

## 9. PASS 标准

全部满足才算 PASS：

- `legacyGame.js` 不再是不可维护的单体核心，主要职责已经拆入命名清晰的模块。
- `src/main.js` 启动路径清晰，运行时创建与 DOM shell 检查分离。
- 用户描述的 B/D 轨迹残留问题已修复，并有复现说明或自动/半自动验证。
- 每次发射都会重置弹体上一轮的 trail、召回、命中冷却和位置速度状态。
- 墙面反弹手感明显强于原 `0.85` 衰减方案，并由配置控制。
- 子弹命中未死亡敌人时会反弹，且不会因持续重叠造成多次异常伤害。
- `npm run build` 通过。
- 语法检查覆盖实际 `src` JS 入口。
- 本地浏览器 smoke 通过：菜单、开始、HUD、射击、回收/拾取、敌人非击杀反弹至少覆盖核心路径。
- README 已准确描述当前架构状态。
- 所有阶段相关提交已推送到 `origin/main`。

## 10. 最终报告模板

```text
Phase 1 执行完成报告

结果：PASS / BLOCKED / PARTIAL
commit:
- <hash> <message>

完成内容：
- ...

用户问题验证：
- 可维护重构：
- 轨迹起点：
- 弹力与敌人反弹：

验证命令：
- <command>: <result>

浏览器/线上验证：
- <url or local url>: <result>

剩余风险：
- ...

是否使用缓冲轮：
- ...
```
