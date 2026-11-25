// Sizzle & Serve — the kitchen itself. One clear job: the whole game state
// (chef, tickets, grill, fryer, plate, coins) and every rule that changes it.
import {
  CHEF_RADIUS,
  CHEF_SPEED,
  CHOP_SECONDS,
  FRIES_BURN_SECONDS,
  FRIES_COOK_SECONDS,
  GRILL_SLOTS,
  ING,
  INTERACT_RANGE,
  MAX_CARRY,
  MAX_STRIKES,
  MAX_TICKETS,
  PATY_BURN_SECONDS,
  PATY_COOK_SECONDS,
  RECIPES,
  SHIFT_SECONDS,
  STATION_BY_ID,
  STATIONS,
  patienceFor,
  spawnGapFor,
} from './config.js';
import { mulberry32, pickWeighted as pick } from './random.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_OVER = 'over';

export const EVENT_NONE = 0;
export const EVENT_SERVED = 1;
export const EVENT_MISSED = 2;
export const EVENT_OVER = 4;
export const EVENT_WRONG = 8;
export const EVENT_CHOPPED = 16;
export const EVENT_ACTION = 32;

function stationCenter(station) {
  return { x: station.x + station.w / 2, y: station.y + station.h + 26 };
}

function newTicket(world, recipe) {
  return {
    id: world.nextTicketId,
    recipe,
    patience: patienceFor(world.elapsed),
    maxPatience: patienceFor(world.elapsed),
    born: world.elapsed,
  };
}

function spawnTicket(world) {
  if (world.tickets.length >= MAX_TICKETS) return;
  // Early on only the simple recipes appear; the fancy ones join later.
  const pool = RECIPES.filter((r) => world.elapsed >= 45 || r.id === 'classic' || r.id === 'cheese' || r.id === 'fries');
  world.tickets.push(newTicket(world, pick(world.rng, pool)));
  world.nextTicketId += 1;
}

export function createWorld(seed) {
  const world = {
    rng: mulberry32(seed),
    seed,
    elapsed: 0,
    timeLeft: SHIFT_SECONDS,
    screen: SCREEN_TITLE,
    chef: { x: 640, y: 380, dir: 1, moving: false, chop: 0, chopping: null },
    carry: [],
    plate: [],
    grill: Array.from({ length: GRILL_SLOTS }, () => null),
    fryer: null,
    tickets: [],
    nextTicketId: 1,
    coins: 0,
    served: 0,
    missed: 0,
    strikes: 0,
    combo: 0,
    bestCombo: 0,
    earned: 0,
    spawnIn: 6,
    floats: [],
    flash: 0,
    over: false,
    won: false,
    muted: false,
  };
  return world;
}

export function resetWorld(world) {
  const fresh = createWorld(world.seed);
  Object.assign(world, fresh);
  world.screen = SCREEN_PLAY;
  spawnTicket(world);
  spawnTicket(world);
  world.spawnIn = spawnGapFor(0);
}

function addFloat(world, x, y, text, color) {
  world.floats.push({ x, y, text, color, life: 1.4 });
}

function countOf(list, id) {
  let n = 0;
  for (const item of list) if (item === id) n += 1;
  return n;
}

function sameMultiset(a, b) {
  if (a.length !== b.length) return false;
  const rest = [...b];
  for (const item of a) {
    const i = rest.indexOf(item);
    if (i < 0) return false;
    rest.splice(i, 1);
  }
  return true;
}

function plateMatchesTicket(plate, recipe) {
  return sameMultiset(plate, recipe.needs);
}

function ticketForPlate(world) {
  for (const ticket of world.tickets) {
    if (!ticket.recipe.side && plateMatchesTicket(world.plate, ticket.recipe)) return ticket;
  }
  return null;
}

function ticketForFries(world) {
  for (const ticket of world.tickets) {
    if (ticket.recipe.side) return ticket;
  }
  return null;
}

function serveTicket(world, ticket, x, y) {
  const tip = Math.round(ticket.recipe.price * 0.5 * (ticket.patience / ticket.maxPatience));
  const comboBonus = Math.min(world.combo, 5);
  const total = ticket.recipe.price + tip + comboBonus;
  world.coins += total;
  world.earned += total;
  world.served += 1;
  world.combo += 1;
  world.bestCombo = Math.max(world.bestCombo, world.combo);
  world.tickets = world.tickets.filter((t) => t !== ticket);
  addFloat(world, x, y, `+$${total}`, '#ffd94d');
  if (comboBonus > 0) addFloat(world, x, y + 22, `combo +$${comboBonus}`, '#7ec850');
  return EVENT_SERVED;
}

function missTicket(world, ticket) {
  world.tickets = world.tickets.filter((t) => t !== ticket);
  world.missed += 1;
  world.strikes += 1;
  world.combo = 0;
  world.flash = 0.5;
  addFloat(world, 640, 130, 'Order missed!', '#ff5a4e');
  if (world.strikes >= MAX_STRIKES) return EVENT_OVER;
  return EVENT_MISSED;
}

function nearestStation(world) {
  let best = null;
  let bestD = Infinity;
  for (const station of STATIONS) {
    const c = stationCenter(station);
    const dx = world.chef.x - c.x;
    const dy = world.chef.y - c.y;
    const d = Math.hypot(dx, dy);
    if (d < bestD) {
      bestD = d;
      best = station;
    }
  }
  return bestD <= INTERACT_RANGE ? best : null;
}

function canCarry(world) {
  return world.carry.length < MAX_CARRY;
}

function take(world, id) {
  if (!canCarry(world)) return false;
  world.carry.push(id);
  return true;
}

function chopTarget(world) {
  if (world.carry.includes(ING.LETTUCE_RAW)) return ING.LETTUCE_RAW;
  if (world.carry.includes(ING.TOMATO_RAW)) return ING.TOMATO_RAW;
  return null;
}

// One press of the interact key (or a click on a station): do what the
// nearest station does with what the chef is carrying. Returns an event
// bitmask: EVENT_ACTION when something happened, plus EVENT_SERVED,
// EVENT_WRONG or EVENT_OVER when the serve window settles an order.
export function interact(world) {
  const station = nearestStation(world);
  if (!station) return EVENT_NONE;
  const ok = (done) => (done ? EVENT_ACTION : EVENT_NONE);
  switch (station.id) {
    case 'bun':
      return ok(take(world, ING.BUN));
    case 'patty':
      return ok(take(world, ING.PATTY));
    case 'lettuce':
      return ok(take(world, ING.LETTUCE_RAW));
    case 'tomato':
      return ok(take(world, ING.TOMATO_RAW));
    case 'cheese':
      return ok(take(world, ING.CHEESE));
    case 'sauce':
      return ok(take(world, ING.SAUCE));
    case 'grill': {
      // Take a cooked patty first; otherwise put a raw one on a free slot.
      for (let i = 0; i < world.grill.length; i += 1) {
        const slot = world.grill[i];
        if (slot && slot.state === 'done' && canCarry(world)) {
          world.carry.push(ING.PATTY_COOKED);
          world.grill[i] = null;
          return EVENT_ACTION;
        }
      }
      for (let i = 0; i < world.grill.length; i += 1) {
        const slot = world.grill[i];
        if (slot && slot.state === 'burnt' && canCarry(world)) {
          world.carry.push(ING.PATTY_BURNT);
          world.grill[i] = null;
          return EVENT_ACTION;
        }
      }
      const raw = world.carry.indexOf(ING.PATTY);
      if (raw >= 0) {
        for (let i = 0; i < world.grill.length; i += 1) {
          if (!world.grill[i]) {
            world.grill[i] = { state: 'cooking', t: 0 };
            world.carry.splice(raw, 1);
            return EVENT_ACTION;
          }
        }
      }
      return EVENT_NONE;
    }
    case 'fryer': {
      if (world.fryer && world.fryer.state !== 'cooking' && canCarry(world)) {
        world.carry.push(world.fryer.state === 'done' ? ING.FRIES_COOKED : ING.FRIES_BURNT);
        world.fryer = null;
        return EVENT_ACTION;
      }
      if (!world.fryer) {
        world.fryer = { state: 'cooking', t: 0 };
        return EVENT_ACTION;
      }
      return EVENT_NONE;
    }
    case 'board': {
      // Chopping starts on hold, not on press; a press here does nothing.
      return ok(chopTarget(world) !== null);
    }
    case 'plate': {
      if (world.carry.length > 0) {
        // Cooked food and buns go on the plate; raw food does not.
        const item = world.carry[world.carry.length - 1];
        if (item === ING.PATTY || item === ING.LETTUCE_RAW || item === ING.TOMATO_RAW || item.endsWith('_burnt')) return EVENT_NONE;
        world.plate.push(world.carry.pop());
        return EVENT_ACTION;
      }
      if (world.plate.length > 0 && canCarry(world)) {
        world.carry.push(world.plate.pop());
        return EVENT_ACTION;
      }
      return EVENT_NONE;
    }
    case 'window': {
      if (world.plate.length > 0) {
        const ticket = ticketForPlate(world);
        if (ticket) {
          const done = serveTicket(world, ticket, station.x + station.w / 2, station.y);
          world.plate = [];
          return done | EVENT_ACTION;
        }
        // Wrong dish: strike, the plate is binned.
        world.strikes += 1;
        world.combo = 0;
        world.flash = 0.5;
        world.plate = [];
        addFloat(world, station.x + station.w / 2, station.y, 'Wrong dish!', '#ff5a4e');
        if (world.strikes >= MAX_STRIKES) return EVENT_WRONG | EVENT_OVER | EVENT_ACTION;
        return EVENT_WRONG | EVENT_ACTION;
      }
      if (world.carry.includes(ING.FRIES_COOKED)) {
        const ticket = ticketForFries(world);
        if (ticket) {
          world.carry.splice(world.carry.indexOf(ING.FRIES_COOKED), 1);
          return serveTicket(world, ticket, station.x + station.w / 2, station.y) | EVENT_ACTION;
        }
      }
      return EVENT_NONE;
    }
    case 'trash': {
      if (world.carry.length > 0) {
        world.carry = [];
        return EVENT_ACTION;
      }
      if (world.plate.length > 0) {
        world.plate = [];
        return EVENT_ACTION;
      }
      return EVENT_NONE;
    }
    default:
      return EVENT_NONE;
  }
}

function moveChef(world, dx, dy, dt) {
  const chef = world.chef;
  const len = Math.hypot(dx, dy);
  if (len < 0.01) {
    chef.moving = false;
    return;
  }
  chef.moving = true;
  chef.dir = dx < -0.1 ? -1 : dx > 0.1 ? 1 : chef.dir;
  let nx = chef.x + (dx / len) * CHEF_SPEED * dt;
  let ny = chef.y + (dy / len) * CHEF_SPEED * dt;
  nx = Math.max(40 + CHEF_RADIUS, Math.min(1240 - CHEF_RADIUS, nx));
  ny = Math.max(270, Math.min(700 - CHEF_RADIUS, ny));
  // Do not walk through a station: push the chef out of its rect.
  for (const station of STATIONS) {
    const pad = CHEF_RADIUS - 4;
    if (nx > station.x - pad && nx < station.x + station.w + pad && ny > station.y - pad && ny < station.y + station.h + pad) {
      const left = station.x - pad - nx;
      const right = station.x + station.w + pad - nx;
      const top = station.y - pad - ny;
      const bottom = station.y + station.h + pad - ny;
      const m = Math.min(Math.abs(left), Math.abs(right), Math.abs(top), Math.abs(bottom));
      if (m === Math.abs(left)) nx += left;
      else if (m === Math.abs(right)) nx += right;
      else if (m === Math.abs(top)) ny += top;
      else ny += bottom;
    }
  }
  chef.x = nx;
  chef.y = ny;
}

// One fixed step of the game. `input` is {x, y, interact, chopHeld}.
// Returns an event bitmask for sounds and screens.
export function stepWorld(world, input, dt) {
  let events = EVENT_NONE;
  if (world.screen !== SCREEN_PLAY) return events;
  world.elapsed += dt;
  world.timeLeft = Math.max(0, SHIFT_SECONDS - world.elapsed);
  if (world.flash > 0) world.flash = Math.max(0, world.flash - dt);
  for (const f of world.floats) {
    f.y -= 28 * dt;
    f.life -= dt;
  }
  world.floats = world.floats.filter((f) => f.life > 0);

  moveChef(world, input.x, input.y, dt);

  // Chopping: hold near the board while carrying raw veg.
  const near = nearestStation(world);
  const target = chopTarget(world);
  if (near && near.id === 'board' && target && input.chopHeld) {
    world.chef.chopping = target;
    world.chef.chop += dt;
    if (world.chef.chop >= CHOP_SECONDS) {
      const i = world.carry.indexOf(target);
      world.carry.splice(i, 1);
      world.carry.push(target === ING.LETTUCE_RAW ? ING.LETTUCE : ING.TOMATO);
      world.chef.chop = 0;
      world.chef.chopping = null;
      events |= EVENT_CHOPPED;
    }
  } else {
    world.chef.chop = 0;
    world.chef.chopping = null;
  }

  // Grill slots cook, then burn.
  for (let i = 0; i < world.grill.length; i += 1) {
    const slot = world.grill[i];
    if (!slot) continue;
    slot.t += dt;
    if (slot.state === 'cooking' && slot.t >= PATY_COOK_SECONDS) {
      slot.state = 'done';
      slot.t = 0;
    } else if (slot.state === 'done' && slot.t >= PATY_BURN_SECONDS) {
      slot.state = 'burnt';
      slot.t = 0;
    }
  }
  if (world.fryer) {
    world.fryer.t += dt;
    if (world.fryer.state === 'cooking' && world.fryer.t >= FRIES_COOK_SECONDS) {
      world.fryer.state = 'done';
      world.fryer.t = 0;
    } else if (world.fryer.state === 'done' && world.fryer.t >= FRIES_BURN_SECONDS) {
      world.fryer.state = 'burnt';
      world.fryer.t = 0;
    }
  }

  // Tickets lose patience; an expired one is a strike.
  for (const ticket of [...world.tickets]) {
    ticket.patience -= dt;
    if (ticket.patience <= 0) {
      const ev = missTicket(world, ticket);
      events |= ev;
      if (ev & EVENT_OVER) break;
    }
  }
  if (events & EVENT_OVER) {
    world.screen = SCREEN_OVER;
    world.over = true;
    world.won = world.served >= 5;
    return events;
  }

  // New tickets arrive on a timer.
  world.spawnIn -= dt;
  if (world.spawnIn <= 0) {
    spawnTicket(world);
    world.spawnIn = spawnGapFor(world.elapsed);
  }

  if (world.timeLeft <= 0) {
    world.screen = SCREEN_OVER;
    world.over = true;
    world.won = world.served >= 5;
    events |= EVENT_OVER;
  }
  return events;
}

export { STATION_BY_ID, stationCenter, nearestStation, countOf, ticketForPlate };
