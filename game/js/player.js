// GILT — The Aurum Gallery Heist. player.js
// One job: the thief, Wren. Walk, sneak, sprint; hide in shadow and behind
// low cover; carry the loot. Movement collides with walls tile by tile, so
// a thief can slide along a wall instead of sticking to it.

import {
  TILE, GRID_X, GRID_Y, PLAYER_R, WALK_SPEED, SNEAK_SPEED, SPRINT_SPEED,
  NOISE_WALK, NOISE_SPRINT, LAMP_RADIUS, clamp,
} from './config.js';
import { tileCenter } from './config.js';

export class Player {
  constructor(world) {
    this.world = world;
    const start = world.findTile('P');
    const p = tileCenter(start.col, start.row);
    this.x = p.x;
    this.y = p.y;
    this.dir = 0; // facing, radians — drawn as the thief's gaze
    this.moving = false;
    this.sneaking = false;
    this.sprinting = false;
    this.inLight = false;
    this.crouchedInCover = false;
    this.cracking = null; // the safe being cracked, or null
    this.crackTime = 0;
    this.stepTimer = 0;
    this.lootValue = 0;
    this.lootCount = 0;
    this.hasTarget = false;
    this.spotted = 0; // times any guard reached full alert on this heist
    this.alerted = false; // an alert happened at all this heist
  }

  get speed() {
    if (this.sneaking) return SNEAK_SPEED;
    if (this.sprinting) return SPRINT_SPEED;
    return WALK_SPEED;
  }

  update(dt, input) {
    const grid = this.world.grid;
    let mx = (input.right ? 1 : 0) - (input.left ? 1 : 0);
    let my = (input.down ? 1 : 0) - (input.up ? 1 : 0);
    if (mx !== 0 || my !== 0) {
      const len = Math.hypot(mx, my);
      mx /= len; my /= len;
      this.moving = true;
      this.dir = Math.atan2(my, mx);
    } else {
      this.moving = false;
    }
    this.sneaking = !!input.sneak;
    this.sprinting = !!input.sprint && !this.sneaking && this.moving;

    const sp = this.speed * dt;
    if (this.moving) this.move(mx * sp, my * sp, grid);

    // Footstep noise: sprinting is loud, walking is a whisper, sneaking silent.
    this.stepTimer -= dt;
    if (this.moving && this.stepTimer <= 0) {
      this.stepTimer = this.sprinting ? 0.34 : 0.5;
      this.world.audio.step(this.sprinting);
      if (this.sprinting) this.world.noise(this.x, this.y, NOISE_SPRINT);
      else if (!this.sneaking) this.world.noise(this.x, this.y, NOISE_WALK);
    }

    this.updateLightAndCover();
    this.updateCracking(dt, input);
  }

  // Axis-separated collision: try x, then y, so walls slide instead of stop.
  move(dx, dy, grid) {
    if (!this.hitsWall(this.x + dx, this.y, grid)) this.x += dx;
    if (!this.hitsWall(this.x, this.y + dy, grid)) this.y += dy;
  }

  hitsWall(x, y, grid) {
    const r = PLAYER_R - 1;
    const corners = [
      [x - r, y - r], [x + r, y - r], [x - r, y + r], [x + r, y + r],
    ];
    for (const [cx, cy] of corners) {
      const col = Math.floor((cx - GRID_X) / TILE);
      const row = Math.floor((cy - GRID_Y) / TILE);
      if (row < 0 || col < 0 || row >= grid.length || col >= grid[0].length) return true;
      if (grid[row][col] === '#') return true;
    }
    return false;
  }

  updateLightAndCover() {
    const grid = this.world.grid;
    this.inLight = false;
    for (const lamp of this.world.lamps) {
      if (Math.hypot(this.x - lamp.x, this.y - lamp.y) < LAMP_RADIUS) {
        this.inLight = true;
        break;
      }
    }
    const col = Math.floor((this.x - GRID_X) / TILE);
    const row = Math.floor((this.y - GRID_Y) / TILE);
    const onCover = grid[row] && grid[row][col] === 'C';
    this.crouchedInCover = this.sneaking && onCover;
  }

  // Hold E beside a safe to crack it. It takes three seconds and it is loud.
  updateCracking(dt, input) {
    const safe = this.world.nearestSafe(this.x, this.y);
    if (safe && input.interact && !safe.taken) {
      if (this.cracking !== safe) {
        this.cracking = safe;
        this.crackTime = 0;
      }
      this.crackTime += dt;
      safe.crack = clamp(this.crackTime / 3.0, 0, 1);
      if (this.crackTime >= 3.0) {
        safe.taken = true;
        this.cracking = null;
        this.lootValue += safe.value;
        this.lootCount += 1;
        this.world.audio.safeOpen();
        this.world.noise(safe.x, safe.y, 170);
        this.world.addFloatText(safe.x, safe.y - 20, `+$${safe.value} SAFE`);
      }
    } else {
      if (this.cracking) this.cracking.crack = 0;
      this.cracking = null;
      this.crackTime = 0;
    }
  }
}
