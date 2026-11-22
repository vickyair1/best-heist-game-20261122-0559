// GILT — The Aurum Gallery Heist. cameras.js
// One job: the wall cameras. They sweep a fixed arc, see in a long narrow
// cone, and raise the alarm fast while they hold you. An EMP blacks them
// out for a few seconds — at the cost of a power surge on the alarm.

import { CAMERA_RANGE, CAMERA_FOV, clamp } from './config.js';
import { visibility } from './vision.js';
import { tileCenter } from './config.js';

export class Camera {
  constructor(def, grid) {
    const p = tileCenter(def.col, def.row);
    this.x = p.x;
    this.y = p.y;
    this.base = (def.base * Math.PI) / 180; // centre of the sweep, radians
    this.sweep = (def.sweep * Math.PI) / 180; // half-arc of the sweep
    this.speed = def.speed ?? 0.6;
    this.phase = Math.random() * Math.PI * 2;
    this.facing = this.base;
    this.disabledLeft = 0;
    this.seeing = 0; // 0..1, how much of you it holds right now
    this.grid = grid;
  }

  get disabled() {
    return this.disabledLeft > 0;
  }

  update(dt, world, time) {
    if (this.disabledLeft > 0) this.disabledLeft -= dt;
    this.facing = this.base + Math.sin(time * this.speed + this.phase) * this.sweep;
    if (this.disabled) {
      this.seeing = 0;
      return;
    }
    const player = world.player;
    const vis = visibility(
      this.grid, this.x, this.y, this.facing,
      CAMERA_FOV, CAMERA_RANGE, player.x, player.y, player,
    );
    this.seeing = vis > 0.05 ? clamp(this.seeing + vis * dt * 1.4, 0, 1) : 0;
    if (this.seeing > 0.35) world.onCameraSpot(this, dt);
  }

  disable(seconds) {
    this.disabledLeft = Math.max(this.disabledLeft, seconds);
    this.seeing = 0;
  }
}
