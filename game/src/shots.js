// Sizzle & Serve — the screenshot scenes behind ?shot=title|kitchen|rush|serve.
// Each scene plays the real rules forward from a fresh world for a fixed
// script, steered by a simple pilot (walk to a station, use it, wait), so the
// frame is what a short game really looks like and the same seed always
// gives the same frame.
import { CHOP_SECONDS, STEP } from './config.js';
import {
  EVENT_OVER,
  SCREEN_OVER,
  SCREEN_PLAY,
  SCREEN_TITLE,
  interact,
  resetWorld,
  stationCenter,
  stepWorld,
} from './world.js';
import { STATION_BY_ID } from './config.js';

const SAMPLE = STEP;

/** Walk the chef toward `point` until close, or the step budget runs out. */
function driveTo(world, point, maxSeconds = 25) {
  const limit = Math.floor(maxSeconds / SAMPLE);
  for (let i = 0; i < limit; i += 1) {
    const dx = point.x - world.chef.x;
    const dy = point.y - world.chef.y;
    const d = Math.hypot(dx, dy);
    if (d < 48) return true;
    const ev = stepWorld(world, { x: dx / d, y: dy / d, interact: false, chopHeld: false }, SAMPLE);
    if (ev & EVENT_OVER) return false;
  }
  return false;
}

function idle(world, seconds) {
  const limit = Math.floor(seconds / SAMPLE);
  for (let i = 0; i < limit; i += 1) {
    const ev = stepWorld(world, { x: 0, y: 0, interact: false, chopHeld: false }, SAMPLE);
    if (ev & EVENT_OVER) return false;
  }
  return true;
}

/** Go to a station and press interact once. */
function useStation(world, id) {
  const station = STATION_BY_ID[id];
  if (!driveTo(world, stationCenter(station))) return false;
  interact(world);
  idle(world, 0.2);
  return true;
}

/** Go to the chopping board and hold E until the carried veg is chopped. */
function chopAtBoard(world) {
  const station = STATION_BY_ID.board;
  if (!driveTo(world, stationCenter(station))) return false;
  const limit = Math.floor((CHOP_SECONDS + 0.5) / SAMPLE);
  for (let i = 0; i < limit; i += 1) {
    stepWorld(world, { x: 0, y: 0, interact: false, chopHeld: true }, SAMPLE);
    if (!world.chef.chopping && world.carry.some((c) => c === 'lettuce' || c === 'tomato')) break;
    if (!world.carry.some((c) => c === 'lettuce_raw' || c === 'tomato_raw')) break;
  }
  return true;
}

/** Grill one patty and bring it back cooked: crate, grill, wait, take. */
function grillPatty(world) {
  useStation(world, 'patty');
  useStation(world, 'grill');
  idle(world, 6);
  useStation(world, 'grill');
}

/** Build a Classic Burger on the plate: patty, bun, lettuce. */
function buildClassic(world) {
  grillPatty(world);
  useStation(world, 'bun');
  useStation(world, 'plate');
  useStation(world, 'plate');
  useStation(world, 'lettuce');
  chopAtBoard(world);
  useStation(world, 'plate');
}

/** Start fries in the fryer and leave them cooking. */
function startFries(world) {
  useStation(world, 'fryer');
}

function startGrill(world) {
  useStation(world, 'patty');
  useStation(world, 'grill');
}

/**
 * Set `world` to the named scene (title, kitchen, rush or serve; any other
 * name is title) and return the screen to draw over it and the best score
 * to show.
 */
export function stageShot(name, world) {
  resetWorld(world);
  if (name === 'kitchen') {
    buildClassic(world);
    // Chef carries a tomato toward the plate: the dish is mid-assembly.
    useStation(world, 'tomato');
    // Fresh grill and fryer, mid-cook, so the kitchen reads as busy.
    startGrill(world);
    startFries(world);
    driveTo(world, { x: 640, y: 400 });
    return { screen: SCREEN_PLAY, best: 0 };
  }
  if (name === 'rush') {
    buildClassic(world);
    // Serve it, then dawdle: two tickets expire, the third runs low, and the
    // chef is back at the board chopping for the next order.
    useStation(world, 'window');
    idle(world, 30);
    startGrill(world);
    useStation(world, 'lettuce');
    chopAtBoard(world);
    return { screen: SCREEN_PLAY, best: 0 };
  }
  if (name === 'serve') {
    buildClassic(world);
    // Stop at the window with the finished plate: the dish is ready to serve.
    driveTo(world, stationCenter(STATION_BY_ID.window));
    return { screen: SCREEN_PLAY, best: 0 };
  }
  // Title: a lively kitchen behind the title card.
  startFries(world);
  startGrill(world);
  useStation(world, 'bun');
  idle(world, 2);
  world.screen = SCREEN_TITLE;
  return { screen: SCREEN_TITLE, best: 0 };
}

export { SCREEN_OVER, SCREEN_PLAY, SCREEN_TITLE };
