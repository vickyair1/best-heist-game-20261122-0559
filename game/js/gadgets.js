// GILT — The Aurum Gallery Heist. gadgets.js
// One job: the thief's tools, each with a cost. A coin thrown to a point
// pulls the nearest warden over to look; smoke breaks every line of sight
// inside its cloud; an EMP blacks out cameras and lasers — but the power
// surge spikes the alarm. No tool is free, and none of them is endless.

import { SMOKE_RADIUS, SMOKE_TIME, EMP_TIME, ALARM_EMP_SURGE, COIN_LURE_RADIUS } from './config.js';

export class Gadgets {
  constructor(stock) {
    this.coin = stock.coin ?? 0;
    this.smoke = stock.smoke ?? 0;
    this.emp = stock.emp ?? 0;
    this.smokes = []; // {x, y, left}
    this.thrownCoin = null; // {x, y, left} — the lure, still ringing
  }

  // Throw a coin at (x,y). Returns false when none is left.
  throwCoin(x, y, world) {
    if (this.coin <= 0) return false;
    this.coin -= 1;
    this.thrownCoin = { x, y, left: 2.5 };
    world.audio.clink();
    world.noise(x, y, COIN_LURE_RADIUS);
    return true;
  }

  // Pop a smoke bomb at the thief's feet. Returns false when none is left.
  useSmoke(world) {
    if (this.smoke <= 0) return false;
    this.smoke -= 1;
    const p = world.player;
    this.smokes.push({ x: p.x, y: p.y, left: SMOKE_TIME });
    world.audio.puff();
    return true;
  }

  // EMP burst: cameras and lasers die for a while, the alarm jumps.
  useEmp(world) {
    if (this.emp <= 0) return false;
    this.emp -= 1;
    for (const cam of world.cameras) cam.disable(EMP_TIME);
    for (const laser of world.lasers) laser.disable(EMP_TIME);
    world.alarm += ALARM_EMP_SURGE;
    world.audio.zap();
    world.flashEmp = 0.35;
    return true;
  }

  update(dt) {
    for (const s of this.smokes) s.left -= dt;
    this.smokes = this.smokes.filter((s) => s.left > 0);
    if (this.thrownCoin) {
      this.thrownCoin.left -= dt;
      if (this.thrownCoin.left <= 0) this.thrownCoin = null;
    }
  }

  inSmoke(x, y) {
    return this.smokes.some((s) => Math.hypot(x - s.x, y - s.y) < SMOKE_RADIUS);
  }
}
