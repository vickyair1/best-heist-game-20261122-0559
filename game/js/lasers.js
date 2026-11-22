// GILT — The Aurum Gallery Heist. lasers.js
// One job: the laser gates. A beam runs between two wall points and pulses
// on and off on a fixed cycle; crossing a live beam trips the alarm. An
// EMP kills every beam for a few seconds. Watch the pulse — timing is the
// whole puzzle.

import { clamp, dist } from './config.js';
import { tileCenter } from './config.js';

export class Laser {
  constructor(def) {
    const a = tileCenter(def.a[0], def.a[1]);
    const b = tileCenter(def.b[0], def.b[1]);
    this.ax = a.x; this.ay = a.y;
    this.bx = b.x; this.by = b.y;
    this.period = def.period ?? 3.0;
    this.onTime = def.on ?? 1.8;
    this.phase = def.phase ?? 0;
    this.disabledLeft = 0;
    this.tripped = false; // latched until the thief leaves the beam
    this.time = 0;
  }

  get live() {
    if (this.disabledLeft > 0) return false;
    return ((this.time + this.phase) % this.period) < this.onTime;
  }

  // Fraction of the current cycle that remains while the beam is live
  // (drives the pulsing draw so the player can read the timing).
  liveFraction() {
    if (!this.live) return 0;
    const t = (this.time + this.phase) % this.period;
    return 1 - t / this.onTime;
  }

  update(dt, world) {
    this.time += dt;
    if (this.disabledLeft > 0) this.disabledLeft -= dt;
    const player = world.player;
    const hit = this.live && this.distanceTo(player.x, player.y) < 14;
    if (hit && !this.tripped) {
      this.tripped = true;
      world.onLaserTrip(this);
    } else if (!hit) {
      this.tripped = false;
    }
  }

  // Distance from a point to the beam segment.
  distanceTo(px, py) {
    const dx = this.bx - this.ax;
    const dy = this.by - this.ay;
    const len2 = dx * dx + dy * dy || 1;
    let t = ((px - this.ax) * dx + (py - this.ay) * dy) / len2;
    t = clamp(t, 0, 1);
    const cx = this.ax + dx * t;
    const cy = this.ay + dy * t;
    return dist(px, py, cx, cy);
  }

  disable(seconds) {
    this.disabledLeft = Math.max(this.disabledLeft, seconds);
  }
}
