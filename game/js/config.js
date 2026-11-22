// GILT — The Aurum Gallery Heist. config.js
// One job: every number the rest of the game agrees on — canvas size,
// tile grid, colours, speeds, detection rates and loot values.

export const VIEW_W = 1280;
export const VIEW_H = 720;
export const TOP_H = 52; // top bar height
export const PANEL_X = 952; // right panel starts here
export const PANEL_W = VIEW_W - PANEL_X;

// Playfield grid: 23 x 16 tiles of 40px, inside the left area.
export const TILE = 40;
export const COLS = 23;
export const ROWS = 16;
export const GRID_X = 16;
export const GRID_Y = 68;

// Player
export const PLAYER_R = 11;
export const WALK_SPEED = 132; // px per second
export const SNEAK_SPEED = 78;
export const SPRINT_SPEED = 198;
export const NOISE_WALK = 34; // px radius guards can hear
export const NOISE_SPRINT = 130;
export const NOISE_SNEAK = 0;

// Vision
export const GUARD_RANGE = 178;
export const GUARD_FOV = 78; // degrees, full cone
export const CAMERA_RANGE = 228;
export const CAMERA_FOV = 52;
export const LAMP_RADIUS = 92;

// Detection: visibility 0..1 builds per-guard detection 0..1.
export const DETECT_RISE = 1.15; // per second at full visibility
export const DETECT_FALL = 0.45;
export const SUSPICIOUS_AT = 0.45; // guard starts to wonder
export const ALERT_AT = 0.92; // guard knows where you are
export const CATCH_DIST = 20;

// Alarm: 0..100. Rises on detection, cameras, lasers, noise.
export const ALARM_RISE_SEEN = 11; // per second while any guard sees you
export const ALARM_RISE_CAMERA = 22; // per second while a camera sees you
export const ALARM_LASER_TRIP = 18;
export const ALARM_NOISE = 4;
export const ALARM_EMP_SURGE = 8;
export const ALARM_DECAY = 2.2;

// Gadgets
export const GADGETS = {
  coin: { name: 'Coin', key: 'CLICK', max: 5 },
  smoke: { name: 'Smoke', key: 'Q', max: 3 },
  emp: { name: 'EMP', key: 'E', max: 2 },
};
export const SMOKE_RADIUS = 95;
export const SMOKE_TIME = 6;
export const EMP_TIME = 8;
export const COIN_LURE_RADIUS = 210;
export const SAFE_CRACK_TIME = 3.0;

// Loot values in dollars.
export const LOOT_VALUE = { coin: 50, gem: 200, painting: 350, safe: 500, target: 1000 };

// Colours — a gilt-and-shadow gallery: deep blue-black floors, warm gold
// loot, amber lamp pools; danger reads red, safety reads green, cameras blue.
export const COLORS = {
  bg: '#0b0e1a',
  floor: '#171b2e',
  floorAlt: '#1a1f36',
  wall: '#3a4266',
  wallTop: '#4d5680',
  cover: '#2e5d43', // low cover: planters and pedestals
  coverTop: '#3f7d5b',
  crate: '#6b4f2a',
  crateTop: '#8a6a3c',
  lampGlow: 'rgba(255, 190, 90, 0.20)',
  lampCore: '#ffcf7d',
  conePatrol: 'rgba(120, 200, 255, 0.20)',
  conePatrolEdge: 'rgba(120, 200, 255, 0.55)',
  coneSuspect: 'rgba(255, 200, 60, 0.30)',
  coneSuspectEdge: 'rgba(255, 200, 60, 0.75)',
  coneAlert: 'rgba(255, 70, 60, 0.32)',
  coneAlertEdge: 'rgba(255, 70, 60, 0.85)',
  camCone: 'rgba(90, 140, 255, 0.22)',
  camConeEdge: 'rgba(90, 140, 255, 0.6)',
  laser: 'rgba(255, 60, 80, 0.85)',
  laserOff: 'rgba(255, 60, 80, 0.18)',
  player: '#e8ecff',
  playerRing: '#ffd76a',
  guard: '#ff8a3c',
  guardBody: '#c85a17',
  camera: '#7fb2ff',
  lootCoin: '#ffd76a',
  lootGem: '#7de8ff',
  lootPainting: '#ff9de2',
  lootTarget: '#ffe9a8',
  exit: '#3dff9e',
  smoke: 'rgba(200, 205, 220, 0.45)',
  text: '#e8ecff',
  muted: '#9aa3c7',
  panel: '#10142a',
  panelLine: '#2a3054',
  alarmLow: '#3dff9e',
  alarmMid: '#ffc233',
  alarmHigh: '#ff4646',
};

export function clamp(v, lo, hi) {
  return v < lo ? lo : v > hi ? hi : v;
}
export function dist(ax, ay, bx, by) {
  return Math.hypot(ax - bx, ay - by);
}
export function lerp(a, b, t) {
  return a + (b - a) * t;
}
export function angleDiff(a, b) {
  let d = a - b;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return d;
}
export function tileCenter(col, row) {
  return { x: GRID_X + col * TILE + TILE / 2, y: GRID_Y + row * TILE + TILE / 2 };
}
export function pxToTile(x, y) {
  return {
    col: Math.floor((x - GRID_X) / TILE),
    row: Math.floor((y - GRID_Y) / TILE),
  };
}
