// ========== 经验球 ==========
class XpOrb {
  constructor(x, y, tierLevel) {
    this.x = x;
    this.y = y;
    this.value = tierLevel;          // 1~6 exp，对应敌人等级
    this.radius = XP_ORB_BASE_RADIUS + tierLevel * 0.8;
    this.color = XP_ORB_COLORS[tierLevel - 1];
    this.alive = true;
    this.bobPhase = Math.random() * Math.PI * 2;
    this.flying = false;             // 是否正在飞向角色
    this.vx = 0;
    this.vy = 0;
  }

  update(dt, player) {
    const dx = player.x - this.x;
    const dy = player.y - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (this.flying || dist < player.effectivePickupRange) {
      // 进入飞行状态
      if (!this.flying) {
        this.flying = true;
        // 初始速度 = 当前速度方向指向玩家
        const nx = dx / dist;
        const ny = dy / dist;
        this.vx = nx * 180;
        this.vy = ny * 180;
      }
      // 加速度拉向玩家
      const accel = 900;
      const nx = dx / (dist || 1);
      const ny = dy / (dist || 1);
      this.vx += nx * accel * dt;
      this.vy += ny * accel * dt;
      // 限速
      const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
      if (speed > XP_FLY_SPEED) {
        const scale = XP_FLY_SPEED / speed;
        this.vx *= scale;
        this.vy *= scale;
      }
      // 减速阻尼（防止过冲后弹开）
      this.vx *= 0.98;
      this.vy *= 0.98;

      this.x += this.vx * dt;
      this.y += this.vy * dt;

      // 碰到玩家身体就吸收
      if (dist < PLAYER_RADIUS + 8) {
        this.alive = false;
        return this.value;
      }
      // 飞行时缩小
      this.radius = Math.max(1.5, this.radius - 1.5 * dt);
    }
    return 0;
  }
}
