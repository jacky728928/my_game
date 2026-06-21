# 生存射击 · v0.8.0

手机/PC 俯视角生存 | Canvas 原生 JS | 摇杆 + WASD + 方向键 + ESC

## v0.8.0 新增：主角系统 + Echo-01

### 主角选择页（主页 "主角" tab）
- 动态展示角色卡片：头像（带主题色）、角色名、主动技能、武器、HP
- 点击卡片切换选中角色，右侧详情面板展示：
  - 立绘 + 角色名 + 描述
  - 属性网格：HP / 基础攻击 / 射程 / 频率 / 弹速 / 武器
  - 主动技能卡片（含冷却时间）
  - 被动技能卡片
- 选中角色 ID 写入 `localStorage.hero_selected_id`，下次打开自动恢复
- "确认选择 / 返回冒险" 按钮：跳回冒险页

### 角色池（`HERO_POOL` in `constants.js`）
- **Echo-01**（战术干员，紫蓝色 `#8a5cf0`）：等离子冲锋枪三连发
  - 属性：HP 200，攻击 +0，射程 260，弹速 450
  - 主武器：等离子冲锋枪（`type: 'triple'`），三连发总冷却 1.0s，每发间隔 0.12s，单发伤害 ×1.0
  - 子弹：紫色 `#a855f7`，核心浅紫 `#f5d0fe`，带能量尾迹
  - 主动技能：脉冲冲刺（`pulse_dash`）
  - 被动技能：战术充能 + 战场反应
- **标准干员**（灰色 `#888`）：单发手枪（基准数据，测试用）

### 三连发机制（`combat.js` + `player.js`）
- 每轮发射 3 发子弹：第一发立即发射，第 2/3 发在 `burstShotInterval=0.12s` 后由 `update()` 调度
- 每轮总冷却：`burstInterval=1.0s`（从第一发开始计时）
- 命中判定：每发独立向最近敌人发射

### 战术充能被动（`tactical_charge`）
- 每完成一轮三连发累积 1 点能量，最多 3 层
- 下一轮三连发的第一发，若持有充能，伤害额外 ×1.8（并消耗一层）
- 视觉：玩家周围显示 0~3 个脉冲光环（与角色主题色同色）

### 战场反应被动（`field_reflex`）
- 生命值 ≤30% 时：移速 ×1.2，攻击速度 ×1.15
- 视觉：角色外圈显示红色警戒光环

### 脉冲冲刺主动技能（`pulse_dash` in `active_skill.js`）
- 冷却 6s，冲刺距离 280px
- 对路径上敌人造成 `玩家攻击 ×2.0` 的伤害并击退 60px
- 冲刺过程中玩家获得 0.5s 无敌帧（霸体 + 免伤）
- 视觉：紫蓝色拖尾粒子 + 落点爆炸（与角色主题色一致）

### 文件改动
- `index.html`：替换 hero 占位页为完整角色选择界面（标题、卡片容器、详情面板、确认按钮）
- `css/homepage.css`：新增 `.hp-hero-*` 样式系列；`.hp-pages` 改为 `overflow-y: auto;`，支持整页纵向滚动；角色卡片改为横向滚动容器（`scroll-snap` 对齐卡片），主题色金色滚动条
- `js/constants.js`：新增 `HERO_POOL`、`HERO_LIST`；新增 `pulse_dash` 到 `ACTIVE_SKILL_POOL`
- `js/player.js`：重写 Player 构造函数——先初始化所有字段（包括 tacticalCharge、fieldReflex 对象），**最后**调用 `_bindHero()`；`_bindHero()` 增加 `hero.passives || []` 保护，避免 `undefined.indexOf()`
- `js/combat.js`：修改 `attack()` 支持三连发机制，新增 `updateBurst()` 调度；新增 `_findNearestEnemyInRange()`、`_fireOneBullet()`
- `js/active_skill.js`：新增 `pulse_dash` 实现（路径伤害 + 击退 + 无敌帧 + 粒子）
- `js/renderer.js`：玩家子弹颜色/尾迹支持；战术充能光环；战场反应红光；**玩家本体改为立绘圆形裁剪**（`Renderer._portraitCache` 缓存，`ctx.clip()` 圆形裁剪，无立绘时回退圆形）；角色主题色
- `js/bullet.js`：Bullet 类支持 `customColor / customCore / hasTrail`
- `js/homepage.js`：HeroUI（卡片/详情/确认） + localStorage 持久化
- `js/game_core.js`：`update(dt)` 中调用 `updateBurst(dt)`

## 架构：主页 + 游戏 双容器
`index.html` 现在包含两个根容器：
- `#homepage-root`（默认显示）：主页，含 4 个导航页（冒险/主角/科技树/商店），立绘展示，"开始游戏"按钮
- `#game-root`（默认隐藏）：游戏画布层，含 `#gameCanvas`、`#minimap`、`#wheel`

点击主页 "开始游戏" → 打开地图选择 → 启动 `GameCore.init()` + `GameCore.startLoop()`
暂停菜单中 "返回主页" → `GameCore.returnToHomepage()` → 停止游戏循环 + 显示 `#homepage-root`

## 文件地图 & 改哪里
| 文件 | 内容 | 改什么 |
|------|------|--------|
| `index.html` | 入口（主页容器 + 游戏容器 + 主页导航脚本 + JS 加载顺序） | 添加新容器、调整加载顺序 |
| `css/homepage.css` | 主页样式（背景网格/发光/立绘框/开始游戏按钮/响应式） | 改主页视觉 |
| `css/style.css` | 游戏样式 | 摇杆/布局/UI |
| `js/constants.js` | 所有常量 + 6级敌人预设 + 能力池 + 副武器池 + 主动技能池 + 墙体类型定义 | 数值/敌人预设/颜色/新能力 |
| `js/walls.js` | 墙体系统（布局生成 + 圆-矩形碰撞 + 子弹墙体检测 + 抛射物墙体检测）+ 加载 `_pendingMapData` | 墙体布局/墙体类型/碰撞规则 |
| `js/player.js` | 玩家(HP/移动/攻速加成/暴击率/暴击倍率/等级/能力应用/副武器装备/副武器词条等级/主动技能装备) | 玩家逻辑/新能力 |
| `js/enemy.js` | 敌人(追踪/碰撞/6级) | 敌人AI |
| `js/bullet.js` | 子弹(飞行/碰撞/isCrit标记/墙体阻挡) | 子弹逻辑 |
| `js/xp_orb.js` | 经验球(浮动/飞向吸收) | 经验球逻辑 |
| `js/input.js` | 虚拟摇杆 + **WASD + 方向键**双输入源 | 操控 |
| `js/minimap.js` | 左上小地图（绘制墙体） | 小地图 |
| `js/renderer.js` | 主渲染(背景/实体/血条/伤害数字/能力状态/轨道炮准星/墙体 + 暂停/阵亡提示) | 画面/UI/特效渲染 |
| `js/effects.js` | 特效系统（爆炸、粒子、目标标记、轨道炮蓄力/发射/爆炸） | 新武器特效 |
| `js/combat.js` | 战斗系统（攻击、副武器更新含副武器专属词条、AOE伤害、轨道炮状态更新、墙体碰撞检测） | 战斗逻辑/副武器触发/伤害计算 |
| `js/active_skill.js` | 主动技能系统（3技能释放逻辑、蓄力瞄准、图标更新、移动穿墙检测） | 主动技能逻辑 |
| `js/ui.js` | UI界面（升级选择、模式选择、副武器选择、主动技能选择、地图选择 openMapSelection、暂停菜单 + 返回主页） | 界面逻辑 |
| `js/dev_panel.js` | 开发者面板（属性加成/武器开关/经验倍率/停止出怪） | 调试工具 |
| `js/game_core.js` | 游戏核心（**不再自动启动**，暴露 `GameCore.init/startLoop/stopLoop/returnToHomepage`，敌人生成避开墙体） | 游戏循环 |
| `js/homepage.js` | 主页工具模块（`Homepage.goHome/debug`，导航/立绘切换在 `index.html` 内联脚本） | 主页辅助功能 |
| `pic/*.png` | 主页立绘图片（从 test_project 合并而来） | 添加新立绘 |
| `地图/*.json` + `地图/map_index.json` | 地图定义 + 自动生成的索引（含完整地图数据） | 地图编辑器导出新地图后重新生成索引 |
| `js/logger.js` | 统一后台日志系统（内联 logger + console 双输出，环形缓冲上限 500 条） | `window.LOG('msg')` / `GameLogger.download()` / `GameLogger.getAll()` |
| `js/map_data.js` | 内联地图数据（`window.MAP_INDEX_DATA`），供 file:// 协议下绕过 fetch 限制 | 添加/修改地图后需重新生成 |
| `gen_map_data.py` | Python 脚本，扫描 `地图/` 目录生成 `js/map_data.js` | 调整扫描逻辑 |
| `map_index_generator.py` | Python 脚本，扫描 `地图/` 目录生成 `map_index.json` | 调整扫描逻辑 |
| `test_project/` | 已合并，保留为历史参考 | 新功能可先在此实验 |

## 核心参数速查
```
世界 默认 1600×1600（从地图文件读取后动态更新） | 网格80px
玩家 radius=18 speed=180 maxHp=100
手枪 range=250 dmg=5 interval=1.0s | bullet speed=400 radius=4
敌人 Lv1-6: HP=10~60, size=22~42, speed 50~155, 每级不同色
生成间隔 2.5→0.6 | 难度随时间解锁更高等级
经验 pickup=70px | 升级=等级×20 | 奖励+5maxHP | 球飞向角色420px/s
碰撞=敌人撞玩家→玩家扣敌人HP | 子弹命中→扣伤害值
暴击基础倍率 1.5 | 攻速加成后间隔=基础间隔 × (100 / (100 + 攻速加成))
能力池（7选3随机）：hp_max | attack_speed | crit_chance | damage | view_range(+25%) | attack_range(+25px) | pickup_range(+25px)
副武器专属技能池（持有对应副武器才有机会抽到）：gl_firepower | gr_cluster | mk_healboost
```

## 操控：双端统一
- **移动**：手机 → 左下虚拟摇杆；PC → WASD 或 ↑↓←→（可同时输入，自动归一化）
- **暂停**：手机 → 右上按钮；PC → ESC 键
- **主动技能**：手机 → 右下圆形图标（闪烁突袭需按住瞄准）；PC → E 键
- **开发者面板**：暂停菜单中点击 "打开开发者面板"

## file:// 协议兼容性注意事项
- 浏览器 `file://` 协议下禁止 `fetch` 读取本地文件 → **所有地图数据已内联为 `js/map_data.js`**，无需 fetch
- 经典 `<script>` 中 `let`/`const` 声明的变量**不会挂到 `window`** → 动态赋值必须**直接写变量名**：`WORLD_W = xxx`，再 `window.WORLD_W = WORLD_W`（双保险）
- `constants.js` 中 `WORLD_W / WORLD_H` 声明为 `let` 而非 `const`，以便地图选择时动态重赋值
- 更新地图数据后运行 `python gen_map_data.py` 重新生成 `js/map_data.js`

## 统一后台日志系统（js/logger.js）
- `window.LOG('消息')` / `window.LOG_WARN('警告')` / `window.LOG_ERROR('错误')` / `window.LOG_DEBUG('调试')`
- 所有日志同时写入浏览器 Console **和** 内存环形缓冲区（上限 500 条）
- `GameLogger.getAll()` — 读取全部历史日志
- `GameLogger.getRecent(n)` — 读取最近 n 条
- `GameLogger.download()` — 下载为 `.log` 文本文件（浏览器中使用）
- `GameLogger.clear()` — 清空日志
- 已覆盖的关键路径：主页加载、开始游戏、地图选择、世界尺寸更新、墙体加载、玩家出生、游戏循环启停、返回主页

## 开始游戏流程
1. 打开主页 → 立绘 + 切换立绘按钮 + 开始游戏按钮
2. 点击开始游戏 → `GameUI.openMapSelection()` 弹出地图选择界面（带预览）
3. 选择一张地图 → 设置 `window._pendingMapData`，切换到 `#game-root`
4. `GameCore.init()` → `generateWalls()` 从 `_pendingMapData` 加载墙体和出生点
5. `GameCore.startLoop()` → 游戏循环开始

## 墙体系统
- **三种墙体类型**（按高度区分，不同颜色 + 不同阻挡规则）：
  - **矮墙（绿色 `#6b8e4e`）**：阻挡玩家/敌人移动；手枪子弹可穿过；榴弹/手雷可穿过
  - **中墙（灰色 `#9a9a9a`）**：阻挡玩家/敌人移动；阻挡手枪子弹；榴弹/手雷可穿过
  - **高墙（蓝紫灰 `#5a5a8e`）**：阻挡玩家/敌人移动；阻挡手枪子弹；阻挡榴弹/手雷
  - **天基屠龙炮**：无视所有墙体（空对地）
- **碰撞检测接口**（`walls.js`）：
  - `resolveCircleWalls(oldX, oldY, radius, newX, newY)` → 修正移动位置
  - `checkBulletWalls(x1, y1, x2, y2)` → 子弹是否被中/高墙阻挡
  - `checkArcingProjectileWalls(x, y, radius)` → 榴弹/手雷是否被高墙阻挡
- **初始化**：游戏 `init()` 时调用 `generateWalls()` 生成布局

## 副武器系统
- **触发方式**：每把副武器独立冷却计时，倒计时结束自动触发
- **副武器池（开局3选1；第5级和10n级作为升级选项；最多装备3个）**：
  - 榴弹炮 / 手雷 / 医疗包 / 天基屠龙炮

## 主动技能系统
- 闪烁突袭（按住瞄准松开释放）/ 冲刺翻滚 / 疾跑 —— 开局3选1

## 当前状态
v0.7.0: 同 v0.6.2 所有功能 + **新增统一后台日志系统**（`js/logger.js` 最先加载，`window.LOG / LOG_WARN / LOG_ERROR / LOG_DEBUG` 全局可用，`setWorldSize()` 统一修改世界尺寸并触发日志），所有关键路径均有日志埋点，打开浏览器 Console 即可看到完整链路

## 核心参数速查
```
世界 2400×2400 | 网格80px
玩家 radius=18 speed=180 maxHp=100
手枪 range=250 dmg=5 interval=1.0s | bullet speed=400 radius=4
敌人 Lv1-6: HP=10~60, size=22~42, speed 50~155, 每级不同色
生成间隔 2.5→0.6 | 难度随时间解锁更高等级
经验 pickup=70px | 升级=等级×20 | 奖励+5maxHP | 球飞向角色420px/s
碰撞=敌人撞玩家→玩家扣敌人HP | 子弹命中→扣伤害值
暴击基础倍率 1.5 | 攻速加成后间隔=基础间隔 × (100 / (100 + 攻速加成))
能力池（7选3随机）：hp_max | attack_speed | crit_chance | damage | view_range(+25%) | attack_range(+25px) | pickup_range(+25px)
副武器专属技能池（持有对应副武器才有机会抽到）：gl_firepower | gr_cluster | mk_healboost
```

## 墙体系统
- **三种墙体类型**（按高度区分，不同颜色 + 不同阻挡规则）：
  - **矮墙（绿色 `#6b8e4e`）**：阻挡玩家/敌人移动；手枪子弹可穿过（平射不挡）；榴弹/手雷可穿过（抛射不挡）
  - **中墙（灰色 `#9a9a9a`）**：阻挡玩家/敌人移动；阻挡手枪子弹；榴弹/手雷可穿过
  - **高墙（蓝紫灰 `#5a5a8e`）**：阻挡玩家/敌人移动；阻挡手枪子弹；阻挡榴弹/手雷
  - **天基屠龙炮**：无视所有墙体（空对地）
- **墙体布局**：中心十字形中墙 + 四角矮墙掩体 + 边缘随机中/矮墙 + 外围8块高墙（限制玩家活动范围）
- **碰撞检测接口**（`walls.js`）：
  - `resolveCircleWalls(oldX, oldY, radius, newX, newY)` → 修正移动位置（用于玩家/敌人）
  - `checkBulletWalls(x1, y1, x2, y2)` → 子弹是否被中/高墙阻挡
  - `checkArcingProjectileWalls(x, y, radius)` → 榴弹/手雷是否被高墙阻挡
- **初始化**：游戏 `init()` 时调用 `generateWalls()` 生成布局

## 当前状态
v0.5: 基础骨架 + 6级敌人 + 手枪 + 经验等级系统 + 经验球飞行动画 + 经验吸取范围可视化 + 升级三选一能力系统 + 暴击 + 浮动伤害数字 + **副武器系统**（榴弹炮/手雷/医疗包/**天基屠龙炮**）+ **副武器专属技能词条** + 开发者面板武器控制 + **主动技能系统**（闪烁突袭/冲刺翻滚/疾跑）+ **墙体系统**（矮/中/高三种墙体 + 碰撞/阻挡规则）+ 代码模块化拆分 + **天基屠龙炮蓄力瞄准+炫酷特效+UI警告提示**

## 副武器系统
- **触发方式**：每把副武器独立冷却计时，倒计时结束自动触发
- **副武器池（开局3选1；第5级和10n级作为升级选项；最多装备3个，超过需手动丢弃）**：
  - **榴弹炮**：每5秒发射一次，自动追踪最近敌人，基础攻击×800%，100px范围AOE，直接命中爆炸
  - **手雷**：每10秒投掷一枚，自动丢向最近敌人脚下，飞行+2秒延时爆炸，基础攻击×1500%，100px范围AOE
  - **医疗包**：每8秒自动使用一次，回复基础攻击×2000%的生命值
  - **天基屠龙炮**：每60秒发射（击杀敌人-2秒CD），300px范围攻击力×20，无视墙体
- **副武器专属技能词条**（持有对应副武器时升级选项中有概率出现）：
  - **火力倾泻（榴弹炮专属）**：榴弹数量 +1/级（`shellCount = 1 + glLevel`）
  - **集束手雷（手雷专属）**：手雷伤害 +50%/级（`dmgMult = damageMult × (1 + grLevel × 0.5)`）
  - **急救强化（医疗包专属）**：医疗包回复量 +50%/级（`healMult = damageMult × (1 + mkLevel × 0.5)`）
- **天基屠龙炮视觉**：蓄力阶段（多层收缩准星 + 屏幕警告+倒计时+进度条 + 能量汇聚粒子 + 轨道光束；发射阶段（光束冲击+屏幕震动+镜头闪光）；爆炸阶段（多层冲击波+150个碎片+闪电链+烧焦印记）

## 主动技能系统
- **触发方式**：
  - 闪烁突袭：电脑 **按住 E 键**瞄准/手机 **按住右下角圆形图标**瞄准 → 松开释放（有落点预览，显示 AOE 范围和玩家到落点的虚线连线）
  - 其他主动技能（冲刺翻滚/疾跑）：电脑按 E 键 / 手机点击右下角图标，按下即释放
- **开局流程**：模式选择 → 副武器选择 → 主动技能选择（3选1）
- **3个主动技能**：
  - 闪烁突袭：瞬移 300px + 落地 AOE 伤害（半径 50px，×2攻击力），冷却 10 秒
  - 冲刺翻滚：快速位移 200px + 霸体 0.3 秒（免伤），冷却 3 秒
  - 疾跑：移速提升至 1.6×，持续 5 秒，冷却 5 秒
- **视觉**：右下角圆形图标，带冷却环动画（conic-gradient）；充能瞄准时图标呼吸发光，画面中显示落点预览（虚线圆 + 落点中心十字准星 + 连线）；释放后有粒子/爆炸特效

## 代码架构说明
代码已从单文件 `main.js` 拆分为模块化架构：
- **walls.js**（新增，墙体布局生成 + 碰撞检测工具）
- **game_core.js**（主循环、状态管理、敌人生成避开墙体）
- **combat.js**（攻击、副武器更新含副武器专属词条、AOE伤害、墙体碰撞检测）
- **effects.js**（爆炸、粒子、轨道炮特效）
- **active_skill.js**（主动技能释放、移动穿墙检测、图标）
- **ui.js**（升级选择、模式选择、副武器专属词条混入）
- **dev_panel.js**（开发者面板 + 武器开关 + 经验倍率）
- **renderer.js** 保留，负责渲染墙体、准星、爆炸、粒子
