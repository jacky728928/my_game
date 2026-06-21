// ========== 游戏核心模块 ==========
// 不再在文件加载时自动 init 和 startLoop，由主页点击"开始游戏"触发
let player, input, minimap, renderer;
let enemies = [];
let bullets = [];
let xpOrbs = [];
let damageNumbers = [];
let grenades = [];
let shells = [];
let explosions = [];
let particles = [];
let targetMarkers = [];
let spawnTimer = 0;
let spawnInterval = SPAWN_INTERVAL_INIT;
let gameTime = 0;
let elapsedTime = 0;
window._killCount = 0;
window._spawnRateMultiplier = 1;
// 立绘加载完成后触发一次渲染（由 renderer.js 中的 Image onload 调用）
window._requestRedraw = function () {};
let gameOver = false;
let gamePaused = false;
let levelUpChoices = null;
let levelUpUi = null;
let screenShake = { intensity: 0, duration: 0, elapsed: 0 };
let cameraFlash = { intensity: 0, duration: 0, elapsed: 0 };
let _activeSkillCharging = false;
let _rafId = null; // 用于停止游戏循环

function init() {
  if (window.LOG) window.LOG('game_core: init() 开始，WORLD=' + WORLD_W + '×' + WORLD_H + ' walls=' + (walls ? walls.length : 'N/A'));
  player = new Player();
  input = new InputHandler();
  minimap = new Minimap();
  renderer = new Renderer();
  enemies = [];
  bullets = [];
  xpOrbs = [];
  damageNumbers = [];
  spawnTimer = 0;
  spawnInterval = SPAWN_INTERVAL_INIT;
  gameTime = 0;
  elapsedTime = 0;
  window._killCount = 0;
  gameOver = false;
  gamePaused = false;
  closeLevelUpUi();
  closePauseMenu();
  ensureActiveSkillIcon();
  ensurePauseBtn();
  generateWalls();

  // 应用地图加载的出生点（如果有）
  if (window._pendingPlayerSpawn) {
    player.x = window._pendingPlayerSpawn.x;
    player.y = window._pendingPlayerSpawn.y;
    window._pendingPlayerSpawn = null;
    if (window.LOG) window.LOG('game_core: 应用地图出生点 (' + player.x + ', ' + player.y + ')');
  }

  // 检查玩家是否在墙体内，若在则向外移动
  let stuckInWall = false;
  for (let w of walls) {
    if (w.type === WALL_TYPE.HIGH || w.type === WALL_TYPE.MID) {
      if (circleRectCollide(player.x, player.y, player.radius, w.x, w.y, w.w, w.h)) {
        stuckInWall = true;
        break;
      }
    }
  }
  if (stuckInWall) {
    // 沿8个方向找最近的空位
    const dirs = [
      [1, 0], [-1, 0], [0, 1], [0, -1],
      [1, 1], [-1, 1], [1, -1], [-1, -1],
    ];
    let found = false;
    for (let step = 30; step <= 400 && !found; step += 20) {
      for (let d of dirs) {
        const tx = player.x + d[0] * step;
        const ty = player.y + d[1] * step;
        let inWall = false;
        for (let w of walls) {
          if (w.type === WALL_TYPE.HIGH || w.type === WALL_TYPE.MID) {
            if (circleRectCollide(tx, ty, player.radius, w.x, w.y, w.w, w.h)) {
              inWall = true;
              break;
            }
          }
        }
        if (!inWall && tx > 50 && tx < WORLD_W - 50 && ty > 50 && ty < WORLD_H - 50) {
          player.x = tx;
          player.y = ty;
          found = true;
          break;
        }
      }
    }
  }
  openModeSelectUi();
}

function spawnEnemy() {
  const margin = 60;
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const left = player.x - vw / 2 - margin;
  const right = player.x + vw / 2 + margin;
  const top = player.y - vh / 2 - margin;
  const bottom = player.y + vh / 2 + margin;
  const L = Math.max(50, left);
  const R = Math.min(WORLD_W - 50, right);
  const T = Math.max(50, top);
  const B = Math.min(WORLD_H - 50, bottom);

  let x, y;
  let attempts = 0;
  while (attempts < 10) {
    const edge = Math.floor(Math.random() * 4);
    switch (edge) {
      case 0: x = L + Math.random() * (R - L); y = T; break;
      case 1: x = L + Math.random() * (R - L); y = B; break;
      case 2: x = L; y = T + Math.random() * (B - T); break;
      case 3: x = R; y = T + Math.random() * (B - T); break;
    }
    // 检查生成点是否在墙体内，若在则重新生成
    let inWall = false;
    for (let w of walls) {
      if (w.type === WALL_TYPE.HIGH || w.type === WALL_TYPE.MID) {
        if (x >= w.x - 20 && x <= w.x + w.w + 20 && y >= w.y - 20 && y <= w.y + w.h + 20) {
          inWall = true;
          break;
        }
      }
    }
    if (!inWall) break;
    attempts++;
  }

  const elapsed = gameTime / 60;
  const maxTier = Math.min(6, 1 + Math.floor(elapsed * 1.2));
  const tierIdx = Math.floor(Math.random() * maxTier);
  enemies.push(new Enemy(x, y, ENEMY_TIERS[tierIdx]));
}

function addDamageNumber(x, y, value, isCrit) {
  damageNumbers.push({
    x: x + (Math.random() - 0.5) * 20,
    y: y - 6,
    value: value,
    isCrit: isCrit,
    life: DAMAGE_NUM_LIFE,
    maxLife: DAMAGE_NUM_LIFE,
  });
}

function update(dt) {
  if (!player.alive) return;
  if (gamePaused) return;

  elapsedTime += dt;
  const [ix, iy] = input.getDirection();
  player.setVelocity(ix * player.speed, iy * player.speed);
  player.update(dt, bullets);
  attack();
  updateBurst(dt);
  updateSecondaryWeapons(dt);

  for (let b of bullets) {
    if (!b.alive) continue;
    b.update(dt);
    if (!b.alive) continue;
    for (let e of enemies) {
      if (!e.alive) continue;
      if (b.collidesWith(e)) {
        const dmgVal = Math.round(b.damage * 10) / 10;
        e.takeDamage(b.damage);
        addDamageNumber(e.x, e.y, dmgVal, b.isCrit);
        b.alive = false;
        if (!e.alive) {
          window._killCount++;
          xpOrbs.push(new XpOrb(e.x, e.y, e.level));
          onEnemyKilled();
        }
        break;
      }
    }
  }

  for (let e of enemies) {
    if (!e.alive) continue;
    e.update(dt, player);
    if (e.collidesWith(player)) {
      player.takeDamage(e.hp);
      e.alive = false;
      window._killCount++;
      xpOrbs.push(new XpOrb(e.x, e.y, e.level));
      onEnemyKilled();
      if (!player.alive) {
        gameOver = true;
        break;
      }
    }
  }

  enemies = enemies.filter(e => e.alive);
  bullets = bullets.filter(b => b.alive);

  for (let orb of xpOrbs) {
    if (!orb.alive) continue;
    const gained = orb.update(dt, player);
    if (gained > 0) {
      const leveled = player.addXp(gained);
      if (leveled && player.pendingLevelUps.length > 0 && !gamePaused) {
        triggerLevelUpUi();
      }
    }
  }
  xpOrbs = xpOrbs.filter(o => o.alive);

  for (let dn of damageNumbers) {
    dn.life -= dt;
    dn.y -= DAMAGE_NUM_SPEED * dt;
  }
  damageNumbers = damageNumbers.filter(d => d.life > 0);

  if (!window._spawnPaused) {
    spawnTimer -= dt;
    if (spawnTimer <= 0) {
      const mult = window._spawnRateMultiplier || 1;
      for (let i = 0; i < mult; i++) spawnEnemy();
      gameTime += spawnInterval;
      spawnInterval = Math.max(SPAWN_INTERVAL_MIN,
        SPAWN_INTERVAL_INIT - gameTime * SPAWN_INTERVAL_DECAY);
      spawnTimer = spawnInterval / mult;
    }
  }
}

function onEnemyKilled() {
  for (let slot of player.secondaryWeapons) {
    if (slot.def.killReduceCd && slot.cooldown > 0) {
      slot.cooldown = Math.max(0, slot.cooldown - slot.def.killReduceCd);
    }
  }
}

function gameLoop() {
  const now = performance.now();
  if (!gameLoop._last) gameLoop._last = now;
  let dt = (now - gameLoop._last) / 1000;
  gameLoop._last = now;
  if (dt > 0.1) dt = 0.1;

  update(dt);
  renderer.render(player, enemies, bullets, xpOrbs, damageNumbers, grenades, shells, explosions, particles, targetMarkers, screenShake, cameraFlash);
  minimap.render(player, enemies, player.x, player.y);
  _updateSkillIconVisual();

  _rafId = requestAnimationFrame(gameLoop);
}

function startLoop() {
  // 重置时间基准，避免长期暂停后的大 dt
  gameLoop._last = null;
  if (_rafId) cancelAnimationFrame(_rafId);
  _rafId = requestAnimationFrame(gameLoop);
  if (window.LOG) window.LOG('game_core: startLoop() 完成，游戏循环已启动');
}

function stopLoop() {
  if (_rafId) {
    cancelAnimationFrame(_rafId);
    _rafId = null;
  }
  gameLoop._last = null;
  if (window.LOG) window.LOG('game_core: stopLoop() — 游戏循环已停止');
}

function restart() {
  if (window.LOG) window.LOG('game_core: restart() — 重新开始游戏');
  init();
  startLoop();
}

// 从游戏中返回主页
function returnToHomepage() {
  if (window.LOG) window.LOG('game_core: returnToHomepage() — 返回主页');
  stopLoop();
  closeLevelUpUi();
  closePauseMenu();
  // 隐藏游戏 UI 元素（不删除 DOM，避免再次 init 时找不到）
  const dev = document.getElementById('devPanel');
  if (dev) dev.classList.add('hidden');
  const skill = document.getElementById('activeSkillIcon');
  if (skill) skill.style.display = 'none';
  const pauseBtn = document.getElementById('pauseBtn');
  if (pauseBtn) pauseBtn.classList.add('hidden');
  const wheel = document.getElementById('wheel');
  if (wheel) wheel.classList.add('hidden');
  // 清理地图选择相关
  const mapSel = document.getElementById('mapSelectMenu');
  if (mapSel && mapSel.parentNode) mapSel.parentNode.removeChild(mapSel);
  const mapSel2 = document.getElementById('mapSelectionModal');
  if (mapSel2 && mapSel2.parentNode) mapSel2.parentNode.removeChild(mapSel2);

  // 显示主页
  if (window.Homepage && typeof window.Homepage.show === 'function') {
    window.Homepage.show();
  } else {
    location.reload();
  }
}

document.addEventListener('click', (e) => {
  if (gameOver) {
    const wheel = document.getElementById('wheel');
    if (wheel && wheel.contains(e.target)) return;
    restart();
  }
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' || e.key === 'Esc') {
    togglePauseMenu();
  }
});

// ========== 暴露 GameCore 命名空间 ==========
// 由主页 "开始游戏" 按钮调用，不再在文件加载时自动启动
window.GameCore = {
  init: init,
  startLoop: startLoop,
  stopLoop: stopLoop,
  restart: restart,
  returnToHomepage: returnToHomepage,
};