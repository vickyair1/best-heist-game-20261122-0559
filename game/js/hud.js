// GILT — The Aurum Gallery Heist. hud.js
// One job: everything around the room. The top bar (heist, objective,
// timer, loot), the right panel (detection state, the big alarm meter,
// visibility, noise, loot, gadgets, legend, controls), and the screens
// between heists: title, heist select, pause, caught, and the getaway.

import { VIEW_W, VIEW_H, TOP_H, PANEL_X, PANEL_W, COLORS, clamp } from './config.js';

function fmtTime(s) {
  const m = Math.floor(s / 60);
  const r = Math.floor(s % 60);
  return `${String(m).padStart(2, '0')}:${String(r).padStart(2, '0')}`;
}

export function drawTopBar(ctx, world) {
  const level = world.level;
  ctx.fillStyle = '#0d1122';
  ctx.fillRect(0, 0, VIEW_W, TOP_H);
  ctx.fillStyle = COLORS.panelLine;
  ctx.fillRect(0, TOP_H - 1, VIEW_W, 1);

  ctx.textBaseline = 'middle';
  ctx.textAlign = 'left';
  ctx.fillStyle = COLORS.lootCoin;
  ctx.font = 'bold 15px system-ui, sans-serif';
  ctx.fillText(`◆ ${level.name}`, 14, TOP_H / 2 + 1);

  ctx.fillStyle = COLORS.text;
  ctx.font = '13px system-ui, sans-serif';
  ctx.fillText(`OBJECTIVE: Take ${level.target}, then reach the exit`, 300, TOP_H / 2 + 1);

  const p = world.player;
  ctx.textAlign = 'right';
  ctx.fillStyle = COLORS.lootCoin;
  ctx.font = 'bold 15px system-ui, sans-serif';
  ctx.fillText(`LOOT $${p.lootValue.toLocaleString()}`, 1000, TOP_H / 2 + 1);
  ctx.fillStyle = world.time > level.par ? '#ff8a7a' : COLORS.text;
  ctx.font = 'bold 15px system-ui, sans-serif';
  ctx.fillText(`TIME ${fmtTime(world.time)}`, 1245, TOP_H / 2 + 1);
  ctx.fillStyle = COLORS.muted;
  ctx.font = '11px system-ui, sans-serif';
  ctx.fillText(`PAR ${fmtTime(level.par)}`, 1120, TOP_H / 2 + 1);
}

function detectionState(world) {
  const guards = world.guards;
  if (world.lockdown) return { label: 'LOCKDOWN', color: '#ff4646', sub: 'Every warden is hunting you.' };
  if (guards.some((g) => g.state === 'alert')) return { label: 'ALERT !', color: '#ff4646', sub: 'A warden knows where you are. Run.' };
  if (guards.some((g) => g.state === 'suspicious' || g.state === 'search')) {
    return { label: 'SUSPICIOUS ?', color: '#ffc233', sub: 'Something caught an eye. Freeze.' };
  }
  return { label: 'HIDDEN', color: '#3dff9e', sub: 'No one has seen you. Keep it that way.' };
}

export function drawSidePanel(ctx, world) {
  const x = PANEL_X;
  const w = PANEL_W;
  ctx.fillStyle = COLORS.panel;
  ctx.fillRect(x, TOP_H, w, VIEW_H - TOP_H);
  ctx.fillStyle = COLORS.panelLine;
  ctx.fillRect(x, TOP_H, 1, VIEW_H - TOP_H);

  let y = TOP_H + 14;
  const pad = 16;

  // Detection state
  const det = detectionState(world);
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = COLORS.muted;
  ctx.font = 'bold 11px system-ui, sans-serif';
  ctx.fillText('DETECTION', x + pad, y);
  y += 30;
  ctx.fillStyle = det.color;
  ctx.fillRect(x + pad, y - 20, w - pad * 2, 28);
  ctx.fillStyle = '#0b0e1a';
  ctx.font = 'bold 17px system-ui, sans-serif';
  ctx.fillText(det.label, x + pad + 10, y + 1);
  y += 24;
  ctx.fillStyle = COLORS.text;
  ctx.font = '12px system-ui, sans-serif';
  ctx.fillText(det.sub, x + pad, y);
  y += 26;

  // Alarm meter — the big one.
  ctx.fillStyle = COLORS.muted;
  ctx.font = 'bold 11px system-ui, sans-serif';
  ctx.fillText('ALARM', x + pad, y);
  const alarmWord = world.alarm < 25 ? 'QUIET' : world.alarm < 55 ? 'RISING' : world.alarm < 85 ? 'HOT' : 'LOCKDOWN';
  ctx.textAlign = 'right';
  ctx.fillStyle = world.alarm < 55 ? COLORS.alarmLow : world.alarm < 85 ? COLORS.alarmMid : COLORS.alarmHigh;
  ctx.font = 'bold 12px system-ui, sans-serif';
  ctx.fillText(`${alarmWord}  ${Math.floor(world.alarm)}%`, x + w - pad, y);
  ctx.textAlign = 'left';
  y += 8;
  ctx.fillStyle = '#232848';
  ctx.fillRect(x + pad, y, w - pad * 2, 16);
  const aw = (w - pad * 2) * clamp(world.alarm / 100, 0, 1);
  ctx.fillStyle = world.alarm < 55 ? COLORS.alarmLow : world.alarm < 85 ? COLORS.alarmMid : COLORS.alarmHigh;
  ctx.fillRect(x + pad, y, aw, 16);
  // tick marks at 25/55/85
  ctx.fillStyle = 'rgba(0,0,0,0.5)';
  for (const t of [0.25, 0.55, 0.85]) ctx.fillRect(x + pad + (w - pad * 2) * t, y, 1, 16);
  y += 34;

  // Visibility + noise rows
  const p = world.player;
  const visWord = p.crouchedInCover ? 'HIDDEN' : p.inLight ? 'IN LIGHT' : p.sneaking ? 'IN SHADOW' : 'EXPOSED';
  const visColor = p.crouchedInCover ? COLORS.alarmLow : p.inLight ? COLORS.alarmHigh : COLORS.alarmMid;
  row(ctx, x + pad, y, 'VISIBILITY', visWord, visColor); y += 22;
  const noiseWord = p.sprinting ? 'LOUD' : p.moving ? 'QUIET' : 'SILENT';
  row(ctx, x + pad, y, 'NOISE', noiseWord, p.sprinting ? COLORS.alarmHigh : COLORS.alarmLow); y += 22;
  y += 6;

  // Loot / spotted / goal
  ctx.fillStyle = COLORS.muted;
  ctx.font = 'bold 11px system-ui, sans-serif';
  ctx.fillText('LOOT', x + pad, y);
  ctx.fillStyle = COLORS.lootCoin;
  ctx.font = 'bold 16px system-ui, sans-serif';
  ctx.fillText(`$${p.lootValue.toLocaleString()}`, x + pad, y + 20);
  ctx.textAlign = 'right';
  ctx.fillStyle = COLORS.muted;
  ctx.font = 'bold 11px system-ui, sans-serif';
  ctx.fillText('SPOTTED', x + w - pad - 60, y);
  ctx.fillStyle = COLORS.text;
  ctx.font = 'bold 16px system-ui, sans-serif';
  ctx.fillText(String(p.spotted), x + w - pad, y + 20);
  ctx.textAlign = 'left';
  y += 44;
  ctx.fillStyle = COLORS.muted;
  ctx.font = 'bold 11px system-ui, sans-serif';
  ctx.fillText('TARGET', x + pad, y);
  ctx.fillStyle = p.hasTarget ? COLORS.lootTarget : COLORS.text;
  ctx.font = 'bold 14px system-ui, sans-serif';
  ctx.fillText(p.hasTarget ? `✓ ${world.level.target}` : world.level.target, x + pad + 62, y);
  y += 26;
  ctx.fillStyle = COLORS.muted;
  ctx.font = 'bold 11px system-ui, sans-serif';
  ctx.fillText('GOAL', x + pad, y);
  ctx.fillStyle = p.hasTarget ? COLORS.exit : COLORS.text;
  ctx.font = 'bold 14px system-ui, sans-serif';
  ctx.fillText(p.hasTarget ? 'REACH THE EXIT' : 'NOT YET', x + pad + 62, y);
  y += 30;

  // Gadgets
  ctx.fillStyle = COLORS.muted;
  ctx.font = 'bold 11px system-ui, sans-serif';
  ctx.fillText('GADGETS  (tools cost — spend them well)', x + pad, y);
  y += 22;
  const g = world.gadgets;
  gadgetRow(ctx, x + pad, y, 'COIN', 'CLICK to throw — lures a warden', g.coin); y += 20;
  gadgetRow(ctx, x + pad, y, 'SMOKE', 'Q — breaks every line of sight', g.smoke); y += 20;
  gadgetRow(ctx, x + pad, y, 'EMP', 'E — kills cameras + lasers, +8 alarm', g.emp); y += 30;

  // Legend
  ctx.fillStyle = COLORS.muted;
  ctx.font = 'bold 11px system-ui, sans-serif';
  ctx.fillText('LEGEND', x + pad, y);
  y += 20;
  legendRow(ctx, x + pad, y, '#ff8a3c', 'Warden + vision cone'); y += 18;
  legendRow(ctx, x + pad, y, '#7fb2ff', 'Camera + sweep cone'); y += 18;
  legendRow(ctx, x + pad, y, '#ff3c50', 'Laser gate (pulses — time it)'); y += 18;
  legendRow(ctx, x + pad, y, '#2e5d43', 'Low cover: sneak to hide'); y += 18;
  legendRow(ctx, x + pad, y, '#6b4f2a', 'Crate: blocks sight'); y += 18;
  legendRow(ctx, x + pad, y, '#ffcf7d', 'Lamp light: you are seen'); y += 18;
  legendRow(ctx, x + pad, y, '#ffe9a8', 'Target loot — the heist itself'); y += 18;
  legendRow(ctx, x + pad, y, '#3dff9e', 'Exit — getaway'); y += 28;

  // Controls
  ctx.fillStyle = COLORS.muted;
  ctx.font = 'bold 11px system-ui, sans-serif';
  ctx.fillText('CONTROLS', x + pad, y);
  y += 18;
  ctx.fillStyle = COLORS.text;
  ctx.font = '12px system-ui, sans-serif';
  ctx.fillText('WASD / arrows — move    SHIFT — sneak (silent)', x + pad, y); y += 17;
  ctx.fillText('SPACE — sprint (loud)    E — EMP / crack safe', x + pad, y); y += 17;
  ctx.fillText('CLICK — throw coin    Q — smoke    M — mute', x + pad, y); y += 17;
  ctx.fillText('ESC — pause    ENTER — start / next heist', x + pad, y);
}

function row(ctx, x, y, label, value, color) {
  ctx.fillStyle = COLORS.muted;
  ctx.font = 'bold 11px system-ui, sans-serif';
  ctx.fillText(label, x, y);
  ctx.fillStyle = color;
  ctx.font = 'bold 12px system-ui, sans-serif';
  ctx.fillText(value, x + 110, y);
}

function gadgetRow(ctx, x, y, name, desc, count) {
  ctx.fillStyle = count > 0 ? COLORS.text : COLORS.muted;
  ctx.font = 'bold 12px system-ui, sans-serif';
  ctx.fillText(`${name} ×${count}`, x, y);
  ctx.fillStyle = COLORS.muted;
  ctx.font = '12px system-ui, sans-serif';
  ctx.fillText(desc, x + 88, y);
}

function legendRow(ctx, x, y, color, text) {
  ctx.fillStyle = color;
  ctx.fillRect(x, y - 10, 12, 12);
  ctx.fillStyle = COLORS.text;
  ctx.font = '12px system-ui, sans-serif';
  ctx.fillText(text, x + 20, y);
}

// ---- Screens ----------------------------------------------------------

function dim(ctx) {
  ctx.fillStyle = 'rgba(5, 7, 16, 0.82)';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
}

function centerText(ctx, text, y, font, color) {
  ctx.font = font;
  ctx.fillStyle = color;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, VIEW_W / 2, y);
}

export function drawTitle(ctx, world) {
  dim(ctx);
  centerText(ctx, '◆  GILT  ◆', 150, 'bold 64px system-ui, sans-serif', COLORS.lootCoin);
  centerText(ctx, 'THE AURUM GALLERY HEIST', 210, 'bold 26px system-ui, sans-serif', COLORS.text);
  centerText(ctx, 'Six heists. One thief. The Aurum Star waits in the Grand Vault.', 250, '16px system-ui, sans-serif', COLORS.muted);
  centerText(ctx, 'Steal the target of each gallery, grab what else you can carry,', 300, '15px system-ui, sans-serif', COLORS.text);
  centerText(ctx, 'and reach the exit before the alarm does you in.', 324, '15px system-ui, sans-serif', COLORS.text);
  centerText(ctx, 'WASD move · SHIFT sneak · SPACE sprint · CLICK throw coin · Q smoke · E EMP / crack safe', 380, '14px system-ui, sans-serif', COLORS.muted);
  centerText(ctx, 'Cones are sight. Lamp light betrays you. Planters hide a crouched thief.', 404, '14px system-ui, sans-serif', COLORS.muted);
  centerText(ctx, '— PRESS ENTER TO BEGIN —', 470, 'bold 18px system-ui, sans-serif', COLORS.exit);
  centerText(ctx, 'Best rating: GHOST — never seen, never heard, gone with everything.', 520, '13px system-ui, sans-serif', COLORS.lootCoin);
  void world;
}

export function drawHeistSelect(ctx, world) {
  dim(ctx);
  centerText(ctx, 'CHOOSE YOUR HEIST', 110, 'bold 34px system-ui, sans-serif', COLORS.text);
  const best = world.game.bestRatings;
  world.levels.forEach((lv, i) => {
    const y = 170 + i * 72;
    const unlocked = i === 0 || best[i - 1];
    ctx.fillStyle = unlocked ? '#141a38' : '#0d1122';
    ctx.fillRect(VIEW_W / 2 - 320, y - 26, 640, 56);
    ctx.strokeStyle = world.game.selectedLevel === i ? COLORS.lootCoin : COLORS.panelLine;
    ctx.lineWidth = world.selectedLevel === i ? 2 : 1;
    ctx.strokeRect(VIEW_W / 2 - 320, y - 26, 640, 56);
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = unlocked ? COLORS.text : COLORS.muted;
    ctx.font = 'bold 16px system-ui, sans-serif';
    ctx.fillText(`${i + 1}. ${lv.name}`, VIEW_W / 2 - 300, y - 6);
    ctx.fillStyle = COLORS.muted;
    ctx.font = '13px system-ui, sans-serif';
    ctx.fillText(`Target: ${lv.target}  ·  Par ${Math.floor(lv.par / 60)}:${String(lv.par % 60).padStart(2, '0')}  ·  ${lv.guards.length} wardens, ${lv.cameras.length} cameras, ${lv.lasers.length} lasers`, VIEW_W / 2 - 300, y + 14);
    ctx.textAlign = 'right';
    ctx.fillStyle = best[i] ? COLORS.lootCoin : COLORS.muted;
    ctx.font = 'bold 15px system-ui, sans-serif';
    ctx.fillText(best[i] ? `★ ${best[i]}` : unlocked ? '—' : 'LOCKED', VIEW_W / 2 + 300, y);
  });
  centerText(ctx, 'UP / DOWN to choose · ENTER to play · 1–6 to jump', 620, '14px system-ui, sans-serif', COLORS.muted);
}

export function drawPaused(ctx) {
  dim(ctx);
  centerText(ctx, 'PAUSED', 300, 'bold 44px system-ui, sans-serif', COLORS.text);
  centerText(ctx, 'The gallery waits. The wardens do not move. Breathe.', 360, '16px system-ui, sans-serif', COLORS.muted);
  centerText(ctx, 'ESC — resume    R — restart heist    T — heist select', 420, '15px system-ui, sans-serif', COLORS.text);
}

export function drawCaught(ctx, world) {
  dim(ctx);
  centerText(ctx, 'CAUGHT', 240, 'bold 56px system-ui, sans-serif', '#ff4646');
  centerText(ctx, 'A warden has you by the collar. The Aurum Star stays in its case.', 300, '16px system-ui, sans-serif', COLORS.text);
  centerText(ctx, `You carried $${world.player.lootValue.toLocaleString()} — the gallery keeps it.`, 340, '15px system-ui, sans-serif', COLORS.muted);
  centerText(ctx, 'ENTER — try the heist again    T — heist select', 420, 'bold 16px system-ui, sans-serif', COLORS.exit);
}

export function drawComplete(ctx, world) {
  const p = world.player;
  const level = world.level;
  const underPar = world.time <= level.par;
  const rating = p.spotted === 0 ? 'GHOST' : p.alerted ? 'SEEN' : 'SHADOW';
  const stars = rating === 'GHOST' && world.lootGot === world.lootTotal && underPar ? 3
    : rating === 'GHOST' ? 2 : 1;
  dim(ctx);
  centerText(ctx, 'THE GETAWAY', 150, 'bold 52px system-ui, sans-serif', COLORS.exit);
  centerText(ctx, `${level.target} is yours. Wren slips into the night.`, 205, '17px system-ui, sans-serif', COLORS.text);
  centerText(ctx, `RATING: ${rating}   ${'★'.repeat(stars)}${'☆'.repeat(3 - stars)}`, 270, 'bold 26px system-ui, sans-serif', COLORS.lootCoin);
  centerText(ctx, `Loot $${p.lootValue.toLocaleString()}  ·  ${world.lootGot}/${world.lootTotal} pieces  ·  Time ${fmtTime(world.time)} (par ${fmtTime(level.par)})`, 320, '16px system-ui, sans-serif', COLORS.text);
  const tip = rating === 'GHOST'
    ? 'Never seen, never heard. The gallery never knew you were there.'
    : rating === 'SHADOW'
      ? 'Seen, but never caught. A warden somewhere is still wondering.'
      : 'The alarm knew your name. Next time, move like smoke.';
  centerText(ctx, tip, 360, '15px system-ui, sans-serif', COLORS.muted);
  const last = world.levelIndex === world.levels.length - 1;
  centerText(ctx, last ? 'THE AURUM STAR IS YOURS — YOU ROBBED THE WHOLE GALLERY.' : 'ENTER — next heist    T — heist select', 440, 'bold 16px system-ui, sans-serif', COLORS.exit);
  if (last) centerText(ctx, 'ENTER — play again    T — heist select', 480, '15px system-ui, sans-serif', COLORS.text);
}

export function drawHelpBar(ctx) {
  ctx.fillStyle = 'rgba(5, 7, 16, 0.6)';
  ctx.fillRect(0, VIEW_H - 24, PANEL_X, 24);
  ctx.fillStyle = COLORS.muted;
  ctx.font = '12px system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText('WASD move · SHIFT sneak · SPACE sprint · CLICK coin · Q smoke · E EMP / crack · ESC pause', 16, VIEW_H - 12);
}
