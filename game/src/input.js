// Sizzle & Serve — keyboard and mouse. One clear job: turn raw browser
// events into the game's input shape {x, y, interact, chopHeld} plus a
// click-to-move target the world can steer toward.
export function createInput(canvas) {
  const keys = new Set();
  const input = {
    x: 0,
    y: 0,
    interact: false,
    chopHeld: false,
    // Click-to-move: a world point the chef walks toward, or null.
    target: null,
    // Set by the game loop when the player clicks a station: interact there.
    clickStation: null,
  };
  const KEYMAP = {
    ArrowUp: 'up', KeyW: 'up',
    ArrowDown: 'down', KeyS: 'down',
    ArrowLeft: 'left', KeyA: 'left',
    ArrowRight: 'right', KeyD: 'right',
  };

  function recompute() {
    let x = 0;
    let y = 0;
    if (keys.has('left')) x -= 1;
    if (keys.has('right')) x += 1;
    if (keys.has('up')) y -= 1;
    if (keys.has('down')) y += 1;
    input.x = x;
    input.y = y;
    input.chopHeld = keys.has('KeyE') || keys.has('Space');
  }

  window.addEventListener('keydown', (event) => {
    const mapped = KEYMAP[event.code];
    if (mapped) {
      keys.add(mapped);
      input.target = null;
      event.preventDefault();
    }
    if (event.code === 'KeyE' || event.code === 'Space') {
      keys.add(event.code);
      input.interact = true;
      input.target = null;
      event.preventDefault();
    }
    if (event.code === 'KeyM') input.toggleMute?.();
  });
  window.addEventListener('keyup', (event) => {
    keys.delete(KEYMAP[event.code]);
    keys.delete(event.code);
    recompute();
  });
  window.addEventListener('blur', () => {
    keys.clear();
    recompute();
  });

  canvas.addEventListener('pointerdown', (event) => {
    const rect = canvas.getBoundingClientRect();
    const px = ((event.clientX - rect.left) / rect.width) * canvas.width;
    const py = ((event.clientY - rect.top) / rect.height) * canvas.height;
    input.target = { x: px, y: py };
    input.clickStation = { x: px, y: py };
  });

  // The loop calls this each frame to fold a click target into movement.
  input.steer = (chef) => {
    if (input.x !== 0 || input.y !== 0 || !input.target) return { x: input.x, y: input.y };
    const dx = input.target.x - chef.x;
    const dy = input.target.y - chef.y;
    const d = Math.hypot(dx, dy);
    if (d < 12) {
      input.target = null;
      return { x: 0, y: 0 };
    }
    return { x: dx / d, y: dy / d };
  };

  // True once when the player pressed interact; the loop clears it.
  input.consumeInteract = () => {
    const was = input.interact;
    input.interact = false;
    return was;
  };

  return input;
}
