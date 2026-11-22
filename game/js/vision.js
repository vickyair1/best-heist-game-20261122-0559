// GILT — The Aurum Gallery Heist. vision.js
// One job: what a watcher can see. Raycast vision cones that walls and
// tall crates carve, and the line-of-sight test that decides detection.
// Low cover (planters, pedestals) hides a crouched thief only — a standing
// thief is seen over it, so cones are drawn over low cover.

import { TILE, GRID_X, GRID_Y, COLS, ROWS, clamp } from './config.js';

// True when the tile at (col,row) blocks sight for a standing watcher.
export function blocksSight(grid, col, row) {
  if (col < 0 || row < 0 || col >= COLS || row >= ROWS) return true;
  const t = grid[row][col];
  return t === '#' || t === 'X';
}

// March along a ray; return the distance travelled before a sight-blocking
// tile is hit (or maxDist). Steps are small enough that no wall is skipped.
export function raycast(grid, ox, oy, angle, maxDist) {
  const step = 6;
  const dx = Math.cos(angle);
  const dy = Math.sin(angle);
  for (let d = step; d <= maxDist; d += step) {
    const x = ox + dx * d;
    const y = oy + dy * d;
    const col = Math.floor((x - GRID_X) / TILE);
    const row = Math.floor((y - GRID_Y) / TILE);
    if (blocksSight(grid, col, row)) return d - step;
  }
  return maxDist;
}

// The cone polygon: a fan of raycast endpoints around `facing`.
export function conePolygon(grid, ox, oy, facing, fov, range) {
  const pts = [{ x: ox, y: oy }];
  const steps = 26;
  const half = (fov * Math.PI) / 360;
  for (let i = 0; i <= steps; i++) {
    const a = facing - half + (2 * half * i) / steps;
    const d = raycast(grid, ox, oy, a, range);
    pts.push({ x: ox + Math.cos(a) * d, y: oy + Math.sin(a) * d });
  }
  return pts;
}

// Line of sight between two points. `sneaking` lets low cover (C) hide the
// target: the segment is blocked when it crosses a C tile while the thief
// is crouched behind it.
export function hasLineOfSight(grid, ax, ay, bx, by, sneaking) {
  const d = Math.hypot(bx - ax, by - ay);
  const steps = Math.max(1, Math.ceil(d / 6));
  for (let i = 1; i < steps; i++) {
    const t = i / steps;
    const x = ax + (bx - ax) * t;
    const y = ay + (by - ay) * t;
    const col = Math.floor((x - GRID_X) / TILE);
    const row = Math.floor((y - GRID_Y) / TILE);
    if (col < 0 || row < 0 || col >= COLS || row >= ROWS) return false;
    const ch = grid[row][col];
    if (ch === '#' || ch === 'X') return false;
    if (ch === 'C' && sneaking) return false;
  }
  return true;
}

// Visibility of the thief from a watcher at (ox,oy) with a cone of
// `fov`/`range` facing `facing`. Returns 0..1. Light, distance, speed and
// stance all matter: sprinting in a lamp pool at close range is a shout.
export function visibility(grid, ox, oy, facing, fov, range, px, py, player) {
  const d = Math.hypot(px - ox, py - oy);
  if (d > range) return 0;
  const ang = Math.atan2(py - oy, px - ox);
  let diff = Math.abs(ang - facing);
  while (diff > Math.PI) diff = Math.abs(diff - Math.PI * 2);
  if (diff > (fov * Math.PI) / 360) return 0;
  if (!hasLineOfSight(grid, ox, oy, px, py, player.sneaking)) return 0;
  // Smoke blocks sight outright.
  if (player.world && player.world.inSmoke(px, py)) return 0;
  let v = 1 - (d / range) * 0.55;
  if (player.inLight) v += 0.35;
  if (player.sprinting) v += 0.3;
  if (player.sneaking) v -= 0.35;
  if (player.crouchedInCover) v -= 0.4;
  return clamp(v, 0, 1);
}
