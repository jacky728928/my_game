// ========== 转轮操控 + 键盘（方向键 / WASD） ==========
class InputHandler {
  constructor() {
    this.el = document.getElementById('wheel');
    if (!this.el) {
      this.el = document.createElement('div');
      this.el.id = 'wheel';
      this.el.className = 'hidden';
      const knob = document.createElement('div');
      knob.id = 'wheelKnob';
      this.el.appendChild(knob);
      document.body.appendChild(this.el);
    }
    this.knob = document.getElementById('wheelKnob');
    this.cx = 0;  // 轮盘屏幕中心
    this.cy = 0;
    this.radius = 70; // 轮盘半径
    this.active = false;
    this.touchId = null;
    this.dx = 0;
    this.dy = 0;  // 归一化方向

    // 鼠标 / 触摸 / 键盘 - 分别追踪
    this.mouseActive = false;
    this.keyActive = false;
    this.keys = { up: false, down: false, left: false, right: false };

    this._onTouchStart = this._onTouchStart.bind(this);
    this._onTouchMove = this._onTouchMove.bind(this);
    this._onTouchEnd = this._onTouchEnd.bind(this);
    this._onKeyDown = this._onKeyDown.bind(this);
    this._onKeyUp = this._onKeyUp.bind(this);

    this.el.addEventListener('touchstart', this._onTouchStart, {passive: false});
    this.el.addEventListener('touchmove', this._onTouchMove, {passive: false});
    this.el.addEventListener('touchend', this._onTouchEnd);
    this.el.addEventListener('touchcancel', this._onTouchEnd);

    // PC 鼠标支持
    this.el.addEventListener('mousedown', (e) => {
      this._startAt(e.clientX, e.clientY);
      this.mouseActive = true;
      const onMove = (ev) => this._moveAt(ev.clientX, ev.clientY);
      const onUp = () => {
        this.mouseActive = false;
        this._end();
        window.removeEventListener('mousemove', onMove);
        window.removeEventListener('mouseup', onUp);
      };
      window.addEventListener('mousemove', onMove);
      window.addEventListener('mouseup', onUp);
    });

    // 键盘支持（方向键 + WASD）
    window.addEventListener('keydown', this._onKeyDown);
    window.addEventListener('keyup', this._onKeyUp);

    // 显示轮盘
    this.el.classList.remove('hidden');
  }

  _startAt(sx, sy) {
    const rect = this.el.getBoundingClientRect();
    this.cx = rect.left + rect.width / 2;
    this.cy = rect.top + rect.height / 2;
    this._moveAt(sx, sy);
  }

  _moveAt(sx, sy) {
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
    // 如果当前还有其它输入激活，则不清零
    if (this.mouseActive || this.keyActive) return;
    this.dx = 0;
    this.dy = 0;
    this.knob.style.transform = 'translate(-50%, -50%)';
  }

  _onTouchStart(e) {
    e.preventDefault();
    const t = e.changedTouches[0];
    this.touchId = t.identifier;
    this.mouseActive = true;
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
        this.touchId = null;
        this.mouseActive = false;
        this._end();
        break;
      }
    }
  }

  _isDirectionKey(key) {
    return ['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',
            'w','W','a','A','s','S','d','D'].indexOf(key) !== -1;
  }

  _onKeyDown(e) {
    const key = e.key;
    if (!this._isDirectionKey(key)) return;
    // 防止页面滚动
    if (key.startsWith('Arrow')) e.preventDefault();

    if (key === 'ArrowUp' || key === 'w' || key === 'W') this.keys.up = true;
    else if (key === 'ArrowDown' || key === 's' || key === 'S') this.keys.down = true;
    else if (key === 'ArrowLeft' || key === 'a' || key === 'A') this.keys.left = true;
    else if (key === 'ArrowRight' || key === 'd' || key === 'D') this.keys.right = true;

    this._updateFromKeys();
  }

  _onKeyUp(e) {
    const key = e.key;
    if (!this._isDirectionKey(key)) return;

    if (key === 'ArrowUp' || key === 'w' || key === 'W') this.keys.up = false;
    else if (key === 'ArrowDown' || key === 's' || key === 'S') this.keys.down = false;
    else if (key === 'ArrowLeft' || key === 'a' || key === 'A') this.keys.left = false;
    else if (key === 'ArrowRight' || key === 'd' || key === 'D') this.keys.right = false;

    this._updateFromKeys();
  }

  _updateFromKeys() {
    // 由键盘计算方向
    const ndx = (this.keys.right ? 1 : 0) - (this.keys.left ? 1 : 0);
    const ndy = (this.keys.down ? 1 : 0) - (this.keys.up ? 1 : 0);
    const hasKey = ndx !== 0 || ndy !== 0;
    this.keyActive = hasKey;

    // 如果鼠标/触摸当前也在操作：优先交给它控制
    if (this.mouseActive) return;

    if (hasKey) {
      const mag = Math.sqrt(ndx * ndx + ndy * ndy) || 1;
      this.dx = (ndx / mag) * this.radius;
      this.dy = (ndy / mag) * this.radius;
      this.knob.style.transform = `translate(calc(-50% + ${this.dx}px), calc(-50% + ${this.dy}px))`;
    } else {
      this._end();
    }
  }

  // 返回 [-1..1] 的方向向量
  getDirection() {
    const mag = Math.sqrt(this.dx * this.dx + this.dy * this.dy);
    if (mag < 5) return [0, 0];
    return [this.dx / mag, this.dy / mag];
  }
}
