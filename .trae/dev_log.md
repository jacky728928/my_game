# 开发日志 · dev_log

## v0.8.0 · 主角系统 + Echo-01 + 角色页滚动 + Bug 修复（2026-06-21）

### 关键修复（本次）
- **Bug：游戏启动时 `TypeError: Cannot set properties of undefined (setting 'enabled')`**
  - 根本原因：`Player` 构造函数在字段初始化完成前就调用了 `_bindHero()`，`_bindHero()` 内部访问 `this.tacticalCharge.enabled` / `this.fieldReflex.enabled`，但此时两个对象尚未创建
  - 修复：构造函数中先完成所有字段初始化（包括 `tacticalCharge = {...}`、`fieldReflex = {...}`），**最后**才调用 `_bindHero()` 并计算 `attackInterval`
  - 额外加固：`_bindHero()` 中 `hero.passives` 使用 `hero.passives || []` 兜底；被动赋值前增加 `if (this.tacticalCharge)` 等空值保护

### 设计目标
- 将"主角"从单一默认干员扩展为可选角色池，每位干员拥有独特属性、主武器、主动技能和被动
- 新增第一位角色 **Echo-01**：三连发等离子冲锋枪 + 脉冲冲刺 + 战术充能/战场反应
- 主角页容器改为纵向滚动（`.hp-pages` 增加 `overflow-y: auto;`），角色卡片改为横向滚动容器（`scroll-snap` 对齐卡片），主题色金色滚动条；`max-width` 扩展到 820px 以容纳更多内容

### 架构：角色数据池（`HERO_POOL`）
- `js/constants.js` 新增 `HERO_POOL`（角色模板）和 `HERO_LIST`（UI 展示列表）
- 每个角色字段：`id / name / title / avatar / color / desc / stats / primary / activeSkill / passives`
- `stats`：`maxHp / attackBonus / attackRange / attackSpeedBonus / bulletSpeed / critChance`
- `primary`：`type ('single'|'triple') / name / burstInterval / shotInterval / damageMult / range / bulletSpeed / bulletColor / bulletCore`
- `activeSkill`：指向 `ACTIVE_SKILL_POOL` 的 key；`passives`：被动 key 数组

### 三连发机制（`combat.js` → `attack()`）
- 状态模型：`player.burstActive / burstShotsLeft / burstShotTimer / burstTotalShots / burstShotInterval`
- 触发 `attack()` 时：开启 burst → 立即发射第 1 发 → `attackCooldown = burstInterval`（总冷却从第一发计时）
- `gameCore.update(dt)` 中调用 `updateBurst(dt)`：当 `burstShotTimer ≤ 0` 且还有剩余子弹时，发射下一发
- 每发独立做最近敌人搜索 + 弹道发射；若范围内无敌人则不发射子弹（不浪费攻击窗口）
- 三连发命中 → 每发独立计算暴击；单发伤害 = `effectiveDamage × burstDamageMult`；首发射击若持有战术充能，额外 ×1.8

### 战术充能被动（`tactical_charge`）
- 每次完成一轮三连发（第 3 发消耗后），`tacticalCharge.roundsCompleted++`，每累计 1 轮增加 1 层充能，上限 3 层
- 下一轮三连发的第 1 发前若 `stacks > 0`，则本次射击 `damage × 1.8` 并消耗 1 层
- 视觉：玩家脚下 0~3 个同色脉冲光环（radius 每级 +8），呼吸闪烁

### 战场反应被动（`field_reflex`）
- `player.hp ≤ maxHp × 0.3` 时：`effectiveSpeed += 20%`、`attackCooldown` 除以 1.15
- 视觉：玩家外圈红色警戒光环

### 脉冲冲刺（`pulse_dash` in `active_skill.js`）
- 定义（`constants.js`）：`cooldown=6s`，`dashDist=280`，`damageMult=2.0`，`knockback=60`，`iframe=0.5s`
- 释放时：以当前移动方向为冲刺方向（若静止则朝最近敌人）；沿路径以 10 段细分移动，每段检测敌人命中并造成伤害/击退
- 冲刺期间设置 `player.invincibleTimer = iframe` → 敌人碰撞与子弹伤害忽略
- 视觉：路径每段生成 1 个紫蓝色粒子（角色主题色）；落点生成爆炸（与主题色一致）

### 主角选择 UI（`index.html` + `css/homepage.css` + `js/homepage.js`）
- **HTML**：hero 占位页 → 完整角色选择结构（`hp-hero-title` / `hp-hero-subtitle` / `hp-hero-cards` / `hp-hero-detail` / `hp-hero-confirm`）
- **CSS**：
  - `.hp-pages`：整页纵向滚动（`overflow-y: auto; align-items: flex-start;`），金色主题色滚动条
  - `.hp-page`：`max-width: 820px; padding: 20px 0 40px;`（原先 420px 太窄）
  - `.hp-hero-cards`：横向滚动容器（`flex-wrap: nowrap; overflow-x: auto; scroll-snap-type: x mandatory;`），金色滚动条
  - `.hp-hero-card`：`flex: 0 0 200px; scroll-snap-align: center;`（固定宽度 + 滑动吸附）
  - `.hp-hero-card.active`：金色高亮（与角色主题色协调）
  - `.hp-hero-detail`：角色详情（立绘 + 信息 + 属性网格 + 主动技能卡 + 被动卡）
  - 响应式：`max-width: 600px` 下卡片宽度 160px，立绘/字体缩小
- **JS**：`HeroUI.init / refresh / selectHero`
  - 初始化时从 `localStorage.hero_selected_id` 读取，默认 `echo01`
  - 点击卡片切换：更新 active 样式 + 重绘详情 + 写回 localStorage
  - 确认按钮：跳回"冒险"导航页
  - DOM 就绪后自动初始化，兼容 `DOMContentLoaded`

### 视觉自定义（`renderer.js` / `bullet.js` / `game_core.js`）
- `player.hero.color` 作为主题色驱动：战术充能光环、脉冲冲刺粒子/爆炸
- 子弹支持 `customColor / customCore / hasTrail`：若有尾迹，每帧在子弹后生成小粒子
- **玩家本体立绘渲染**（`renderer.js`）：
  - `Renderer._portraitCache = {}` 缓存已加载的立绘 Image 对象
  - 渲染玩家时：`ctx.save()` → `ctx.arc()` 裁剪圆形 → `ctx.drawImage()` 绘制立绘 → `ctx.restore()`
  - 立绘尺寸：`player.radius * 2`（覆盖整个圆形区域）
  - 若 `hero.portrait` 为数组，取第一张
  - 若无立绘或图片未加载/加载失败，回退为纯色圆形
  - 图片异步加载：`new Image().onload` 后调用 `window._requestRedraw()` 触发重绘（下一帧自动渲染）
  - `game_core.js` 中定义空 `window._requestRedraw = () => {}`，游戏运行时自动生效

### 文件改动清单
| 文件 | 改动 |
|------|------|
| `index.html` | hero 占位页 → 完整角色选择页 |
| `css/homepage.css` | 新增 `.hp-hero-*` 样式系列 |
| `js/constants.js` | 新增 `HERO_POOL`、`HERO_LIST`；`ACTIVE_SKILL_POOL.pulse_dash` |
| `js/player.js` | Player 类重写：角色绑定、三连发状态、战术充能、战场反应 |
| `js/combat.js` | `attack()` 三连发分支；新增 `updateBurst()` / `_findNearestEnemyInRange()` / `_fireOneBullet()` |
| `js/active_skill.js` | 新增 `pulse_dash` 实现（路径伤害 + 击退 + 无敌帧 + 粒子） |
| `js/renderer.js` | 玩家子弹颜色/尾迹支持；玩家本体改为立绘圆形裁剪（`_portraitCache` 缓存，`ctx.clip()` 圆形裁剪，无立绘回退圆形） |
| `js/bullet.js` | Bullet 类增加 `customColor / customCore / hasTrail`；撞墙粒子为角色色 |
| `js/homepage.js` | HeroUI（卡片渲染 / 选择 / 详情 / 确认） + `_applyAdventurePortrait()` 同步冒险页立绘 + localStorage 持久化 |
| `js/game_core.js` | `update(dt)` 中调用 `updateBurst(dt)`；顶部定义 `window._requestRedraw = () => {}`（供立绘加载完成后触发重绘） |

## v0.7.0 · 新增统一后台日志系统（js/logger.js）（2026-06-20）
- **新增模块 `js/logger.js`**：经典 `<script>` IIFE 自执行，最先加载，暴露全局 `GameLogger` 和 `window.LOG / LOG_WARN / LOG_ERROR / LOG_DEBUG`
  - 日志同时写入浏览器 Console + 内存环形缓冲区（上限 500 条）
  - 等级：DEBUG / INFO / WARN / ERROR（可通过 `GameLogger.setMinLevel()` 切换）
  - 每条日志带时间戳（YYYY-MM-DD HH:MM:SS.ms）和等级标签
  - `GameLogger.getRecent(n)` / `GameLogger.getAll()` / `GameLogger.download()` / `GameLogger.clear()`
- **`js/constants.js` 新增 `setWorldSize(w, h, reason)`** — 统一修改 WORLD_W/H 并自动同步 window 属性，触发日志便于定位"地图尺寸是否被正确修改"
- **在以下位置加入日志埋点**：
  - `js/constants.js` 加载时输出初始 WORLD 尺寸
  - `js/homepage.js` `Homepage.goHome()` 及其分支
  - `js/ui.js` `loadMapList()`（区分内联模式与 fetch 模式）/ `renderMapPreview()` / `openMapSelection()` / 点击地图卡片 / `loadMapAndRestart()`（覆盖成功与异常分支）
  - `js/walls.js` `generateWalls()`（从地图数据加载 vs 使用默认墙体布局）
  - `js/game_core.js` `init()` / `startLoop()` / `stopLoop()` / `restart()` / `returnToHomepage()`
  - `index.html` `Homepage._startGame()`（点击开始游戏、选中地图、启动游戏循环）
- **`index.html`脚本加载顺序**：`logger.js → constants.js → walls.js → player.js → ... → ui.js → game_core.js → homepage.js`（logger 必须最先加载，才能让其他模块的日志正常输出）

## v0.6.2 · 修复 file:// 协议下 WORLD_W 无法重赋值 + 地图预览不显示墙体（2026-06-20）
- **根本原因（两处字段不匹配）**：
  1. `js/constants.js` 中 `WORLD_W / WORLD_H` 用 `const` 声明 → 不可重新赋值
  2. 赋值处写 `window.WORLD_W = xxx` → 但 `let` 在经典 `<script>` 中不会挂到 `window`，脚本作用域真正被读取的 `WORLD_W` 从未被修改
  3. **`js/ui.js` `renderMapPreview()`** 读 `mapData.width/mapData.height/mapData.spawnX` → 但 `MAP_INDEX_DATA` 结构是 `mapData.world.width/mapData.world.height/mapData.playerSpawn.x`，字段名完全对不上 → 预览画布只有纯色背景，墙体/出生点从未被渲染
- **修复方案**：
  - `js/constants.js`: `const WORLD_W / WORLD_H` → `let WORLD_W / WORLD_H`
  - `js/walls.js` `loadAndApplyMapData()` / `js/ui.js` `loadMapAndRestart()` / `index.html` `Homepage._startGame` 回调: `WORLD_W = mapData.world.width; WORLD_H = mapData.world.height; window.WORLD_W = WORLD_W; window.WORLD_H = WORLD_H;`（双保险）
  - `js/ui.js` `renderMapPreview()`:
    - `mapData.width / mapData.height` → `mapData.world.width / mapData.world.height`（保留回退）
    - `mapData.spawnX / mapData.spawnY` → `mapData.playerSpawn.x / mapData.playerSpawn.y`（保留回退）
- **浏览器端到端验证**：
  - 主页正常显示 → 点击开始游戏 → 6 张地图卡片正确显示（墙体像素不再是全黑）
  - 卡片2"散落掩体"灰色墙体 R=126 G=126 B=128 ✓
  - 卡片4"环形要塞"绿色矮墙 R=89 G=117 B=67 ✓
  - 选择 1600×900 地图后：`WORLD_W = 1600`，`WORLD_H = 900`，`walls = 16`，`player 存在` ✓
  - `homepage-root` → `none`，`game-root` → `block`，游戏正常启动 ✓

## v0.6.1 · 修复「开始游戏」按钮无响应（2026-06-20）
- **根本原因**：`openMapSelection` 和 `loadMapList` 使用 `fetch('地图/map_index.json')` 加载地图数据
  - 以 `file://` 协议直接打开 `index.html` 时，浏览器安全策略禁止 `fetch` 读取本地文件，静默失败
  - 结果：模态框创建了但 `maps` 为空数组，`grid` 内没有任何卡片
- **修复方案**：把所有地图数据内联为 JS 模块
  - 新增 `js/map_data.js`：`window.MAP_INDEX_DATA = [ {name, world, playerSpawn, walls}, ... ]`（共 6 张地图）
  - 新增 `gen_map_data.py`：扫描 `地图/` 目录并生成 `js/map_data.js`
  - 在 `index.html` 中 `js/ui.js` 之前加载 `js/map_data.js`
  - 修改 `js/ui.js` 中的 `loadMapList()`：优先使用 `window.MAP_INDEX_DATA`，回退到 `fetch`
  - 修改 `js/ui.js` 中的 `openMapSelection()`：不再对每张地图单独 `fetch`，直接用内联数据渲染
  - 修改 `js/ui.js` 中的 `openMapSelectMenu()`（暂停菜单中的地图切换）：卡片数据来自内联
  - 修改 `loadMapAndRestart()`：接受数据对象（优先）或 URL（兼容）
- **浏览器端到端验证**：
  - `window.MAP_INDEX_DATA` → 6 个地图 ✅
  - 点击开始游戏 → 地图选择模态框显示 ✅
  - 6 张卡片 + 6 张预览画布正确渲染 ✅
  - 点击「中央竞技场」→ `game-root` 切换为 block，gameCanvas 667x849, minimap 180x180, wheel 创建 ✅
  - `GameCore.returnToHomepage()` → 停止游戏循环，主页显示 ✅

## v0.6 · test_project 合并 & 主页/游戏双容器（2026-06-20）
- 改造 `index.html`：拆分为 `#homepage-root`（主页默认显示） + `#game-root`（游戏默认隐藏）
- 新增 `css/homepage.css`：主页背景网格、发光动画、立绘框（带呼吸边框）、底部导航（4 个页面按钮）、开始游戏按钮
- 新增 `js/homepage.js`：`Homepage.goHome/debug/show/hide` API
- 修改 `js/game_core.js`：移除文件加载时自动 `init()` + `requestAnimationFrame(gameLoop)`，新增 `GameCore.init/startLoop/stopLoop/returnToHomepage` 外部可控接口
- 修改 `js/ui.js`：暂停菜单增加「返回主页」按钮
- 修改 `js/renderer.js`：阵亡画面增加「按 ESC 打开暂停菜单可返回主页」提示
- 合并 `test_project/pic/*.png` 到主项目 `pic/`（7 张立绘）
- 主页底部导航 4 个页面：冒险（含立绘切换 + 开始游戏）、主角、科技树、商店（后三者为占位页）
- 开始游戏流程：点击开始游戏 → `GameUI.openMapSelection` 弹出地图选择 → 选择地图 → 设置 `_pendingMapData` + 切换 `game-root` 显示 → `GameCore.init()` + `GameCore.startLoop()` 启动游戏

## v0.5 · 模块化拆分 & 新副武器 & 墙体系统（历史）
- 将 `main.js` 拆分为 `constants / walls / player / enemy / bullet / xp_orb / input / minimap / renderer / effects / combat / active_skill / ui / dev_panel / game_core` 等 15 个模块
- 新增副武器「天基屠龙炮」（60s CD，击杀-2s，300px AOE ×20 攻击力，无视墙体），含准星逐渐瞄准、蓄力光束、多层爆炸特效
- 新增墙体系统（矮/中/高三种墙体类型，不同阻挡规则，敌人 AI 避开墙体生成）
- 新增主动技能系统（闪烁突袭需按住瞄准、松开释放，含落点预览）
- 新增地图选择界面，支持从 `地图/*.json` 读取地图并预览
- 新增开发者面板：出怪量倍数设置、停止出怪按钮
- PC 端：WASD + 方向键双输入源
