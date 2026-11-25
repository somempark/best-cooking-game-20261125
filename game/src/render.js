// Sizzle & Serve — everything the player sees. One clear job: draw the
// kitchen, the chef, the tickets, the HUD and the screens on one canvas.
// All art is drawn in code; there are no image files.
import {
  CHEF_RADIUS,
  CHOP_SECONDS,
  FRIES_BURN_SECONDS,
  FRIES_COOK_SECONDS,
  ING,
  MAX_STRIKES,
  MAX_TICKETS,
  PATY_BURN_SECONDS,
  PATY_COOK_SECONDS,
  STATIONS,
  starsFor,
} from './config.js';
import { SCREEN_OVER, SCREEN_TITLE, nearestStation, stationCenter } from './world.js';

const FLOOR_A = '#c98d5a';
const FLOOR_B = '#bd7f4e';
const WALL = '#8a5a34';
const WOOD = '#a9713f';
const WOOD_DARK = '#7d4f27';

function rr(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function text(ctx, str, x, y, size, color, align = 'center', weight = '700') {
  ctx.fillStyle = color;
  ctx.font = `${weight} ${size}px "Trebuchet MS", "Segoe UI", sans-serif`;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillText(str, x, y);
}

function ring(ctx, x, y, r, frac, color, width = 6) {
  ctx.beginPath();
  ctx.arc(x, y, r, -Math.PI / 2, -Math.PI / 2 + frac * Math.PI * 2);
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.lineCap = 'round';
  ctx.stroke();
}

// One ingredient, drawn as a small icon at (x, y) with size s.
export function drawIngredient(ctx, id, x, y, s) {
  ctx.save();
  ctx.translate(x, y);
  switch (id) {
    case ING.BUN: {
      ctx.fillStyle = '#e8a34c';
      ctx.beginPath();
      ctx.arc(0, 2, s * 0.55, Math.PI, 0);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#d18a35';
      ctx.fillRect(-s * 0.55, 2, s * 1.1, s * 0.16);
      ctx.fillStyle = '#f7d9a0';
      ctx.beginPath();
      ctx.arc(-s * 0.2, -s * 0.18, s * 0.06, 0, Math.PI * 2);
      ctx.arc(s * 0.15, -s * 0.3, s * 0.06, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case ING.PATTY:
    case ING.PATTY_COOKED: {
      ctx.fillStyle = id === ING.PATTY ? '#c07a68' : '#7a4a2e';
      rr(ctx, -s * 0.55, -s * 0.22, s * 1.1, s * 0.44, s * 0.2);
      ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.15)';
      ctx.fillRect(-s * 0.4, -s * 0.16, s * 0.8, s * 0.1);
      break;
    }
    case ING.PATTY_BURNT: {
      ctx.fillStyle = '#2b2118';
      rr(ctx, -s * 0.55, -s * 0.22, s * 1.1, s * 0.44, s * 0.2);
      ctx.fill();
      break;
    }
    case ING.LETTUCE:
    case ING.LETTUCE_RAW: {
      ctx.fillStyle = id === ING.LETTUCE ? '#7ec850' : '#a8d97a';
      ctx.beginPath();
      for (let i = 0; i <= 6; i += 1) {
        const px = -s * 0.55 + (i * s * 1.1) / 6;
        const py = Math.sin((i / 6) * Math.PI * 2) * s * 0.16;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.lineTo(s * 0.55, s * 0.18);
      ctx.lineTo(-s * 0.55, s * 0.18);
      ctx.closePath();
      ctx.fill();
      break;
    }
    case ING.TOMATO:
    case ING.TOMATO_RAW: {
      ctx.fillStyle = '#e84a3a';
      ctx.beginPath();
      ctx.arc(0, 0, s * 0.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#f2816f';
      ctx.beginPath();
      ctx.arc(0, 0, s * 0.3, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffd9d2';
      ctx.beginPath();
      ctx.arc(0, 0, s * 0.12, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case ING.CHEESE: {
      ctx.fillStyle = '#f7c948';
      ctx.beginPath();
      ctx.moveTo(-s * 0.55, s * 0.3);
      ctx.lineTo(s * 0.55, s * 0.3);
      ctx.lineTo(s * 0.55, -s * 0.1);
      ctx.lineTo(0, -s * 0.35);
      ctx.lineTo(-s * 0.55, -s * 0.1);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#d9a41f';
      ctx.beginPath();
      ctx.arc(-s * 0.15, s * 0.08, s * 0.09, 0, Math.PI * 2);
      ctx.arc(s * 0.2, -s * 0.05, s * 0.07, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case ING.SAUCE: {
      ctx.strokeStyle = '#f2e6c9';
      ctx.lineWidth = s * 0.16;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(-s * 0.5, 0);
      ctx.bezierCurveTo(-s * 0.25, -s * 0.3, s * 0.1, s * 0.3, s * 0.5, 0);
      ctx.stroke();
      break;
    }
    case ING.FRIES:
    case ING.FRIES_COOKED: {
      ctx.fillStyle = '#d9382b';
      ctx.beginPath();
      ctx.moveTo(-s * 0.5, -s * 0.1);
      ctx.lineTo(s * 0.5, -s * 0.1);
      ctx.lineTo(s * 0.38, s * 0.5);
      ctx.lineTo(-s * 0.38, s * 0.5);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#f2b63c';
      for (let i = -1; i <= 1; i += 1) ctx.fillRect(i * s * 0.24 - s * 0.07, -s * 0.55, s * 0.14, s * 0.55);
      break;
    }
    case ING.FRIES_BURNT: {
      ctx.fillStyle = '#3a2c1c';
      for (let i = -1; i <= 1; i += 1) ctx.fillRect(i * s * 0.24 - s * 0.07, -s * 0.5, s * 0.14, s * 0.9);
      break;
    }
    default:
      break;
  }
  ctx.restore();
}

function drawChip(ctx, id, x, y, s = 30) {
  ctx.fillStyle = 'rgba(255,255,255,0.92)';
  rr(ctx, x - s / 2, y - s / 2, s, s, 7);
  ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,0.18)';
  ctx.lineWidth = 1;
  ctx.stroke();
  drawIngredient(ctx, id, x, y, s * 0.62);
}

function drawStation(ctx, world, station) {
  const { x, y, w, h } = station;
  const near = nearestStation(world) === station;
  ctx.save();
  if (near) {
    ctx.shadowColor = '#ffd94d';
    ctx.shadowBlur = 18;
  }
  ctx.fillStyle = WOOD;
  rr(ctx, x, y, w, h, 12);
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.strokeStyle = near ? '#ffd94d' : WOOD_DARK;
  ctx.lineWidth = near ? 4 : 2;
  ctx.stroke();
  ctx.restore();

  ctx.save();
  ctx.beginPath();
  rr(ctx, x, y, w, h, 12);
  ctx.clip();
  if (station.id === 'grill') {
    ctx.fillStyle = '#3a3a40';
    ctx.fillRect(x + 10, y + 14, w - 20, h - 28);
    ctx.strokeStyle = '#55555e';
    ctx.lineWidth = 3;
    for (let i = 1; i < 5; i += 1) {
      ctx.beginPath();
      ctx.moveTo(x + 10 + ((w - 20) * i) / 5, y + 16);
      ctx.lineTo(x + 10 + ((w - 20) * i) / 5, y + h - 16);
      ctx.stroke();
    }
    world.grill.forEach((slot, i) => {
      if (!slot) return;
      const cx = x + 40 + i * 110;
      const cy = y + h / 2 + 2;
      drawIngredient(ctx, slot.state === 'burnt' ? ING.PATTY_BURNT : ING.PATTY_COOKED, cx, cy, 44);
      const total = slot.state === 'cooking' ? PATY_COOK_SECONDS : PATY_BURN_SECONDS;
      const frac = slot.state === 'cooking' ? slot.t / total : 1 - slot.t / total;
      ring(ctx, cx, cy, 30, Math.min(1, Math.max(0, frac)), slot.state === 'burnt' ? '#ff5a4e' : slot.state === 'done' ? '#7ec850' : '#ffd94d', 5);
    });
  } else if (station.id === 'fryer') {
    ctx.fillStyle = '#8a6a2f';
    rr(ctx, x + 14, y + 16, w - 28, h - 30, 8);
    ctx.fill();
    ctx.fillStyle = '#e8b64c';
    rr(ctx, x + 20, y + 22, w - 40, h - 42, 6);
    ctx.fill();
    if (world.fryer) {
      const cx = x + w / 2;
      const cy = y + h / 2;
      drawIngredient(ctx, world.fryer.state === 'burnt' ? ING.FRIES_BURNT : ING.FRIES_COOKED, cx, cy, 40);
      if (world.fryer.state === 'cooking') ring(ctx, cx, cy, 30, world.fryer.t / FRIES_COOK_SECONDS, '#ffd94d', 5);
      else if (world.fryer.state === 'done') ring(ctx, cx, cy, 30, 1 - world.fryer.t / FRIES_BURN_SECONDS, '#7ec850', 5);
    } else {
      ctx.fillStyle = 'rgba(255,255,255,0.55)';
      for (let i = 0; i < 5; i += 1) {
        ctx.beginPath();
        ctx.arc(x + 30 + i * 26, y + 30 + (i % 2) * 22, 4, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  } else if (station.id === 'plate') {
    ctx.fillStyle = '#f4efe4';
    ctx.beginPath();
    ctx.ellipse(x + w / 2, y + h / 2 + 8, w / 2 - 26, h / 2 - 18, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#cbb98f';
    ctx.lineWidth = 2;
    ctx.stroke();
    world.plate.forEach((item, i) => {
      const px = x + w / 2;
      const py = y + h / 2 + 8 - (world.plate.length - 1 - i) * 10;
      drawIngredient(ctx, item, px, py, 46);
    });
    if (world.plate.length === 0) text(ctx, 'plate your dish here', x + w / 2, y + h / 2 + 8, 15, '#9a8a6a', 'center', '600');
  } else if (station.id === 'window') {
    ctx.fillStyle = '#5a4632';
    ctx.fillRect(x, y + h - 22, w, 22);
    ctx.fillStyle = '#ffd94d';
    ctx.beginPath();
    ctx.arc(x + w / 2, y + 34, 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#5a4632';
    ctx.fillRect(x + w / 2 - 14, y + 30, 28, 6);
    text(ctx, 'SERVE', x + w / 2, y + h - 52, 22, '#fff');
  } else if (station.id === 'trash') {
    ctx.fillStyle = '#4a4a52';
    rr(ctx, x + w / 2 - 26, y + 22, 52, 56, 6);
    ctx.fill();
    ctx.fillStyle = '#33333a';
    ctx.fillRect(x + w / 2 - 30, y + 16, 60, 10);
  } else if (station.id === 'board') {
    ctx.fillStyle = '#e8d5a8';
    rr(ctx, x + 16, y + 18, w - 32, h - 36, 8);
    ctx.fill();
    const target = world.carry.includes(ING.LETTUCE_RAW) || world.carry.includes(ING.TOMATO_RAW);
    if (target) {
      drawIngredient(ctx, world.carry.includes(ING.LETTUCE_RAW) ? ING.LETTUCE_RAW : ING.TOMATO_RAW, x + w / 2, y + h / 2 - 4, 40);
      if (world.chef.chopping) ring(ctx, x + w / 2, y + h / 2 - 4, 34, world.chef.chop / CHOP_SECONDS, '#ffd94d', 5);
    } else {
      ctx.strokeStyle = '#b09a6a';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(x + 40, y + h / 2);
      ctx.lineTo(x + w - 40, y + h / 2);
      ctx.stroke();
    }
  } else {
    // Ingredient crates: a neat pile of the ingredient.
    const map = {
      bun: ING.BUN,
      patty: ING.PATTY,
      lettuce: ING.LETTUCE_RAW,
      tomato: ING.TOMATO_RAW,
      cheese: ING.CHEESE,
      sauce: ING.SAUCE,
    };
    const id = map[station.id];
    if (id) {
      drawIngredient(ctx, id, x + w / 2 - 26, y + h / 2 + 4, 44);
      drawIngredient(ctx, id, x + w / 2 + 26, y + h / 2 + 4, 44);
      drawIngredient(ctx, id, x + w / 2, y + h / 2 - 16, 44);
    }
  }
  ctx.restore();
  text(ctx, station.label.toUpperCase(), x + w / 2, y + h - 0, 13, '#fff', 'center', '800');
}

function drawTicket(ctx, ticket, x, y, w, h) {
  const frac = Math.max(0, ticket.patience / ticket.maxPatience);
  const urgent = ticket.patience < 10;
  ctx.save();
  ctx.fillStyle = urgent && Math.floor(ticket.patience * 4) % 2 === 0 ? '#ffe1de' : '#fff8ea';
  rr(ctx, x, y, w, h, 10);
  ctx.fill();
  ctx.strokeStyle = urgent ? '#ff5a4e' : '#d9c49a';
  ctx.lineWidth = urgent ? 3 : 2;
  ctx.stroke();
  ctx.restore();
  text(ctx, `#${ticket.id} ${ticket.recipe.name}`, x + 10, y + 16, 14, '#4a3220', 'left', '800');
  text(ctx, `$${ticket.recipe.price}`, x + w - 10, y + 16, 15, '#2e7d32', 'right', '800');
  ticket.recipe.needs.forEach((need, i) => {
    drawChip(ctx, need, x + 22 + i * 36, y + 44, 30);
  });
  const barW = w - 20;
  ctx.fillStyle = '#e5d9bd';
  rr(ctx, x + 10, y + h - 16, barW, 8, 4);
  ctx.fill();
  ctx.fillStyle = frac > 0.5 ? '#7ec850' : frac > 0.25 ? '#f2b63c' : '#ff5a4e';
  if (frac > 0) {
    rr(ctx, x + 10, y + h - 16, barW * frac, 8, 4);
    ctx.fill();
  }
}

function drawChef(ctx, world) {
  const { x, y, dir } = world.chef;
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.35)';
  ctx.shadowBlur = 8;
  ctx.shadowOffsetY = 4;
  // Body: white apron over a teal shirt.
  ctx.fillStyle = '#2f8f7b';
  ctx.beginPath();
  ctx.arc(x, y, CHEF_RADIUS, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.fillStyle = '#fdfbf6';
  ctx.beginPath();
  ctx.ellipse(x, y + 8, 18, 16, 0, 0, Math.PI * 2);
  ctx.fill();
  // Face.
  ctx.fillStyle = '#f2c79b';
  ctx.beginPath();
  ctx.arc(x + dir * 4, y - 6, 13, 0, Math.PI * 2);
  ctx.fill();
  // Chef hat.
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(x - 9, y - 16, 8, 0, Math.PI * 2);
  ctx.arc(x + 1, y - 20, 9, 0, Math.PI * 2);
  ctx.arc(x + 10, y - 15, 8, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillRect(x - 14, y - 18, 28, 6);
  // Eyes.
  ctx.fillStyle = '#2b2118';
  ctx.beginPath();
  ctx.arc(x + dir * 4 - 5, y - 7, 1.8, 0, Math.PI * 2);
  ctx.arc(x + dir * 4 + 5, y - 7, 1.8, 0, Math.PI * 2);
  ctx.fill();
  // Carried stack above the head.
  world.carry.forEach((item, i) => {
    drawChip(ctx, item, x - ((world.carry.length - 1) * 17) + i * 34, y - 52, 30);
  });
  if (world.chef.chopping) {
    text(ctx, 'CHOP!', x, y - 78, 15, '#fff', 'center', '800');
  }
  ctx.restore();
}

function drawHud(ctx, world) {
  ctx.fillStyle = '#3a2a1c';
  ctx.fillRect(0, 0, 1280, 96);
  ctx.fillStyle = '#54371f';
  ctx.fillRect(0, 92, 1280, 4);
  // Tickets.
  const slotW = 196;
  for (let i = 0; i < MAX_TICKETS; i += 1) {
    const ticket = world.tickets[i];
    if (ticket) drawTicket(ctx, ticket, 14 + i * (slotW + 8), 10, slotW, 76);
    else {
      ctx.fillStyle = 'rgba(255,255,255,0.08)';
      rr(ctx, 14 + i * (slotW + 8), 10, slotW, 76, 10);
      ctx.fill();
    }
  }
  // Timer, coins, combo, strikes.
  const tx = 856;
  const mins = Math.floor(world.timeLeft / 60);
  const secs = Math.floor(world.timeLeft % 60);
  const lowTime = world.timeLeft <= 30 && world.screen === 'play';
  text(ctx, `${mins}:${String(secs).padStart(2, '0')}`, tx + 60, 34, 34, lowTime ? '#ff8a7a' : '#ffd94d', 'center', '800');
  text(ctx, 'SHIFT', tx + 60, 66, 11, '#cbb98f', 'center', '700');
  text(ctx, `$${world.coins}`, tx + 180, 34, 30, '#ffffff', 'center', '800');
  text(ctx, 'EARNED', tx + 180, 66, 11, '#cbb98f', 'center', '700');
  if (world.combo >= 2) {
    text(ctx, `COMBO x${world.combo}`, tx + 300, 34, 20, '#ffb03a', 'center', '800');
  }
  for (let i = 0; i < MAX_STRIKES; i += 1) {
    ctx.fillStyle = i < world.strikes ? '#ff5a4e' : 'rgba(255,255,255,0.25)';
    ctx.beginPath();
    const hx = tx + 330 + i * 26;
    const hy = 66;
    ctx.moveTo(hx, hy + 6);
    ctx.bezierCurveTo(hx - 9, hy - 4, hx - 4, hy - 10, hx, hy - 4);
    ctx.bezierCurveTo(hx + 4, hy - 10, hx + 9, hy - 4, hx, hy + 6);
    ctx.fill();
  }
  text(ctx, 'STRIKES', tx + 356, 82, 9, '#cbb98f', 'center', '700');
}

function drawFloor(ctx) {
  for (let ty = 0; ty < 9; ty += 1) {
    for (let tx = 0; tx < 16; tx += 1) {
      ctx.fillStyle = (tx + ty) % 2 === 0 ? FLOOR_A : FLOOR_B;
      ctx.fillRect(tx * 80, 96 + ty * 70, 80, 70);
    }
  }
  ctx.fillStyle = WALL;
  ctx.fillRect(0, 96, 1280, 26);
  ctx.fillStyle = 'rgba(255,255,255,0.08)';
  ctx.fillRect(0, 96, 1280, 4);
}

function drawTitle(ctx, world, best) {
  ctx.fillStyle = 'rgba(20,12,6,0.55)';
  ctx.fillRect(0, 0, 1280, 720);
  text(ctx, 'SIZZLE & SERVE', 640, 210, 84, '#ffd94d', 'center', '900');
  text(ctx, 'a little burger stall with big lunch-rush dreams', 640, 268, 24, '#fff', 'center', '600');
  text(ctx, 'Take orders  ·  Grill patties  ·  Chop veg  ·  Build burgers  ·  Serve before patience runs out', 640, 330, 19, '#ffe9b0', 'center', '600');
  text(ctx, 'Move: WASD / arrows or click  ·  Interact: E or Space  ·  Hold E at the board to chop  ·  M: mute', 640, 372, 17, '#fff', 'center', '600');
  text(ctx, 'Serve 5 orders to finish the shift — 3 missed orders ends it early', 640, 402, 17, '#fff', 'center', '600');
  if (best > 0) text(ctx, `Best shift: $${best}`, 640, 448, 20, '#7ec850', 'center', '800');
  const pulse = 0.7 + 0.3 * Math.sin(world.elapsed * 4);
  ctx.globalAlpha = pulse;
  text(ctx, 'PRESS ENTER TO OPEN THE STALL', 640, 520, 26, '#ffd94d', 'center', '800');
  ctx.globalAlpha = 1;
}

function drawOver(ctx, world, best) {
  ctx.fillStyle = 'rgba(20,12,6,0.62)';
  ctx.fillRect(0, 0, 1280, 720);
  const title = world.won ? 'SHIFT COMPLETE!' : 'SHIFT OVER';
  text(ctx, title, 640, 170, 64, world.won ? '#7ec850' : '#ff8a7a', 'center', '900');
  const stars = starsFor(world.coins);
  for (let i = 0; i < 3; i += 1) {
    text(ctx, i < stars ? '★' : '☆', 580 + i * 60, 240, 52, '#ffd94d', 'center', '400');
  }
  text(ctx, `You earned $${world.coins}  ·  ${world.served} orders served  ·  ${world.missed} missed`, 640, 310, 24, '#fff', 'center', '700');
  text(ctx, `Best combo x${world.bestCombo}  ·  Best shift $${Math.max(best, world.coins)}`, 640, 348, 20, '#ffe9b0', 'center', '600');
  const pulse = 0.7 + 0.3 * Math.sin(world.elapsed * 4);
  ctx.globalAlpha = pulse;
  text(ctx, 'PRESS ENTER TO COOK AGAIN', 640, 430, 24, '#ffd94d', 'center', '800');
  ctx.globalAlpha = 1;
}

export function drawWorld(ctx, world, best) {
  ctx.clearRect(0, 0, 1280, 720);
  drawFloor(ctx);
  for (const station of STATIONS) drawStation(ctx, world, station);
  drawChef(ctx, world);
  drawHud(ctx, world);
  // Floating score popups.
  for (const f of world.floats) {
    ctx.globalAlpha = Math.max(0, Math.min(1, f.life));
    text(ctx, f.text, f.x, f.y, 24, f.color, 'center', '900');
  }
  ctx.globalAlpha = 1;
  // Strike flash.
  if (world.flash > 0) {
    ctx.fillStyle = `rgba(255,60,40,${world.flash * 0.35})`;
    ctx.fillRect(0, 0, 1280, 720);
  }
  // Nearest-station hint.
  if (world.screen === 'play') {
    const near = nearestStation(world);
    if (near) {
      text(ctx, `${near.label} — ${near.hint}  (E)`, 640, 706, 15, 'rgba(255,255,255,0.9)', 'center', '700');
    }
  }
  if (world.screen === SCREEN_TITLE) drawTitle(ctx, world, best);
  if (world.screen === SCREEN_OVER) drawOver(ctx, world, best);
}
