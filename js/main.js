import { initWorld, buildWorld, update, render, getClock } from './world.js';
import { DEFAULT_STATE, TAG_PRESETS, applySlider, applyTag, interpretText } from './moodEngine.js';
import { initAudio, updateAudio, toggleMute } from './audio.js';

let worldState = { ...DEFAULT_STATE };
let canvas;
let animationId;
let initializedAudio = false;
let interpretResultEl;

function init() {
  canvas = document.getElementById('webgl');
  initWorld(canvas);
  setupUI();
  buildWorld(worldState);
  loop();
}

function loop() {
  const delta = getClock().getDelta();
  update(delta, worldState);
  render();
  if (initializedAudio) {
    updateAudio(worldState);
  }
  animationId = requestAnimationFrame(loop);
}

function setupUI() {
  const lifeRange = document.getElementById('lifeRange');
  const lifeValue = document.getElementById('lifeValue');
  const tagsContainer = document.getElementById('tags');
  const interpretBtn = document.getElementById('interpretBtn');
  const vibeText = document.getElementById('vibeText');
  interpretResultEl = document.getElementById('interpretResult');
  const stateDescription = document.getElementById('stateDescription');
  const muteBtn = document.getElementById('muteBtn');

  TAG_PRESETS.forEach((tag) => {
    const btn = document.createElement('button');
    btn.className = 'tag-btn';
    btn.textContent = tag.label;
    btn.addEventListener('click', () => {
      ensureAudio();
      worldState = applyTag(tag.label, worldState);
      vibeText.value = `${tag.label}, ${tag.description || 'reset mood'}`;
      applyStateToUI(lifeRange, lifeValue, stateDescription);
      buildWorld(worldState);
      updateAudio(worldState);
    });
    tagsContainer.appendChild(btn);
  });

  lifeRange.addEventListener('input', () => {
    ensureAudio();
    worldState = applySlider(Number(lifeRange.value), worldState);
    lifeValue.textContent = lifeRange.value;
    buildWorld(worldState);
    updateAudio(worldState);
    stateDescription.textContent = worldState.description;
  });

  interpretBtn.addEventListener('click', () => {
    ensureAudio();
    worldState = interpretText(vibeText.value, worldState);
    applyStateToUI(lifeRange, lifeValue, stateDescription);
    interpretResultEl.textContent = `AI guess: ${worldState.description}`;
    buildWorld(worldState);
    updateAudio(worldState);
  });

  muteBtn.addEventListener('click', () => {
    ensureAudio();
    const muted = toggleMute();
    muteBtn.textContent = muted ? '🔇 Unmute' : '🔈 Mute / Unmute';
  });

  // initial description
  stateDescription.textContent = worldState.description;
  lifeValue.textContent = worldState.lifeLevel;
  interpretResultEl.textContent = '';
}

function applyStateToUI(lifeRange, lifeValue, stateDescription) {
  lifeRange.value = worldState.lifeLevel;
  lifeValue.textContent = worldState.lifeLevel;
  stateDescription.textContent = worldState.description;
}

function ensureAudio() {
  if (!initializedAudio) {
    initAudio();
    updateAudio(worldState);
    initializedAudio = true;
  }
}

window.addEventListener('DOMContentLoaded', init);

// Graceful cleanup if needed
window.addEventListener('beforeunload', () => {
  if (animationId) cancelAnimationFrame(animationId);
});
