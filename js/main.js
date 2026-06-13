// ========== 主循环 ==========
let player, input, minimap, renderer;
let enemies = [];
let bullets = [];
let xpOrbs = [];
let damageNumbers = [];    // {x,y,value,isCrit,life}
let spawnTimer = 0;
let spawnInterval = SPAWN_INTERVAL_INIT;
let gameTime = 0;
window._killCount = 0;
let gameOver = false;
let gamePaused = false;
let levelUpChoices = null;   // 当前三选一选项
let levelUpUi = null;         // UI 元素引用

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
}

// 生成悬浮伤害数字
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

// 在视口边缘外侧生成随机等级敌人（游戏越久高等级概率越大）
function spawnEnemy() {
  const margin = 60;
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const left   = player.x - vw / 2 - margin;
  const right  = player.x + vw / 2 + margin;
  const top    = player.y - vh / 2 - margin;
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

function attack() {
  if (!player.canAttack() || enemies.length === 0) return;
  let nearest = null;
  let minDist = player.effectiveAttackRange;
  for (let e of enemies) {
    if (!e.alive) continue;
    const dx = e.x - player.x;
    const dy = e.y - player.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < minDist) {
      minDist = dist;
      nearest = { enemy: e, dist, dx, dy };
    }
  }
  if (!nearest) return;

  player.doAttack();
  const angle = Math.atan2(nearest.dy, nearest.dx);
  // 决定本次是否暴击
  const roll = player.rollAttack();
  bullets.push(new Bullet(player.x, player.y, angle, roll.damage, roll.isCrit));
  player.angle = angle;
}

function update(dt) {
  if (!player.alive) return;
  if (gamePaused) return;

  const [ix, iy] = input.getDirection();
  player.setVelocity(ix * player.speed, iy * player.speed);
  player.update(dt, bullets);
  attack();

  // 子弹碰撞
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
        }
        break;
      }
    }
  }

  // 敌人碰撞
  for (let e of enemies) {
    if (!e.alive) continue;
    e.update(dt, player);
    if (e.collidesWith(player)) {
      player.takeDamage(e.hp);
      e.alive = false;
      window._killCount++;
      xpOrbs.push(new XpOrb(e.x, e.y, e.level));
      if (!player.alive) {
        gameOver = true;
        break;
      }
    }
  }

  enemies = enemies.filter(e => e.alive);
  bullets = bullets.filter(b => b.alive);

  // 经验球
  for (let orb of xpOrbs) {
    if (!orb.alive) continue;
    const gained = orb.update(dt, player);
    if (gained > 0) {
      const leveled = player.addXp(gained);
      if (leveled && player.pendingLevelUps > 0 && !gamePaused) {
        triggerLevelUpUi();
      }
    }
  }
  xpOrbs = xpOrbs.filter(o => o.alive);

  // 伤害数字动画
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

// ========== 升级选择 UI ==========
function pickRandomChoices(n) {
  const pool = ABILITY_POOL.slice();
  const result = [];
  while (result.length < n && pool.length > 0) {
    const idx = Math.floor(Math.random() * pool.length);
    result.push(pool.splice(idx, 1)[0]);
  }
  return result;
}

function triggerLevelUpUi() {
  gamePaused = true;
  levelUpChoices = pickRandomChoices(3);
  openLevelUpUi();
}

function onChooseAbility(abilityId) {
  player.applyAbility(abilityId);
  player.pendingLevelUps = Math.max(0, player.pendingLevelUps - 1);
  closeLevelUpUi();
  if (player.pendingLevelUps > 0) {
    // 连升多级，再次弹出
    setTimeout(() => triggerLevelUpUi(), 80);
  } else {
    gamePaused = false;
  }
}

function openLevelUpUi() {
  // 先保存选项，再清理旧 UI
  const choices = levelUpChoices;
  closeLevelUpUi();
  levelUpChoices = choices;
  
  const container = document.createElement('div');
  container.id = 'levelUpUi';
  container.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.75);z-index:500;display:flex;flex-direction:column;align-items:center;justify-content:center;font-family:Arial,sans-serif;color:#fff;user-select:none;';

  const title = document.createElement('div');
  title.textContent = '✦ 升级！选择一项能力 ✦';
  title.style.cssText = 'font-size:28px;font-weight:bold;margin-bottom:28px;color:#f1c40f;text-shadow:0 2px 8px rgba(0,0,0,0.6);';
  container.appendChild(title);

  const cards = document.createElement('div');
  cards.style.cssText = 'display:flex;gap:18px;flex-wrap:wrap;justify-content:center;';

  levelUpChoices.forEach((choice) => {
    const card = document.createElement('div');
    card.dataset.abilityId = choice.id;
    card.style.cssText = 'width:200px;padding:20px 18px;border:2px solid rgba(241,196,15,0.5);border-radius:14px;background:rgba(26,26,46,0.85);cursor:pointer;transition:all 0.15s;text-align:center;';
    card.onmouseenter = () => {
      card.style.background = 'rgba(52,152,219,0.25)';
      card.style.borderColor = '#f1c40f';
      card.style.transform = 'translateY(-2px)';
    };
    card.onmouseleave = () => {
      card.style.background = 'rgba(26,26,46,0.85)';
      card.style.borderColor = 'rgba(241,196,15,0.5)';
      card.style.transform = 'translateY(0)';
    };
    card.onclick = () => onChooseAbility(choice.id);

    const name = document.createElement('div');
    name.textContent = choice.name;
    name.style.cssText = 'font-size:18px;font-weight:bold;color:#f1c40f;margin-bottom:10px;';

    const desc = document.createElement('div');
    desc.textContent = choice.desc;
    desc.style.cssText = 'font-size:13px;color:#ddd;line-height:1.4;';

    card.appendChild(name);
    card.appendChild(desc);
    cards.appendChild(card);
  });
  container.appendChild(cards);
  document.body.appendChild(container);
  levelUpUi = container;
}

function closeLevelUpUi() {
  if (levelUpUi && levelUpUi.parentNode) levelUpUi.parentNode.removeChild(levelUpUi);
  levelUpUi = null;
  levelUpChoices = null;
}

// ========== 开发者面板 ==========
let devPanel = null;

function createDevPanel() {
  if (devPanel) return;
  
  const panel = document.createElement('div');
  panel.id = 'devPanel';
  panel.style.cssText = 'position:fixed;top:12px;right:12px;background:rgba(0,0,0,0.8);border:1px solid rgba(255,255,255,0.3);border-radius:8px;padding:12px;font-family:Arial,sans-serif;color:#fff;font-size:12px;z-index:400;user-select:none;min-width:140px;';
  
  const title = document.createElement('div');
  title.textContent = '🔧 开发者面板';
  title.style.cssText = 'font-weight:bold;margin-bottom:10px;color:#f1c40f;';
  panel.appendChild(title);
  
  // 攻速按钮
  const atkBtn = document.createElement('button');
  atkBtn.textContent = '攻速 +20%';
  atkBtn.style.cssText = 'width:100%;margin-bottom:6px;padding:6px 10px;background:#3498db;border:none;border-radius:4px;color:#fff;cursor:pointer;font-size:11px;';
  atkBtn.onclick = () => {
    player.applyAbility('attack_speed');
  };
  panel.appendChild(atkBtn);
  
  // 暴击按钮
  const critBtn = document.createElement('button');
  critBtn.textContent = '暴击 +10%';
  critBtn.style.cssText = 'width:100%;margin-bottom:6px;padding:6px 10px;background:#e74c3c;border:none;border-radius:4px;color:#fff;cursor:pointer;font-size:11px;';
  critBtn.onclick = () => {
    player.applyAbility('crit_chance');
  };
  panel.appendChild(critBtn);
  
  // HP按钮
  const hpBtn = document.createElement('button');
  hpBtn.textContent = '生命 +10';
  hpBtn.style.cssText = 'width:100%;margin-bottom:6px;padding:6px 10px;background:#2ecc71;border:none;border-radius:4px;color:#fff;cursor:pointer;font-size:11px;';
  hpBtn.onclick = () => {
    player.applyAbility('hp_max');
  };
  panel.appendChild(hpBtn);
  
  // 经验按钮
  const xpBtn = document.createElement('button');
  xpBtn.textContent = '经验 +50';
  xpBtn.style.cssText = 'width:100%;margin-bottom:6px;padding:6px 10px;background:#9b59b6;border:none;border-radius:4px;color:#fff;cursor:pointer;font-size:11px;';
  xpBtn.onclick = () => {
    player.addXp(50);
  };
  panel.appendChild(xpBtn);

  // 伤害按钮
  const dmgBtn = document.createElement('button');
  dmgBtn.textContent = '伤害 +2';
  dmgBtn.style.cssText = 'width:100%;margin-bottom:6px;padding:6px 10px;background:#e67e22;border:none;border-radius:4px;color:#fff;cursor:pointer;font-size:11px;';
  dmgBtn.onclick = () => {
    player.applyAbility('damage');
  };
  panel.appendChild(dmgBtn);

  // 视野按钮
  const viewBtn = document.createElement('button');
  viewBtn.textContent = '视野 +5%';
  viewBtn.style.cssText = 'width:100%;margin-bottom:6px;padding:6px 10px;background:#1abc9c;border:none;border-radius:4px;color:#fff;cursor:pointer;font-size:11px;';
  viewBtn.onclick = () => {
    player.applyAbility('view_range');
  };
  panel.appendChild(viewBtn);

  // 攻击范围按钮
  const atkRngBtn = document.createElement('button');
  atkRngBtn.textContent = '攻击范围 +5';
  atkRngBtn.style.cssText = 'width:100%;margin-bottom:6px;padding:6px 10px;background:#8e44ad;border:none;border-radius:4px;color:#fff;cursor:pointer;font-size:11px;';
  atkRngBtn.onclick = () => {
    player.applyAbility('attack_range');
  };
  panel.appendChild(atkRngBtn);

  // 吸取范围按钮
  const pickBtn = document.createElement('button');
  pickBtn.textContent = '吸取范围 +5';
  pickBtn.style.cssText = 'width:100%;margin-bottom:6px;padding:6px 10px;background:#16a085;border:none;border-radius:4px;color:#fff;cursor:pointer;font-size:11px;';
  pickBtn.onclick = () => {
    player.applyAbility('pickup_range');
  };
  panel.appendChild(pickBtn);

  // 经验倍率按钮
  const xpMulBtn = document.createElement('button');
  const updateXpMulText = () => {
    xpMulBtn.textContent = '经验 x' + (player.expMultiplier || 1) + '（切换）';
  };
  updateXpMulText();
  xpMulBtn.style.cssText = 'width:100%;margin-bottom:6px;padding:6px 10px;background:#d35400;border:none;border-radius:4px;color:#fff;cursor:pointer;font-size:11px;';
  xpMulBtn.onclick = () => {
    // 1 → 5 → 10 → 1 循环
    const cur = player.expMultiplier || 1;
    player.expMultiplier = cur === 1 ? 5 : cur === 5 ? 10 : 1;
    updateXpMulText();
  };
  panel.appendChild(xpMulBtn);

  // 关闭按钮
  const closeBtn = document.createElement('button');
  closeBtn.textContent = '隐藏面板';
  closeBtn.style.cssText = 'width:100%;padding:4px 10px;background:rgba(255,255,255,0.1);border:1px solid rgba(255,255,255,0.3);border-radius:4px;color:#aaa;cursor:pointer;font-size:10px;margin-top:4px;';
  closeBtn.onclick = () => {
    panel.style.display = 'none';
  };
  panel.appendChild(closeBtn);
  
  document.body.appendChild(panel);
  devPanel = panel;
}

// 按 D 键切换开发者面板
document.addEventListener('keydown', (e) => {
  if (e.key === 'd' || e.key === 'D') {
    if (devPanel) {
      devPanel.style.display = devPanel.style.display === 'none' ? 'block' : 'none';
    } else {
      createDevPanel();
    }
  }
});

// ========== 渲染与主循环 ==========
function gameLoop() {
  const now = performance.now();
  if (!gameLoop._last) gameLoop._last = now;
  let dt = (now - gameLoop._last) / 1000;
  gameLoop._last = now;
  if (dt > 0.1) dt = 0.1;

  update(dt);
  renderer.render(player, enemies, bullets, xpOrbs, damageNumbers);
  minimap.render(player, enemies, player.x, player.y);

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
