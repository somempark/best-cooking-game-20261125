// Sizzle & Serve — every sound is synthesized live with WebAudio. One clear
// job: short named effects (pickup, chop, sizzle, ding, coin, alarm) and a
// mute toggle. No audio files, no network.
export function createAudio() {
  let ctx = null;
  let muted = false;
  let sizzleNodes = null;

  function ensure() {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
    }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  function tone(freq, dur, type, gain, when = 0, slideTo = null) {
    if (muted) return;
    const ac = ensure();
    if (!ac) return;
    const t0 = ac.currentTime + when;
    const osc = ac.createOscillator();
    const g = ac.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(gain, t0 + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(g);
    g.connect(ac.destination);
    osc.start(t0);
    osc.stop(t0 + dur + 0.05);
  }

  function noise(dur, gain, filterFreq, when = 0) {
    if (muted) return;
    const ac = ensure();
    if (!ac) return;
    const t0 = ac.currentTime + when;
    const len = Math.floor(ac.sampleRate * dur);
    const buffer = ac.createBuffer(1, len, ac.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < len; i += 1) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = ac.createBufferSource();
    src.buffer = buffer;
    const filter = ac.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = filterFreq;
    const g = ac.createGain();
    g.gain.setValueAtTime(gain, t0);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    src.connect(filter);
    filter.connect(g);
    g.connect(ac.destination);
    src.start(t0);
  }

  return {
    get muted() {
      return muted;
    },
    toggleMute() {
      muted = !muted;
      if (muted) this.stopSizzle();
      return muted;
    },
    unlock() {
      ensure();
    },
    pickup() {
      tone(520, 0.08, 'sine', 0.12, 0, 760);
    },
    place() {
      tone(340, 0.09, 'triangle', 0.14, 0, 260);
    },
    chop() {
      noise(0.07, 0.25, 1800);
      tone(180, 0.06, 'square', 0.08);
    },
    chopped() {
      tone(660, 0.09, 'sine', 0.14);
      tone(880, 0.12, 'sine', 0.14, 0.08);
    },
    serve() {
      tone(523, 0.12, 'sine', 0.16);
      tone(659, 0.12, 'sine', 0.16, 0.09);
      tone(784, 0.2, 'sine', 0.18, 0.18);
    },
    wrong() {
      tone(220, 0.18, 'sawtooth', 0.1, 0, 140);
    },
    alarm() {
      tone(980, 0.12, 'square', 0.06, 0, 980);
      tone(980, 0.12, 'square', 0.06, 0.16, 980);
    },
    click() {
      tone(700, 0.05, 'sine', 0.1);
    },
    startSizzle() {
      if (muted || sizzleNodes) return;
      const ac = ensure();
      if (!ac) return;
      const len = ac.sampleRate;
      const buffer = ac.createBuffer(1, len, ac.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < len; i += 1) data[i] = Math.random() * 2 - 1;
      const src = ac.createBufferSource();
      src.buffer = buffer;
      src.loop = true;
      const filter = ac.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.value = 2500;
      const g = ac.createGain();
      g.gain.value = 0.035;
      src.connect(filter);
      filter.connect(g);
      g.connect(ac.destination);
      src.start();
      sizzleNodes = { src, g };
    },
    stopSizzle() {
      if (!sizzleNodes) return;
      try {
        sizzleNodes.src.stop();
      } catch (e) {
        // Already stopped.
      }
      sizzleNodes = null;
    },
  };
}
