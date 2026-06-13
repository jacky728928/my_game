// ========== 玩家 ==========
class Player {
  constructor() {
    this.x = WORLD_W / 2;
    this.y = WORLD_H / 2;
    this.radius = PLAYER_RADIUS;
    this.hp = PLAYER_MAX_HP;
    this.maxHp = PLAYER_MAX_HP;
    this.speed = PLAYER_SPEED;
    this.vx = 0;
    this.vy = 0;
    // 武器
    this.attackCooldown = 0;
    this.attackRange = PISTOL_RANGE;
    this.attackDamage = PISTOL_DAMAGE;
    this.attackInterval = PISTOL_INTERVAL;
    // 朝向（弧度）
    this.angle = 0;
    // 受击闪光
    this.damageFlash = 0;
    this.alive = true;
  }

  update(dt, bullets) {
    if (!this.alive) return;
    // 移动
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    // 边界限制
    this.x = Math.max(this.radius, Math.min(WORLD_W - this.radius, this.x));
    this.y = Math.max(this.radius, Math.min(WORLD_H - this.radius, this.y));
    // 朝向
    if (Math.abs(this.vx) > 1 || Math.abs(this.vy) > 1) {
      this.angle = Math.atan2(this.vy, this.vx);
    }
    // 攻击冷却
    this.attackCooldown = Math.max(0, this.attackCooldown - dt);
    // 受击闪光
    this.damageFlash = Math.max(0, this.damageFlash - dt);
    this.vx = 0;
    this.vy = 0;
  }

  setVelocity(vx, vy) {
    this.vx = vx;
    this.vy = vy;
  }

  canAttack() {
    return this.attackCooldown <= 0;
  }

  doAttack() {
    this.attackCooldown = this.attackInterval;
  }

  takeDamage(dmg) {
    this.hp = Math.max(0, this.hp - dmg);
    this.damageFlash = DAMAGE_FLASH_DURATION;
    if (this.hp <= 0) {
      this.alive = false;
    }
  }
}
