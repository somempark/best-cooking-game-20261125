// Sizzle & Serve — tuning, layout and recipes. One clear job: every number
// that defines the game lives here, so the rest of the code reads as rules.
export const VIEW = { width: 1280, height: 720 };
export const STEP = 1 / 60;
export const SHIFT_SECONDS = 150;
export const MAX_TICKETS = 4;
export const MAX_CARRY = 4;
export const CHEF_SPEED = 300;
export const CHEF_RADIUS = 26;
export const INTERACT_RANGE = 110;
export const GRILL_SLOTS = 2;
export const PATY_COOK_SECONDS = 5;
export const PATY_BURN_SECONDS = 8;
export const FRIES_COOK_SECONDS = 6;
export const FRIES_BURN_SECONDS = 8;
export const CHOP_SECONDS = 1.2;
export const MAX_STRIKES = 3;

// Ingredient ids. A dish is a multiset of these; the ticket matches when the
// plate holds exactly the recipe's ingredients, in any order.
export const ING = {
  BUN: 'bun',
  PATTY: 'patty',
  PATTY_COOKED: 'patty_cooked',
  PATTY_BURNT: 'patty_burnt',
  LETTUCE: 'lettuce',
  LETTUCE_RAW: 'lettuce_raw',
  TOMATO: 'tomato',
  TOMATO_RAW: 'tomato_raw',
  CHEESE: 'cheese',
  SAUCE: 'sauce',
  FRIES: 'fries',
  FRIES_COOKED: 'fries_cooked',
  FRIES_BURNT: 'fries_burnt',
};

export const ING_NAME = {
  [ING.BUN]: 'Bun',
  [ING.PATTY]: 'Raw patty',
  [ING.PATTY_COOKED]: 'Patty',
  [ING.PATTY_BURNT]: 'Burnt patty',
  [ING.LETTUCE]: 'Lettuce',
  [ING.LETTUCE_RAW]: 'Lettuce',
  [ING.TOMATO]: 'Tomato',
  [ING.TOMATO_RAW]: 'Tomato',
  [ING.CHEESE]: 'Cheese',
  [ING.SAUCE]: 'Sauce',
  [ING.FRIES]: 'Fries',
  [ING.FRIES_COOKED]: 'Fries',
  [ING.FRIES_BURNT]: 'Burnt fries',
};

// Short label drawn on ingredient chips.
export const ING_SHORT = {
  [ING.BUN]: 'BUN',
  [ING.PATTY_COOKED]: 'PATTY',
  [ING.LETTUCE]: 'LETTUCE',
  [ING.TOMATO]: 'TOMATO',
  [ING.CHEESE]: 'CHEESE',
  [ING.SAUCE]: 'SAUCE',
  [ING.FRIES_COOKED]: 'FRIES',
};

// Colour per ingredient, used by the chips, the plate stack and the tickets.
export const ING_COLOR = {
  [ING.BUN]: '#e8a34c',
  [ING.PATTY]: '#b06a5a',
  [ING.PATTY_COOKED]: '#7a4a2e',
  [ING.PATTY_BURNT]: '#2b2118',
  [ING.LETTUCE]: '#7ec850',
  [ING.LETTUCE_RAW]: '#8fce62',
  [ING.TOMATO]: '#e84a3a',
  [ING.TOMATO_RAW]: '#ef6a55',
  [ING.CHEESE]: '#f7c948',
  [ING.SAUCE]: '#f2e6c9',
  [ING.FRIES]: '#f7c948',
  [ING.FRIES_COOKED]: '#f2b63c',
  [ING.FRIES_BURNT]: '#3a2c1c',
};

export const RECIPES = [
  {
    id: 'classic',
    name: 'Classic Burger',
    needs: [ING.BUN, ING.PATTY_COOKED, ING.LETTUCE],
    price: 8,
    weight: 30,
  },
  {
    id: 'cheese',
    name: 'Cheese Burger',
    needs: [ING.BUN, ING.PATTY_COOKED, ING.CHEESE],
    price: 9,
    weight: 26,
  },
  {
    id: 'garden',
    name: 'Garden Burger',
    needs: [ING.BUN, ING.LETTUCE, ING.TOMATO, ING.CHEESE],
    price: 9,
    weight: 16,
  },
  {
    id: 'deluxe',
    name: 'Deluxe Burger',
    needs: [ING.BUN, ING.PATTY_COOKED, ING.CHEESE, ING.TOMATO, ING.SAUCE],
    price: 12,
    weight: 16,
  },
  {
    id: 'double',
    name: 'Double Stack',
    needs: [ING.BUN, ING.PATTY_COOKED, ING.PATTY_COOKED, ING.CHEESE],
    price: 14,
    weight: 8,
  },
  {
    id: 'fries',
    name: 'Golden Fries',
    needs: [ING.FRIES_COOKED],
    price: 4,
    weight: 12,
    side: true,
  },
];

// Stations: id, label, rect, and the hint shown when the chef is near.
export const STATIONS = [
  { id: 'bun', label: 'Buns', x: 36, y: 148, w: 148, h: 92, hint: 'Take a bun' },
  { id: 'patty', label: 'Patty crate', x: 200, y: 148, w: 148, h: 92, hint: 'Take a raw patty' },
  { id: 'grill', label: 'Grill', x: 364, y: 148, w: 250, h: 100, hint: 'Grill a patty' },
  { id: 'fryer', label: 'Fryer', x: 630, y: 148, w: 168, h: 100, hint: 'Drop fries in' },
  { id: 'lettuce', label: 'Lettuce', x: 814, y: 148, w: 128, h: 92, hint: 'Take lettuce' },
  { id: 'tomato', label: 'Tomatoes', x: 958, y: 148, w: 128, h: 92, hint: 'Take a tomato' },
  { id: 'cheese', label: 'Cheese', x: 1102, y: 148, w: 142, h: 92, hint: 'Take cheese' },
  { id: 'sauce', label: 'Sauce', x: 1102, y: 256, w: 142, h: 84, hint: 'Take sauce' },
  { id: 'board', label: 'Chop board', x: 36, y: 300, w: 170, h: 96, hint: 'Hold E to chop' },
  { id: 'plate', label: 'Assembly plate', x: 470, y: 470, w: 320, h: 140, hint: 'Build the dish' },
  { id: 'window', label: 'Serve window', x: 940, y: 470, w: 304, h: 140, hint: 'Serve the order' },
  { id: 'trash', label: 'Bin', x: 36, y: 470, w: 140, h: 110, hint: 'Throw it away' },
];

export const STATION_BY_ID = Object.fromEntries(STATIONS.map((s) => [s.id, s]));

// Patience (seconds) of a fresh ticket, and how fast new tickets arrive.
export function patienceFor(elapsed) {
  return elapsed < 60 ? 48 : elapsed < 110 ? 40 : 34;
}
export function spawnGapFor(elapsed) {
  return elapsed < 45 ? 15 : elapsed < 90 ? 12 : 9;
}
export function starsFor(coins) {
  if (coins >= 190) return 3;
  if (coins >= 120) return 2;
  if (coins >= 60) return 1;
  return 0;
}
