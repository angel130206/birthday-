/* =========================================================
   AUDIO — musik "Happy Birthday" ala kotak musik + efek suara
   Semua disintesis dengan Web Audio API (tanpa file audio).
   ========================================================= */
window.BirthdayAudio = (function () {
  "use strict";

  let ctx = null;
  let master = null;
  let musicGain = null;
  let sfxGain = null;
  let noiseBuffer = null;

  let playing = false;
  let loopTimer = null;
  let liveNodes = [];

  const VOLUME = 0.9;
  const MUSIC_LEVEL = 0.2;

  const NOTE = {
    C4: 261.63, D4: 293.66, E4: 329.63, F4: 349.23, G4: 392.0, A4: 440.0, B4: 493.88,
    C5: 523.25, D5: 587.33, E5: 659.25, F5: 698.46, G5: 783.99, A5: 880.0,
    C3: 130.81, F3: 174.61, G3: 196.0
  };

  // Melodi Happy Birthday (3/4), pasangan [nada, ketukan]
  const MELODY = [
    ["G4", 0.75], ["G4", 0.25], ["A4", 1], ["G4", 1], ["C5", 1], ["B4", 2],
    ["G4", 0.75], ["G4", 0.25], ["A4", 1], ["G4", 1], ["D5", 1], ["C5", 2],
    ["G4", 0.75], ["G4", 0.25], ["G5", 1], ["E5", 1], ["C5", 1], ["B4", 1], ["A4", 2],
    ["F5", 0.75], ["F5", 0.25], ["E5", 1], ["C5", 1], ["D5", 1], ["C5", 3]
  ];
  const BEAT = 0.56; // detik per ketukan

  function ensure() {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = VOLUME;

      const comp = ctx.createDynamicsCompressor();
      comp.threshold.value = -18;
      comp.ratio.value = 6;

      master.connect(comp);
      comp.connect(ctx.destination);

      musicGain = ctx.createGain();
      musicGain.gain.value = MUSIC_LEVEL;
      musicGain.connect(master);

      sfxGain = ctx.createGain();
      sfxGain.gain.value = 0.8;
      sfxGain.connect(master);
    }
    if (ctx.state === "suspended") ctx.resume();
    return ctx;
  }

  function noise() {
    if (!noiseBuffer) {
      const len = Math.floor(ctx.sampleRate * 1.6);
      noiseBuffer = ctx.createBuffer(1, len, ctx.sampleRate);
      const data = noiseBuffer.getChannelData(0);
      for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
    }
    return noiseBuffer;
  }

  /* ---------- instrumen ---------- */
  function bell(freq, when, dur, level) {
    const t = when;
    const g = ctx.createGain();
    g.connect(musicGain);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(level || 0.5, t + 0.014);
    g.gain.exponentialRampToValueAtTime(0.0001, t + Math.max(dur, 0.5) * 1.5);

    const partials = [
      { ratio: 1, gain: 1, type: "sine" },
      { ratio: 2.001, gain: 0.32, type: "sine" },
      { ratio: 3.004, gain: 0.12, type: "triangle" },
      { ratio: 4.2, gain: 0.05, type: "sine" }
    ];

    partials.forEach((part) => {
      const o = ctx.createOscillator();
      const pg = ctx.createGain();
      o.type = part.type;
      o.frequency.value = freq * part.ratio;
      pg.gain.value = part.gain;
      o.connect(pg);
      pg.connect(g);
      o.start(t);
      o.stop(t + Math.max(dur, 0.5) * 1.6 + 0.1);
      liveNodes.push(o);
    });
  }

  function bass(freq, when, dur) {
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = "sine";
    o.frequency.value = freq;
    g.gain.setValueAtTime(0.0001, when);
    g.gain.exponentialRampToValueAtTime(0.14, when + 0.18);
    g.gain.exponentialRampToValueAtTime(0.0001, when + dur);
    o.connect(g);
    g.connect(musicGain);
    o.start(when);
    o.stop(when + dur + 0.1);
    liveNodes.push(o);
  }

  /* ---------- musik ---------- */
  function scheduleCycle(startAt) {
    let t = startAt;
    let i = 0;

    MELODY.forEach(([name, beats]) => {
      const dur = beats * BEAT;
      bell(NOTE[name] || 440, t, dur, 0.42);
      if (i === 0 || i === 6 || i === 13 || i === 20) {
        const root = i === 0 ? "C3" : i === 6 ? "G3" : i === 13 ? "C3" : "F3";
        bass(NOTE[root], t, dur * 3.4);
      }
      t += dur;
      i++;
    });

    return t - startAt; // panjang satu putaran
  }

  function playMusic() {
    if (!ensure()) return false;
    if (playing) return true;
    playing = true;
    musicGain.gain.cancelScheduledValues(ctx.currentTime);
    musicGain.gain.setValueAtTime(Math.max(musicGain.gain.value, 0.0001), ctx.currentTime);
    musicGain.gain.exponentialRampToValueAtTime(MUSIC_LEVEL, ctx.currentTime + 1.2);

    const cycle = () => {
      if (!playing) return;
      const length = scheduleCycle(ctx.currentTime + 0.15);
      loopTimer = setTimeout(cycle, (length + 2.8) * 1000);
    };
    cycle();
    return true;
  }

  function stopMusic() {
    if (!ctx || !playing) return;
    playing = false;
    clearTimeout(loopTimer);
    musicGain.gain.cancelScheduledValues(ctx.currentTime);
    musicGain.gain.setValueAtTime(musicGain.gain.value, ctx.currentTime);
    musicGain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.5);

    setTimeout(() => {
      liveNodes.forEach((n) => { try { n.stop(); } catch (e) {} });
      liveNodes = [];
    }, 620);
  }

  function isPlaying() { return playing; }

  /* ---------- efek suara ---------- */
  function pop() {
    if (!ensure()) return;
    const t = ctx.currentTime;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = "sine";
    o.frequency.setValueAtTime(660, t);
    o.frequency.exponentialRampToValueAtTime(150, t + 0.16);
    g.gain.setValueAtTime(0.35, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.2);
    o.connect(g);
    g.connect(sfxGain);
    o.start(t);
    o.stop(t + 0.22);

    const src = ctx.createBufferSource();
    const ng = ctx.createGain();
    src.buffer = noise();
    ng.gain.setValueAtTime(0.16, t);
    ng.gain.exponentialRampToValueAtTime(0.0001, t + 0.12);
    src.connect(ng);
    ng.connect(sfxGain);
    src.start(t);
    src.stop(t + 0.14);
  }

  function blow() {
    if (!ensure()) return;
    const t = ctx.currentTime;
    const src = ctx.createBufferSource();
    src.buffer = noise();

    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(1800, t);
    filter.frequency.exponentialRampToValueAtTime(420, t + 1.1);
    filter.Q.value = 0.8;

    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(0.34, t + 0.16);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 1.25);

    src.connect(filter);
    filter.connect(g);
    g.connect(sfxGain);
    src.start(t);
    src.stop(t + 1.3);
  }

  function chime() {
    if (!ensure()) return;
    const t = ctx.currentTime;
    const notes = ["C5", "E5", "G5", "C5"];
    notes.forEach((n, i) => {
      bell(NOTE[n] * 2, t + i * 0.1, 0.5, 0.32);
    });
  }

  function paper() {
    if (!ensure()) return;
    const t = ctx.currentTime;
    const src = ctx.createBufferSource();
    src.buffer = noise();
    const hp = ctx.createBiquadFilter();
    hp.type = "highpass";
    hp.frequency.value = 2200;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(0.15, t + 0.06);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.45);
    src.connect(hp);
    hp.connect(g);
    g.connect(sfxGain);
    src.start(t);
    src.stop(t + 0.5);
  }

  function launch() {
    if (!ensure()) return;
    const t = ctx.currentTime;
    const src = ctx.createBufferSource();
    src.buffer = noise();
    const bp = ctx.createBiquadFilter();
    bp.type = "bandpass";
    bp.frequency.setValueAtTime(700, t);
    bp.frequency.exponentialRampToValueAtTime(2400, t + 0.75);
    bp.Q.value = 1.4;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(0.07, t + 0.2);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.85);
    src.connect(bp);
    bp.connect(g);
    g.connect(sfxGain);
    src.start(t);
    src.stop(t + 0.9);
  }

  return {
    ensure, pop, blow, chime, paper, launch,
    playMusic, stopMusic, isPlaying,
    get context() { return ctx; }
  };
})();
