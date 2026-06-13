# 数值参数表

## 世界
WORLD_W=2400 WORLD_H=2400 | 网格80px | 摄像机跟随玩家

## 玩家
PLAYER_RADIUS=18 PLAYER_SPEED=180 PLAYER_MAX_HP=100

## 武器-小手枪
PISTOL_RANGE=250 PISTOL_DAMAGE=5 PISTOL_INTERVAL=1.0
BULLET_SPEED=400 BULLET_RADIUS=4

## 6级敌人预设 (HP=等级×10)
| Lv | HP | 大小 | 移速区间 | 颜色 |
|----|----|------|----------|------|
| 1 | 10 | 22 | 100-155 | #e74c3c红 |
| 2 | 20 | 26 | 90-145 | #e67e22橙 |
| 3 | 30 | 30 | 80-135 | #f1c40f黄 |
| 4 | 40 | 34 | 70-125 | #2ecc71绿 |
| 5 | 50 | 38 | 60-115 | #3498db蓝 |
| 6 | 60 | 42 | 50-105 | #9b59b6紫 |

SPAWN_INTERVAL_INIT=2.5 SPAWN_INTERVAL_MIN=0.6 DECAY=0.02

## 碰撞规则
敌人碰到玩家→敌人死亡，玩家扣=敌人当前HP | 子弹命中→敌人扣5HP
