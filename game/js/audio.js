// GILT — The Aurum Gallery Heist. audio.js
// One job: every sound, synthesized with WebAudio — no audio files. Soft
// footsteps, a coin clink, a pickup chime, a safe's clunk, the alarm's
// two-tone wail and a low gallery hum. Mute with M; nothing plays before
// the first user gesture.

export class AudioEngine {
  constructor() {
    this.ctx = null;
    this.muted = false;
    this.hum = null;
  }

  ensure() {
    if (!this.ctx) {
      try {
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      } catch {
        this.ctx = null;
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
    return this.ctx;
  }

  tone(freq, dur, type, vol, slideTo) {
    if (this.muted) return;
    const ctx = this.ensure();
    if (!ctx) return;
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
    gain.gain.setValueAtTime(vol, t);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(gain).connect(ctx.destination);
    osc.start(t);
    osc.stop(t + dur);
  }

  step(sprinting) {
    this.tone(sprinting ? 140 : 110, 0.06, 'sine', sprinting ? 0.10 : 0.05);
  }

  clink() {
    this.tone(2100, 0.12, 'triangle', 0.12, 1500);
    this.tone(2800, 0.09, 'sine', 0.07);
  }

  pickup() {
    this.tone(880, 0.09, 'sine', 0.10);
    setTimeout(() => this.tone(1318, 0.12, 'sine', 0.10), 70);
  }

  target() {
    [523, 659, 784, 1046].forEach((f, i) =>
      setTimeout(() => this.tone(f, 0.16, 'triangle', 0.12), i * 90));
  }

  safeOpen() {
    this.tone(180, 0.18, 'square', 0.08, 90);
    setTimeout(() => this.tone(660, 0.1, 'sine', 0.10), 140);
  }

  puff() {
    if (this.muted) return;
    const ctx = this.ensure();
    if (!ctx) return;
    const t = ctx.currentTime;
    const buf = ctx.createBuffer(1, ctx.sampleRate * 0.3, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
    const src = ctx.createBufferSource();
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.16, t);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.3);
    src.buffer = buf;
    src.connect(gain).connect(ctx.destination);
    src.start(t);
  }

  zap() {
    this.tone(1200, 0.25, 'sawtooth', 0.07, 200);
  }

  alarm() {
    this.tone(740, 0.22, 'square', 0.06, 740);
    setTimeout(() => this.tone(554, 0.22, 'square', 0.06, 554), 240);
  }

  caught() {
    [392, 311, 233].forEach((f, i) =>
      setTimeout(() => this.tone(f, 0.22, 'sawtooth', 0.09), i * 160));
  }

  win() {
    [523, 659, 784, 1046, 1318].forEach((f, i) =>
      setTimeout(() => this.tone(f, 0.2, 'triangle', 0.11), i * 110));
  }

  startHum() {
    if (this.muted) return;
    const ctx = this.ensure();
    if (!ctx || this.hum) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = 55;
    gain.gain.value = 0.02;
    osc.connect(gain).connect(ctx.destination);
    osc.start();
    this.hum = { osc, gain };
  }

  toggleMute() {
    this.muted = !this.muted;
    if (this.hum) this.hum.gain.gain.value = this.muted ? 0 : 0.02;
    return this.muted;
  }
}
