// GILT — The Aurum Gallery Heist. shots.js
// One job: the staged screenshot states. ?shot=cover (or alarm, vault,
// ghost) loads a level and poses it — a suspicious warden on the thief, a
// full alert, the Grand Vault's laser maze, a GHOST getaway — so the four
// screenshots are real renders of the game's own code in its best light.
// Nothing here changes how the game plays; it only sets the opening pose.

import { tileCenter } from './config.js';

// Put the thief on a tile (col,row), sneaking if asked.
function placeThief(world, col, row, sneaking) {
  const p = tileCenter(col, row);
  world.player.x = p.x;
  world.player.y = p.y;
  world.player.sneaking = !!sneaking;
  world.player.dir = Math.PI * 0.25;
}

function aimGuardAtPlayer(world, guardIndex, detection, state) {
  const g = world.guards[guardIndex];
  const p = world.player;
  g.detection = detection;
  g.state = state;
  g.lastSeen = { x: p.x, y: p.y };
  g.facing = Math.atan2(p.y - g.y, p.x - g.x);
  // Stand the guard still for the shot: freeze its patrol pause.
  g.pauseLeft = 999;
}

// Stand a guard on a tile for the shot (pose only — the game itself
// never teleports a warden).
function placeGuard(world, guardIndex, col, row) {
  const g = world.guards[guardIndex];
  const p = tileCenter(col, row);
  g.x = p.x;
  g.y = p.y;
}

export function applyShot(world, game, name) {
  const p = world.player;
  if (name === 'cover') {
    // Painting Wing, mid-heist: thief crouched behind a planter, a warden
    // suspicious with its cone on her, alarm rising, target still in place.
    placeThief(world, 7, 7, true);
    placeGuard(world, 0, 10, 5);
    aimGuardAtPlayer(world, 0, 0.62, 'suspicious');
    world.alarm = 34;
    world.time = 64;
    world.loot[0].taken = true;
    p.lootValue += world.loot[0].value;
    p.lootCount += 1;
    world.lootGot = 1;
    world.addFloatText(world.loot[0].x, world.loot[0].y - 20, `+$${world.loot[0].value}`);
  } else if (name === 'alarm') {
    // Jewel Vault, full alert: the thief has the sapphire and is running
    // for the exit while every cone burns red.
    placeThief(world, 17, 12, false);
    const target = world.loot.find((l) => l.kind === 'target');
    if (target) {
      target.taken = true;
      p.hasTarget = true;
      p.lootValue += target.value;
      p.lootCount += 1;
    }
    p.lootValue += 400;
    world.lootGot = 3;
    world.alarm = 78;
    world.time = 98;
    world.guards.forEach((g, i) => aimGuardAtPlayer(world, i, 1, 'alert'));
    world.audio.alarm();
  } else if (name === 'vault') {
    // Grand Vault: the thief below the laser maze, EMP ready, the Aurum Star
    // glowing behind two safes and four cameras.
    placeThief(world, 8, 11, true);
    world.alarm = 12;
    world.time = 45;
    p.dir = Math.PI;
    const g0 = world.guards[0];
    g0.facing = Math.PI * 0.75;
  } else if (name === 'ghost') {
    // A finished heist: GHOST, three stars, everything stolen, under par.
    for (const item of world.loot) {
      if (!item.taken) {
        item.taken = true;
        p.lootValue += item.value;
        p.lootCount += 1;
      }
    }
    p.hasTarget = true;
    world.lootGot = world.lootTotal;
    world.time = 62;
    world.screen = 'complete';
    game.screen = 'complete';
    game.world = world;
  }
  world.screen = game.screen;
}
