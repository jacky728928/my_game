// ========== 小地图 ==========
class Minimap {
  constructor() {
    this.canvas = document.getElementById('minimap');
    this.ctx = this.canvas.getContext('2d');
    this.size = MINIMAP_SIZE;
    this.canvas.width = this.size * devicePixelRatio;
    this.canvas.height = this.size * devicePixelRatio;
    this.ctx.scale(devicePixelRatio, devicePixelRatio);
    this.scaleX = this.size / WORLD_W;
    this.scaleY = this.size / WORLD_H;
  }

  render(player, enemies, cameraX, cameraY) {
    const ctx = this.ctx;
    const s = this.size;
    ctx.clearRect(0, 0, s, s);

    // 背景
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.fillRect(0, 0, s, s);

    // 视口框
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const vx = (cameraX - vw / 2) * this.scaleX;
    const vy = (cameraY - vh / 2) * this.scaleY;
    ctx.strokeStyle = 'rgba(255,255,255,0.5)';
    ctx.lineWidth = 1;
    ctx.strokeRect(vx, vy, vw * this.scaleX, vh * this.scaleY);

    // 敌人
    for (let e of enemies) {
      if (!e.alive) continue;
      ctx.fillStyle = e.color;
      const ex = e.x * this.scaleX;
      const ey = e.y * this.scaleY;
      ctx.fillRect(ex - 1.5, ey - 1.5, 3, 3);
    }

    // 玩家
    const px = player.x * this.scaleX;
    const py = player.y * this.scaleY;
    ctx.fillStyle = COLOR_PLAYER;
    ctx.beginPath();
    ctx.arc(px, py, 3, 0, Math.PI * 2);
    ctx.fill();
  }
}
