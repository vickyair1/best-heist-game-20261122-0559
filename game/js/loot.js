// GILT — The Aurum Gallery Heist. loot.js
// One job: everything worth stealing. Coins, gems and paintings are picked
// up by walking over them; safes must be cracked (hold E, loud, three
// seconds); the target is the heist itself — take it, then reach the exit.

import { LOOT_VALUE, dist } from './config.js';
import { tileCenter } from './config.js';

export class Loot {
  constructor(kind, col, row) {
    const p = tileCenter(col, row);
    this.kind = kind; // coin | gem | painting | safe | target
    this.x = p.x;
    this.y = p.y;
    this.col = col;
    this.row = row;
    this.value = LOOT_VALUE[kind];
    this.taken = false;
    this.crack = 0; // 0..1 progress while a safe is being cracked
    this.bob = Math.random() * Math.PI * 2;
  }

  get label() {
    return {
      coin: 'Coin',
      gem: 'Gem',
      painting: 'Painting',
      safe: 'Safe',
      target: 'TARGET',
    }[this.kind];
  }
}

// Pull the loot items out of a level map. The map keeps the letters; the
// world keeps the objects.
export function parseLoot(map) {
  const items = [];
  map.forEach((row, r) => {
    [...row].forEach((ch, c) => {
      if (ch === '$') items.push(new Loot('coin', c, r));
      else if (ch === 'G') items.push(new Loot('gem', c, r));
      else if (ch === 'A') items.push(new Loot('painting', c, r));
      else if (ch === 'S') items.push(new Loot('safe', c, r));
      else if (ch === 'T') items.push(new Loot('target', c, r));
    });
  });
  return items;
}

// Walk-over pickup for the small stuff; returns the items just taken.
export function collectLoot(items, player) {
  const got = [];
  for (const item of items) {
    if (item.taken || item.kind === 'safe' || item.kind === 'target') continue;
    if (dist(item.x, item.y, player.x, player.y) < 24) {
      item.taken = true;
      got.push(item);
    }
  }
  return got;
}
