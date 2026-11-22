// GILT — The Aurum Gallery Heist. main.js
// One job: the game itself. The World (one heist, loaded and ticked) and
// the Game (screens, input, the loop, and the staged screenshot poses).
// The loop runs at requestAnimationFrame; every system ticks from the same
// dt, clamped so a slow frame never teleports the thief through a wall.

import { LEVELS } from './levels.js';
import { TILE, GRID_X, GRID_Y, COLS, ROWS, VIEW_W, VIEW_H, TOP_H, PANEL_X,
  ALARM_RISE_SEEN, ALARM_RISE_CAMERA, ALARM_LASER_TRIP, ALARM_DECAY, clamp } from './config.js';
import { tileCenter } from './config.js';
import { parseLoot, collectLoot } from './loot.js';
import { Guard } from './guards.js';
import { Camera } from './cameras.js';
import { Laser } from './lasers.js';
import { Gadgets } from './gadgets.js';
import { Player } from './player.js';
import { AudioEngine } from './audio.js';
import { drawWorld } from './render.js';
import { drawTopBar, drawSidePanel, drawTitle, drawHeistSelect, drawPaused,
  drawCaught, drawComplete, drawHelpBar } from './hud.js';
import { Input } from './input.js';
import { applyShot } from './shots.js';

const SHOT_LEVEL = { cover: 2, alarm: 3, vault: 5, ghost: 0 };

export class World {
  constructor(levelIndex, game) {
    this.game = game;
    this.levels = game.levels;
    this.levelIndex = levelIndex;
    this.level = LEVELS[levelIndex];
    this.grid = this.level.map.map((row) => [...row]);
    this.audio = game.audio;
    this.lamps = [];
    this.loot = parseLoot(this.level.map);
    this.lootTotal = this.loot.length;
    this.lootGot = 0;
    this.guards = this.level.guards.map((d) => new Guard(d, this.grid));
    this.cameras = this.level.cameras.map((d) => new Camera(d, this.grid));
    this.lasers = this.level.lasers.map((d) => new Laser(d));
    this.gadgets = new Gadgets(this.level.gadgets);
    const exit = this.findTile('E');
    this.exit = tileCenter(exit.col, exit.row);
    this.grid.forEach((row, r) => row.forEach((ch, c) => {
      if (ch === 'L') this.lamps.push(tileCenter(c, r));
    }));
    this.player = new Player(this);
    this.alarm = 0;
    this.time = 0;
    this.lockdown = false;
    this.lastNoise = null;
    this.noiseRings = [];
    this.floatTexts = [];
    this.flashEmp = 0;
    this.seeingNow = false;
    this.cameraSeeing = false;
  }

  findTile(ch) {
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        if (this.grid[r][c] === ch) return { col: c, row: r };
      }
    }
    return { col: 1, row: 1 };
  }

  inSmoke(x, y) {
    return this.gadgets.inSmoke(x, y);
  }

  nearestSafe(x, y) {
    let best = null;
    let bestD = 30;
    for (const item of this.loot) {
      if (item.kind !== 'safe' || item.taken) continue;
      const d = Math.hypot(item.x - x, item.y - y);
      if (d < bestD) { bestD = d; best = item; }
    }
    return best;
  }

  noise(x, y, radius) {
    this.lastNoise = { x, y };
    this.noiseRings.push({ x, y, radius, left: 0.6, max: 0.6 });
    for (const g of this.guards) g.hearNoise(x, y, radius);
  }

  addFloatText(x, y, text) {
    this.floatTexts.push({ x, y, text, left: 1.6 });
  }

  onGuardAlert(guard) {
    const p = this.player;
    p.spotted += 1;
    p.alerted = true;
    this.alarm = clamp(this.alarm + 10, 0, 100);
    this.audio.alarm();
    this.addFloatText(guard.x, guard.y - 30, 'SPOTTED!');
  }

  onCameraSpot(cam, dt) {
    this.alarm = clamp(this.alarm + ALARM_RISE_CAMERA * dt, 0, 100);
    this.cameraSeeing = true;
  }

  onLaserTrip() {
    this.alarm = clamp(this.alarm + ALARM_LASER_TRIP, 0, 100);
    this.audio.alarm();
    this.addFloatText(this.player.x, this.player.y - 26, 'LASER TRIP!');
  }

  onCaught() {
    this.game.caught();
  }

  update(dt, input) {
    this.time += dt;
    this.seeingNow = false;
    this.cameraSeeing = false;
    this.player.update(dt, input);
    this.gadgets.update(dt);
    for (const g of this.guards) {
      g.update(dt, this);
      if (g.detection > 0.05) this.seeingNow = true;
    }
    for (const cam of this.cameras) cam.update(dt, this, this.time);
    for (const laser of this.lasers) laser.update(dt, this);

    // Loot: walk over coins, gems and paintings; the target is the heist.
    for (const item of collectLoot(this.loot, this.player)) {
      this.player.lootValue += item.value;
      this.player.lootCount += 1;
      this.lootGot += 1;
      this.audio.pickup();
      this.addFloatText(item.x, item.y - 18, `+$${item.value}`);
    }
    const target = this.loot.find((l) => l.kind === 'target');
    if (target && !target.taken && !this.player.hasTarget) {
      if (Math.hypot(target.x - this.player.x, target.y - this.player.y) < 26) {
        target.taken = true;
        this.player.hasTarget = true;
        this.player.lootValue += target.value;
        this.player.lootCount += 1;
        this.lootGot += 1;
        this.audio.target();
        this.addFloatText(target.x, target.y - 26, `${this.level.target.toUpperCase()}!`);
      }
    }

    // Alarm: rises while anyone holds you, decays while you are nobody's.
    if (this.seeingNow) this.alarm = clamp(this.alarm + ALARM_RISE_SEEN * dt, 0, 100);
    else if (!this.cameraSeeing) this.alarm = clamp(this.alarm - ALARM_DECAY * dt, 0, 100);
    if (this.alarm >= 100 && !this.lockdown) {
      this.lockdown = true;
      for (const g of this.guards) {
        g.state = 'alert';
        g.lastSeen = { x: this.player.x, y: this.player.y };
        g.detection = 1;
      }
      this.audio.alarm();
      this.addFloatText(this.player.x, this.player.y - 30, 'LOCKDOWN!');
    } else if (this.alarm < 60) {
      this.lockdown = false;
    }

    // The getaway: target in hand, reach the green door.
    if (this.player.hasTarget) {
      if (Math.hypot(this.exit.x - this.player.x, this.exit.y - this.player.y) < 26) {
        this.game.complete();
      }
    }

    for (const ring of this.noiseRings) ring.left -= dt;
    this.noiseRings = this.noiseRings.filter((r) => r.left > 0);
    for (const f of this.floatTexts) { f.left -= dt; f.y -= 14 * dt; }
    this.floatTexts = this.floatTexts.filter((f) => f.left > 0);
    if (this.flashEmp > 0) this.flashEmp -= dt;
  }
}

export class Game {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.audio = new AudioEngine();
    this.input = new Input(canvas);
    this.levels = LEVELS;
    this.bestRatings = this.loadBest();
    this.selectedLevel = 0;
    this.screen = 'title';
    this.world = new World(0, this);
    this.renderTime = 0;
    this.last = 0;
    this.frames = 0;
    this.shotMode = false;
    this.input.onKey = (code) => this.handleKey(code);
    this.input.onClick = (x, y) => this.handleClick(x, y);
    this.setupShot();
    requestAnimationFrame((t) => this.loop(t));
  }

  loadBest() {
    try {
      return JSON.parse(localStorage.getItem('gilt-best') || '{}');
    } catch {
      return {};
    }
  }

  saveBest() {
    try {
      localStorage.setItem('gilt-best', JSON.stringify(this.bestRatings));
    } catch { /* storage unavailable — ratings just don't persist */ }
  }

  // ?shot=cover stages one level as a posed scene for screenshots.
  // Logic is frozen in shot mode: the pose is the picture, exactly.
  setupShot() {
    const q = new URLSearchParams(window.location.search);
    const shot = q.get('shot');
    if (!shot || !(shot in SHOT_LEVEL)) return;
    this.shotMode = true;
    this.shotName = shot;
    this.loadLevel(SHOT_LEVEL[shot]);
    applyShot(this.world, this, shot);
    if (shot !== 'ghost') this.screen = 'play';
  }

  loadLevel(i) {
    this.world = new World(i, this);
    this.screen = 'play';
  }

  rating() {
    const p = this.world.player;
    if (p.spotted === 0) return 'GHOST';
    return p.alerted ? 'SEEN' : 'SHADOW';
  }

  complete() {
    const r = this.rating();
    const i = this.world.levelIndex;
    const order = { GHOST: 3, SHADOW: 2, SEEN: 1 };
    if (!this.bestRatings[i] || order[r] > order[this.bestRatings[i]]) {
      this.bestRatings[i] = r;
      this.saveBest();
    }
    this.audio.win();
    this.screen = 'complete';
  }

  caught() {
    this.audio.caught();
    this.screen = 'caught';
  }

  handleKey(code) {
    this.audio.ensure();
    if (code === 'KeyM') {
      this.audio.toggleMute();
      return;
    }
    if (this.screen === 'title') {
      if (code === 'Enter') this.screen = 'select';
      return;
    }
    if (this.screen === 'select') {
      if (code === 'ArrowUp' || code === 'KeyW') {
        this.selectedLevel = (this.selectedLevel + LEVELS.length - 1) % LEVELS.length;
      } else if (code === 'ArrowDown' || code === 'KeyS') {
        this.selectedLevel = (this.selectedLevel + 1) % LEVELS.length;
      } else if (code.startsWith('Digit')) {
        const n = Number(code.slice(5)) - 1;
        if (n >= 0 && n < LEVELS.length && (n === 0 || this.bestRatings[n - 1])) {
          this.selectedLevel = n;
        }
      } else if (code === 'Enter') {
        this.loadLevel(this.selectedLevel);
      }
      return;
    }
    if (this.screen === 'play') {
      if (code === 'Escape') { this.screen = 'paused'; return; }
      if (code === 'KeyR') { this.loadLevel(this.world.levelIndex); return; }
      if (code === 'KeyT') { this.screen = 'select'; return; }
      if (code === 'KeyQ') { this.world.gadgets.useSmoke(this.world); return; }
      if (code === 'KeyE') {
        // E near a safe cracks it (hold); elsewhere it fires the EMP.
        if (!this.world.nearestSafe(this.world.player.x, this.world.player.y)) {
          this.world.gadgets.useEmp(this.world);
        }
      }
      return;
    }
    if (this.screen === 'paused') {
      if (code === 'Escape') this.screen = 'play';
      else if (code === 'KeyR') this.loadLevel(this.world.levelIndex);
      else if (code === 'KeyT') this.screen = 'select';
      return;
    }
    if (this.screen === 'caught') {
      if (code === 'Enter') this.loadLevel(this.world.levelIndex);
      else if (code === 'KeyT') this.screen = 'select';
      return;
    }
    if (this.screen === 'complete') {
      if (code === 'Enter') {
        const next = this.world.levelIndex + 1;
        if (next < LEVELS.length) this.loadLevel(next);
        else this.screen = 'select';
      } else if (code === 'KeyT') {
        this.screen = 'select';
      }
    }
  }

  handleClick(x, y) {
    if (this.screen !== 'play') return;
    if (x >= PANEL_X || y <= TOP_H) return; // clicks on the panels do nothing
    this.audio.ensure();
    this.world.gadgets.throwCoin(x, y, this.world);
  }

  loop(t) {
    const dt = clamp((t - this.last) / 1000 || 0.016, 0, 0.05);
    this.last = t;
    this.renderTime += dt;
    if (this.screen === 'play' && !this.shotMode) {
      this.world.update(dt, this.input);
    }
    const ctx = this.ctx;
    ctx.clearRect(0, 0, VIEW_W, VIEW_H);
    ctx.fillStyle = '#0b0e1a';
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);
    if (this.screen === 'title') {
      drawWorld(ctx, this.world, this.renderTime);
      drawTopBar(ctx, this.world);
      drawSidePanel(ctx, this.world);
      drawTitle(ctx, this.world);
    } else if (this.screen === 'select') {
      drawHeistSelect(ctx, this.world);
    } else {
      drawWorld(ctx, this.world, this.renderTime);
      drawTopBar(ctx, this.world);
      drawSidePanel(ctx, this.world);
      if (this.screen === 'play') drawHelpBar(ctx);
      else if (this.screen === 'paused') drawPaused(ctx);
      else if (this.screen === 'caught') drawCaught(ctx, this.world);
      else if (this.screen === 'complete') drawComplete(ctx, this.world);
    }
    this.input.endFrame();
    this.frames += 1;
    if (this.shotMode && this.frames === 3) window.__shotReady = true;
    requestAnimationFrame((nt) => this.loop(nt));
  }
}

// Boot: the canvas is 1280x720 in index.html.
const canvas = document.getElementById('game');
const game = new Game(canvas);
window.__gilt = game;
