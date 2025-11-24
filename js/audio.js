// audio.js
// Lightweight Web Audio ambience that reacts to life level + weather.

let audioCtx;
let masterGain;
let padOsc, padGain;
let noiseNode, noiseGain, noiseFilter;
let bellOsc, bellGain;
let started = false;
let muted = false;

export function initAudio() {
  if (started) return;
  audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  masterGain = audioCtx.createGain();
  masterGain.gain.value = 0.5;
  masterGain.connect(audioCtx.destination);

  // Base pad
  padOsc = audioCtx.createOscillator();
  padGain = audioCtx.createGain();
  padOsc.type = 'sawtooth';
  padOsc.frequency.value = 150;
  padGain.gain.value = 0.08;
  padOsc.connect(padGain).connect(masterGain);
  padOsc.start();

  // Noise layer (rain/storm)
  noiseNode = createNoiseNode(audioCtx);
  noiseFilter = audioCtx.createBiquadFilter();
  noiseFilter.type = 'lowpass';
  noiseFilter.frequency.value = 600;
  noiseGain = audioCtx.createGain();
  noiseGain.gain.value = 0;
  noiseNode.connect(noiseFilter).connect(noiseGain).connect(masterGain);

  // Bell / chime
  bellOsc = audioCtx.createOscillator();
  bellOsc.type = 'triangle';
  bellOsc.frequency.value = 440;
  bellGain = audioCtx.createGain();
  bellGain.gain.value = 0;
  bellOsc.connect(bellGain).connect(masterGain);
  bellOsc.start();

  started = true;
}

export function toggleMute() {
  muted = !muted;
  if (masterGain) masterGain.gain.value = muted ? 0 : 0.5;
  return muted;
}

export function updateAudio(state) {
  if (!started) return;

  // Base pad brightness shifts with life level.
  const tone = 120 + state.lifeLevel * 1.2;
  padOsc.frequency.setTargetAtTime(tone, audioCtx.currentTime, 0.5);
  padGain.gain.setTargetAtTime(0.06 + state.lifeLevel / 2000, audioCtx.currentTime, 0.4);

  // Weather-driven layers
  const weather = state.weather;
  if (weather === 'rain') {
    fade(noiseGain.gain, 0.18, 0.3);
    noiseFilter.frequency.setTargetAtTime(1200, audioCtx.currentTime, 0.2);
    fade(bellGain.gain, 0.02, 1.4);
  } else if (weather === 'storm') {
    fade(noiseGain.gain, 0.32, 0.2);
    noiseFilter.frequency.setTargetAtTime(800, audioCtx.currentTime, 0.2);
    triggerRumble();
    fade(bellGain.gain, 0.01, 1.2);
  } else if (weather === 'snow') {
    fade(noiseGain.gain, 0.06, 0.5);
    noiseFilter.frequency.setTargetAtTime(1800, audioCtx.currentTime, 0.5);
    bellOsc.frequency.setTargetAtTime(640, audioCtx.currentTime, 0.4);
    fade(bellGain.gain, 0.05, 0.8);
  } else if (weather === 'night') {
    fade(noiseGain.gain, 0.02, 0.6);
    bellOsc.frequency.setTargetAtTime(520, audioCtx.currentTime, 0.4);
    fade(bellGain.gain, 0.08, 0.6);
  } else {
    fade(noiseGain.gain, 0.04, 0.6);
    bellOsc.frequency.setTargetAtTime(720, audioCtx.currentTime, 0.4);
    fade(bellGain.gain, 0.03, 0.8);
  }
}

function triggerRumble() {
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = 'sine';
  osc.frequency.value = 60;
  gain.gain.value = 0.01;
  osc.connect(gain).connect(masterGain);
  osc.start();
  gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.8);
  osc.stop(audioCtx.currentTime + 0.8);
}

function fade(param, value, time = 0.4) {
  param.setTargetAtTime(value, audioCtx.currentTime, time);
}

function createNoiseNode(ctx) {
  const bufferSize = 2 * ctx.sampleRate;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1;
  }
  const noise = ctx.createBufferSource();
  noise.buffer = buffer;
  noise.loop = true;
  noise.start();
  return noise;
}
