// GILT — The Aurum Gallery Heist. input.js
// One job: keyboard and mouse. Held keys steer the thief; pressed keys
// fire one-shot actions (smoke, EMP, pause, confirm). The game clears the
// pressed set at the end of every frame, so a tap never fires twice.

export class Input {
  constructor(canvas) {
    this.canvas = canvas;
    this.keys = new Set();
    this.pressed = new Set();
    this.mouse = { x: 0, y: 0, clicked: false };
    this.onKey = null; // game hooks one-shot keys through this
    this.onClick = null;
    window.addEventListener('keydown', (e) => {
      if (e.repeat) return;
      this.keys.add(e.code);
      this.pressed.add(e.code);
      if (this.onKey) this.onKey(e.code);
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) {
        e.preventDefault();
      }
    });
    window.addEventListener('keyup', (e) => {
      this.keys.delete(e.code);
    });
    canvas.addEventListener('mousedown', (e) => {
      const rect = canvas.getBoundingClientRect();
      const sx = canvas.width / rect.width;
      const sy = canvas.height / rect.height;
      this.mouse.x = (e.clientX - rect.left) * sx;
      this.mouse.y = (e.clientY - rect.top) * sy;
      this.mouse.clicked = true;
      if (this.onClick) this.onClick(this.mouse.x, this.mouse.y);
    });
    window.addEventListener('blur', () => this.keys.clear());
  }

  get up() { return this.keys.has('KeyW') || this.keys.has('ArrowUp'); }
  get down() { return this.keys.has('KeyS') || this.keys.has('ArrowDown'); }
  get left() { return this.keys.has('KeyA') || this.keys.has('ArrowLeft'); }
  get right() { return this.keys.has('KeyD') || this.keys.has('ArrowRight'); }
  get sneak() { return this.keys.has('ShiftLeft') || this.keys.has('ShiftRight'); }
  get sprint() { return this.keys.has('Space'); }
  get interact() { return this.keys.has('KeyE'); }

  wasPressed(code) {
    return this.pressed.has(code);
  }

  endFrame() {
    this.pressed.clear();
    this.mouse.clicked = false;
  }
}
