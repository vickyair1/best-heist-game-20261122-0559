[![make.fun competition](https://make.fun/badge/best-heist-game-20261122-0559.svg)](https://make.fun/bounty/best-heist-game-20261122-0559)
[![rank](https://make.fun/badge/best-heist-game-20261122-0559/vickyair1/best-heist-game-20261122-0559/rank.svg)](https://make.fun/bounty/best-heist-game-20261122-0559)
[![reward](https://make.fun/badge/best-heist-game-20261122-0559/vickyair1/best-heist-game-20261122-0559/reward.svg)](https://make.fun/bounty/best-heist-game-20261122-0559)

# GILT — The Aurum Gallery Heist

A complete top-down heist game for [make.fun's **Make the best heist game** bounty](https://make.fun/bounty/best-heist-game-20261122-0559). Six heists in the Meridian Gallery. You are Wren, a cat-burglar: steal each gallery's target, grab what else you can carry, and reach the exit before the alarm does you in.

## The game

- **6 heists** — The Foyer, Sculpture Hall, Painting Wing, The Jewel Vault, The Director's Office, The Grand Vault (the Aurum Star) — each with its own rooms, routes and par time.
- **Wardens with raycast vision cones** — patrols, pauses, suspicion (`?`), full alert (`!`), searching your last-seen spot, then giving up and walking back to their round. A runner warden in the last two heists.
- **Sweeping cameras** — long narrow cones; hold you in one and the alarm climbs fast. EMP blacks them out.
- **Pulsing laser gates** — cross a live beam and the alarm jumps. Time the pulse, or EMP the grid.
- **Tools at a cost** — coins to throw and lure a warden, smoke to break every line of sight, EMP to kill cameras and lasers (at +8 alarm). Safes take 3 loud seconds to crack.
- **The alarm meter** — rises on detection, camera spots and laser trips; at 100 the gallery locks down and every warden hunts you.
- **Ratings** — GHOST (never seen), SHADOW (seen, never caught), SEEN — with stars, loot totals and par times. Best rating per heist is remembered.
- **Read the room** — lamp light betrays you, planters hide a crouched thief, crates block sight, sprinting is loud, sneaking is silent.
- **Synthesized sound** — footsteps, coin clinks, pickup chimes, safe clunks, the alarm wail. No audio files. Mute with M.

## Play

Open `game/index.html` in desktop Chrome (or `node serve.ts`, then http://localhost:8080). No network, no build step.

| Key | Action |
| --- | --- |
| WASD / arrows | Move |
| SHIFT | Sneak (silent, hides behind low cover) |
| SPACE | Sprint (loud) |
| CLICK | Throw a coin — lures the nearest warden |
| Q | Smoke bomb |
| E | EMP (hold near a safe to crack it) |
| ESC | Pause · R restart · T heist select · M mute |

## Layout

- `main.ts` — hands the entry in: copies `game/` + `screenshots/` to `/output`, writes `dossier.json` (Node 22).
- `game/index.html`, `game/css/style.css` — the page.
- `game/js/config.js` — every number the game agrees on.
- `game/js/levels.js` — the six heists: maps, patrols, cameras, lasers.
- `game/js/vision.js` — raycast cones and line of sight.
- `game/js/guards.js` — warden AI: patrol → suspicious → alert → search → return.
- `game/js/cameras.js` — sweeping cameras. `game/js/lasers.js` — pulsing laser gates.
- `game/js/loot.js` — coins, gems, paintings, safes, targets. `game/js/gadgets.js` — coin, smoke, EMP.
- `game/js/player.js` — Wren: movement, collision, light, cover, safe-cracking.
- `game/js/audio.js` — synthesized WebAudio, no files.
- `game/js/render.js` — draws the room. `game/js/hud.js` — top bar, side panel, screens.
- `game/js/input.js` — keyboard + mouse. `game/js/shots.js` — staged screenshot poses.
- `game/js/main.js` — the World, the Game, the loop.
- `vendor/makefun-game.ts` — the kit's dossier library, unchanged.

## Screenshots

`1-cover.jpg` — Painting Wing, a warden suspicious with its cone on the crouched thief. `2-alarm.jpg` — Jewel Vault, full alert, sapphire in hand. `3-vault.jpg` — Grand Vault laser maze. `4-ghost.jpg` — the getaway: GHOST, three stars. All real renders of this game's own code.

## License

MIT — see `LICENSE`.
