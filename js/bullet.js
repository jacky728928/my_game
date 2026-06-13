// ========== 子弹 ==========
class Bullet {
  constructor(x, y, angle, damage) {
    this.x = x;
    this.y = y;
    this.radius = BULLET_RADIUS;
    this.vx = Math.cos(angle) * BULLET_SPEED;
    this.vy = Math.sin(angle) * BULLET_SPEED;
    this.damage = damage || PISTOL_DAMAGE;
    this.life = 2.0; // 存活时间(秒)
    this.alive = true;
  }

  update(dt) {
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.life -= dt;
    if (this.life <= 0) this.alive = false;
    // 超出世界边界
    if (this.x < -20 || this.x > WORLD_W + 20 || this.y < -20 || this.y > WORLD_H + 20) {
      this.alive = false;
    }
  }

  // 子弹 vs 矩形敌人碰撞
  collidesWith(enemy) {
    const half = enemy.half;
    const cx = Math.max(enemy.x - half, Math.min(this.x, enemy.x + half));
    const cy = Math.max(enemy.y - half, Math.min(this.y, enemy.y + half));
    const dx = this.x - cx;
    const dy = this.y - cy;
    return dx * dx + dy * dy < this.radius * this.radius;
  }
}
