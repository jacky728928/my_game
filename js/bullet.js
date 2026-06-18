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
    this.life = 2.0;
    this.alive = true;
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
    // 子弹与墙体碰撞检测（平射子弹，中/高墙阻挡）
    const hitWall = checkBulletWalls(prevX, prevY, this.x, this.y);
    if (hitWall) {
      this.alive = false;
      // 在碰撞点生成小的撞击粒子
      if (typeof particles !== 'undefined') {
        particles.push({
          type: 'wall_hit',
          x: this.x, y: this.y,
          vx: 0, vy: 0,
          size: 6,
          life: 0.2,
          maxLife: 0.2,
          color: WALL_COLORS[hitWall.type],
        });
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
