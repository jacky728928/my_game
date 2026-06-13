# 项目工作流指引

## 每次开始对话时

告诉 CodeBuddy：
> 读取 dev_log.md，了解当前项目状态后继续

这样 AI 就能自动掌握：
- 当前版本号和已完成功能
- 文件架构
- 待办路线

## 每次结束对话时

要求更新 dev_log.md，记录本次完成了什么、下步要做什么。

## 文件职责

| 文件 | 用途 |
|------|------|
| `dev_log.md` | 开发日志：版本历史、当前状态、待办 |
| `game_design.md` | 设计文档：概念、参数表、技术栈 |
| `index.html` | 入口 |
| `css/style.css` | 全部样式 |
| `js/constants.js` | 所有数值常量 |
| `js/player.js` | 玩家类 |
| `js/enemy.js` | 敌人类 |
| `js/bullet.js` | 子弹类 |
| `js/input.js` | 转轮操控 |
| `js/minimap.js` | 小地图 |
| `js/renderer.js` | 主渲染 |
| `js/main.js` | 主循环 |

## 长期开发防遗忘清单

1. **改参数** → 改 `constants.js`
2. **加功能** → 对应 JS 文件 + 更新 `dev_log.md`
3. **改设计** → 更新 `game_design.md`
4. **每次对话开始** → 贴一句"读 dev_log.md"
