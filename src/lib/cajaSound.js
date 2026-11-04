// Sound utilities for Cajas Sorpresa — Web Audio API (no external files needed)

let audioCtx = null;

function getCtx() {
  if (!audioCtx) {
    try { audioCtx = new (window.AudioContext || window.webkitAudioContext)(); } catch {}
  }
  return audioCtx;
}

function tone(freq, dur, type = "sine", vol = 0.2) {
  const ctx = getCtx();
  if (!ctx) return;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(vol, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start();
  osc.stop(ctx.currentTime + dur);
}

export function sndClick() {
  tone(800, 0.08, "square", 0.15);
}

export function sndOpen() {
  tone(523, 0.1, "sine", 0.25);
  setTimeout(() => tone(659, 0.1, "sine", 0.25), 100);
  setTimeout(() => tone(784, 0.12, "sine", 0.25), 200);
  setTimeout(() => tone(1047, 0.2, "sine", 0.3), 320);
}

export function sndReward() {
  tone(988, 0.08, "square", 0.2);
  setTimeout(() => tone(1319, 0.15, "square", 0.2), 80);
}

export function sndBigReward() {
  tone(523, 0.1, "sawtooth", 0.2);
  setTimeout(() => tone(659, 0.1, "sawtooth", 0.2), 100);
  setTimeout(() => tone(784, 0.1, "sawtooth", 0.2), 200);
  setTimeout(() => tone(1047, 0.25, "sawtooth", 0.25), 300);
  setTimeout(() => tone(1319, 0.3, "sawtooth", 0.25), 450);
  setTimeout(() => tone(1568, 0.4, "sawtooth", 0.25), 600);
}