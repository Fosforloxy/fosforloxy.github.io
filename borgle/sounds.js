// WebAudio-based sound effects for Borgle.
// Synthesized — no audio files needed. Gentle, warm, tuned to not be annoying.

let _audioCtx = null;
function getCtx() {
  if (!_audioCtx) {
    _audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (_audioCtx.state === 'suspended') _audioCtx.resume();
  return _audioCtx;
}

function tone({ freq, dur = 0.2, type = 'sine', gain = 0.12, attack = 0.005, release = 0.1, detune = 0 }) {
  const ctx = getCtx();
  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, now);
  osc.detune.setValueAtTime(detune, now);
  g.gain.setValueAtTime(0, now);
  g.gain.linearRampToValueAtTime(gain, now + attack);
  g.gain.linearRampToValueAtTime(gain, now + Math.max(attack, dur - release));
  g.gain.linearRampToValueAtTime(0, now + dur);
  osc.connect(g).connect(ctx.destination);
  osc.start(now);
  osc.stop(now + dur + 0.02);
}

function playDing() {
  // Warm two-note chime, major third up
  tone({ freq: 784, dur: 0.18, type: 'triangle', gain: 0.09, attack: 0.003, release: 0.1 });
  setTimeout(() => tone({ freq: 988, dur: 0.28, type: 'triangle', gain: 0.09, attack: 0.003, release: 0.18 }), 80);
}

function playBuzz() {
  // Soft downward thud — not sharp
  tone({ freq: 220, dur: 0.18, type: 'sawtooth', gain: 0.06, attack: 0.005, release: 0.1 });
  setTimeout(() => tone({ freq: 165, dur: 0.22, type: 'sawtooth', gain: 0.06, attack: 0.005, release: 0.16 }), 60);
}

function playTick() {
  tone({ freq: 1200, dur: 0.04, type: 'square', gain: 0.02, attack: 0.002, release: 0.03 });
}

function playStart() {
  // Little ascending arpeggio
  [523, 659, 784].forEach((f, i) => {
    setTimeout(() => tone({ freq: f, dur: 0.14, type: 'triangle', gain: 0.07 }), i * 70);
  });
}

function playGameOver() {
  // Descending — softer
  [784, 659, 523, 392].forEach((f, i) => {
    setTimeout(() => tone({ freq: f, dur: 0.22, type: 'triangle', gain: 0.08, release: 0.16 }), i * 140);
  });
}

window.BorgleSounds = { playDing, playBuzz, playTick, playStart, playGameOver };
