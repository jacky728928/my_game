// ========== 渲染器 ==========
class Renderer {
  constructor() {
    this.canvas = document.getElementById('gameCanvas');
    this.ctx = this.canvas.getContext('2d');
    this.resize();
    window.addEventListener('resize', () => this.resize());
  }

  resize() {
    this.canvas.width = window.innerWidth * devicePixelRatio;
    this.canvas.height = window.innerHeight * devicePixelRatio;
    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    this.ctx.scale(devicePixelRatio, devicePixelRatio);
    this.w = window.innerWidth;
    this.h = window.innerHeight;
  }

  render(player, enemies, bullets, xpOrbs, damageNumbers) {
    const ctx = this.ctx;
    const camX = player.x;
    const camY = player.y;
    const cx = this.w / 2;
    const cy = this.h / 2;

    // 视野缩放（视野+5%时，canvas放大5%，中央区域不变）
    const vrMult = player.viewRangeMultiplier || 1;
    const savedScale = vrMult !== 1;

    // 背景
    ctx.fillStyle = COLOR_BG;
    ctx.fillRect(0, 0, this.w, this.h);

    // 视野缩放：以屏幕中心为基准缩放世界内容
    if (savedScale) {
      ctx.save();
      ctx.translate(cx, cy);
      ctx.scale(vrMult, vrMult);
      ctx.translate(-cx, -cy);
    }

    // 网格
    const gridSize = 80;
    const startCol = Math.floor((camX - this.w / 2) / gridSize) * gridSize;
    const startRow = Math.floor((camY - this.h / 2) / gridSize) * gridSize;
    ctx.strokeStyle = COLOR_GRID;
    ctx.lineWidth = 1;
    for (let x = startCol; x <= camX + this.w / 2 + gridSize; x += gridSize) {
      const sx = x - camX + cx;
      ctx.beginPath();
      ctx.moveTo(sx, 0);
      ctx.lineTo(sx, this.h);
      ctx.stroke();
    }
    for (let y = startRow; y <= camY + this.h / 2 + gridSize; y += gridSize) {
      const sy = y - camY + cy;
      ctx.beginPath();
      ctx.moveTo(0, sy);
      ctx.lineTo(this.w, sy);
      ctx.stroke();
    }

    // 世界边界
    ctx.strokeStyle = 'rgba(255,255,255,0.15)';
    ctx.lineWidth = 2;
    ctx.strokeRect(-camX + cx, -camY + cy, WORLD_W, WORLD_H);

    // 攻击范围
    ctx.strokeStyle = COLOR_RANGE;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(cx, cy, player.effectiveAttackRange, 0, Math.PI * 2);
    ctx.stroke();

    // 经验吸取范围
    ctx.strokeStyle = 'rgba(241,196,15,0.25)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([6, 4]);
    ctx.beginPath();
    ctx.arc(cx, cy, player.effectivePickupRange, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    // 子弹
    for (let b of bullets) {
      if (!b.alive) continue;
      const bx = b.x - camX + cx;
      const by = b.y - camY + cy;
      if (bx < -20 || bx > this.w + 20 || by < -20 || by > this.h + 20) continue;
      ctx.fillStyle = COLOR_BULLET;
      ctx.shadowColor = COLOR_BULLET;
      ctx.shadowBlur = 6;
      ctx.beginPath();
      ctx.arc(bx, by, b.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    }

    // 经验球
    const now = performance.now() / 1000;
    for (let orb of xpOrbs) {
      if (!orb.alive) continue;
      const ox = orb.x - camX + cx;
      const oy = orb.y - camY + cy + Math.sin(now * 3 + orb.bobPhase) * 3;
      if (ox < -20 || ox > this.w + 20 || oy < -20 || oy > this.h + 20) continue;
      // 光晕
      ctx.fillStyle = orb.color + '66';
      ctx.beginPath();
      ctx.arc(ox, oy, orb.radius + 4, 0, Math.PI * 2);
      ctx.fill();
      // 本体
      ctx.fillStyle = orb.color;
      ctx.beginPath();
      ctx.arc(ox, oy, orb.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    // 敌人
    for (let e of enemies) {
      if (!e.alive) continue;
      const ex = e.x - camX + cx;
      const ey = e.y - camY + cy;
      if (ex < -50 || ex > this.w + 50 || ey < -50 || ey > this.h + 50) continue;
      const half = e.half;
      // 方块本体
      ctx.fillStyle = e.color;
      ctx.strokeStyle = e.glow;
      ctx.lineWidth = 1.5;
      ctx.fillRect(ex - half, ey - half, e.size, e.size);
      ctx.strokeRect(ex - half, ey - half, e.size, e.size);
      // 等级标记
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 10px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('Lv' + e.level, ex, ey);
      // 血条
      const hpPct = e.hp / e.maxHp;
      const barW = e.size;
      const barY = ey - half - 8;
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(ex - half, barY, barW, 4);
      const hpColor = hpPct > 0.5 ? COLOR_HP_HIGH : hpPct > 0.25 ? COLOR_HP_MID : COLOR_HP_LOW;
      ctx.fillStyle = hpColor;
      ctx.fillRect(ex - half, barY, barW * hpPct, 4);
    }

    // 伤害数字
    if (damageNumbers && damageNumbers.length > 0) {
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      for (let dn of damageNumbers) {
        const dx = dn.x - camX + cx;
        const dy = dn.y - camY + cy;
        const alpha = Math.max(0, Math.min(1, dn.life / dn.maxLife));
        if (dn.isCrit) {
          // 暴击：红色 + 更大 + 描边
          ctx.font = 'bold 22px Arial';
          ctx.fillStyle = 'rgba(231,76,60,' + alpha + ')';
          ctx.strokeStyle = 'rgba(0,0,0,' + (alpha * 0.8) + ')';
          ctx.lineWidth = 3;
          ctx.strokeText('CRIT ' + dn.value, dx, dy);
          ctx.fillText('CRIT ' + dn.value, dx, dy);
        } else {
          // 普通：金黄色
          ctx.font = 'bold 14px Arial';
          ctx.fillStyle = 'rgba(255,236,150,' + alpha + ')';
          ctx.strokeStyle = 'rgba(0,0,0,' + (alpha * 0.7) + ')';
          ctx.lineWidth = 2;
          ctx.strokeText(String(dn.value), dx, dy);
          ctx.fillText(String(dn.value), dx, dy);
        }
      }
    }

    // 玩家
    if (player.damageFlash > 0) {
      ctx.fillStyle = COLOR_DAMAGE_FLASH;
      ctx.fillRect(0, 0, this.w, this.h);
    }
    // 外圈
    ctx.fillStyle = 'rgba(52,152,219,0.2)';
    ctx.beginPath();
    ctx.arc(cx, cy, player.radius + 6, 0, Math.PI * 2);
    ctx.fill();
    // 本体
    ctx.fillStyle = COLOR_PLAYER;
    ctx.strokeStyle = COLOR_PLAYER_STROKE;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx, cy, player.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    // 朝向
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + Math.cos(player.angle) * (player.radius + 10),
               cy + Math.sin(player.angle) * (player.radius + 10));
    ctx.stroke();

    // 恢复视野缩放（此后为 UI 正常大小）
    if (savedScale) ctx.restore();

    // ====== 经验条（顶部居中） ======
    const xpBarW = 180;
    const xpBarH = 8;
    const xpBarX = this.w / 2 - xpBarW / 2;
    const xpBarY = 12;
    const xpPct = player.xpToNext > 0 ? player.xp / player.xpToNext : 1;

    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.strokeStyle = 'rgba(255,255,255,0.4)';
    ctx.lineWidth = 1;
    ctx.fillRect(xpBarX - 1, xpBarY - 1, xpBarW + 2, xpBarH + 2);
    ctx.strokeRect(xpBarX - 1, xpBarY - 1, xpBarW + 2, xpBarH + 2);
    ctx.fillStyle = XP_BAR_COLOR;
    ctx.fillRect(xpBarX, xpBarY, xpBarW * Math.min(1, xpPct), xpBarH);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 10px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText('Lv' + player.level + '  XP ' + player.xp + '/' + player.xpToNext, this.w / 2, xpBarY + xpBarH + 4);

    // ====== 主角头上血条 ======
    const barW = 60;
    const barH = 6;
    const barX = cx - barW / 2;
    const barY = cy - player.radius - 28;
    const hpPct = Math.max(0, player.hp / player.maxHp);

    ctx.fillStyle = COLOR_HP_BG;
    ctx.strokeStyle = 'rgba(255,255,255,0.4)';
    ctx.lineWidth = 1;
    ctx.fillRect(barX - 1, barY - 1, barW + 2, barH + 2);
    ctx.strokeRect(barX - 1, barY - 1, barW + 2, barH + 2);
    const hpColor = hpPct > 0.5 ? COLOR_HP_HIGH : hpPct > 0.25 ? COLOR_HP_MID : COLOR_HP_LOW;
    ctx.fillStyle = hpColor;
    ctx.fillRect(barX, barY, barW * hpPct, barH);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 10px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(Math.ceil(player.hp) + ' / ' + player.maxHp, cx, barY - 4);

    // 击杀数
    ctx.fillStyle = '#fff';
    ctx.font = '14px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('击杀: ' + (window._killCount || 0), cx, cy + player.radius + 28);

    // 左上角能力状态
    const statsX = 12;
    const statsY = this.h - 76;
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.strokeStyle = 'rgba(255,255,255,0.3)';
    ctx.lineWidth = 1;
    ctx.fillRect(statsX - 4, statsY, 160, 80);
    ctx.strokeRect(statsX - 4, statsY, 160, 80);
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.font = '11px Arial';
    ctx.fillStyle = '#f1c40f';
    ctx.fillText('攻速 +' + (player.attackSpeedBonus || 0) + '%', statsX + 4, statsY + 6);
    ctx.fillStyle = '#e74c3c';
    ctx.fillText('暴击 ' + (player.critChance || 0) + '%  x' + (player.critMultiplier || CRIT_MULTIPLIER_BASE), statsX + 4, statsY + 22);
    ctx.fillStyle = '#e67e22';
    ctx.fillText('伤害 +' + (player.damageBonus || 0) + '  攻距 +' + (player.attackRangeBonus || 0), statsX + 4, statsY + 38);
    ctx.fillStyle = '#3498db';
    ctx.fillText('视野 +' + (player.viewRangeBonus || 0) + '%  吸距 +' + (player.pickupRangeBonus || 0), statsX + 4, statsY + 54);
    ctx.fillStyle = '#d35400';
    ctx.fillText('经验倍率 x' + (player.expMultiplier || 1), statsX + 4, statsY + 70);

    // 死亡画面
    if (!player.alive) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, this.w, this.h);
      ctx.fillStyle = '#e74c3c';
      ctx.font = 'bold 48px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('阵亡', cx, cy - 20);
      ctx.fillStyle = '#fff';
      ctx.font = '20px Arial';
      ctx.fillText('点击重新开始', cx, cy + 30);
    }
  }
}
