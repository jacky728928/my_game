// ========== 主动技能系统模块 ==========
let _activeSkillDomIcon = null;

function _getActiveSkillDirection() {
  const [ix, iy] = input.getDirection();
  let dx = ix, dy = iy;
  const mag = Math.sqrt(dx * dx + dy * dy);
  if (mag < 0.1) {
    dx = Math.cos(player.angle || 0);
    dy = Math.sin(player.angle || 0);
  } else {
    dx = dx / mag;
    dy = dy / mag;
  }
  return [dx, dy];
}

function _resolveBlinkTarget(dx, dy, dist) {
  let tx = player.x + dx * dist;
  let ty = player.y + dy * dist;
  const inWall = walls.some(w =>
    circleRectCollide(tx, ty, player.radius, w.x, w.y, w.w, w.h)
  );
  if (inWall) {
    for (let t = 0.95; t >= 0; t -= 0.02) {
      const sx = player.x + dx * dist * t;
      const sy = player.y + dy * dist * t;
      if (!walls.some(w =>
        circleRectCollide(sx, sy, player.radius, w.x, w.y, w.w, w.h)
      )) {
        tx = sx;
        ty = sy;
        break;
      }
    }
  }
  tx = Math.max(player.radius, Math.min(WORLD_W - player.radius, tx));
  ty = Math.max(player.radius, Math.min(WORLD_H - player.radius, ty));
  return { x: tx, y: ty };
}

function getActiveSkillPreview() {
  if (!_activeSkillCharging) return null;
  if (!player || !player.alive) return null;
  if (!player.activeSkillId) return null;
  const def = ACTIVE_SKILL_POOL[player.activeSkillId];
  if (!def) return null;
  if (def.id !== 'blink') return null;
  const [dx, dy] = _getActiveSkillDirection();
  const { x: newX, y: newY } = _resolveBlinkTarget(dx, dy, def.blinkDist);
  return { x: newX, y: newY, aoeRadius: def.aoeRadius, color: def.color, fromX: player.x, fromY: player.y };
}

function _canReleaseActiveSkill() {
  if (!player || !player.alive) return false;
  if (gamePaused || gameOver) return false;
  if (!player.activeSkillId) return false;
  if (player.activeSkillCooldown > 0) return false;
  return !!ACTIVE_SKILL_POOL[player.activeSkillId];
}

function releaseActiveSkillNow() {
  if (!_canReleaseActiveSkill()) return;
  const def = ACTIVE_SKILL_POOL[player.activeSkillId];
  const [dx, dy] = _getActiveSkillDirection();

  if (def.id === 'blink') {
    const { x: newX, y: newY } = _resolveBlinkTarget(dx, dy, def.blinkDist);
    const oldX = player.x;
    const oldY = player.y;
    player.x = newX;
    player.y = newY;
    player.startInvuln(0.2);

    const aoeR = def.aoeRadius * 3;

    explosions.push({ x: oldX, y: oldY, radius: 0, maxRadius: aoeR * 0.8, life: 0.25, maxLife: 0.25, color: '#9b59b6', type: 'ring_main' });
    explosions.push({ x: oldX, y: oldY, radius: 0, maxRadius: aoeR * 1.4, life: 0.4, maxLife: 0.4, color: '#bb66ff', type: 'ring_outer' });
    for (let i = 0; i < 20; i++) {
      const a = Math.random() * Math.PI * 2;
      const sp = 80 + Math.random() * 160;
      particles.push({ x: oldX, y: oldY, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: 0.45, maxLife: 0.45, color: '#9b59b6', radius: 3 });
    }

    explosions.push({ x: newX, y: newY, radius: 0, maxRadius: aoeR * 2.0, life: 0.25, maxLife: 0.25, color: '#ffffff', type: 'flash' });
    explosions.push({ x: newX, y: newY, radius: 0, maxRadius: aoeR * 1.6, life: 0.4, maxLife: 0.4, color: '#9b59b6', type: 'ring_main' });
    explosions.push({ x: newX, y: newY, radius: 0, maxRadius: aoeR * 1.2, life: 0.3, maxLife: 0.3, color: '#ffffff', type: 'ring_white' });
    explosions.push({ x: newX, y: newY, radius: 0, maxRadius: aoeR * 2.2, life: 0.55, maxLife: 0.55, color: '#bb66ff', type: 'ring_outer' });
    explosions.push({ x: newX, y: newY, radius: 0, maxRadius: aoeR * 1.0, life: 0.35, maxLife: 0.35, color: '#d9b3ff', type: 'ring_inner' });
    explosions.push({ x: newX, y: newY, radius: 0, maxRadius: aoeR * 1.2, life: 1.4, maxLife: 1.4, color: '#3d1f5c', type: 'scorch' });

    for (let i = 0; i < 28; i++) {
      const a = Math.random() * Math.PI * 2;
      const sp = 140 + Math.random() * 220;
      particles.push({ x: newX, y: newY, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: 0.55, maxLife: 0.55, color: '#bb66ff', radius: 4 });
    }
    for (let i = 0; i < 14; i++) {
      const a = Math.random() * Math.PI * 2;
      const sp = 60 + Math.random() * 80;
      particles.push({ x: newX, y: newY, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 60, life: 0.7, maxLife: 0.7, color: '#ffffff', radius: 3 });
    }
    for (let i = 0; i < 12; i++) {
      const a = Math.random() * Math.PI * 2;
      const sp = 200 + Math.random() * 180;
      particles.push({ x: newX, y: newY, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: 0.4, maxLife: 0.4, color: '#ffccff', radius: 2 });
    }

    const dmg = player.effectiveDamage * 2.0;
    for (let e of enemies) {
      if (!e.alive) continue;
      const edx = e.x - newX;
      const edy = e.y - newY;
      const d2 = Math.sqrt(edx * edx + edy * edy);
      if (d2 <= aoeR + e.radius) {
        e.takeDamage(dmg);
        addDamageNumber(e.x, e.y, dmg, true);
      }
    }
    screenShake.intensity = 14;
    screenShake.duration = 0.35;
    screenShake.elapsed = 0;
    cameraFlash.intensity = 0.25;
    cameraFlash.duration = 0.18;
    cameraFlash.elapsed = 0;
  } else if (def.id === 'pulse_dash') {
    // 脉冲冲刺：沿路径快速移动，路径上敌人受伤并被击退；途中霸体
    let { x: targetX, y: targetY } = _resolveBlinkTarget(dx, dy, def.dashDist);
    const dashSteps = 10;
    let lastX = player.x;
    let lastY = player.y;
    const stepDist = Math.sqrt(
      Math.pow(targetX - player.x, 2) + Math.pow(targetY - player.y, 2)
    ) / dashSteps;
    const baseDmg = player.effectiveDamage * (def.damageMult || 2.0);
    const hitSet = new Set();
    for (let i = 1; i <= dashSteps; i++) {
      const tx = player.x + (targetX - player.x) * (i / dashSteps);
      const ty = player.y + (targetY - player.y) * (i / dashSteps);
      // 路径粒子（蓝紫色能量拖尾）
      for (let j = 0; j < 3; j++) {
        particles.push({
          x: tx + (Math.random() - 0.5) * 10,
          y: ty + (Math.random() - 0.5) * 10,
          vx: 0, vy: 0, life: 0.3,
          maxLife: 0.3,
          color: def.color || '#8a5cf0',
          radius: 5,
        });
      }
      // 沿途伤害检测：对半径30px内敌人造成伤害并击退
      for (let e of enemies) {
        if (!e.alive) continue;
        if (hitSet.has(e)) continue;
        const edx = e.x - tx;
        const edy = e.y - ty;
        const dist = Math.sqrt(edx * edx + edy * edy);
        if (dist <= 30 + e.radius) {
          e.takeDamage(baseDmg);
          addDamageNumber(e.x, e.y, baseDmg, true);
          // 击退
          if (dist > 0.1) {
            e.x += (edx / dist) * (def.knockback || 30);
            e.y += (edy / dist) * (def.knockback || 30);
          }
          hitSet.add(e);
        }
      }
      lastX = tx; lastY = ty;
    }
    // 落地：大爆发
    explosions.push({ x: targetX, y: targetY, radius: 0, maxRadius: 60, life: 0.3, maxLife: 0.3, color: def.color || '#8a5cf0', type: 'ring_main' });
    explosions.push({ x: targetX, y: targetY, radius: 0, maxRadius: 100, life: 0.5, maxLife: 0.5, color: '#bb66ff', type: 'ring_outer' });
    explosions.push({ x: targetX, y: targetY, radius: 0, maxRadius: 30, life: 0.2, maxLife: 0.2, color: '#ffffff', type: 'flash' });
    for (let i = 0; i < 16; i++) {
      const a = Math.random() * Math.PI * 2;
      const sp = 100 + Math.random() * 180;
      particles.push({
        x: targetX, y: targetY,
        vx: Math.cos(a) * sp, vy: Math.sin(a) * sp,
        life: 0.5, maxLife: 0.5, color: def.color || '#8a5cf0', radius: 4
      });
    }
    player.x = targetX;
    player.y = targetY;
    player.startInvuln(def.invulnTime);
    screenShake.intensity = 10;
    screenShake.duration = 0.25;
    screenShake.elapsed = 0;
  } else if (def.id === 'dash') {
    let { x: targetX, y: targetY } = _resolveBlinkTarget(dx, dy, def.dashDist);
    // 沿路径生成冲刺粒子
    const dashSteps = 8;
    const stepDist = Math.sqrt(
      Math.pow(targetX - player.x, 2) + Math.pow(targetY - player.y, 2)
    ) / dashSteps;
    for (let i = 1; i <= dashSteps; i++) {
      const tx = player.x + (targetX - player.x) * (i / dashSteps);
      const ty = player.y + (targetY - player.y) * (i / dashSteps);
      particles.push({ x: tx, y: ty, vx: 0, vy: 0, life: 0.4, maxLife: 0.4, color: '#3498db', radius: 5 });
    }
    player.x = targetX;
    player.y = targetY;
    player.startInvuln(def.invulnTime);
  } else if (def.id === 'haste') {
    player.activeSkillBuff = {
      id: 'haste',
      timeLeft: def.duration,
      speedMult: def.speedMult,
    };
  }

  player.releaseActiveSkill();
}

function onActiveSkillPress() {
  if (!_canReleaseActiveSkill()) return;
  const def = ACTIVE_SKILL_POOL[player.activeSkillId];
  if (def.id === 'blink') {
    _activeSkillCharging = true;
  } else {
    releaseActiveSkillNow();
  }
}

function onActiveSkillRelease() {
  if (_activeSkillCharging) {
    _activeSkillCharging = false;
    releaseActiveSkillNow();
  }
}

function ensureActiveSkillIcon() {
  if (_activeSkillDomIcon && _activeSkillDomIcon.parentNode) {
    _activeSkillDomIcon.parentNode.removeChild(_activeSkillDomIcon);
  }
  const el = document.createElement('div');
  el.id = 'activeSkillIcon';
  el.style.cssText = 'position:fixed;right:20px;bottom:20px;width:70px;height:70px;border-radius:50%;background:rgba(26,26,46,0.7);border:2px solid #666;cursor:pointer;display:flex;align-items:center;justify-content:center;font-family:Arial,sans-serif;color:#888;font-size:14px;user-select:none;z-index:100;pointer-events:none;touch-action:none;-webkit-user-select:none;';
  el.textContent = '技能';
  el.addEventListener('pointerdown', (ev) => {
    ev.preventDefault();
    onActiveSkillPress();
  });
  el.addEventListener('pointerup', (ev) => {
    ev.preventDefault();
    onActiveSkillRelease();
  });
  el.addEventListener('pointercancel', (ev) => {
    ev.preventDefault();
    onActiveSkillRelease();
  });
  document.body.appendChild(el);
  _activeSkillDomIcon = el;
  _updateSkillIconVisual();
}

function _updateSkillIconVisual() {
  if (!_activeSkillDomIcon) return;
  if (!player || !player.activeSkillId) {
    _activeSkillDomIcon.textContent = '技能';
    _activeSkillDomIcon.style.border = '2px solid #666';
    _activeSkillDomIcon.style.color = '#888';
    return;
  }
  const def = ACTIVE_SKILL_POOL[player.activeSkillId];
  const ready = player.activeSkillCooldown <= 0;
  _activeSkillDomIcon.style.borderColor = def.color;
  if (_activeSkillCharging && ready && def.id === 'blink') {
    const pulse = 0.6 + 0.4 * Math.sin(performance.now() / 150);
    _activeSkillDomIcon.style.boxShadow = '0 0 ' + (12 + 6 * pulse) + 'px ' + hexToRgba(def.color, 0.9) + ', inset 0 0 ' + (8 + 4 * pulse) + 'px ' + hexToRgba(def.color, 0.5);
    _activeSkillDomIcon.style.background = 'radial-gradient(circle, ' + hexToRgba(def.color, 0.3) + ' 0%, ' + hexToRgba(def.color, 0.15) + ' 80%, rgba(0,0,0,0) 100%)';
    _activeSkillDomIcon.style.color = '#fff';
    _activeSkillDomIcon.innerHTML = '<div style="text-align:center;line-height:1.1;"><div style="font-size:22px;font-weight:bold;">' + def.icon + '</div><div style="font-size:9px;opacity:0.9;">瞄准中·松开释放</div></div>';
    _activeSkillDomIcon.style.pointerEvents = 'auto';
  } else if (ready) {
    _activeSkillDomIcon.style.boxShadow = 'none';
    _activeSkillDomIcon.style.background = 'radial-gradient(circle, rgba(40,40,70,0.85) 0%, ' + hexToRgba(def.color, 0.25) + ' 80%, rgba(0,0,0,0) 100%)';
    _activeSkillDomIcon.style.color = '#fff';
    _activeSkillDomIcon.innerHTML = '<div style="text-align:center;line-height:1.1;"><div style="font-size:22px;font-weight:bold;">' + def.icon + '</div><div style="font-size:10px;opacity:0.85;">按 E / 点击</div></div>';
    _activeSkillDomIcon.style.pointerEvents = 'auto';
  } else {
    const pct = player.activeSkillCooldown / def.cooldown;
    _activeSkillDomIcon.style.boxShadow = 'none';
    _activeSkillDomIcon.style.background = 'conic-gradient(#444 ' + (pct * 360) + 'deg, ' + def.color + ' 0deg, rgba(40,40,70,0.85) 0deg)';
    _activeSkillDomIcon.style.color = '#bbb';
    _activeSkillDomIcon.innerHTML = '<div style="text-align:center;line-height:1.1;"><div style="font-size:22px;font-weight:bold;">' + def.icon + '</div><div style="font-size:11px;">' + player.activeSkillCooldown.toFixed(1) + 's</div></div>';
    _activeSkillDomIcon.style.pointerEvents = 'auto';
  }
}

function hexToRgba(hex, alpha) {
  if (!hex || hex.length < 7) return 'rgba(155,89,182,' + alpha + ')';
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return 'rgba(' + r + ',' + g + ',' + b + ',' + alpha + ')';
}

document.addEventListener('keydown', (e) => {
  if (e.key === 'e' || e.key === 'E') {
    if (e.repeat) return;
    onActiveSkillPress();
  }
});
document.addEventListener('keyup', (e) => {
  if (e.key === 'e' || e.key === 'E') {
    onActiveSkillRelease();
  }
});