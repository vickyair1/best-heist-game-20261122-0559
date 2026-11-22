// GILT — The Aurum Gallery Heist. render.js
// One job: draw the room. Floor and lamp pools, the carved vision cones,
// walls and cover, lasers, loot, the exit, the wardens and their cameras,
// and Wren herself — in that order, so danger always reads on top of the
// floor and the thief always reads on top of everything.

import {
  TILE, GRID_X, GRID_Y, COLS, ROWS, COLORS, LAMP_RADIUS, SMOKE_RADIUS, PLAYER_R,
} from './config.js';
import { conePolygon } from './vision.js';
import { CAMERA_FOV, CAMERA_RANGE } from './config.js';

function tileXY(col, row) {
  return { x: GRID_X + col * TILE, y: GRID_Y + row * TILE };
}

export function drawWorld(ctx, world, time) {
  const grid = world.grid;
  drawFloor(ctx, grid, time);
  drawLamps(ctx, world, time);
  drawCones(ctx, world);
  drawWallsAndCover(ctx, grid);
  drawLasers(ctx, world, time);
  drawExit(ctx, world, time);
  drawLoot(ctx, world, time);
  drawGuards(ctx, world);
  drawCameras(ctx, world, time);
  drawPlayer(ctx, world, time);
  drawSmoke(ctx, world);
  drawNoiseRings(ctx, world);
  drawFloatTexts(ctx, world);
  if (world.flashEmp > 0) {
    ctx.fillStyle = `rgba(140, 180, 255, ${world.flashEmp * 0.5})`;
    ctx.fillRect(GRID_X, GRID_Y, COLS * TILE, ROWS * TILE);
  }
}

function drawFloor(ctx, grid, time) {
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const { x, y } = tileXY(c, r);
      const ch = grid[r][c];
      if (ch === '#') continue;
      ctx.fillStyle = (c + r) % 2 === 0 ? COLORS.floor : COLORS.floorAlt;
      ctx.fillRect(x, y, TILE, TILE);
      // faint gallery tile seams
      ctx.strokeStyle = 'rgba(255,255,255,0.03)';
      ctx.strokeRect(x + 0.5, y + 0.5, TILE - 1, TILE - 1);
    }
  }
}

function drawLamps(ctx, world) {
  for (const lamp of world.lamps) {
    const g = ctx.createRadialGradient(lamp.x, lamp.y, 6, lamp.x, lamp.y, LAMP_RADIUS);
    g.addColorStop(0, 'rgba(255, 200, 110, 0.30)');
    g.addColorStop(1, 'rgba(255, 200, 110, 0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(lamp.x, lamp.y, LAMP_RADIUS, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = COLORS.lampCore;
    ctx.beginPath();
    ctx.arc(lamp.x, lamp.y, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 207, 125, 0.5)';
    ctx.beginPath();
    ctx.arc(lamp.x, lamp.y, 9, 0, Math.PI * 2);
    ctx.stroke();
  }
}

function fillCone(ctx, poly, fill, edge) {
  ctx.beginPath();
  ctx.moveTo(poly[0].x, poly[0].y);
  for (let i = 1; i < poly.length; i++) ctx.lineTo(poly[i].x, poly[i].y);
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.strokeStyle = edge;
  ctx.lineWidth = 1.5;
  ctx.stroke();
}

function drawCones(ctx, world) {
  for (const cam of world.cameras) {
    if (cam.disabled) continue;
    const poly = conePolygon(world.grid, cam.x, cam.y, cam.facing, CAMERA_FOV, CAMERA_RANGE);
    fillCone(ctx, poly, COLORS.camCone, COLORS.camConeEdge);
  }
  for (const guard of world.guards) {
    const alert = guard.state === 'alert';
    const susp = guard.state === 'suspicious' || guard.state === 'search';
    const fill = alert ? COLORS.coneAlert : susp ? COLORS.coneSuspect : COLORS.conePatrol;
    const edge = alert ? COLORS.coneAlertEdge : susp ? COLORS.coneSuspectEdge : COLORS.conePatrolEdge;
    const poly = conePolygon(world.grid, guard.x, guard.y, guard.facing, 78, 178);
    fillCone(ctx, poly, fill, edge);
  }
}

function drawWallsAndCover(ctx, grid) {
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const { x, y } = tileXY(c, r);
      const ch = grid[r][c];
      if (ch === '#') {
        ctx.fillStyle = COLORS.wall;
        ctx.fillRect(x, y, TILE, TILE);
        ctx.fillStyle = COLORS.wallTop;
        ctx.fillRect(x, y, TILE, 5);
      } else if (ch === 'X') {
        ctx.fillStyle = COLORS.crate;
        ctx.fillRect(x + 3, y + 3, TILE - 6, TILE - 6);
        ctx.fillStyle = COLORS.crateTop;
        ctx.fillRect(x + 3, y + 3, TILE - 6, 6);
        ctx.strokeStyle = 'rgba(0,0,0,0.35)';
        ctx.strokeRect(x + 3.5, y + 3.5, TILE - 7, TILE - 7);
      } else if (ch === 'C') {
        ctx.fillStyle = COLORS.cover;
        ctx.beginPath();
        ctx.arc(x + TILE / 2, y + TILE / 2, 13, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = COLORS.coverTop;
        ctx.beginPath();
        ctx.arc(x + TILE / 2, y + TILE / 2, 8, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }
}

function drawLasers(ctx, world, time) {
  for (const laser of world.lasers) {
    const live = laser.live;
    const pulse = 0.55 + 0.45 * Math.sin(time * 6);
    ctx.strokeStyle = live
      ? `rgba(255, 60, 80, ${0.55 + 0.45 * pulse})`
      : COLORS.laserOff;
    ctx.lineWidth = live ? 3 : 2;
    ctx.setLineDash(live ? [] : [6, 6]);
    ctx.beginPath();
    ctx.moveTo(laser.ax, laser.ay);
    ctx.lineTo(laser.bx, laser.by);
    ctx.stroke();
    ctx.setLineDash([]);
    // emitter posts
    for (const [ex, ey] of [[laser.ax, laser.ay], [laser.bx, laser.by]]) {
      ctx.fillStyle = live ? '#ff3c50' : '#7a2a35';
      ctx.fillRect(ex - 4, ey - 4, 8, 8);
    }
  }
}

function drawExit(ctx, world, time) {
  const e = world.exit;
  const pulse = 0.5 + 0.5 * Math.sin(time * 3);
  ctx.fillStyle = `rgba(61, 255, 158, ${0.14 + 0.12 * pulse})`;
  ctx.fillRect(e.x - 18, e.y - 18, 36, 36);
  ctx.fillStyle = COLORS.exit;
  ctx.fillRect(e.x - 14, e.y - 14, 28, 28);
  ctx.fillStyle = '#062b16';
  ctx.font = 'bold 15px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('▶', e.x, e.y + 1);
  ctx.fillStyle = COLORS.exit;
  ctx.font = 'bold 10px system-ui, sans-serif';
  ctx.fillText('EXIT', e.x, e.y - 26);
}

function drawLoot(ctx, world, time) {
  for (const item of world.loot) {
    if (item.taken) continue;
    const bob = Math.sin(time * 2 + item.bob) * 2;
    const y = item.y + bob;
    if (item.kind === 'coin') {
      ctx.fillStyle = COLORS.lootCoin;
      ctx.beginPath();
      ctx.arc(item.x, y, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#8a6a1c';
      ctx.font = 'bold 9px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('$', item.x, y + 0.5);
    } else if (item.kind === 'gem') {
      ctx.fillStyle = COLORS.lootGem;
      ctx.beginPath();
      ctx.moveTo(item.x, y - 9);
      ctx.lineTo(item.x + 7, y);
      ctx.lineTo(item.x, y + 9);
      ctx.lineTo(item.x - 7, y);
      ctx.closePath();
      ctx.fill();
    } else if (item.kind === 'painting') {
      ctx.fillStyle = '#3a2a18';
      ctx.fillRect(item.x - 13, item.y - 10, 26, 20);
      ctx.fillStyle = COLORS.lootPainting;
      ctx.fillRect(item.x - 10, item.y - 7, 20, 14);
      ctx.fillStyle = 'rgba(255,255,255,0.35)';
      ctx.fillRect(item.x - 10, item.y - 7, 20, 4);
    } else if (item.kind === 'safe') {
      ctx.fillStyle = '#4a4f6a';
      ctx.fillRect(item.x - 14, item.y - 14, 28, 28);
      ctx.fillStyle = '#2c3048';
      ctx.beginPath();
      ctx.arc(item.x, item.y, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = COLORS.lootCoin;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(item.x, item.y, 8, -Math.PI / 2, -Math.PI / 2 + item.crack * Math.PI * 2);
      ctx.stroke();
      if (item.crack > 0) {
        ctx.fillStyle = COLORS.lootCoin;
        ctx.font = 'bold 10px system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('CRACKING…', item.x, item.y - 22);
      }
    } else if (item.kind === 'target') {
      const glow = ctx.createRadialGradient(item.x, y, 4, item.x, y, 34);
      glow.addColorStop(0, 'rgba(255, 233, 168, 0.55)');
      glow.addColorStop(1, 'rgba(255, 233, 168, 0)');
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(item.x, y, 34, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = COLORS.lootTarget;
      ctx.beginPath();
      ctx.moveTo(item.x, y - 13);
      ctx.lineTo(item.x + 10, y);
      ctx.lineTo(item.x, y + 13);
      ctx.lineTo(item.x - 10, y);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#fff8dd';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.fillStyle = '#7a5c10';
      ctx.font = 'bold 10px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('★', item.x, y + 0.5);
      ctx.fillStyle = COLORS.lootTarget;
      ctx.font = 'bold 10px system-ui, sans-serif';
      ctx.fillText('TARGET', item.x, y - 24);
    }
  }
}

function drawGuards(ctx, world) {
  for (const guard of world.guards) {
    // last-seen marker while searching
    if ((guard.state === 'search' || guard.state === 'suspicious') && guard.lastSeen) {
      ctx.strokeStyle = 'rgba(255, 200, 60, 0.7)';
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.arc(guard.lastSeen.x, guard.lastSeen.y, 16, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = '#ffc233';
      ctx.font = 'bold 13px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('?', guard.lastSeen.x, guard.lastSeen.y - 24);
    }
    // body
    ctx.fillStyle = COLORS.guardBody;
    ctx.beginPath();
    ctx.arc(guard.x, guard.y, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = COLORS.guard;
    ctx.beginPath();
    ctx.arc(guard.x, guard.y, 8, 0, Math.PI * 2);
    ctx.fill();
    // facing tick
    ctx.strokeStyle = '#ffd9b0';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(guard.x, guard.y);
    ctx.lineTo(guard.x + Math.cos(guard.facing) * 14, guard.y + Math.sin(guard.facing) * 14);
    ctx.stroke();
    // detection arc over the head
    if (guard.detection > 0.05) {
      ctx.strokeStyle = guard.detection >= 0.92 ? '#ff4646' : '#ffc233';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(guard.x, guard.y, 17, -Math.PI / 2, -Math.PI / 2 + guard.detection * Math.PI * 2);
      ctx.stroke();
    }
    // state bubble
    if (guard.state === 'suspicious' || guard.state === 'search') {
      ctx.fillStyle = '#ffc233';
      ctx.font = 'bold 16px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('?', guard.x, guard.y - 22);
    } else if (guard.state === 'alert') {
      ctx.fillStyle = '#ff4646';
      ctx.font = 'bold 18px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('!', guard.x, guard.y - 22);
    }
  }
}

function drawCameras(ctx, world, time) {
  for (const cam of world.cameras) {
    ctx.fillStyle = cam.disabled ? '#3a4a6a' : COLORS.camera;
    ctx.fillRect(cam.x - 7, cam.y - 7, 14, 14);
    ctx.fillStyle = cam.disabled ? '#222' : '#0b0e1a';
    ctx.beginPath();
    ctx.arc(cam.x + Math.cos(cam.facing) * 4, cam.y + Math.sin(cam.facing) * 4, 3, 0, Math.PI * 2);
    ctx.fill();
    if (cam.disabled) {
      ctx.strokeStyle = '#ff4646';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(cam.x - 9, cam.y - 9);
      ctx.lineTo(cam.x + 9, cam.y + 9);
      ctx.moveTo(cam.x + 9, cam.y - 9);
      ctx.lineTo(cam.x - 9, cam.y + 9);
      ctx.stroke();
      ctx.fillStyle = '#8fa3d8';
      ctx.font = 'bold 9px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('OFF', cam.x, cam.y - 14);
    } else if (cam.seeing > 0.3) {
      ctx.fillStyle = '#ff4646';
      ctx.font = 'bold 11px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('SPOTTED', cam.x, cam.y - 14);
    }
  }
}

function drawPlayer(ctx, world, time) {
  const p = world.player;
  const hidden = p.crouchedInCover || world.inSmoke(p.x, p.y);
  // shadow ring: the thief is hard to see here
  ctx.strokeStyle = hidden ? COLORS.exit : 'rgba(232,236,255,0.35)';
  ctx.setLineDash(hidden ? [] : [3, 4]);
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(p.x, p.y, 16, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = p.sneaking ? '#c8d0f0' : COLORS.player;
  ctx.beginPath();
  ctx.arc(p.x, p.y, PLAYER_R, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#1a1f36';
  ctx.beginPath();
  ctx.arc(p.x + Math.cos(p.dir) * 5, p.y + Math.sin(p.dir) * 5, 4, 0, Math.PI * 2);
  ctx.fill();
  // gold ring while carrying the target
  if (p.hasTarget) {
    ctx.strokeStyle = COLORS.playerRing;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(p.x, p.y, 15, 0, Math.PI * 2);
    ctx.stroke();
  }
  if (hidden) {
    ctx.fillStyle = COLORS.exit;
    ctx.font = 'bold 10px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('HIDDEN', p.x, p.y - 24);
  }
  // cracking progress ring
  if (p.cracking) {
    ctx.strokeStyle = COLORS.lootCoin;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(p.x, p.y, 20, -Math.PI / 2, -Math.PI / 2 + p.cracking.crack * Math.PI * 2);
    ctx.stroke();
  }
}

function drawSmoke(ctx, world) {
  for (const s of world.gadgets.smokes) {
    const a = 0.35 + 0.15 * Math.sin(Date.now() / 200);
    ctx.fillStyle = `rgba(200, 205, 220, ${a})`;
    ctx.beginPath();
    ctx.arc(s.x, s.y, SMOKE_RADIUS, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(220, 225, 240, 0.5)';
    ctx.beginPath();
    ctx.arc(s.x - 20, s.y + 10, SMOKE_RADIUS * 0.5, 0, Math.PI * 2);
    ctx.arc(s.x + 22, s.y - 12, SMOKE_RADIUS * 0.45, 0, Math.PI * 2);
    ctx.fill();
  }
  const coin = world.gadgets.thrownCoin;
  if (coin) {
    ctx.fillStyle = COLORS.lootCoin;
    ctx.beginPath();
    ctx.arc(coin.x, coin.y, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 215, 106, 0.7)';
    ctx.beginPath();
    ctx.arc(coin.x, coin.y, 10 + (2.5 - coin.left) * 14, 0, Math.PI * 2);
    ctx.stroke();
  }
}

function drawNoiseRings(ctx, world) {
  for (const ring of world.noiseRings) {
    const t = 1 - ring.left / ring.max;
    ctx.strokeStyle = `rgba(255, 215, 106, ${0.8 * (1 - t)})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(ring.x, ring.y, ring.radius * t, 0, Math.PI * 2);
    ctx.stroke();
  }
}

function drawFloatTexts(ctx, world) {
  ctx.font = 'bold 13px system-ui, sans-serif';
  ctx.textAlign = 'center';
  for (const f of world.floatTexts) {
    ctx.fillStyle = `rgba(255, 215, 106, ${Math.min(1, f.left)})`;
    ctx.fillText(f.text, f.x, f.y);
  }
}
