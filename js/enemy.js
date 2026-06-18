// ========== 敌人（方形，6级预设） ==========
class Enemy {
  constructor(x, y, tier) {
    this.x = x;
    this.y = y;
    this.tier = tier || ENEMY_TIERS[0];
    this.level = this.tier.level;
    this.size = this.tier.size;
    this.half = this.size / 2;
    this.radius = this.half;       // AOE 碰撞判定用的半径
    this.hp = this.tier.hp;
    this.maxHp = this.tier.hp;
    this.color = this.tier.color;
    this.glow = this.tier.glow;
    // 随机移速（每级一个区间，有的快有的慢）
    this.speed = this.tier.speedMin + Math.random() * (this.tier.speedMax - this.tier.speedMin);
    this.alive = true;
  }

  update(dt, player) {
    if (!this.alive) return;
    const dx = player.x - this.x;
    const dy = player.y - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < 1) return;
    const nx = dx / dist;
    const ny = dy / dist;
    const nextX = this.x + nx * this.speed * dt;
    const nextY = this.y + ny * this.speed * dt;
    // 墙体碰撞修正
    const resolved = resolveCircleWalls(this.x, this.y, this.radius, nextX, nextY);
    this.x = resolved.x;
    this.y = resolved.y;
  }

  takeDamage(dmg) {
    this.hp -= dmg;
    if (this.hp <= 0) {
      this.alive = false;
    }
  }

  // 矩形 vs 圆形碰撞
  collidesWith(player) {
    const cx = Math.max(this.x - this.half, Math.min(player.x, this.x + this.half));
    const cy = Math.max(this.y - this.half, Math.min(player.y, this.y + this.half));
    const dx = player.x - cx;
    const dy = player.y - cy;
    return dx * dx + dy * dy < player.radius * player.radius;
  }
}
