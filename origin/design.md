《无尽回弹 / ETERNAL RICOCHET》 AI项目交接文档

文档概述

本文档旨在为接手《无尽回弹》项目的开发人员或AI助手提供完整的项目上下文。本项目是一个单文件 (Single-file) 网页端生存射击游戏。

1. 需求设计文档 (PRD)

1.1 核心机制拆解

空间限制: 完全封闭的Canvas屏幕边缘。

资源限制: 玩家仅有1颗子弹。

生命限制: 玩家仅有3点生命值。

生存挑战: 随时间推移不断生成的敌人潮。

战斗策略: 利用子弹在封闭空间的弹射轨迹，以及通过“召回(Recall)”机制创造的高效击杀潜力。

1.2 核心玩法循环 (Core Loop)

射击: 玩家瞄准并射出唯一的一颗子弹。

弹射: 子弹在墙壁反弹，失去动能，途中穿透并击杀敌人。

回收: 玩家处于无武装状态，必须主动靠近拾取低速子弹，或启动“引力召回”将子弹吸回手中（召回轨迹同样具有杀伤力）。

循环: 重新装填，面对越来越密集的敌人。

1.3 实体与机制

玩家 (Player): WASD/摇杆移动，3格血量，受伤有无敌帧 (I-frames)。

子弹 (Bullet): 射出时速度极快，每次撞墙衰减速度。召回时带有强制向玩家移动的加速度。

敌人 (Enemies):

追踪者 (Chaser): 速度快，1 HP，伤害1，体积小。

坦克 (Tank): 速度慢，3 HP，伤害1，体积大，随游戏时间推移生成概率增加。

操控方案:

PC: WASD (移动) + 鼠标左键 (射击) + 空格/鼠标右键 (召回)。

移动端: 左半屏虚拟摇杆 (移动) + 右半屏滑动/释放 (瞄准射击) + 右半屏单击 (召回)。

2. 美术风格约束文档 (Art Style Constraints)

2.1 视觉主题

赛博朋克 / 街机复古 / 极简霓虹 (Cyberpunk / Arcade Retro / Minimalist Neon)

全屏幕使用深色底，利用高对比度的高亮颜色和发光效果(Glow)来突出游戏实体。

2.2 色彩调色板 (Color Palette)

背景 (Background): 极深灰/黑 (#050505)，带有随玩家移动的微弱视差网格 (rgba(0, 255, 255, 0.05))。

玩家 (Player): 亮青色/霓虹蓝 (#00ffff)。

子弹 (Bullet): 射出时为警告黄 (#ffcc00)，召回时为亮蓝色 (#00ccff 或 #00aaff)。

追踪者敌人 (Chaser): 危险红 (#ff3333)，形状为尖刺三角形。

坦克敌人 (Tank): 霓虹粉紫 (#ff00aa)，形状为六边形。

2.3 视觉特效 (VFX) 约束

发光效果 (Glow): 实体必须使用 Canvas API 的 shadowBlur 和 shadowColor 实现霓虹发光。绘图时叠加模式 (globalCompositeOperation) 应设为 lighter。

CRT扫描线 (CRT Scanlines): 由 HTML 层面的 CSS 伪类 (.crt::before) 实现，包含微弱的红绿蓝RGB分离和线性渐变，不可在 Canvas 内部渲染以节省性能。

粒子系统 (Particles): 击中、弹射、死亡、回收时需生成对应颜色的方形粒子，带有极快的速度衰减 (vx *= 0.9) 和透明度衰减。

打击感 (Game Feel): 必须保留现有的两项关键技术：

Hit Stop (顿帧): 受到伤害时跳过5帧，击杀敌人跳过2帧，产生“卡肉感”。

Screen Shake (屏幕震动): 通过 ctx.translate 配合随机偏移量实现，应用于子弹高速撞墙、受伤和击杀事件。

3. 技术设计文档 (TDD & Architecture)

3.1 技术栈

核心: 原生 HTML5 Canvas 2D API + Vanilla JavaScript (ES6+)。

工程化 (推荐): 基于 Vite/Webpack 进行 ES Modules 模块化打包，使用 TypeScript 提升代码健壮性。

UI层: TailwindCSS 用于构建脱离 Canvas 的独立 HUD 和菜单层，利用 DOM 的重排/重绘独立性优化性能。

音频: 原生 Web Audio API (AudioContext) 进行纯代码音频合成。

3.2 架构设计 (Architecture Design)

为了保障游戏在未来拥有良好的可扩展性、性能以及可维护性，系统架构采用模块化分层 (Layered Architecture)，并引入经典的游戏开发设计模式，实现“逻辑与表现分离”、“高内聚低耦合”。

3.2.1 模块分层 (Layering)

系统划分为四个主要层级：

核心引擎层 (Core Engine):

GameLoop: 采用固定步长更新与可变渲染 (Fixed Timestep & Variable Rendering) 模型。将逻辑运算 (update) 与 画面渲染 (render) 彻底分离，确保在不同刷新率的设备上物理演算表现一致。

TimeManager: 管理全局时间戳、DeltaTime计算以及 Hit Stop（顿帧时间冻结）逻辑。

EventBus (发布-订阅中心): 游戏内各模块间解耦的核心。例如：实体死亡触发 emit('ENEMY_KILLED')，UI模块和音频模块分别监听该事件进行更新，互不干扰。

数据与逻辑层 (Logic & Data - Model):

StateManager (状态机): 采用有限状态机 (FSM) 管理游戏的宏观状态流转 (MENU -> PLAYING -> PAUSED -> GAMEOVER)。

EntityManager (实体管理): 负责所有场景对象的生命周期管理。

Physics/Collision (碰撞检测): 独立于实体的物理层，负责空间分区（如四叉树 QuadTree）和碰撞结算。

表现层 (Presentation - View):

Renderer (渲染器): 封装 Canvas API 或 WebGL 接口，提供基础的绘制命令（画发光多边形、画线等）。

ParticleSystem (粒子系统): 独立管理视觉特效。

AudioManager (音频管理器): 监听 EventBus，负责通过 Web Audio API 生成对应的波形音效。

UIManager: 通过 DOM 操作映射逻辑层抛出的数据（如分数、血量）。

输入与交互层 (Input - Controller):

InputManager: 统一接管 Keyboard, Mouse 和 Touch 事件。将底层原生事件抽象为“虚拟摇杆向左”、“触发射击”、“触发召回”等语义化指令，向上层分发。

3.2.2 核心设计模式 (Core Patterns)

对象池模式 (Object Pooling):

痛点: 游戏过程中会高频生成和销毁“子弹”、“敌人”、“爆炸粒子”，直接使用 new 和 垃圾回收(GC) 会导致浏览器内存抖动（Stuttering）。

方案: 在 EntityManager 和 ParticleSystem 中预先实例化一定数量的对象（如300个粒子，50个敌人）。对象“死亡”时仅将其重置并休眠放回池中，生成时从池中唤醒，实现内存的零分配。

组件化/ECS思维 (Entity-Component-System):

虽然对于当前体量不一定需要严格的纯 ECS 框架，但在设计实体类时应采用“组合优于继承”的原则。将行为抽象为可插拔的方法（例如：把“向目标移动”、“带尾迹渲染”独立封装）。

3.3 Web Audio API 合成器设计

所有的音效由统一的音频服务模块生成，函数签名形如 AudioSys.playTone(freq, type, duration, vol, slideFreq)：

射击/击杀: 使用 square 方波，产生复古的 8-bit 感。

反弹/拾取: 使用 sine 正弦波，产生清脆高频的声音。

受伤/受击: 使用 sawtooth 锯齿波，产生撕裂感。

滑动频率 (slideFreq): 用于制造滑音 (例如子弹召回时的音调上升)。

4. 后续开发路线图 (Roadmap)

如果接下来继续扩展此游戏，建议遵循以下迭代路径：

Phase 1: 机制深度扩展 (v1.1)

敌人类拓展: 引入一种会远程射击的敌人 (Shooter)，增加走位压力。

地形生成: 在屏幕中心随机生成几个不可摧毁的几何障碍物（霓虹立柱），增加子弹弹射的复杂度。

连击系统 (Combo): 在一次子弹射出到收回的周期内，击杀敌人数量越多，分数倍率越高，UI 上增加“X2, X3”的连击字样。

Phase 2: 局外养成与升级 (Meta-Progression - v1.2)

利用 localStorage 存储货币（积分转化）。

添加“商店/升级 (UPGRADES)”界面。

升级项建议：

引力强化: 提高召回加速度。

穿甲弹头: 减少击穿敌人时的速度衰减。

能量护盾: HP上限增加至4或5。

Phase 3: 表现力与性能重构 (v1.3)

性能瓶颈突破: 当后期同屏敌人和粒子达到几百个时，Canvas 2D 原生的 shadowBlur (高斯模糊) 会导致严重掉帧。

架构迁移: 根据新的分层架构，平滑地将 Renderer 层从 Canvas 2D 迁移至 WebGL (纯原生写 Shader 或使用 Pixi.js)。逻辑层可完全保留不变。

增加后处理 (Post-Processing) 特效：如色差 (Chromatic Aberration) 和 辉光 (Bloom) 的 Shader 实现。

Phase 4: 全平台发布与社交 (v2.0)

接入 Firebase，实现全球排行榜 (Global Leaderboards)。

优化移动端浏览器全屏体验，使用 PWA 技术打包。

使用 Capacitor.js 或 Cordova 包装为独立的 iOS/Android APK 进行发布。