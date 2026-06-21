# 主页合并 + 开始游戏按钮 - 实施计划

## [/] Task 1: 迁移 pic/ 目录资源
- **Priority**: low
- **Depends On**: None
- **Description**:
  - 将 `test_project/pic/` 下所有图片复制到主项目根目录的 `pic/` 文件夹
  - 确保文件名保持原样（含中文和空格）
- **ACs**: AC-5
- **Notes**: Windows 路径中中文和圆括号在 `file://` 协议下正常工作；JS 端用 `encodeURI`
- **Files to touch**: (新) `pic/初始角色.png` 等

## [ ] Task 2: 创建 css/homepage.css
- **Priority**: high
- **Depends On**: None
- **Description**:
  - 从 `test_project/css/style.css` 复制全部内容
  - 添加命名空间前缀：所有主页相关 CSS 顶层包裹在 `#homepage-root` 内（body 级变量和基础样式例外）
  - 保留原 `test_project` 的视觉风格（金色主题、底部导航、立绘框、发光）
  - 新增 `#homepage-root.hidden`：主页隐藏时 `display:none`
  - 新增开始游戏按钮样式（`.start-btn`），风格与金色主题一致
  - 新增「返回主页」按钮样式（游戏暂停菜单里）
- **ACs**: AC-1, AC-4, AC-8
- **Files to touch**: (新) `css/homepage.css`

## [ ] Task 3: 创建 js/homepage.js
- **Priority**: high
- **Depends On**: Task 2
- **Description**:
  - 主页自身的逻辑：页面切换（switchPage）、立绘切换（portraitSwitch）、粒子背景
  - 暴露 `window.Homepage.show()` / `window.Homepage.hide()` 供游戏端调用
  - 暴露 `window.Homepage.init()` ：在 DOMContentLoaded 时调用，绑定按钮
  - 立绘列表写死在 JS 里（从 `test_project/js/main.js` 复制的 portraits 数组）
  - 「开始游戏」按钮 → 调用 `window.GameUI.openMapSelection()` 触发地图选择
- **ACs**: AC-1, AC-4, AC-5
- **Files to touch**: (新) `js/homepage.js`

## [ ] Task 4: 修改 game_core.js 支持延迟初始化
- **Priority**: high
- **Depends On**: None
- **Description**:
  - 改造现有「DOMContentLoaded 立即 init」为：默认不自启
  - 暴露 `window.GameCore.init(mapData, spawn)` 作为入口
  - 暴露 `window.GameCore.stop()` ：停止 rAF 循环、重置 game state
  - 保留原有的键盘事件监听（WASD/方向键），在 `init()` 中绑定/重绑定
  - 内部需清理：重置 player.hp、清空 enemies、bullets、particles 等
- **ACs**: AC-3, AC-6, AC-7
- **Files to touch**: `js/game_core.js`

## [ ] Task 5: 修改 ui.js 抽取地图选择为通用方法
- **Priority**: high
- **Depends On**: Task 4
- **Description**:
  - 将当前「暂停菜单里打开地图选择」抽取为独立的 `openMapSelection(callback)`
  - 回调参数：`callback(mapData)` 当用户选中某张地图时调用
  - 「取消」按钮：关闭地图选择弹层
  - 主页调用时传入 callback → 选择地图后 → 调用 `GameCore.init(mapData)` + 隐藏主页
  - 暂停菜单调用时传入 callback → 切换地图 + 重启（已有逻辑基本保持）
- **ACs**: AC-2, AC-3
- **Files to touch**: `js/ui.js`

## [ ] Task 6: 重构 index.html
- **Priority**: high
- **Depends On**: Task 1, 2, 3, 4, 5
- **Description**:
  - 在 `<head>` 中加入 `css/homepage.css` 引用（顺序：`style.css` 前或后都可，但要确保主页样式独立）
  - 在现有游戏 DOM 外层添加 `#game-root` 容器，添加 `.hidden` 默认隐藏
  - 新增 `#homepage-root` 容器，内部放置：
    - 背景层（bg-grid/bg-glow/bg-particles 从 test_project index.html 复制）
    - 4 个 page 元素：冒险（含立绘 + 切换按钮 + 开始游戏按钮）、主角、科技树、商店（开发中）
    - 底部导航栏 nav#bottom-nav
  - 调整脚本引用顺序：先加载 `js/constants.js`、`js/walls.js`、`js/*` 全部模块，最后加载 `js/homepage.js`
  - 移除原有 game_core.js 的自启动逻辑（已在 Task 4 改由外部触发）
  - 游戏内「暂停菜单」添加「返回主页」按钮
  - 阵亡画面添加「返回主页」按钮
- **ACs**: AC-1, AC-2, AC-3, AC-6
- **Files to touch**: `index.html`

## [ ] Task 7: 冒险页面添加「开始游戏」按钮
- **Priority**: high
- **Depends On**: Task 6
- **Description**:
  - 在 `#page-adventure` 内立绘框下方添加按钮 `<button class="start-btn">开始游戏</button>`
  - 绑定点击事件：`Homepage.onStartGameClick()` → 调用 `GameUI.openMapSelection(...)`
- **ACs**: AC-1, AC-2
- **Files to touch**: `index.html` (DOM 结构), `js/homepage.js`（事件绑定）

## [ ] Task 8: 游戏返回主页能力
- **Priority**: medium
- **Depends On**: Task 6
- **Description**:
  - 暂停菜单内新增「返回主页」按钮
  - 阵亡画面「点击重新开始」旁边新增「返回主页」按钮
  - 实现：`GameCore.stop()` → 隐藏 `#game-root` → 显示 `#homepage-root`
- **ACs**: AC-6
- **Files to touch**: `js/ui.js`, `index.html`

## [ ] Task 9: 手动验证
- **Priority**: high
- **Depends On**: Task 1-8 全部完成
- **Description**:
  - 打开 `index.html` → 应看到主页（非直接进入游戏）
  - 点击底部导航 → 4 个页面可切换
  - 切换立绘 → 图片正确显示
  - 点击开始游戏 → 弹出地图选择 → 选地图 → 游戏启动
  - 游戏中按 WASD / 方向键 → 正常移动
  - 暂停菜单 → 点返回主页 → 回到主页
  - 阵亡 → 点返回主页 → 回到主页
  - CPU 占用检查：主页下无游戏循环运行
- **ACs**: AC-1 ~ AC-8
- **Files to touch**: 无新文件，仅人工测试

## [ ] Task 10: 清理与收尾
- **Priority**: low
- **Depends On**: Task 9
- **Description**:
  - 确认 `test_project/` 目录可删除（由用户决定是否保留）
  - 检查未使用的冗余引用
- **Files to touch**: 可能删除 `test_project/` 目录
