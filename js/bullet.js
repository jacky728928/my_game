// ========== 子弹 ==========
class Bullet {
  constructor(x, y, angle, damage, isCrit) {
    this.x = x;
    this.y = y;
    this.radius = BULLET_RADIUS;
    this.vx = Math.cos(angle) * BULLET_SPEED;
    this.vy = Math.sin(angle) * BULLET_SPEED;
    this.damage = damage || PISTOL_DAMAGE;
    this.isCrit = !!isCrit;
    this.hasCharge = false;
    this.life = 2.0;
    this.alive = true;
    // 颜色（角色专属会在创建时被覆盖）
    this.color = null;       // 外发光颜色
    this.core = null;        // 内核颜色
    this.trail = null;       // 拖尾颜色（默认与 color 同）
  }

  update(dt) {
    const prevX = this.x;
    const prevY = this.y;
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.life -= dt;
    if (this.life <= 0) this.alive = false;
    if (this.x < -20 || this.x > WORLD_W + 20 || this.y < -20 || this.y > WORLD_H + 20) {
      this.alive = false;
    }
    const hitWall = checkBulletWalls(prevX, prevY, this.x, this.y);
    if (hitWall) {
      this.alive = false;
      if (typeof particles !== 'undefined') {
        // 角色颜色的爆炸粒子（如果有）
        const pColor = this.color || WALL_COLORS[hitWall.type];
        for (let i = 0; i < 3; i++) {
          const a = Math.random() * Math.PI * 2;
          particles.push({
            type: 'wall_hit',
            x: this.x, y: this.y,
            vx: Math.cos(a) * 40, vy: Math.sin(a) * 40,
            size: 4,
            life: 0.25, maxLife: 0.25,
            color: pColor,
          });
        }
      }
    }
  }

  collidesWith(enemy) {
    const half = enemy.half;
    const cx = Math.max(enemy.x - half, Math.min(this.x, enemy.x + half));
    const cy = Math.max(enemy.y - half, Math.min(this.y, enemy.y + half));
    const dx = this.x - cx;
    const dy = this.y - cy;
    return dx * dx + dy * dy < this.radius * this.radius;
  }
}
