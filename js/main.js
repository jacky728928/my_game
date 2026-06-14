// ========== 主循环 ==========
let player, input, minimap, renderer;
let enemies = [];
let bullets = [];
let xpOrbs = [];
let damageNumbers = [];    // {x,y,value,isCrit,life}
let grenades = [];          // 延迟爆炸：手雷飞行中的投掷物
let shells = [];            // 榴弹炮：发射中的弹体（飞行→爆炸）
let explosions = [];        // 爆炸视觉效果（闪光+冲击波）
let particles = [];         // 通用粒子（爆炸碎片/烟雾/火星）
let targetMarkers = [];     // 目标锁定指示（榴弹炮瞄准时显示）
let spawnTimer = 0;
// 武器攻击禁用状态
let weaponAttackDisabled = {
  primary: false,   // 主武器
  slot1: false,     // 副武器槽位1
  slot2: false,     // 副武器槽位2
  slot3: false,     // 副武器槽位3
};
let spawnInterval = SPAWN_INTERVAL_INIT;
let gameTime = 0;
window._killCount = 0;
let gameOver = false;
let gamePaused = false;
let levelUpChoices = null;   // 当前三选一选项
let levelUpUi = null;         // UI 元素引用
let screenShake = { intensity: 0, duration: 0, elapsed: 0 };  // 屏幕震动
let cameraFlash = { intensity: 0, duration: 0, elapsed: 0 };  // 镜头闪光

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
  // 开局先选模式（手机/电脑），手机视野+50%；选完再选副武器
  openModeSelectUi();
}

// 开局模式选择：手机 vs 电脑
function openModeSelectUi() {
  gamePaused = true;
  closeLevelUpUi();
  const container = document.createElement('div');
  container.id = 'levelUpUi';
  container.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.85);z-index:500;display:flex;flex-direction:column;align-items:center;justify-content:center;font-family:Arial,sans-serif;color:#fff;user-select:none;';

  const title = document.createElement('div');
  title.textContent = '✦ 选择你的模式 ✦';
  title.style.cssText = 'font-size:30px;font-weight:bold;margin-bottom:10px;color:#f1c40f;text-shadow:0 2px 8px rgba(0,0,0,0.6);';
  container.appendChild(title);

  const subtitle = document.createElement('div');
  subtitle.textContent = '手机模式：视野 +50%（更适合窄屏）| 电脑模式：标准视野';
  subtitle.style.cssText = 'font-size:13px;color:#aaa;margin-bottom:28px;text-align:center;';
  container.appendChild(subtitle);

  const cards = document.createElement('div');
  cards.style.cssText = 'display:flex;gap:22px;flex-wrap:wrap;justify-content:center;';

  // 手机模式
  const mobileCard = document.createElement('div');
  mobileCard.style.cssText = 'width:220px;padding:26px 20px;border:2px solid #3498db;border-radius:14px;background:rgba(26,26,46,0.85);cursor:pointer;transition:all 0.15s;text-align:center;';
  mobileCard.onmouseenter = () => { mobileCard.style.transform = 'translateY(-3px)'; mobileCard.style.boxShadow = '0 6px 16px rgba(52,152,219,0.45)'; };
  mobileCard.onmouseleave = () => { mobileCard.style.transform = 'translateY(0)'; mobileCard.style.boxShadow = 'none'; };
  mobileCard.onclick = () => {
    player.viewRangeBonus += 50;  // 手机模式：视野 +50%
    closeLevelUpUi();
    // 进入副武器选择
    player.pendingLevelUps.push({ level: 1, type: 'secondary' });
    triggerLevelUpUi();
  };
  const mobileName = document.createElement('div');
  mobileName.textContent = '📱 手机模式';
  mobileName.style.cssText = 'font-size:20px;font-weight:bold;color:#3498db;margin-bottom:10px;';
  const mobileDesc = document.createElement('div');
  mobileDesc.textContent = '视野 +50%\n屏幕内能看到更多区域\n适合窄屏和移动端';
  mobileDesc.style.cssText = 'font-size:12px;color:#ddd;line-height:1.6;white-space:pre-line;';
  mobileCard.appendChild(mobileName);
  mobileCard.appendChild(mobileDesc);
  cards.appendChild(mobileCard);

  // 电脑模式
  const pcCard = document.createElement('div');
  pcCard.style.cssText = 'width:220px;padding:26px 20px;border:2px solid #9b59b6;border-radius:14px;background:rgba(26,26,46,0.85);cursor:pointer;transition:all 0.15s;text-align:center;';
  pcCard.onmouseenter = () => { pcCard.style.transform = 'translateY(-3px)'; pcCard.style.boxShadow = '0 6px 16px rgba(155,89,182,0.45)'; };
  pcCard.onmouseleave = () => { pcCard.style.transform = 'translateY(0)'; pcCard.style.boxShadow = 'none'; };
  pcCard.onclick = () => {
    closeLevelUpUi();
    // 进入副武器选择
    player.pendingLevelUps.push({ level: 1, type: 'secondary' });
    triggerLevelUpUi();
  };
  const pcName = document.createElement('div');
  pcName.textContent = '💻 电脑模式';
  pcName.style.cssText = 'font-size:20px;font-weight:bold;color:#9b59b6;margin-bottom:10px;';
  const pcDesc = document.createElement('div');
  pcDesc.textContent = '标准视野\n适合大屏电脑操作\n原始画面比例';
  pcDesc.style.cssText = 'font-size:12px;color:#ddd;line-height:1.6;white-space:pre-line;';
  pcCard.appendChild(pcName);
  pcCard.appendChild(pcDesc);
  cards.appendChild(pcCard);

  container.appendChild(cards);
  document.body.appendChild(container);
  levelUpUi = container;
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
  if (weaponAttackDisabled.primary) return;
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
  const roll = player.rollAttack();
  bullets.push(new Bullet(player.x, player.y, angle, roll.damage, roll.isCrit));
  player.angle = angle;
}

// 查找最近的存活敌人（用于副武器自动锁定）
function findNearestEnemy(maxRange) {
  let nearest = null;
  let minDist = maxRange;
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
  return nearest;
}

function findNearestEnemies(count, maxRange) {
  const sorted = [];
  for (let e of enemies) {
    if (!e.alive) continue;
    const dx = e.x - player.x;
    const dy = e.y - player.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < maxRange) {
      sorted.push({ enemy: e, dist, dx, dy });
    }
  }
  sorted.sort((a, b) => a.dist - b.dist);
  return sorted.slice(0, count);
}

// AOE 伤害：对指定位置半径范围内所有敌人造成伤害
function applyAoeDamage(x, y, radius, damage) {
  for (let e of enemies) {
    if (!e.alive) continue;
    const dx = e.x - x;
    const dy = e.y - y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist <= radius + e.radius) {
      const dmgVal = Math.round(damage * 10) / 10;
      e.takeDamage(damage);
      addDamageNumber(e.x, e.y, dmgVal, true);
      if (!e.alive) {
        window._killCount++;
        xpOrbs.push(new XpOrb(e.x, e.y, e.level));
      }
    }
  }
}

// 创建爆炸：多层冲击波 + 中心闪光 + 碎片 + 烟雾 + 火花 + 屏幕震动
function createExplosion(x, y, radius, color, extra) {
  // 屏幕震动（强度随AOE范围缩放）
  screenShake.intensity = 8 + (radius / 150) * 12;
  screenShake.duration = 0.35 + (radius / 150) * 0.2;
  screenShake.elapsed = 0;

  // 第0层：中心白色强光（瞬间出现，快速消失）
  explosions.push({
    x, y,
    radius: 0,
    maxRadius: radius * 0.45,
    life: 0.25,
    maxLife: 0.25,
    color: '#ffffff',
    type: 'flash',
  });
  // 第1层：主冲击波（颜色环，中等速度）
  explosions.push({
    x, y,
    radius: 0,
    maxRadius: radius,
    life: 0.85,
    maxLife: 0.85,
    color: color,
    type: 'ring_main',
  });
  // 第2层：白色高光环（略小更快）
  explosions.push({
    x, y,
    radius: 0,
    maxRadius: radius * 0.7,
    life: 0.5,
    maxLife: 0.5,
    color: '#ffffff',
    type: 'ring_white',
  });
  // 第3层：外圈橙红扩散（最大最慢）
  explosions.push({
    x, y,
    radius: 0,
    maxRadius: radius * 1.5,
    life: 1.2,
    maxLife: 1.2,
    color: '#ff4411',
    type: 'ring_outer',
  });
  // 第4层：内层暗红脉冲（快速收缩消失）
  explosions.push({
    x, y,
    radius: radius * 0.9,
    maxRadius: radius * 0.9,
    life: 0.3,
    maxLife: 0.3,
    color: '#cc1100',
    type: 'ring_inner',
  });
  // 地面烧焦印记（持续久，渐淡）
  explosions.push({
    x, y,
    radius: radius * 0.85,
    maxRadius: radius * 0.85,
    life: 3.0,
    maxLife: 3.0,
    color: '#1a0a00',
    type: 'scorch',
  });

  // 爆炸碎片：更多、更快、更密集
  const debrisCount = 70;
  for (let i = 0; i < debrisCount; i++) {
    const angle = (i / debrisCount) * Math.PI * 2 + Math.random() * 0.4;
    const speed = (150 + Math.random() * 280) * (radius / 100);
    const colorList = ['#ffffff', color, '#ffee66', '#ff7722', '#ff3322', '#aa2211', '#ffcc88'];
    particles.push({
      type: 'debris',
      x: x,
      y: y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 30,
      size: 2 + Math.random() * 6,
      life: 0.6 + Math.random() * 0.6,
      maxLife: 1.2,
      color: colorList[Math.floor(Math.random() * colorList.length)],
      drag: 2.2,
    });
  }

  // 烟雾：多团、上升、扩大
  const smokeCount = 30;
  for (let i = 0; i < smokeCount; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 20 + Math.random() * 60;
    particles.push({
      type: 'smoke',
      x: x + (Math.random() - 0.5) * radius * 0.5,
      y: y + (Math.random() - 0.5) * radius * 0.5,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 30,
      size: 16 + Math.random() * 28,
      life: 1.0 + Math.random() * 0.9,
      maxLife: 1.9,
      color: Math.random() < 0.35 ? '#2a2a2a' : (Math.random() < 0.5 ? '#555555' : '#7a4a28'),
      drag: 0.5,
      grow: 40,
    });
  }

  // 火花：大量快速小亮点，向四周喷射并上升
  const sparkCount = 45;
  for (let i = 0; i < sparkCount; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 180 + Math.random() * 320;
    particles.push({
      type: 'spark',
      x: x,
      y: y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 60,
      size: 1.5 + Math.random() * 3,
      life: 0.4 + Math.random() * 0.55,
      maxLife: 0.95,
      color: Math.random() < 0.45 ? '#ffffff' : (Math.random() < 0.5 ? '#ffee66' : '#ff8833'),
      drag: 1.4,
    });
  }
}

// 创建目标锁定指示器（十字瞄准线 + 收缩环，飞行命中时消失）
function createTargetMarker(x, y, radius, color) {
  targetMarkers.push({
    x, y,
    radius: radius,
    life: 0.9,
    maxLife: 0.9,
    color: color || '#e67e22',
  });
}

// 副武器：每个的冷却时间 + 触发
function updateSecondaryWeapons(dt) {
  const baseDmg = player.effectiveDamage;

  for (let i = 0; i < player.secondaryWeapons.length; i++) {
    // 检查该槽位是否被禁用
    if (weaponAttackDisabled['slot' + (i + 1)]) continue;
    const slot = player.secondaryWeapons[i];
    slot.cooldown = Math.max(0, slot.cooldown - dt);
    if (slot.cooldown > 0) continue;

    const def = slot.def;

    if (def.type === 'heal') {
      // 医疗包：恢复生命
      // 急救强化：回复量 +50%/级
      const mkLevel = player.secondaryAbilityLevels['mk_healboost'] || 0;
      const healMult = def.damageMult * (1 + mkLevel * 0.5);
      const heal = Math.round(baseDmg * healMult);
      player.hp = Math.min(player.maxHp, player.hp + heal);
      // 显示治疗数字（绿色）
      damageNumbers.push({
        x: player.x + (Math.random() - 0.5) * 20,
        y: player.y - player.radius - 10,
        value: heal,
        isCrit: false,
        isHeal: true,
        life: DAMAGE_NUM_LIFE,
        maxLife: DAMAGE_NUM_LIFE,
      });
      slot.cooldown = def.cooldown;
      continue;
    }

    if (def.type === 'aoe_direct') {
      // 榴弹炮：找多个最近敌人 → 每颗弹体各自锁定 → 发射 → 命中爆炸
      // 火力倾泻：每级额外发射一颗榴弹
      const glLevel = player.secondaryAbilityLevels['gl_firepower'] || 0;
      const shellCount = 1 + glLevel;
      const targets = findNearestEnemies(shellCount, 1e9);
      if (targets.length === 0) continue;
      const dmg = baseDmg * def.damageMult;
      // 每颗弹体各自锁定最近的敌人
      for (let i = 0; i < shellCount; i++) {
        const tgt = targets[i] || targets[targets.length - 1]; // 不够多敌人时锁定同一目标
        const tx = tgt.enemy.x;
        const ty = tgt.enemy.y;
        createTargetMarker(tx, ty, def.aoeRadius, def.color);
        const dx = tx - player.x;
        const dy = ty - player.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const flyTime = Math.max(0.5, Math.min(2.0, dist / 300));
        shells.push({
          x: player.x,
          y: player.y,
          startX: player.x,
          startY: player.y,
          targetX: tx,
          targetY: ty,
          flyTime: flyTime,
          flyElapsed: 0,
          dmg: dmg,
          aoeRadius: def.aoeRadius,
          color: def.color,
          exploded: false,
          angle: Math.atan2(dy, dx),
        });
      }
      slot.cooldown = def.cooldown;
      continue;
    }

    if (def.type === 'aoe_delayed') {
      // 手雷：向最近敌人位置投掷，2秒后爆炸
      // 集束手雷：手雷伤害 +50%/级
      const grLevel = player.secondaryAbilityLevels['gr_cluster'] || 0;
      const dmgMult = def.damageMult * (1 + grLevel * 0.5);
      const grenadeRange = 300;  // 手雷投掷范围
      const target = findNearestEnemy(grenadeRange);
      if (!target) continue;
      const tx = target.enemy.x;
      const ty = target.enemy.y;
      // 飞行轨迹参数
      const dx = tx - player.x;
      const dy = ty - player.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const flyTime = Math.max(0.5, Math.min(1.0, dist / 300));  // 近距离飞行更快
      grenades.push({
        x: player.x,
        y: player.y,
        startX: player.x,
        startY: player.y,
        targetX: tx,
        targetY: ty,
        flyTime: flyTime,
        flyElapsed: 0,
        fuseTime: def.fuseTime,
        fuseElapsed: 0,
        dmg: baseDmg * dmgMult,
        aoeRadius: def.aoeRadius,
        color: def.color,
        exploding: false,
        landed: false,
      });
      slot.cooldown = def.cooldown;
      continue;
    }
  }

  // 榴弹炮弹体：飞行 + 命中爆炸
  for (let s of shells) {
    s.flyElapsed += dt;
    const t = Math.min(1, s.flyElapsed / s.flyTime);
    s.x = s.startX + (s.targetX - s.startX) * t;
    s.y = s.startY + (s.targetY - s.startY) * t;
    // 飞行拖尾：密集的火花和发光粒子
    if (Math.random() < 0.85) {
      particles.push({
        type: 'trail',
        x: s.x + (Math.random() - 0.5) * 8,
        y: s.y + (Math.random() - 0.5) * 8,
        vx: (Math.random() - 0.5) * 60,
        vy: (Math.random() - 0.5) * 60 - 10,
        size: 4 + Math.random() * 3,
        life: 0.25 + Math.random() * 0.2,
        maxLife: 0.45,
        color: Math.random() < 0.4 ? '#ffffff' : (Math.random() < 0.5 ? '#ffcc33' : '#ff6611'),
        drag: 2.5,
      });
    }
    if (t >= 1 && !s.exploded) {
      s.exploded = true;
      // 命中后：大爆炸 + 伤害 + 大量碎片
      applyAoeDamage(s.x, s.y, s.aoeRadius, s.dmg);
      createExplosion(s.x, s.y, s.aoeRadius, s.color);
      // 额外的爆炸冲击波（让大爆炸更有层次）
      explosions.push({
        x: s.x, y: s.y,
        radius: 0,
        maxRadius: s.aoeRadius * 1.6,
        life: 0.6,
        maxLife: 0.6,
        color: '#ffffff',
        type: 'big',
      });
    }
  }
  shells = shells.filter(s => !s.exploded);

  // 手雷飞行与爆炸
  for (let g of grenades) {
    if (!g.landed) {
      g.flyElapsed += dt;
      const t = Math.min(1, g.flyElapsed / g.flyTime);
      g.x = g.startX + (g.targetX - g.startX) * t;
      g.y = g.startY + (g.targetY - g.startY) * t;
      // 飞行尾迹：每隔几帧喷一颗小火花
      if (Math.random() < 0.6) {
        particles.push({
          type: 'trail',
          x: g.x + (Math.random() - 0.5) * 6,
          y: g.y + (Math.random() - 0.5) * 6,
          vx: (Math.random() - 0.5) * 20,
          vy: (Math.random() - 0.5) * 20 - 15,
          size: 3 + Math.random() * 2,
          life: 0.2 + Math.random() * 0.2,
          maxLife: 0.4,
          color: Math.random() < 0.5 ? '#ffbb33' : '#ff6622',
          drag: 2.0,
        });
      }
      if (t >= 1) {
        g.landed = true;
        // 落地时溅射一些碎片
        for (let i = 0; i < 8; i++) {
          const a = Math.random() * Math.PI * 2;
          const s = 40 + Math.random() * 50;
          particles.push({
            type: 'debris',
            x: g.x, y: g.y,
            vx: Math.cos(a) * s,
            vy: Math.sin(a) * s,
            size: 2 + Math.random() * 2,
            life: 0.3 + Math.random() * 0.2,
            maxLife: 0.5,
            color: '#aaaaaa',
            drag: 2.5,
          });
        }
      }
    } else {
      g.fuseElapsed += dt;
      // 引信倒计时：越接近爆炸越频繁地喷火花
      const fuseProgress = g.fuseElapsed / g.fuseTime;
      const sparkRate = 3 + fuseProgress * 18; // 开始 3/s，结束 21/s
      const sparkChance = Math.min(1, sparkRate * dt);
      if (Math.random() < sparkChance) {
        const a = Math.random() * Math.PI * 2;
        const s = 30 + Math.random() * 90 * fuseProgress;
        particles.push({
          type: 'spark',
          x: g.x + (Math.random() - 0.5) * 10,
          y: g.y + (Math.random() - 0.5) * 10,
          vx: Math.cos(a) * s,
          vy: Math.sin(a) * s - 30,
          size: 1.5 + Math.random() * 2,
          life: 0.25 + Math.random() * 0.3,
          maxLife: 0.55,
          color: Math.random() < 0.3 ? '#ffffff' : '#ffaa33',
          drag: 1.8,
        });
      }
      if (g.fuseElapsed >= g.fuseTime) {
        // 爆炸
        applyAoeDamage(g.x, g.y, g.aoeRadius, g.dmg);
        createExplosion(g.x, g.y, g.aoeRadius, g.color);
        g.exploding = true;
      }
    }
  }
  grenades = grenades.filter(g => !g.exploding);

  // 屏幕震动衰减
  if (screenShake.duration > 0) {
    screenShake.elapsed += dt;
    if (screenShake.elapsed >= screenShake.duration) {
      screenShake.intensity = 0;
      screenShake.duration = 0;
      screenShake.elapsed = 0;
    }
  }
  // 镜头闪光衰减
  if (cameraFlash.duration > 0) {
    cameraFlash.elapsed += dt;
    if (cameraFlash.elapsed >= cameraFlash.duration) {
      cameraFlash.intensity = 0;
      cameraFlash.duration = 0;
      cameraFlash.elapsed = 0;
    }
  }

  // 爆炸视觉衰减
  for (let ex of explosions) {
    ex.life -= dt;
    const t = 1 - (ex.life / ex.maxLife);
    // 缓出：前期快速扩散
    ex.radius = ex.maxRadius * (1 - Math.pow(1 - t, 2.5));
  }
  explosions = explosions.filter(e => e.life > 0);

  // 粒子更新（所有类型统一）
  for (let p of particles) {
    p.life -= dt;
    // 阻尼（drag 越大减速越快）
    const damp = Math.max(0, 1 - p.drag * dt);
    p.vx *= damp;
    p.vy *= damp;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    if (p.grow) {
      p.size += p.grow * dt;
    }
  }
  particles = particles.filter(p => p.life > 0);

  // 目标锁定指示更新
  for (let m of targetMarkers) {
    m.life -= dt;
  }
  targetMarkers = targetMarkers.filter(m => m.life > 0);
}

function update(dt) {
  if (!player.alive) return;
  if (gamePaused) return;

  const [ix, iy] = input.getDirection();
  player.setVelocity(ix * player.speed, iy * player.speed);
  player.update(dt, bullets);
  attack();

  // 副武器：冷却计时 + 自动触发
  updateSecondaryWeapons(dt);

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
      if (leveled && player.pendingLevelUps.length > 0 && !gamePaused) {
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

  // 副武器专属技能：持有对应武器时加入候选池
  const secondaryChoices = [];
  if (player) {
    for (let slot of player.secondaryWeapons) {
      const weaponId = slot.id;
      const pool = SECONDARY_ABILITY_POOL[weaponId];
      if (pool) {
        for (let skill of pool) {
          secondaryChoices.push({ ...skill, weaponId });
        }
      }
    }
  }

  // 混合普通技能和副武器专属技能，统一打乱后取前 n 个
  const fullPool = pool.concat(secondaryChoices);
  while (result.length < n && fullPool.length > 0) {
    const idx = Math.floor(Math.random() * fullPool.length);
    result.push(fullPool.splice(idx, 1)[0]);
  }
  return result;
}

function triggerLevelUpUi() {
  gamePaused = true;
  // 判断当前是否触发副武器升级等级（第5级或10n级）
  // 注：player.level 在 addXp 中已升级，因此需要看“刚升到的等级”
  // 简单做法：检查“玩家当前等级”是否为 5 或 10 的倍数
  // 但如果连升多级（从3→6），应取最高的一个等级作判定（否则可能错过特殊等级）
  // 方案：检查本次升级后是否命中了特殊等级——跟踪当前level与pendingLevelUps
  const pending = player.pendingLevelUps[0];
  const isSecondary = pending && pending.type === 'secondary';

  if (isSecondary) {
    // 弹出副武器选择：列出所有副武器（当前已装备的禁止重复）
    levelUpChoices = SECONDARY_WEAPON_LIST.map(w => ({ ...w }));
    openSecondaryWeaponUi();
  } else {
    levelUpChoices = pickRandomChoices(3);
    openLevelUpUi();
  }
}

// 副武器选择后：如已达上限则先弹丢弃选择
function onChooseSecondaryWeapon(weaponId) {
  if (player.hasSecondaryWeapon(weaponId)) return; // 已装备同名，不重复选
  if (player.secondaryWeapons.length < MAX_SECONDARY_WEAPONS) {
    player.equipSecondaryWeapon(weaponId);
    player.pendingLevelUps.shift();
    closeLevelUpUi();
    if (player.pendingLevelUps.length > 0) {
      setTimeout(() => triggerLevelUpUi(), 80);
    } else {
      gamePaused = false;
    }
  } else {
    // 超过上限：打开丢弃选择界面
    openDiscardUi(weaponId);
  }
}

// 打开丢弃界面（在“武器超过3个时”使用）
function openDiscardUi(newWeaponId) {
  closeLevelUpUi();
  const container = document.createElement('div');
  container.id = 'levelUpUi';
  container.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.8);z-index:500;display:flex;flex-direction:column;align-items:center;justify-content:center;font-family:Arial,sans-serif;color:#fff;user-select:none;';

  const title = document.createElement('div');
  title.textContent = '⚠ 副武器已满（最多 ' + MAX_SECONDARY_WEAPONS + ' 个），请选择要丢弃的副武器，否则放弃获得新武器';
  title.style.cssText = 'font-size:16px;font-weight:bold;margin-bottom:22px;color:#f1c40f;text-align:center;max-width:620px;';
  container.appendChild(title);

  const cards = document.createElement('div');
  cards.style.cssText = 'display:flex;gap:16px;flex-wrap:wrap;justify-content:center;';

  // 列出当前已装备的副武器供丢弃
  player.secondaryWeapons.forEach(slot => {
    const def = slot.def;
    const card = document.createElement('div');
    card.style.cssText = 'width:200px;padding:18px 16px;border:2px solid ' + def.color + ';border-radius:14px;background:rgba(26,26,46,0.85);cursor:pointer;transition:all 0.15s;text-align:center;';
    card.onmouseenter = () => { card.style.transform = 'translateY(-2px)'; card.style.boxShadow = '0 4px 14px rgba(0,0,0,0.5)'; };
    card.onmouseleave = () => { card.style.transform = 'translateY(0)'; card.style.boxShadow = 'none'; };

    const name = document.createElement('div');
    name.textContent = '[丢弃] ' + def.name;
    name.style.cssText = 'font-size:16px;font-weight:bold;color:' + def.color + ';margin-bottom:8px;';

    const desc = document.createElement('div');
    desc.textContent = def.desc;
    desc.style.cssText = 'font-size:12px;color:#ddd;line-height:1.4;';

    card.appendChild(name);
    card.appendChild(desc);
    card.onclick = () => {
      player.discardSecondaryWeapon(slot.id);
      player.equipSecondaryWeapon(newWeaponId);
      player.pendingLevelUps.shift();
      closeLevelUpUi();
      if (player.pendingLevelUps.length > 0) {
        setTimeout(() => triggerLevelUpUi(), 80);
      } else {
        gamePaused = false;
      }
    };
    cards.appendChild(card);
  });

  // 放弃获得新武器的选项
  const giveUp = document.createElement('div');
  giveUp.textContent = '放弃新武器';
  giveUp.style.cssText = 'width:150px;padding:18px 16px;border:2px solid #555;border-radius:14px;background:rgba(26,26,46,0.7);cursor:pointer;transition:all 0.15s;text-align:center;font-size:14px;color:#999;';
  giveUp.onmouseenter = () => { giveUp.style.transform = 'translateY(-2px)'; };
  giveUp.onmouseleave = () => { giveUp.style.transform = 'translateY(0)'; };
  giveUp.onclick = () => {
    player.pendingLevelUps.shift();
    closeLevelUpUi();
    if (player.pendingLevelUps.length > 0) {
      setTimeout(() => triggerLevelUpUi(), 80);
    } else {
      gamePaused = false;
    }
  };
  cards.appendChild(giveUp);

  container.appendChild(cards);
  document.body.appendChild(container);
  levelUpUi = container;
}

// 打开副武器选择窗口：列出所有副武器（已装备的灰掉不可选）
function openSecondaryWeaponUi() {
  // 先保存选项再清理（和 openLevelUpUi 一样的模式）
  const choices = levelUpChoices;
  closeLevelUpUi();
  levelUpChoices = choices;
  const container = document.createElement('div');
  container.id = 'levelUpUi';
  container.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.8);z-index:500;display:flex;flex-direction:column;align-items:center;justify-content:center;font-family:Arial,sans-serif;color:#fff;user-select:none;';

  const title = document.createElement('div');
  const pending = player.pendingLevelUps[0];
  const showLevel = pending ? pending.level : player.level;
  title.textContent = '★ 第 ' + showLevel + ' 级！选择一个副武器 ★';
  title.style.cssText = 'font-size:26px;font-weight:bold;margin-bottom:22px;color:#f1c40f;text-shadow:0 2px 8px rgba(0,0,0,0.6);';
  container.appendChild(title);

  const info = document.createElement('div');
  info.textContent = '当前已装备 ' + player.secondaryWeapons.length + ' / ' + MAX_SECONDARY_WEAPONS + ' 个副武器（超过上限会进入丢弃选择）';
  info.style.cssText = 'font-size:13px;color:#aaa;margin-bottom:18px;';
  container.appendChild(info);

  const cards = document.createElement('div');
  cards.style.cssText = 'display:flex;gap:18px;flex-wrap:wrap;justify-content:center;';

  levelUpChoices.forEach((choice) => {
    const alreadyEquipped = player.hasSecondaryWeapon(choice.id);
    const card = document.createElement('div');
    const borderColor = alreadyEquipped ? '#555' : (choice.color || '#f1c40f');
    card.style.cssText = 'width:220px;padding:20px 18px;border:2px solid ' + borderColor + ';border-radius:14px;background:rgba(26,26,46,0.85);cursor:pointer;transition:all 0.15s;text-align:center;' + (alreadyEquipped ? 'opacity:0.5;cursor:not-allowed;' : '');

    if (!alreadyEquipped) {
      card.onmouseenter = () => { card.style.transform = 'translateY(-2px)'; card.style.boxShadow = '0 4px 14px rgba(0,0,0,0.5)'; };
      card.onmouseleave = () => { card.style.transform = 'translateY(0)'; card.style.boxShadow = 'none'; };
      card.onclick = () => onChooseSecondaryWeapon(choice.id);
    }

    const name = document.createElement('div');
    name.textContent = choice.name + (alreadyEquipped ? '（已装备）' : '');
    name.style.cssText = 'font-size:18px;font-weight:bold;color:' + borderColor + ';margin-bottom:10px;';

    const desc = document.createElement('div');
    desc.textContent = choice.desc;
    desc.style.cssText = 'font-size:12px;color:#ddd;line-height:1.4;';

    card.appendChild(name);
    card.appendChild(desc);
    cards.appendChild(card);
  });
  container.appendChild(cards);
  document.body.appendChild(container);
  levelUpUi = container;
}

function onChooseAbility(abilityId) {
  player.applyAbility(abilityId);
  player.pendingLevelUps.shift();
  closeLevelUpUi();
  if (player.pendingLevelUps.length > 0) {
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
    const isSecondary = !!choice.weaponId;
    const accentColor = isSecondary ? (choice.color || '#e67e22') : 'rgba(241,196,15,0.5)';
    const nameColor = isSecondary ? (choice.color || '#e67e22') : '#f1c40f';
    const tagText = isSecondary ? '[' + (SECONDARY_WEAPON_POOL[choice.weaponId]?.name || choice.weaponId) + '专属]' : '';
    const card = document.createElement('div');
    card.dataset.abilityId = choice.id;
    card.style.cssText = 'width:200px;padding:20px 18px;border:2px solid ' + accentColor + ';border-radius:14px;background:rgba(26,26,46,0.85);cursor:pointer;transition:all 0.15s;text-align:center;';
    card.onmouseenter = () => {
      card.style.background = 'rgba(52,152,219,0.25)';
      card.style.borderColor = nameColor;
      card.style.transform = 'translateY(-2px)';
    };
    card.onmouseleave = () => {
      card.style.background = 'rgba(26,26,46,0.85)';
      card.style.borderColor = accentColor;
      card.style.transform = 'translateY(0)';
    };
    card.onclick = () => onChooseAbility(choice.id);

    const tag = document.createElement('div');
    tag.textContent = tagText;
    tag.style.cssText = 'font-size:10px;color:' + nameColor + ';margin-bottom:4px;opacity:0.8;';

    const name = document.createElement('div');
    name.textContent = choice.name;
    name.style.cssText = 'font-size:18px;font-weight:bold;color:' + nameColor + ';margin-bottom:10px;';

    const desc = document.createElement('div');
    desc.textContent = choice.desc;
    desc.style.cssText = 'font-size:13px;color:#ddd;line-height:1.4;';

    card.appendChild(tag);
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

  // 分隔线
  const sep = document.createElement('hr');
  sep.style.cssText = 'width:100%;border:none;border-top:1px solid rgba(255,255,255,0.2);margin:8px 0;';
  panel.appendChild(sep);

  const sepTitle = document.createElement('div');
  sepTitle.textContent = '⚔ 武器控制';
  sepTitle.style.cssText = 'font-weight:bold;margin-bottom:6px;color:#e74c3c;font-size:11px;';
  panel.appendChild(sepTitle);

  // 主武器停止按钮
  const primaryBtn = document.createElement('button');
  const updatePrimaryBtn = () => {
    primaryBtn.textContent = '主武器: ' + (weaponAttackDisabled.primary ? '已停止' : '进行中');
    primaryBtn.style.cssText = 'width:100%;margin-bottom:4px;padding:5px 10px;background:' + (weaponAttackDisabled.primary ? '#c0392b' : '#27ae60') + ';border:none;border-radius:4px;color:#fff;cursor:pointer;font-size:11px;';
  };
  updatePrimaryBtn();
  primaryBtn.onclick = () => {
    weaponAttackDisabled.primary = !weaponAttackDisabled.primary;
    updatePrimaryBtn();
  };
  panel.appendChild(primaryBtn);

  // 副武器1停止按钮
  const slot1Btn = document.createElement('button');
  const updateSlot1Btn = () => {
    slot1Btn.textContent = '1号副武器: ' + (weaponAttackDisabled.slot1 ? '已停止' : '进行中');
    slot1Btn.style.cssText = 'width:100%;margin-bottom:4px;padding:5px 10px;background:' + (weaponAttackDisabled.slot1 ? '#c0392b' : '#27ae60') + ';border:none;border-radius:4px;color:#fff;cursor:pointer;font-size:11px;';
  };
  updateSlot1Btn();
  slot1Btn.onclick = () => {
    weaponAttackDisabled.slot1 = !weaponAttackDisabled.slot1;
    updateSlot1Btn();
  };
  panel.appendChild(slot1Btn);

  // 副武器2停止按钮
  const slot2Btn = document.createElement('button');
  const updateSlot2Btn = () => {
    slot2Btn.textContent = '2号副武器: ' + (weaponAttackDisabled.slot2 ? '已停止' : '进行中');
    slot2Btn.style.cssText = 'width:100%;margin-bottom:4px;padding:5px 10px;background:' + (weaponAttackDisabled.slot2 ? '#c0392b' : '#27ae60') + ';border:none;border-radius:4px;color:#fff;cursor:pointer;font-size:11px;';
  };
  updateSlot2Btn();
  slot2Btn.onclick = () => {
    weaponAttackDisabled.slot2 = !weaponAttackDisabled.slot2;
    updateSlot2Btn();
  };
  panel.appendChild(slot2Btn);

  // 副武器3停止按钮
  const slot3Btn = document.createElement('button');
  const updateSlot3Btn = () => {
    slot3Btn.textContent = '3号副武器: ' + (weaponAttackDisabled.slot3 ? '已停止' : '进行中');
    slot3Btn.style.cssText = 'width:100%;margin-bottom:4px;padding:5px 10px;background:' + (weaponAttackDisabled.slot3 ? '#c0392b' : '#27ae60') + ';border:none;border-radius:4px;color:#fff;cursor:pointer;font-size:11px;';
  };
  updateSlot3Btn();
  slot3Btn.onclick = () => {
    weaponAttackDisabled.slot3 = !weaponAttackDisabled.slot3;
    updateSlot3Btn();
  };
  panel.appendChild(slot3Btn);

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
  renderer.render(player, enemies, bullets, xpOrbs, damageNumbers, grenades, shells, explosions, particles, targetMarkers, screenShake, cameraFlash);
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
