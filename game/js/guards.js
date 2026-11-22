// GILT — The Aurum Gallery Heist. guards.js
// One job: the wardens. Patrol waypoints, pause and look, grow suspicious
// at a sound or a glimpse, chase when they are sure, search the last place
// they saw you, then give up and walk back to their round.

import { TILE, clamp, angleDiff, dist } from './config.js';
import { visibility } from './vision.js';
import { tileCenter } from './config.js';

export class Guard {
  constructor(def, grid) {
    this.waypoints = def.waypoints.map(([c, r]) => tileCenter(c, r));
    this.pauseTime = def.pause ?? 1.0;
    this.speed = def.speed ?? 58;
    this.runner = !!def.runner;
    this.x = this.waypoints[0].x;
    this.y = this.waypoints[0].y;
    this.wp = 1 % this.waypoints.length;
    this.facing = 0;
    this.state = 'patrol'; // patrol | suspicious | alert | search | return
    this.detection = 0; // 0..1, how sure this guard is
    this.pauseLeft = 0;
    this.lastSeen = null;
    this.searchLeft = 0;
    this.lookTimer = 0;
    this.lookDir = 0;
    this.grid = grid;
    this.chaseSpeed = this.speed * 1.9;
  }

  // Where the guard is heading right now (used by the HUD "last seen" mark).
  targetPoint() {
    if (this.state === 'alert' || this.state === 'search') return this.lastSeen;
    return this.waypoints[this.wp];
  }

  update(dt, world) {
    const player = world.player;
    const vis = visibility(
      this.grid, this.x, this.y, this.facing,
      78, 178, player.x, player.y, player,
    );
    // Detection builds while seen, decays while hidden.
    if (vis > 0.05) {
      this.detection = clamp(this.detection + vis * 1.15 * dt, 0, 1);
      if (this.detection > 0.25) this.lastSeen = { x: player.x, y: player.y };
    } else {
      this.detection = clamp(this.detection - 0.45 * dt, 0, 1);
    }
    if (this.detection >= 0.92 && this.state !== 'alert') {
      this.state = 'alert';
      world.onGuardAlert(this);
    } else if (this.detection >= 0.45 && this.state === 'patrol') {
      this.state = 'suspicious';
    } else if (this.detection < 0.2 && this.state === 'suspicious' && !this.lastSeen) {
      // A warden who only thought they saw something gives up — but one
      // with a place to check (a noise, a last glimpse) goes and looks.
      this.state = 'patrol';
    }

    switch (this.state) {
      case 'patrol': this.patrol(dt); break;
      case 'suspicious': this.investigate(dt, world); break;
      case 'alert': this.chase(dt, world); break;
      case 'search': this.search(dt); break;
      case 'return': this.returnToPatrol(dt); break;
    }
    // A guard that reaches you while alerted catches you.
    if (this.state === 'alert' && dist(this.x, this.y, player.x, player.y) < 20) {
      world.onCaught(this);
    }
  }

  moveToward(tx, ty, speed, dt) {
    const d = dist(this.x, this.y, tx, ty);
    if (d < 2) return true;
    const step = Math.min(d, speed * dt);
    this.x += ((tx - this.x) / d) * step;
    this.y += ((ty - this.y) / d) * step;
    this.facing = Math.atan2(ty - this.y, tx - this.x);
    return d - step < 3;
  }

  patrol(dt) {
    if (this.pauseLeft > 0) {
      this.pauseLeft -= dt;
      // Look around while paused: sweep the facing slowly.
      this.facing += Math.sin(performance.now() / 700 + this.x) * 0.008;
      return;
    }
    const wp = this.waypoints[this.wp];
    if (this.moveToward(wp.x, wp.y, this.speed, dt)) {
      this.wp = (this.wp + 1) % this.waypoints.length;
      this.pauseLeft = this.pauseTime;
    }
  }

  // Walk toward the last-seen point (or a noise) and look around.
  investigate(dt, world) {
    const p = this.lastSeen ?? world.lastNoise;
    if (!p) { this.state = 'patrol'; return; }
    if (this.moveToward(p.x, p.y, this.speed * 1.25, dt)) {
      this.state = 'search';
      this.searchLeft = 3.2;
      this.lookTimer = 0;
    }
  }

  chase(dt, world) {
    const player = world.player;
    if (this.detection < 0.25) {
      // Lost you: search where you were last seen.
      this.state = 'search';
      this.searchLeft = 4;
      return;
    }
    this.moveToward(player.x, player.y, this.chaseSpeed, dt);
  }

  search(dt) {
    this.searchLeft -= dt;
    this.lookTimer += dt;
    this.facing += Math.sin(this.lookTimer * 1.8) * 0.03;
    if (this.searchLeft <= 0) {
      this.state = 'return';
      this.detection = 0;
    }
  }

  returnToPatrol(dt) {
    // Walk back to the nearest waypoint, then resume the round.
    let best = 0;
    let bestD = Infinity;
    this.waypoints.forEach((w, i) => {
      const d = dist(this.x, this.y, w.x, w.y);
      if (d < bestD) { bestD = d; best = i; }
    });
    const w = this.waypoints[best];
    if (this.moveToward(w.x, w.y, this.speed, dt)) {
      this.wp = (best + 1) % this.waypoints.length;
      this.state = 'patrol';
    }
  }

  // A noise (coin, sprint, safe crack) pulls a patrolling guard over.
  hearNoise(x, y, strength) {
    if (this.state === 'alert') return;
    const d = dist(this.x, this.y, x, y);
    if (d < strength) {
      this.lastSeen = { x, y };
      if (this.state === 'patrol') this.state = 'suspicious';
    }
  }
}
