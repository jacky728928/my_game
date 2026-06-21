# 主页合并 + 开始游戏按钮 - PRD

## Overview
- **Summary**: 将 `test_project` 的主页（含底部导航、立绘展示、4 个页面）整体合并到主项目 `游戏最新（自己）`，改造 `index.html` 为「单页面双模式」：进入时先显示主页（冒险/主角/科技树/商店），在冒险页面点击「开始游戏」按钮后弹出地图选择，选好后启动游戏 Canvas 循环。
- **Purpose**: 为游戏提供精美的进入画面和流程控制，避免打开页面就直接进入游戏，同时整合 test_project 已经写好的主页 UI 作为统一入口。
- **Target Users**: 游戏玩家（桌面 + 移动端）。

## Goals
- G1: 冒险页面有明显的「开始游戏」按钮，点击后展示地图选择
- G2: 主页（test_project 的全部视觉/交互）完整融入主项目，无需跳转外部页面
- G3: 游戏启动后可返回主页（例如阵亡后）
- G4: 主页不消耗游戏渲染性能（游戏循环仅在启动后运行）

## Non-Goals
- 不修改游戏核心玩法（不改动战斗/经验/敌人逻辑）
- 不实现「主角/科技树/商店」三个页面的实质内容，仅保留占位
- 不改动已有地图数据和开发者面板
- 不引入外部库（保持纯 HTML/CSS/JS）

## Background & Context
- 主项目 `游戏最新（自己）` 使用 Canvas 2D + 原生 JS，模块化于 `js/` 目录
- `test_project` 是一个纯静态主页（含底部导航 4 个页面、立绘展示、动画背景），本身与主项目独立
- 两个项目均使用「深蓝 + 金色」色调，视觉可统一
- 游戏入口文件：`index.html` + `js/game_core.js` 的 `init()` 自启动（需要改造为可延迟启动）

## Functional Requirements
- **FR-1 开始游戏按钮**: 在冒险页面（立绘下方或立绘右侧）放置显眼的「开始游戏」按钮
- **FR-2 地图选择弹层**: 点击「开始游戏」后弹出地图选择界面，展示所有地图预览与名称
- **FR-3 游戏启动**: 地图选择确认后，隐藏主页 DOM，调用游戏初始化逻辑（选择地图 → 选择模式 → 游戏运行）
- **FR-4 主页导航**: 底部导航栏 4 个页面切换（冒险/主角/科技树/商店），仅冒险页有开始游戏按钮
- **FR-5 立绘切换**: 冒险页面保留「切换立绘」按钮，循环展示 pic/ 目录中的立绘
- **FR-6 返回主页**: 游戏中玩家阵亡或点击暂停菜单里的「返回主页」可回到主页（销毁游戏 DOM / 重置状态）
- **FR-7 样式隔离**: 主页样式使用 `.hp-` 前缀或独立文件，避免污染游戏已有 CSS

## Non-Functional Requirements
- **NFR-1 性能**: 主页模式下游戏 Canvas 不渲染、不启动动画循环（零运行时开销）
- **NFR-2 响应式**: 桌面端（>=768px）与移动端（<600px）双适配
- **NFR-3 代码风格一致**: 新增 JS 使用 `js/homepage.js` 单文件；CSS 单独放在 `css/homepage.css`
- **NFR-4 零额外依赖**: 不引入新 JS 库

## Constraints
- 文件必须放在 `d:/Program Files/python work/游戏最新（自己）/` 下
- 不能破坏当前游戏功能（按 WASD / 方向键玩、暂停菜单、开发者面板、地图选择等）
- 游戏地图数据依赖 `地图/map_index.json`，合并时需保留该路径访问

## Assumptions
- 用户使用浏览器直接打开 `index.html` 访问（不需要本地服务器，但建议使用）
- 立绘图片文件名含中文和空格，需使用 `encodeURI` 处理
- 玩家阵亡后点击「重新开始」→ 走返回主页流程还是原地重启；这里假定「重新开始」重启当前地图，新增「返回主页」按钮

## Acceptance Criteria

### AC-1 开始游戏按钮可见且可点击
- **Given**: 用户打开 `index.html` 看到冒险主页
- **When**: 用户视线扫过立绘区域下方
- **Then**: 能看到一个明显的金色「开始游戏」按钮
- **Verification**: `human-judgment`
- **Notes**: 按钮样式应与金色主题一致，具有 hover/active 动画

### AC-2 点击开始游戏弹出地图选择
- **Given**: 用户在冒险页面
- **When**: 用户点击「开始游戏」
- **Then**: 出现与游戏暂停菜单里一致的地图选择界面（卡片列表、预览图、返回按钮）
- **Verification**: `human-judgment` / `programmatic`（检查 DOM 中 `#mapSelectModal` 被添加并显示）

### AC-3 选择地图后启动游戏
- **Given**: 地图选择界面可见
- **When**: 用户点击任意一张地图卡片
- **Then**: 主页 DOM 被隐藏，游戏 Canvas 启动，玩家出现在所选地图上
- **Verification**: `programmatic`（检查 `#game-container` 变为 active，`player.x` 位于所选地图范围内）

### AC-4 主页四页面切换正常
- **Given**: 用户处于主页
- **When**: 用户点击底部导航栏不同按钮
- **Then**: 对应页面显示（有淡入缩放动画），其他页面隐藏
- **Verification**: `human-judgment`

### AC-5 立绘切换按钮工作
- **Given**: 用户在冒险页面
- **When**: 用户点击「↻ 切换立绘」
- **Then**: 立绘以淡出→切换→淡入效果展示下一张图片
- **Verification**: `human-judgment`

### AC-6 返回主页
- **Given**: 游戏中玩家阵亡，看到「阵亡+点击重新开始」
- **When**: 用户点击暂停菜单里的「返回主页」或阵亡页的「返回主页」
- **Then**: 游戏 Canvas 停止渲染，主页 DOM 恢复显示
- **Verification**: `human-judgment` / `programmatic`（检查游戏主循环不再执行，requestAnimationFrame 已取消）

### AC-7 主页不消耗性能
- **Given**: 用户停留在主页 10 秒
- **When**: 观察浏览器任务管理器
- **Then**: CPU/JS 堆栈不应有持续动画循环（仅有 CSS 动画和一次性粒子生成）
- **Verification**: `human-judgment`

### AC-8 CSS 不冲突
- **Given**: 合并后打开 `index.html`
- **When**: 同时查看主页和游戏中画面
- **Then**: 游戏内按钮、字体、布局不因新 CSS 被破坏
- **Verification**: `human-judgment`
