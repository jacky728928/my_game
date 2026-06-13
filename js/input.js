// ========== 转轮操控 ==========
class InputHandler {
  constructor() {
    this.el = document.getElementById('wheel');
    this.knob = document.getElementById('wheelKnob');
    this.cx = 0;  // 轮盘屏幕中心
    this.cy = 0;
    this.radius = 70; // 轮盘半径
    this.active = false;
    this.touchId = null;
    this.dx = 0;
    this.dy = 0;  // 归一化方向

    this._onTouchStart = this._onTouchStart.bind(this);
    this._onTouchMove = this._onTouchMove.bind(this);
    this._onTouchEnd = this._onTouchEnd.bind(this);

    this.el.addEventListener('touchstart', this._onTouchStart, {passive: false});
    this.el.addEventListener('touchmove', this._onTouchMove, {passive: false});
    this.el.addEventListener('touchend', this._onTouchEnd);
    this.el.addEventListener('touchcancel', this._onTouchEnd);

    // PC 鼠标支持
    this.el.addEventListener('mousedown', (e) => {
      this._startAt(e.clientX, e.clientY);
      const onMove = (ev) => this._moveAt(ev.clientX, ev.clientY);
      const onUp = () => {
        this._end();
        window.removeEventListener('mousemove', onMove);
        window.removeEventListener('mouseup', onUp);
      };
      window.addEventListener('mousemove', onMove);
      window.addEventListener('mouseup', onUp);
    });

    // 显示轮盘
    this.el.classList.remove('hidden');
  }

  _startAt(sx, sy) {
    this.active = true;
    const rect = this.el.getBoundingClientRect();
    this.cx = rect.left + rect.width / 2;
    this.cy = rect.top + rect.height / 2;
    this._moveAt(sx, sy);
  }

  _moveAt(sx, sy) {
    if (!this.active) return;
    this.dx = sx - this.cx;
    this.dy = sy - this.cy;
    const dist = Math.sqrt(this.dx * this.dx + this.dy * this.dy);
    if (dist > this.radius) {
      this.dx = this.dx / dist * this.radius;
      this.dy = this.dy / dist * this.radius;
    }
    this.knob.style.transform = `translate(calc(-50% + ${this.dx}px), calc(-50% + ${this.dy}px))`;
  }

  _end() {
    this.active = false;
    this.dx = 0;
    this.dy = 0;
    this.knob.style.transform = 'translate(-50%, -50%)';
  }

  _onTouchStart(e) {
    e.preventDefault();
    const t = e.changedTouches[0];
    this.touchId = t.identifier;
    this._startAt(t.clientX, t.clientY);
  }

  _onTouchMove(e) {
    e.preventDefault();
    for (let t of e.changedTouches) {
      if (t.identifier === this.touchId) {
        this._moveAt(t.clientX, t.clientY);
        break;
      }
    }
  }

  _onTouchEnd(e) {
    for (let t of e.changedTouches) {
      if (t.identifier === this.touchId) {
        this._end();
        this.touchId = null;
        break;
      }
    }
  }

  // 返回 [0..1] 的方向向量
  getDirection() {
    if (!this.active) return [0, 0];
    const mag = Math.sqrt(this.dx * this.dx + this.dy * this.dy);
    if (mag < 5) return [0, 0];
    return [this.dx / mag, this.dy / mag];
  }
}
