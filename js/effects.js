// ========== 特效系统模块 ==========
function createExplosion(x, y, radius, color, extra) {
  screenShake.intensity = 8 + (radius / 150) * 12;
  screenShake.duration = 0.35 + (radius / 150) * 0.2;
  screenShake.elapsed = 0;

  explosions.push({
    x, y,
    radius: 0,
    maxRadius: radius * 0.45,
    life: 0.25,
    maxLife: 0.25,
    color: '#ffffff',
    type: 'flash',
  });
  explosions.push({
    x, y,
    radius: 0,
    maxRadius: radius,
    life: 0.85,
    maxLife: 0.85,
    color: color,
    type: 'ring_main',
  });
  explosions.push({
    x, y,
    radius: 0,
    maxRadius: radius * 0.7,
    life: 0.5,
    maxLife: 0.5,
    color: '#ffffff',
    type: 'ring_white',
  });
  explosions.push({
    x, y,
    radius: 0,
    maxRadius: radius * 1.5,
    life: 1.2,
    maxLife: 1.2,
    color: '#ff4411',
    type: 'ring_outer',
  });
  explosions.push({
    x, y,
    radius: radius * 0.9,
    maxRadius: radius * 0.9,
    life: 0.3,
    maxLife: 0.3,
    color: '#cc1100',
    type: 'ring_inner',
  });
  explosions.push({
    x, y,
    radius: radius * 0.85,
    maxRadius: radius * 0.85,
    life: 3.0,
    maxLife: 3.0,
    color: '#1a0a00',
    type: 'scorch',
  });

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

// 轨道炮瞄准状态数组
let orbitalCharges = [];  // { targetX, targetY, chargeTime, maxChargeTime, aoeRadius, damage, color, phase }

function createTargetMarker(x, y, radius, color) {
  targetMarkers.push({
    x, y,
    radius: radius,
    life: 0.9,
    maxLife: 0.9,
    color: color || '#e67e22',
  });
}

// 触发轨道炮：进入瞄准蓄力阶段
function triggerOrbitalCannon(targetX, targetY, damage, aoeRadius, color) {
  orbitalCharges.push({
    targetX,
    targetY,
    chargeTime: 0,
    maxChargeTime: 2.0,  // 蓄力2秒，更明显
    aoeRadius,
    damage,
    color,
    phase: 'charging',  // charging -> firing -> done
  });
}

// 轨道炮瞄准与蓄力更新
function updateOrbitalCharges(dt) {
  for (let i = orbitalCharges.length - 1; i >= 0; i--) {
    const c = orbitalCharges[i];
    
    if (c.phase === 'charging') {
      c.chargeTime += dt;
      const progress = Math.min(1, c.chargeTime / c.maxChargeTime);
      
      // 蓄力阶段粒子：大量锁定气息粒子从外围向中心聚集
      if (Math.random() < 1.5) {
        const angle = Math.random() * Math.PI * 2;
        const dist = c.aoeRadius * (1.0 + Math.random() * 0.8);
        const speed = 150 + Math.random() * 200;
        particles.push({
          type: 'orbital_lock',
          x: c.targetX + Math.cos(angle) * dist,
          y: c.targetY + Math.sin(angle) * dist,
          vx: -Math.cos(angle) * speed,
          vy: -Math.sin(angle) * speed,
          size: 4 + Math.random() * 5,
          life: 0.5 + Math.random() * 0.3,
          maxLife: 0.8,
          color: c.color,
          drag: 0.85,
          glow: true,
        });
      }
      
      // 能量光束：从天而降的光柱效果
      if (Math.random() < 0.8) {
        const offsetX = (Math.random() - 0.5) * c.aoeRadius * 0.6;
        particles.push({
          type: 'orbital_beam',
          x: c.targetX + offsetX,
          y: c.targetY - 400,
          targetY: c.targetY,
          vx: (Math.random() - 0.5) * 20,
          vy: 600 + Math.random() * 300,
          size: 6 + Math.random() * 8,
          life: 0.6 + Math.random() * 0.3,
          maxLife: 0.9,
          color: Math.random() < 0.3 ? '#ffffff' : c.color,
          drag: 0.95,
          glow: true,
        });
      }
      
      // 中心电弧效果
      if (Math.random() < 0.4) {
        const angle = Math.random() * Math.PI * 2;
        const dist = 20 + Math.random() * 40;
        particles.push({
          type: 'lightning',
          x: c.targetX + Math.cos(angle) * dist,
          y: c.targetY + Math.sin(angle) * dist,
          vx: (c.targetX - (c.targetX + Math.cos(angle) * dist)) * 3,
          vy: (c.targetY - (c.targetY + Math.sin(angle) * dist)) * 3,
          size: 2,
          life: 0.2 + Math.random() * 0.15,
          maxLife: 0.35,
          color: '#ffff00',
          drag: 4.0,
        });
      }
      
      // 充能完成，进入发射阶段
      if (c.chargeTime >= c.maxChargeTime) {
        c.phase = 'firing';
        c.firingTime = 0;
        c.maxFiringTime = 0.5;
        
        // 发射瞬间的屏幕效果
        screenShake.intensity = 12;
        screenShake.duration = 0.4;
        screenShake.elapsed = 0;
        cameraFlash.intensity = 0.35;
        cameraFlash.duration = 0.3;
        cameraFlash.elapsed = 0;
        
        // 发射前的能量大汇聚
        for (let j = 0; j < 60; j++) {
          const angle = Math.random() * Math.PI * 2;
          const dist = c.aoeRadius * (1.5 + Math.random() * 0.5);
          particles.push({
            type: 'orbital_converge',
            x: c.targetX + Math.cos(angle) * dist,
            y: c.targetY + Math.sin(angle) * dist,
            vx: (c.targetX - (c.targetX + Math.cos(angle) * dist)) * 5,
            vy: (c.targetY - (c.targetY + Math.sin(angle) * dist)) * 5,
            size: 5 + Math.random() * 8,
            life: 0.35 + Math.random() * 0.2,
            maxLife: 0.55,
            color: Math.random() < 0.5 ? c.color : '#ffffff',
            drag: 6.0,
          });
        }
      }
    } else if (c.phase === 'firing') {
      c.firingTime += dt;
      
      // 发射阶段：光束持续下落
      if (c.firingTime < c.maxFiringTime * 0.6) {
        for (let j = 0; j < 12; j++) {
          const offsetX = (Math.random() - 0.5) * c.aoeRadius * 0.8;
          particles.push({
            type: 'orbital_beam',
            x: c.targetX + offsetX,
            y: c.targetY - 500,
            targetY: c.targetY,
            vx: 0,
            vy: 3000 + Math.random() * 1500,
            size: 15 + Math.random() * 20,
            life: 0.2,
            maxLife: 0.2,
            color: c.color,
            drag: 0.98,
            glow: true,
          });
        }
      }
      
      // 命中瞬间
      if (c.firingTime >= c.maxFiringTime * 0.6 && !c.exploded) {
        c.exploded = true;
        fireOrbitalExplosion(c.targetX, c.targetY, c.aoeRadius, c.damage, c.color);
      }
      
      // 发射完成
      if (c.firingTime >= c.maxFiringTime) {
        c.phase = 'done';
      }
    }
  }
  
  // 清理已完成的瞄准
  orbitalCharges = orbitalCharges.filter(c => c.phase !== 'done');
}

// 轨道炮真正爆炸（发射完成后调用）
function fireOrbitalExplosion(x, y, radius, damage, color) {
  // 强烈屏幕震动
  screenShake.intensity = 25;
  screenShake.duration = 0.8;
  screenShake.elapsed = 0;
  
  // 镜头闪光
  cameraFlash.intensity = 0.5;
  cameraFlash.duration = 0.4;
  cameraFlash.elapsed = 0;
  
  // 中心核心闪光
  explosions.push({
    x, y,
    radius: 0,
    maxRadius: radius * 0.6,
    life: 0.35,
    maxLife: 0.35,
    color: '#ffffff',
    type: 'flash',
  });
  
  // 多层冲击波
  explosions.push({
    x, y,
    radius: 0,
    maxRadius: radius,
    life: 1.2,
    maxLife: 1.2,
    color: color,
    type: 'ring_main',
  });
  explosions.push({
    x, y,
    radius: 0,
    maxRadius: radius * 1.3,
    life: 1.0,
    maxLife: 1.0,
    color: '#00ffff',
    type: 'ring_outer',
  });
  explosions.push({
    x, y,
    radius: 0,
    maxRadius: radius * 1.6,
    life: 1.5,
    maxLife: 1.5,
    color: '#0088ff',
    type: 'ring_outer',
  });
  explosions.push({
    x, y,
    radius: 0,
    maxRadius: radius * 2.0,
    life: 2.0,
    maxLife: 2.0,
    color: '#0044aa',
    type: 'ring_outer',
  });
  explosions.push({
    x, y,
    radius: 0,
    maxRadius: radius * 0.7,
    life: 0.4,
    maxLife: 0.4,
    color: '#ffffff',
    type: 'ring_white',
  });
  
  // 地面烧焦印记
  explosions.push({
    x, y,
    radius: 0,
    maxRadius: radius * 1.3,
    life: 5.0,
    maxLife: 5.0,
    color: '#0a1a2a',
    type: 'scorch',
  });
  
  // 高能碎片
  const debrisCount = 150;
  for (let i = 0; i < debrisCount; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 250 + Math.random() * 450;
    const size = 3 + Math.random() * 10;
    particles.push({
      type: 'debris',
      x: x,
      y: y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 80,
      size: size,
      life: 0.9 + Math.random() * 0.7,
      maxLife: 1.6,
      color: Math.random() < 0.25 ? '#ffffff' : (Math.random() < 0.5 ? color : '#00ffff'),
      drag: 1.6,
    });
  }
  
  // 蓝色火焰
  const flameCount = 50;
  for (let i = 0; i < flameCount; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 100 + Math.random() * 180;
    particles.push({
      type: 'spark',
      x: x + (Math.random() - 0.5) * radius * 0.6,
      y: y + (Math.random() - 0.5) * radius * 0.6,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 100,
      size: 5 + Math.random() * 8,
      life: 1.2 + Math.random() * 0.9,
      maxLife: 2.1,
      color: Math.random() < 0.35 ? '#00ffff' : (Math.random() < 0.5 ? '#00aaff' : '#0066ff'),
      drag: 0.8,
      grow: 3,
    });
  }
  
  // 电磁脉冲球
  const pulseCount = 25;
  for (let i = 0; i < pulseCount; i++) {
    const angle = Math.random() * Math.PI * 2;
    const dist = radius * (0.25 + Math.random() * 0.35);
    particles.push({
      type: 'smoke',
      x: x + Math.cos(angle) * dist,
      y: y + Math.sin(angle) * dist,
      vx: -Math.cos(angle) * 40,
      vy: -Math.sin(angle) * 40 - 30,
      size: 20 + Math.random() * 30,
      life: 1.8 + Math.random() * 1.2,
      maxLife: 3.0,
      color: Math.random() < 0.5 ? '#003366' : '#005588',
      drag: 0.35,
      grow: 40,
    });
  }
  
  // 闪电链
  for (let i = 0; i < 20; i++) {
    particles.push({
      type: 'lightning',
      x: x,
      y: y,
      vx: (Math.random() - 0.5) * 500,
      vy: (Math.random() - 0.5) * 500 - 150,
      size: 2.5,
      life: 0.35 + Math.random() * 0.25,
      maxLife: 0.6,
      color: '#ffff00',
      drag: 3.5,
    });
  }
  
  // 延迟次级爆炸波
  setTimeout(() => {
    explosions.push({
      x, y,
      radius: 0,
      maxRadius: radius * 2.5,
      life: 0.9,
      maxLife: 0.9,
      color: '#0066ff',
      type: 'ring_outer',
    });
    for (let i = 0; i < 40; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 180 + Math.random() * 280;
      particles.push({
        type: 'spark',
        x: x,
        y: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 2.5 + Math.random() * 4,
        life: 0.6 + Math.random() * 0.5,
        maxLife: 1.1,
        color: '#00ffff',
        drag: 2.0,
      });
    }
  }, 350);
  
  // 应用伤害
  applyAoeDamage(x, y, radius, damage);
}