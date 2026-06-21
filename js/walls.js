// ========== 墙体系统 ==========
// 墙体数组，在 init() 时生成
let walls = [];

// 生成墙体布局
function generateWalls() {
  walls = [];

  // 检查是否有待加载的地图数据
  if (window._pendingMapData) {
    const mapData = window._pendingMapData;
    // 应用世界尺寸（同时更新脚本作用域绑定 + window 属性，双保险）
    if (mapData.world) {
      setWorldSize(mapData.world.width, mapData.world.height, 'walls.js: 从 _pendingMapData 加载地图 "' + (mapData.name || '未命名') + '"');
    } else if (window.LOG) {
      window.LOG_WARN('地图数据缺少 world 字段，使用默认 2400×2400');
    }
    // 加载墙体
    let wallCount = 0;
    if (mapData.walls) {
      mapData.walls.forEach(w => {
        walls.push({
          x: w.x,
          y: w.y,
          w: w.w,
          h: w.h,
          type: w.type || WALL_TYPE.MID
        });
        wallCount++;
      });
    }
    // 保存玩家出生点
    let spawnInfo = '';
    if (mapData.playerSpawn) {
      window._pendingPlayerSpawn = { x: mapData.playerSpawn.x, y: mapData.playerSpawn.y };
      spawnInfo = '出生点(' + mapData.playerSpawn.x + ',' + mapData.playerSpawn.y + ')';
    }
    if (window.LOG) window.LOG('walls.js: 加载地图完成，墙体表 ' + wallCount + ' 条，' + spawnInfo);
    // 清除待加载数据
    window._pendingMapData = null;
    return;
  }

  if (window.LOG) window.LOG('walls.js: 未检测到 _pendingMapData，使用默认墙体布局（' + WORLD_W + '×' + WORLD_H + '）');
  const cx = WORLD_W / 2;
  const cy = WORLD_H / 2;

  // 移除地图边界墙
  // 中央区域：十字形中墙
  const crossLen = 160;
  const crossThick = 40;
  walls.push({ x: cx - crossLen / 2, y: cy - crossThick / 2, w: crossLen, h: crossThick, type: WALL_TYPE.MID });
  walls.push({ x: cx - crossThick / 2, y: cy - crossLen / 2, w: crossThick, h: crossLen, type: WALL_TYPE.MID });

  // 四角区域：各一组矮墙（模拟灌木/掩体）
  const cornerOffsets = [
    { x: 300, y: 300 },
    { x: WORLD_W - 300 - 80, y: 300 },
    { x: 300, y: WORLD_H - 300 - 60 },
    { x: WORLD_W - 300 - 80, y: WORLD_H - 300 - 60 },
  ];
  for (let c of cornerOffsets) {
    walls.push({ x: c.x, y: c.y, w: 80, h: 20, type: WALL_TYPE.LOW });
    walls.push({ x: c.x + 60, y: c.y + 20, w: 20, h: 40, type: WALL_TYPE.LOW });
  }

  // 边缘区域：随机散落的中墙/矮墙
  const rngOffsets = [
    { x: 600, y: 400 }, { x: 800, y: 600 }, { x: 400, y: 800 },
    { x: WORLD_W - 600, y: 400 }, { x: WORLD_W - 800, y: 600 },
    { x: WORLD_W - 400, y: 800 }, { x: 600, y: WORLD_H - 600 },
    { x: 800, y: WORLD_H - 800 }, { x: WORLD_W - 600, y: WORLD_H - 600 },
  ];
  for (let i = 0; i < rngOffsets.length; i++) {
    const pos = rngOffsets[i];
    const type = (i % 3 === 0) ? WALL_TYPE.MID : WALL_TYPE.LOW;
    walls.push({ x: pos.x, y: pos.y, w: 80, h: 40, type: type });
  }

  // 边缘高墙障碍：限制玩家在中央活动区
  const ringR = 900;
  const ringCount = 8;
  for (let i = 0; i < ringCount; i++) {
    const angle = (i / ringCount) * Math.PI * 2;
    const rx = cx + Math.cos(angle) * ringR;
    const ry = cy + Math.sin(angle) * ringR;
    walls.push({ x: rx - 60, y: ry - 20, w: 120, h: 40, type: WALL_TYPE.HIGH });
  }
}

// ========== 碰撞检测工具 ==========

// 点是否在矩形内
function pointInRect(px, py, rx, ry, rw, rh) {
  return px >= rx && px <= rx + rw && py >= ry && py <= ry + rh;
}

// 圆形 vs 矩形碰撞（玩家/敌人 vs 墙体）
function circleRectCollide(cx, cy, radius, rx, ry, rw, rh) {
  const closestX = Math.max(rx, Math.min(cx, rx + rw));
  const closestY = Math.max(ry, Math.min(cy, ry + rh));
  const dx = cx - closestX;
  const dy = cy - closestY;
  return dx * dx + dy * dy < radius * radius;
}

// ========== 碰撞检测接口 ==========

// 检测玩家/敌人移动是否与墙体碰撞
// oldX, oldY: 移动前位置；newX, newY: 尝试移动到的位置
// 返回修正后的 { x, y }
function resolveCircleWalls(oldX, oldY, radius, newX, newY) {
  let x = newX;
  let y = newY;

  for (let w of walls) {
    // 先检查目标位置是否碰撞
    if (circleRectCollide(x, y, radius, w.x, w.y, w.w, w.h)) {
      // 尝试只保留水平移动（碰撞时把y回到oldY）
      if (!circleRectCollide(x, oldY, radius, w.x, w.y, w.w, w.h)) {
        y = oldY;
        continue;
      }
      // 尝试只保留垂直移动
      if (!circleRectCollide(oldX, y, radius, w.x, w.y, w.w, w.h)) {
        x = oldX;
        continue;
      }
      // 两个方向都碰撞：完全回到移动前
      x = oldX;
      y = oldY;
    }
  }

  return { x, y };
}

// 检测子弹（直线）是否碰到墙体
// 会检查 WALL_BLOCKS_DIRECT：矮墙不挡子弹，中墙/高墙挡
// 返回被阻挡的墙体（null 表示没碰到）
function checkBulletWalls(x1, y1, x2, y2) {
  // 沿路径多点采样检测（起点、中点、终点 + 中间几个点）
  const samples = 5;
  for (let i = 1; i <= samples; i++) {
    const t = i / samples;
    const px = x1 + (x2 - x1) * t;
    const py = y1 + (y2 - y1) * t;
    for (let w of walls) {
      if (!WALL_BLOCKS_DIRECT[w.type]) continue;
      if (pointInRect(px, py, w.x, w.y, w.w, w.h)) {
        return w;
      }
    }
  }
  return null;
}

// 检测抛射物（榴弹/手雷）是否碰到墙体（只有高墙阻挡）
function checkArcingProjectileWalls(x, y, radius) {
  for (let w of walls) {
    if (!WALL_BLOCKS_ARCING[w.type]) continue;
    if (circleRectCollide(x, y, radius, w.x, w.y, w.w, w.h)) {
      return w;
    }
  }
  return null;
}
