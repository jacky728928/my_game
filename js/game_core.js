// ========== 游戏核心模块 ==========
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
window._killCount = 0;
let gameOver = false;
let gamePaused = false;
let levelUpChoices = null;
let levelUpUi = null;
let screenShake = { intensity: 0, duration: 0, elapsed: 0 };
let cameraFlash = { intensity: 0, duration: 0, elapsed: 0 };
let _activeSkillCharging = false;

function init() {
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
  window._killCount = 0;
  gameOver = false;
  gamePaused = false;
  closeLevelUpUi();
  ensureActiveSkillIcon();
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
  const L = Math.max(0, left);
  const R = Math.min(WORLD_W, right);
  const T = Math.max(0, top);
  const B = Math.min(WORLD_H, bottom);

  let x, y;
  const edge = Math.floor(Math.random() * 4);
  switch (edge) {
    case 0: x = L + Math.random() * (R - L); y = T; break;
    case 1: x = L + Math.random() * (R - L); y = B; break;
    case 2: x = L; y = T + Math.random() * (B - T); break;
    case 3: x = R; y = T + Math.random() * (B - T); break;
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

  const [ix, iy] = input.getDirection();
  player.setVelocity(ix * player.speed, iy * player.speed);
  player.update(dt, bullets);
  attack();
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

  spawnTimer -= dt;
  if (spawnTimer <= 0) {
    spawnEnemy();
    gameTime += spawnInterval;
    spawnInterval = Math.max(SPAWN_INTERVAL_MIN,
      SPAWN_INTERVAL_INIT - gameTime * SPAWN_INTERVAL_DECAY);
    spawnTimer = spawnInterval;
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

  requestAnimationFrame(gameLoop);
}

function restart() {
  init();
}

document.addEventListener('click', (e) => {
  if (gameOver) {
    const wheel = document.getElementById('wheel');
    if (wheel && wheel.contains(e.target)) return;
    restart();
  }
});

init();
requestAnimationFrame(gameLoop);