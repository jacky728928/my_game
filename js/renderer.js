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

  render(player, enemies, bullets, xpOrbs, damageNumbers, grenades, shells, explosions, particles, targetMarkers, screenShake, cameraFlash) {
    const ctx = this.ctx;
    // 屏幕震动偏移
    let shakeX = 0, shakeY = 0;
    if (screenShake && screenShake.duration > 0) {
      const progress = screenShake.elapsed / screenShake.duration;
      const damp = 1 - progress;
      shakeX = (Math.random() - 0.5) * 2 * screenShake.intensity * damp;
      shakeY = (Math.random() - 0.5) * 2 * screenShake.intensity * damp;
    }
    const camX = player.x + shakeX;
    const camY = player.y + shakeY;
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

    // 手雷（飞行 + 落地）
    if (grenades && grenades.length > 0) {
      for (let g of grenades) {
        const gx = g.x - camX + cx;
        const gy = g.y - camY + cy;
        if (gx < -100 || gx > this.w + 100 || gy < -100 || gy > this.h + 100) continue;

        if (!g.landed) {
          // 飞行中的手雷：椭圆旋转体 + 外发光 + 烟雾尾迹 + 高光
          const spin = (g.flyElapsed * 8) % (Math.PI * 2);
          ctx.save();
          // 大范围外发光
          ctx.shadowColor = g.color || '#e74c3c';
          ctx.shadowBlur = 30;
          // 椭圆主体（随旋转缩放营造3D旋转感）
          ctx.translate(gx, gy);
          ctx.rotate(spin);
          ctx.scale(1, 0.65);
          ctx.fillStyle = g.color || '#e74c3c';
          ctx.beginPath();
          ctx.arc(0, 0, 9, 0, Math.PI * 2);
          ctx.fill();
          // 高光面
          ctx.scale(1 / 1, 1 / 0.65);
          ctx.shadowBlur = 0;
          ctx.fillStyle = '#ff9988';
          ctx.beginPath();
          ctx.arc(-2, -2, 3.5, 0, Math.PI * 2);
          ctx.fill();
          // 白色顶点高光
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(-3, -3, 2, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();

          // 烟雾尾迹（每帧在当前位置后方画一团淡烟）
          const dx = g.targetX - g.startX;
          const dy = g.targetY - g.startY;
          const dlen = Math.sqrt(dx * dx + dy * dy) || 1;
          ctx.save();
          // 多层烟雾，渐淡渐大
          for (let t = 1; t <= 6; t++) {
            const trailDist = t * 12;  // 尾迹间隔
            const tx = gx - (dx / dlen) * trailDist;
            const ty = gy - (dy / dlen) * trailDist;
            ctx.globalAlpha = 0.25 - t * 0.035;
            ctx.fillStyle = t < 3 ? '#ffaa66' : '#888888';
            ctx.beginPath();
            ctx.arc(tx, ty, 4 + t * 4, 0, Math.PI * 2);
            ctx.fill();
          }
          ctx.restore();
        } else {
          // 落地后的手雷：危险区呼吸灯 + 地面印记 + 急促闪烁 + 倒计时
          const fuseLeft = Math.max(0, g.fuseTime - g.fuseElapsed);
          const fuseProgress = g.fuseElapsed / g.fuseTime;
          const blinkFreq = 3 + fuseProgress * 22;
          const blink = (Math.floor(g.fuseElapsed * blinkFreq) % 2 === 0) ? 1 : 0.25;
          const intensity = 0.5 + fuseProgress * 0.5;

          ctx.save();

          // 地面投影阴影
          ctx.globalAlpha = 0.3;
          ctx.fillStyle = '#000000';
          ctx.beginPath();
          ctx.ellipse(gx, gy + 4, 12, 5, 0, 0, Math.PI * 2);
          ctx.fill();

          // 危险区外圈：呼吸灯 + 旋转弧线
          const pulse = Math.sin(g.fuseElapsed * 16) * 3;
          ctx.globalAlpha = 0.2 + intensity * 0.4;
          ctx.strokeStyle = g.color || '#e74c3c';
          ctx.lineWidth = 2 + intensity * 3;
          ctx.setLineDash([10, 7]);
          ctx.beginPath();
          ctx.arc(gx, gy, g.aoeRadius + pulse, 0, Math.PI * 2);
          ctx.stroke();
          // 旋转的虚线弧（让危险区更有动感）
          ctx.setLineDash([4, 12]);
          ctx.lineWidth = 1.5;
          ctx.globalAlpha = 0.5 + Math.sin(g.fuseElapsed * 6) * 0.3;
          ctx.strokeStyle = '#ff6644';
          ctx.beginPath();
          ctx.arc(gx, gy, g.aoeRadius + pulse + 8, g.fuseElapsed * 2, g.fuseElapsed * 2 + Math.PI * 1.2);
          ctx.stroke();
          ctx.setLineDash([]);

          // 内圈填充（红色警示）
          ctx.globalAlpha = 0.12 * intensity;
          const innerGrd = ctx.createRadialGradient(gx, gy, 0, gx, gy, g.aoeRadius * 0.45);
          innerGrd.addColorStop(0, '#ff3300');
          innerGrd.addColorStop(1, 'rgba(255,50,0,0)');
          ctx.fillStyle = innerGrd;
          ctx.beginPath();
          ctx.arc(gx, gy, g.aoeRadius * 0.45, 0, Math.PI * 2);
          ctx.fill();

          // 手雷本体：急促闪烁核心
          const coreColor = fuseProgress < 0.4 ? '#ffdd44' : fuseProgress < 0.7 ? '#ff8822' : '#ff2200';
          ctx.globalAlpha = 1;
          ctx.shadowColor = coreColor;
          ctx.shadowBlur = 40 * intensity;
          ctx.fillStyle = coreColor;
          ctx.globalAlpha = blink;
          ctx.beginPath();
          ctx.arc(gx, gy, 7 + intensity * 5, 0, Math.PI * 2);
          ctx.fill();
          // 深色内核
          ctx.globalAlpha = 1;
          ctx.shadowBlur = 0;
          ctx.fillStyle = '#220000';
          ctx.beginPath();
          ctx.arc(gx, gy, 5, 0, Math.PI * 2);
          ctx.fill();
          // 顶部白点（接近爆炸时变成红色）
          ctx.fillStyle = fuseProgress > 0.7 ? '#ff0000' : '#ffffff';
          ctx.beginPath();
          ctx.arc(gx, gy - 4, 2.5, 0, Math.PI * 2);
          ctx.fill();

          // 引信倒计时大字（越接近爆炸越大越红）
          const fontSize = 14 + intensity * 10;
          ctx.globalAlpha = 1;
          ctx.fillStyle = fuseProgress > 0.7 ? '#ff0000' : '#ffffff';
          ctx.strokeStyle = '#000000';
          ctx.lineWidth = 3;
          ctx.font = 'bold ' + fontSize + 'px Arial';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'bottom';
          const txt = fuseLeft.toFixed(1) + 's';
          ctx.strokeText(txt, gx, gy - 16);
          ctx.fillText(txt, gx, gy - 16);
          ctx.restore();
        }
      }
    }

    // 榴弹炮弹体：旋转的发光弹丸 + 拖尾光带
    if (shells && shells.length > 0) {
      for (let s of shells) {
        const sx = s.x - camX + cx;
        const sy = s.y - camY + cy;
        if (sx < -100 || sx > this.w + 100 || sy < -100 || sy > this.h + 100) continue;

        ctx.save();
        // 外层光晕（大）
        ctx.shadowColor = s.color || '#e67e22';
        ctx.shadowBlur = 35;
        ctx.fillStyle = s.color || '#e67e22';
        ctx.beginPath();
        ctx.arc(sx, sy, 9, 0, Math.PI * 2);
        ctx.fill();
        // 中间白色内核（亮）
        ctx.shadowBlur = 15;
        ctx.shadowColor = '#ffffff';
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(sx, sy, 4, 0, Math.PI * 2);
        ctx.fill();
        // 方向尾翼（一条沿运动方向的光带）
        ctx.shadowBlur = 0;
        ctx.globalAlpha = 0.7;
        ctx.strokeStyle = '#ffee66';
        ctx.lineWidth = 3;
        const tailLen = 25;
        ctx.beginPath();
        ctx.moveTo(sx - Math.cos(s.angle) * tailLen, sy - Math.sin(s.angle) * tailLen);
        ctx.lineTo(sx, sy);
        ctx.stroke();
        ctx.globalAlpha = 1;
        ctx.restore();
      }
    }

    // 爆炸视觉效果（多层圆环 + 中心辐射）
    if (explosions && explosions.length > 0) {
      for (let ex of explosions) {
        const ex2 = ex.x - camX + cx;
        const ey2 = ex.y - camY + cy;
        const t = 1 - (ex.life / ex.maxLife);
        const alpha = Math.max(0, Math.min(1, ex.life / ex.maxLife));

        if (ex.type === 'ring_main') {
          // 主环：粗、彩色、带外发光
          ctx.save();
          ctx.shadowColor = ex.color;
          ctx.shadowBlur = 25;
          ctx.strokeStyle = ex.color;
          ctx.lineWidth = 5 * alpha + 2;
          ctx.globalAlpha = alpha;
          ctx.beginPath();
          ctx.arc(ex2, ey2, ex.radius, 0, Math.PI * 2);
          ctx.stroke();
          // 内部淡色填充
          ctx.globalAlpha = alpha * 0.3;
          ctx.fillStyle = ex.color;
          ctx.beginPath();
          ctx.arc(ex2, ey2, ex.radius * 0.7, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        } else if (ex.type === 'ring_white') {
          // 白色高光环：细、亮、收缩更快
          ctx.save();
          ctx.shadowColor = '#ffffff';
          ctx.shadowBlur = 15;
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 3 * alpha + 1;
          ctx.globalAlpha = alpha;
          ctx.beginPath();
          ctx.arc(ex2, ey2, ex.radius, 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();
        } else if (ex.type === 'ring_outer') {
          // 外圈扩散环：粗大、暗红橙
          ctx.save();
          ctx.strokeStyle = ex.color;
          ctx.lineWidth = 3 * alpha + 1;
          ctx.globalAlpha = alpha * 0.7;
          ctx.beginPath();
          ctx.arc(ex2, ey2, ex.radius, 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();
        } else if (ex.type === 'flash') {
          // 中心白色强光：从小到大然后消失，带发光
          ctx.save();
          ctx.shadowColor = '#ffffff';
          ctx.shadowBlur = 60 * alpha;
          const grd = ctx.createRadialGradient(ex2, ey2, 0, ex2, ey2, ex.radius);
          grd.addColorStop(0, `rgba(255,255,255,${alpha})`);
          grd.addColorStop(0.4, `rgba(255,240,200,${alpha * 0.7})`);
          grd.addColorStop(1, `rgba(255,180,80,0)`);
          ctx.fillStyle = grd;
          ctx.beginPath();
          ctx.arc(ex2, ey2, ex.radius, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        } else if (ex.type === 'ring_inner') {
          // 内层暗红脉冲：收缩消失
          ctx.save();
          ctx.strokeStyle = ex.color;
          ctx.lineWidth = 6 * alpha + 2;
          ctx.globalAlpha = alpha * 0.8;
          ctx.beginPath();
          ctx.arc(ex2, ey2, ex.radius * alpha, 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();
        } else if (ex.type === 'scorch') {
          // 地面烧焦印记：暗色圆斑，久久不散
          ctx.save();
          ctx.globalAlpha = alpha * 0.55;
          const grd = ctx.createRadialGradient(ex2, ey2, 0, ex2, ey2, ex.radius);
          grd.addColorStop(0, 'rgba(15,5,0,0.8)');
          grd.addColorStop(0.6, 'rgba(30,10,0,0.5)');
          grd.addColorStop(1, 'rgba(40,15,0,0)');
          ctx.fillStyle = grd;
          ctx.beginPath();
          ctx.arc(ex2, ey2, ex.radius, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        } else {
          // 默认兼容（简单圆环）
          ctx.strokeStyle = ex.color;
          ctx.lineWidth = 4 * alpha + 1;
          ctx.globalAlpha = alpha;
          ctx.beginPath();
          ctx.arc(ex2, ey2, ex.radius, 0, Math.PI * 2);
          ctx.stroke();
          ctx.globalAlpha = alpha * 0.35;
          ctx.fillStyle = ex.color;
          ctx.beginPath();
          ctx.arc(ex2, ey2, ex.radius * 0.8, 0, Math.PI * 2);
          ctx.fill();
          ctx.globalAlpha = 1;
        }
      }
    }

    // 目标锁定指示器（榴弹炮瞄准时）：十字瞄准线 + 4个角标 + 收缩圆环
    if (targetMarkers && targetMarkers.length > 0) {
      for (let m of targetMarkers) {
        const mx = m.x - camX + cx;
        const my = m.y - camY + cy;
        const progress = 1 - (m.life / m.maxLife);  // 0→1
        const alpha = Math.max(0, m.life / m.maxLife);

        ctx.save();
        // 外圈：虚线范围圆（收缩）
        ctx.strokeStyle = m.color || '#e67e22';
        ctx.lineWidth = 2;
        ctx.globalAlpha = alpha * 0.8;
        ctx.setLineDash([6, 6]);
        ctx.beginPath();
        ctx.arc(mx, my, m.radius * (1 - progress * 0.2), 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);

        // 4个角标（在半径的外圈，随进度向内收拢）
        const bracketR = m.radius * (1.1 - progress * 0.3);
        const bracketLen = 14;
        ctx.lineWidth = 3;
        ctx.strokeStyle = m.color || '#e67e22';
        ctx.globalAlpha = alpha;
        // 左上 / 右上 / 左下 / 右下
        const corners = [
          [-1, -1], [1, -1], [-1, 1], [1, 1],
        ];
        for (let c of corners) {
          const cx2 = mx + c[0] * bracketR;
          const cy2 = my + c[1] * bracketR;
          ctx.beginPath();
          ctx.moveTo(cx2 + c[0] * bracketLen, cy2);
          ctx.lineTo(cx2, cy2);
          ctx.lineTo(cx2, cy2 + c[1] * bracketLen);
          ctx.stroke();
        }

        // 中心十字瞄准线（短十字）
        const crossLen = 18;
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = '#ffffff';
        ctx.globalAlpha = alpha * 0.9;
        ctx.beginPath();
        ctx.moveTo(mx - crossLen, my);
        ctx.lineTo(mx - 6, my);
        ctx.moveTo(mx + 6, my);
        ctx.lineTo(mx + crossLen, my);
        ctx.moveTo(mx, my - crossLen);
        ctx.lineTo(mx, my - 6);
        ctx.moveTo(mx, my + 6);
        ctx.lineTo(mx, my + crossLen);
        ctx.stroke();

        // 中心点（小圆）
        ctx.fillStyle = m.color || '#e67e22';
        ctx.globalAlpha = alpha;
        ctx.beginPath();
        ctx.arc(mx, my, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }

    // 轨道炮瞄准准星（天基屠龙炮蓄力阶段）
    if (typeof orbitalCharges !== 'undefined' && orbitalCharges.length > 0) {
      for (let c of orbitalCharges) {
        if (c.phase !== 'charging') continue;
        const mx = c.targetX - camX + cx;
        const my = c.targetY - camY + cy;
        const progress = Math.min(1, c.chargeTime / c.maxChargeTime);
        const alpha = 0.7 + progress * 0.3;
        const now3 = performance.now() / 1000;
        const pulse = 0.6 + 0.4 * Math.sin(now3 * 10);

        ctx.save();

        // 屏幕边缘红色警告闪烁
        const warnAlpha = (0.15 + progress * 0.15) * (0.5 + 0.5 * Math.sin(now3 * 8));
        ctx.fillStyle = `rgba(0,100,200,${warnAlpha})`;
        ctx.fillRect(0, 0, this.w, this.h);

        // 第1层：外圈大虚线圆（缓慢收缩）
        const outerR = c.aoeRadius * (1.6 - progress * 0.6);
        ctx.strokeStyle = c.color || '#00d4ff';
        ctx.lineWidth = 4;
        ctx.globalAlpha = alpha * 0.7;
        ctx.setLineDash([15, 10]);
        ctx.lineDashOffset = now3 * 40;
        ctx.shadowColor = c.color || '#00d4ff';
        ctx.shadowBlur = 15;
        ctx.beginPath();
        ctx.arc(mx, my, outerR, 0, Math.PI * 2);
        ctx.stroke();

        // 第2层：主准星圆
        const mainR = c.aoeRadius * (1.3 - progress * 0.3);
        ctx.setLineDash([10, 6]);
        ctx.lineDashOffset = -now3 * 60;
        ctx.lineWidth = 5 + pulse * 3;
        ctx.strokeStyle = c.color || '#00d4ff';
        ctx.globalAlpha = alpha;
        ctx.shadowBlur = 25;
        ctx.beginPath();
        ctx.arc(mx, my, mainR, 0, Math.PI * 2);
        ctx.stroke();

        // 第3层：内圈
        const innerR = c.aoeRadius * (1.0 - progress * 0.4);
        ctx.setLineDash([5, 4]);
        ctx.lineDashOffset = now3 * 80;
        ctx.lineWidth = 3;
        ctx.strokeStyle = '#ffffff';
        ctx.globalAlpha = alpha * 0.9;
        ctx.shadowBlur = 15;
        ctx.beginPath();
        ctx.arc(mx, my, innerR, 0, Math.PI * 2);
        ctx.stroke();

        ctx.setLineDash([]);

        // 充能进度填充
        const gradR = c.aoeRadius * (1.4 - progress * 0.4);
        const grd = ctx.createRadialGradient(mx, my, innerR * 0.2, mx, my, gradR);
        grd.addColorStop(0, `rgba(0,220,255,${0.4 * progress})`);
        grd.addColorStop(0.4, `rgba(0,150,255,${0.25 * progress})`);
        grd.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = grd;
        ctx.globalAlpha = alpha * 0.8;
        ctx.beginPath();
        ctx.arc(mx, my, gradR, 0, Math.PI * 2);
        ctx.fill();

        // 4个旋转的角标
        const cornerR = mainR;
        const cornerLen = 25 + progress * 15;
        ctx.lineWidth = 4;
        ctx.strokeStyle = c.color || '#00d4ff';
        ctx.globalAlpha = alpha;
        ctx.shadowBlur = 20;
        const rotOffset = now3 * 3;
        for (let i = 0; i < 4; i++) {
          const baseAngle = (i / 4) * Math.PI * 2 + rotOffset;
          const cxx = mx + Math.cos(baseAngle) * cornerR;
          const cyy = my + Math.sin(baseAngle) * cornerR;
          ctx.beginPath();
          ctx.moveTo(cxx + Math.cos(baseAngle) * cornerLen, cyy + Math.sin(baseAngle) * cornerLen);
          ctx.lineTo(cxx, cyy);
          ctx.lineTo(cxx + Math.cos(baseAngle + Math.PI / 2) * (cornerLen * 0.6), cyy + Math.sin(baseAngle + Math.PI / 2) * (cornerLen * 0.6));
          ctx.stroke();
        }

        // 中心十字准星
        const crossSize = 30 + progress * 10;
        const crossGap = 10;
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 3;
        ctx.globalAlpha = alpha * 0.95;
        ctx.shadowColor = '#ffffff';
        ctx.shadowBlur = 15;
        ctx.beginPath();
        ctx.moveTo(mx - crossSize, my);
        ctx.lineTo(mx - crossGap, my);
        ctx.moveTo(mx + crossGap, my);
        ctx.lineTo(mx + crossSize, my);
        ctx.moveTo(mx, my - crossSize);
        ctx.lineTo(mx, my - crossGap);
        ctx.moveTo(mx, my + crossGap);
        ctx.lineTo(mx, my + crossSize);
        ctx.stroke();

        // 中心能量核心
        const coreSize = 8 + progress * 12;
        ctx.shadowColor = c.color || '#00d4ff';
        ctx.shadowBlur = 30 + progress * 40;
        ctx.fillStyle = progress > 0.6 ? '#ffffff' : c.color || '#00d4ff';
        ctx.globalAlpha = alpha;
        ctx.beginPath();
        ctx.arc(mx, my, coreSize, 0, Math.PI * 2);
        ctx.fill();

        ctx.shadowBlur = 0;

        // === 屏幕中央大号警告UI ===
        ctx.save();
        // 警告背景条
        const barW = 400;
        const barH = 70;
        const barX = cx - barW / 2;
        const barY = 100;
        ctx.fillStyle = `rgba(0,20,40,0.8)`;
        ctx.fillRect(barX, barY, barW, barH);
        ctx.strokeStyle = c.color || '#00d4ff';
        ctx.lineWidth = 3;
        ctx.globalAlpha = 0.8 + pulse * 0.2;
        ctx.strokeRect(barX, barY, barW, barH);

        // 警告标题
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 24px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.globalAlpha = alpha;
        ctx.fillText('⚠ 天基屠龙炮 轨道锁定 ⚠', cx, barY + 22);

        // 倒计时数字
        const remaining = Math.max(0, c.maxChargeTime - c.chargeTime);
        ctx.font = 'bold 28px Arial';
        ctx.fillStyle = progress > 0.8 ? '#ff4444' : (progress > 0.5 ? '#ffaa00' : c.color || '#00d4ff');
        ctx.shadowColor = ctx.fillStyle;
        ctx.shadowBlur = 15;
        ctx.fillText(remaining.toFixed(1) + 's', cx, barY + 52);

        // 充能进度条
        ctx.shadowBlur = 0;
        const pgBarW = barW - 40;
        const pgBarH = 8;
        const pgBarX = barX + 20;
        const pgBarY = barY + 62;
        ctx.fillStyle = 'rgba(255,255,255,0.2)';
        ctx.fillRect(pgBarX, pgBarY, pgBarW, pgBarH);
        ctx.fillStyle = c.color || '#00d4ff';
        ctx.fillRect(pgBarX, pgBarY, pgBarW * progress, pgBarH);

        ctx.restore();

        // 准星处的小提示
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        ctx.globalAlpha = alpha;
        ctx.fillText('FIRE', mx, my - mainR - 10);

        ctx.restore();
      }
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
        if (dn.isHeal) {
          // 治疗：绿色 + 大
          ctx.font = 'bold 18px Arial';
          ctx.fillStyle = 'rgba(46,204,113,' + alpha + ')';
          ctx.strokeStyle = 'rgba(0,0,0,' + (alpha * 0.7) + ')';
          ctx.lineWidth = 3;
          ctx.strokeText('+' + dn.value, dx, dy);
          ctx.fillText('+' + dn.value, dx, dy);
        } else if (dn.isCrit) {
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

    // 主动技能：闪烁突袭落点预览
    if (typeof getActiveSkillPreview === 'function') {
      const pv = getActiveSkillPreview();
      if (pv) {
        const tx = pv.x - camX + cx;
        const ty = pv.y - camY + cy;
        const color = pv.color || '#9b59b6';
        const now2 = performance.now() / 1000;
        const pulse = 0.6 + 0.4 * Math.sin(now2 * 6);
        ctx.save();
        // 玩家到落点的虚线
        ctx.strokeStyle = color;
        ctx.globalAlpha = 0.45;
        ctx.lineWidth = 2;
        ctx.setLineDash([8, 6]);
        ctx.lineDashOffset = -now2 * 40;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(tx, ty);
        ctx.stroke();
        // 落点处的 AOE 虚线圆（呼吸）
        ctx.globalAlpha = 0.55 + pulse * 0.35;
        ctx.lineWidth = 2 + pulse * 1.5;
        ctx.setLineDash([10, 6]);
        ctx.beginPath();
        ctx.arc(tx, ty, pv.aoeRadius, 0, Math.PI * 2);
        ctx.stroke();
        // 落点处的浅色填充（更有范围感）
        ctx.globalAlpha = 0.15 + pulse * 0.12;
        const grd = ctx.createRadialGradient(tx, ty, 0, tx, ty, pv.aoeRadius);
        grd.addColorStop(0, color);
        grd.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = grd;
        ctx.beginPath();
        ctx.arc(tx, ty, pv.aoeRadius, 0, Math.PI * 2);
        ctx.fill();
        // 落点中心十字准星
        ctx.globalAlpha = 0.9;
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.setLineDash([]);
        const cLen = 8;
        ctx.beginPath();
        ctx.moveTo(tx - cLen, ty);
        ctx.lineTo(tx - 2, ty);
        ctx.moveTo(tx + 2, ty);
        ctx.lineTo(tx + cLen, ty);
        ctx.moveTo(tx, ty - cLen);
        ctx.lineTo(tx, ty - 2);
        ctx.moveTo(tx, ty + 2);
        ctx.lineTo(tx, ty + cLen);
        ctx.stroke();
        // 落点中心小圆点（颜色对应技能）
        ctx.fillStyle = color;
        ctx.shadowColor = color;
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.arc(tx, ty, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.restore();
      }
    }

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

    // 右上角副武器槽（3 个最大槽位）
    if (player.secondaryWeapons && player.secondaryWeapons.length > 0) {
      const slotSize = 62;
      const slotGap = 8;
      const totalW = MAX_SECONDARY_WEAPONS * slotSize + (MAX_SECONDARY_WEAPONS - 1) * slotGap;
      let slotX = this.w - totalW - 12;
      let slotY = 12;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      for (let i = 0; i < MAX_SECONDARY_WEAPONS; i++) {
        const slot = player.secondaryWeapons[i];
        const x = slotX + i * (slotSize + slotGap);
        // 空槽位背景
        ctx.fillStyle = 'rgba(0,0,0,0.55)';
        ctx.strokeStyle = 'rgba(255,255,255,0.3)';
        ctx.lineWidth = 1;
        ctx.fillRect(x, slotY, slotSize, slotSize);
        ctx.strokeRect(x, slotY, slotSize, slotSize);
        if (slot && slot.def) {
          // 有装备的槽位：彩色边框
          ctx.strokeStyle = slot.def.color;
          ctx.lineWidth = 2;
          ctx.strokeRect(x, slotY, slotSize, slotSize);
          // 名称
          ctx.fillStyle = slot.def.color;
          ctx.font = 'bold 11px Arial';
          ctx.fillText(slot.def.name, x + slotSize / 2, slotY + 14);
          // 冷却条 / 就绪
          const def = slot.def;
          const ready = slot.cooldown <= 0;
          const barY = slotY + slotSize - 12;
          if (ready) {
            ctx.fillStyle = '#2ecc71';
            ctx.font = 'bold 11px Arial';
            ctx.fillText('就绪', x + slotSize / 2, barY + 6);
          } else {
            // 冷却进度条
            const pct = 1 - (slot.cooldown / def.cooldown);
            ctx.fillStyle = 'rgba(255,255,255,0.15)';
            ctx.fillRect(x + 4, barY + 2, slotSize - 8, 8);
            ctx.fillStyle = '#e67e22';
            ctx.fillRect(x + 4, barY + 2, (slotSize - 8) * pct, 8);
            // 剩余时间
            ctx.fillStyle = '#fff';
            ctx.font = '10px Arial';
            ctx.fillText(slot.cooldown.toFixed(1) + 's', x + slotSize / 2, barY - 2);
          }
          // 伤害数值（小字，底部中心）
          ctx.fillStyle = 'rgba(255,255,255,0.75)';
          ctx.font = '10px Arial';
          ctx.fillText('x' + def.damageMult, x + slotSize / 2, slotY + slotSize - 24);
        } else {
          // 空槽位：灰色提示
          ctx.fillStyle = 'rgba(255,255,255,0.3)';
          ctx.font = '11px Arial';
          ctx.fillText('空', x + slotSize / 2, slotY + slotSize / 2);
        }
      }
    }

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

    // 镜头闪光叠加层（全屏白闪效果）
    if (cameraFlash && cameraFlash.duration > 0) {
      const progress = cameraFlash.elapsed / cameraFlash.duration;
      const alpha = cameraFlash.intensity * (1 - progress);
      ctx.fillStyle = `rgba(255,255,255,${alpha})`;
      ctx.fillRect(0, 0, this.w, this.h);
    }
  }
}
