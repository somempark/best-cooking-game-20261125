// Sizzle & Serve — the game loop and screens. One clear job: run the world
// at a fixed step, feed it the player's input, play the sounds, and draw.
import { STEP, VIEW } from './config.js';
import { createAudio } from './audio.js';
import { createInput } from './input.js';
import { drawWorld } from './render.js';
import { stageShot } from './shots.js';
import {
  EVENT_CHOPPED,
  EVENT_MISSED,
  EVENT_OVER,
  EVENT_SERVED,
  EVENT_WRONG,
  SCREEN_OVER,
  SCREEN_PLAY,
  SCREEN_TITLE,
  createWorld,
  interact,
  resetWorld,
  stepWorld,
} from './world.js';

const params = new URLSearchParams(window.location.search);
const shotName = params.get('shot');
const seed = Number(params.get('seed') || '7');

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const status = document.getElementById('status');
const audio = createAudio();
const input = createInput(canvas);
input.toggleMute = () => audio.toggleMute();

const world = createWorld(seed);
let best = 0;
try {
  best = Number(window.localStorage.getItem('sizzle-serve-best') || '0') || 0;
} catch (e) {
  best = 0;
}
let staged = null;
if (shotName) {
  staged = stageShot(shotName, world);
  world.screen = staged.screen;
  best = staged.best;
}

function setStatus(text) {
  if (status) status.textContent = text;
}

function handleEvents(events) {
  if (events & EVENT_SERVED) audio.serve();
  if (events & EVENT_WRONG) audio.wrong();
  if (events & EVENT_MISSED) audio.alarm();
  if (events & EVENT_CHOPPED) audio.chopped();
  if (events & EVENT_OVER) {
    audio.stopSizzle();
    const coins = world.coins;
    if (coins > best) {
      best = coins;
      try {
        window.localStorage.setItem('sizzle-serve-best', String(best));
      } catch (e) {
        // Storage unavailable; the best score just does not persist.
      }
    }
    setStatus(world.won ? `Shift complete! You earned $${coins}.` : `Shift over. You earned $${coins}.`);
  }
}

function startShift() {
  audio.unlock();
  audio.click();
  resetWorld(world);
  setStatus('Shift started. Serve the orders before their patience runs out.');
}

window.addEventListener('keydown', (event) => {
  if (event.code === 'Enter') {
    if (world.screen === SCREEN_TITLE || world.screen === SCREEN_OVER) startShift();
  }
});

let last = performance.now();
let acc = 0;
function frame(now) {
  const dt = Math.min(0.1, (now - last) / 1000);
  last = now;
  if (!shotName && world.screen === SCREEN_PLAY) {
    acc += dt;
    while (acc >= STEP) {
      acc -= STEP;
      const steered = input.steer(world.chef);
      const ev = stepWorld(world, { x: steered.x, y: steered.y, interact: false, chopHeld: input.chopHeld }, STEP);
      handleEvents(ev);
      if (input.consumeInteract()) {
        const ev2 = interact(world);
        handleEvents(ev2);
        if (ev2) audio.pickup();
      }
      // Clicked a station: walk there, then use it.
      if (input.clickStation) {
        const { x, y } = input.clickStation;
        input.clickStation = null;
        const near = Math.hypot(world.chef.x - x, world.chef.y - y) < 120;
        if (near) {
          const ev3 = interact(world);
          handleEvents(ev3);
          if (ev3) audio.pickup();
        }
      }
    }
    // Sizzle while a patty or fries cook.
    const cooking = world.grill.some((s) => s && s.state === 'cooking') || (world.fryer && world.fryer.state === 'cooking');
    if (cooking) audio.startSizzle();
    else audio.stopSizzle();
  } else if (!shotName) {
    // Title and over screens still tick the clock for their pulse.
    world.elapsed += dt;
  }
  drawWorld(ctx, world, best);
  requestAnimationFrame(frame);
}

if (shotName) {
  drawWorld(ctx, world, best);
} else {
  setStatus('Sizzle and Serve. Press Enter to open the stall.');
  requestAnimationFrame(frame);
}
