// ========== 战斗系统模块 ==========
let weaponAttackDisabled = {
  primary: false,
  slot1: false,
  slot2: false,
  slot3: false,
};

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
        onEnemyKilled();
      }
    }
  }
}

function updateSecondaryWeapons(dt) {
  const baseDmg = player.effectiveDamage;

  for (let i = 0; i < player.secondaryWeapons.length; i++) {
    if (weaponAttackDisabled['slot' + (i + 1)]) continue;
    const slot = player.secondaryWeapons[i];
    slot.cooldown = Math.max(0, slot.cooldown - dt);
    if (slot.cooldown > 0) continue;

    const def = slot.def;

    if (def.type === 'heal') {
      const mkLevel = player.secondaryAbilityLevels['mk_healboost'] || 0;
      const healMult = def.damageMult * (1 + mkLevel * 0.5);
      const heal = Math.round(baseDmg * healMult);
      player.hp = Math.min(player.maxHp, player.hp + heal);
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
      const glLevel = player.secondaryAbilityLevels['gl_firepower'] || 0;
      const shellCount = 1 + glLevel;
      const targets = findNearestEnemies(shellCount, 1e9);
      if (targets.length === 0) continue;
      const dmg = baseDmg * def.damageMult;
      for (let i = 0; i < shellCount; i++) {
        const tgt = targets[i] || targets[targets.length - 1];
        const tx = tgt.enemy.x;
        const ty = tgt.enemy.y;
        createTargetMarker(tx, ty, def.aoeRadius, def.color);
        const dx = tx - player.x;
        const dy = ty - player.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const flyTime = Math.max(0.5, Math.min(2.0, dist / 300));
        shells.push({
          x: player.x, y: player.y,
          startX: player.x, startY: player.y,
          targetX: tx, targetY: ty,
          flyTime: flyTime, flyElapsed: 0,
          dmg: dmg, aoeRadius: def.aoeRadius,
          color: def.color, exploded: false,
          angle: Math.atan2(dy, dx),
        });
      }
      slot.cooldown = def.cooldown;
      continue;
    }

    if (def.type === 'aoe_delayed') {
      const grLevel = player.secondaryAbilityLevels['gr_cluster'] || 0;
      const dmgMult = def.damageMult * (1 + grLevel * 0.5);
      const grenadeRange = 300;
      const target = findNearestEnemy(grenadeRange);
      if (!target) continue;
      const tx = target.enemy.x;
      const ty = target.enemy.y;
      const dx = tx - player.x;
      const dy = ty - player.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const flyTime = Math.max(0.5, Math.min(1.0, dist / 300));
      grenades.push({
        x: player.x, y: player.y,
        startX: player.x, startY: player.y,
        targetX: tx, targetY: ty,
        flyTime: flyTime, flyElapsed: 0,
        fuseTime: def.fuseTime, fuseElapsed: 0,
        dmg: baseDmg * dmgMult, aoeRadius: def.aoeRadius,
        color: def.color, exploding: false, landed: false,
      });
      slot.cooldown = def.cooldown;
      continue;
    }

    if (def.type === 'orbital') {
      const aliveEnemies = enemies.filter(e => e.alive);
      if (aliveEnemies.length === 0) continue;

      let centerX = 0, centerY = 0;
      for (let e of aliveEnemies) {
        centerX += e.x;
        centerY += e.y;
      }
      centerX /= aliveEnemies.length;
      centerY /= aliveEnemies.length;

      createTargetMarker(centerX, centerY, def.aoeRadius, def.color);
      triggerOrbitalCannon(centerX, centerY, baseDmg * def.damageMult, def.aoeRadius, def.color);

      slot.cooldown = def.cooldown;
      continue;
    }
  }

  for (let s of shells) {
    const prevX = s.x;
    const prevY = s.y;
    s.flyElapsed += dt;
    const t = Math.min(1, s.flyElapsed / s.flyTime);
    s.x = s.startX + (s.targetX - s.startX) * t;
    s.y = s.startY + (s.targetY - s.startY) * t;
    // 抛射物碰撞高墙检测
    const hitWall = checkArcingProjectileWalls(s.x, s.y, 8);
    if (hitWall) {
      s.exploded = true;
      applyAoeDamage(s.x, s.y, s.aoeRadius, s.dmg);
      createExplosion(s.x, s.y, s.aoeRadius, s.color);
      explosions.push({
        x: s.x, y: s.y,
        radius: 0, maxRadius: s.aoeRadius * 1.6,
        life: 0.6, maxLife: 0.6,
        color: '#ffffff', type: 'big',
      });
      continue;
    }
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
      applyAoeDamage(s.x, s.y, s.aoeRadius, s.dmg);
      createExplosion(s.x, s.y, s.aoeRadius, s.color);
      explosions.push({
        x: s.x, y: s.y,
        radius: 0, maxRadius: s.aoeRadius * 1.6,
        life: 0.6, maxLife: 0.6,
        color: '#ffffff', type: 'big',
      });
    }
  }
  shells = shells.filter(s => !s.exploded);

  for (let g of grenades) {
    if (!g.landed) {
      g.flyElapsed += dt;
      const t = Math.min(1, g.flyElapsed / g.flyTime);
      g.x = g.startX + (g.targetX - g.startX) * t;
      g.y = g.startY + (g.targetY - g.startY) * t;
      // 抛射物碰撞高墙检测
      const hitWall = checkArcingProjectileWalls(g.x, g.y, 8);
      if (hitWall) {
        g.landed = true;
        g.fuseElapsed = 0;
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
      const fuseProgress = g.fuseElapsed / g.fuseTime;
      const sparkRate = 3 + fuseProgress * 18;
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
        applyAoeDamage(g.x, g.y, g.aoeRadius, g.dmg);
        createExplosion(g.x, g.y, g.aoeRadius, g.color);
        g.exploding = true;
      }
    }
  }
  grenades = grenades.filter(g => !g.exploding);

  if (screenShake.duration > 0) {
    screenShake.elapsed += dt;
    if (screenShake.elapsed >= screenShake.duration) {
      screenShake.intensity = 0;
      screenShake.duration = 0;
      screenShake.elapsed = 0;
    }
  }
  if (cameraFlash.duration > 0) {
    cameraFlash.elapsed += dt;
    if (cameraFlash.elapsed >= cameraFlash.duration) {
      cameraFlash.intensity = 0;
      cameraFlash.duration = 0;
      cameraFlash.elapsed = 0;
    }
  }

  for (let ex of explosions) {
    ex.life -= dt;
    const t = 1 - (ex.life / ex.maxLife);
    ex.radius = ex.maxRadius * (1 - Math.pow(1 - t, 2.5));
  }
  explosions = explosions.filter(e => e.life > 0);

  for (let p of particles) {
    p.life -= dt;
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

  for (let m of targetMarkers) {
    m.life -= dt;
  }
  targetMarkers = targetMarkers.filter(m => m.life > 0);

  // 轨道炮瞄准充能更新
  updateOrbitalCharges(dt);
}