/* Kale 2.0 — Kanat Sesleri: her kanadın kendi hafif arka plan sesi, hepsi tarayıcıda üretilir (dosya yok).
   Mevsim: kuş cıvıltısı ve rüzgâr · Zaman: duvar saati · Anılar: uzaktan deniz · Kalp: şömine çıtırtısı ·
   Oyun: rüzgâr çanları · Hazine: mağarada damlalar · Sahip: sessiz. Kendi sesi olan odalarda (radyo, masal, film,
   piyano...) ve müzik çalarken susar; Tema Atölyesi'nde "Kanat sesleri" ya da "Sesler" kapalıysa hiç çalmaz. */
(function () {
  'use strict';
  const K = window.K;

  const SILENT = ['radyo', 'telesekreter', 'uyku', 'dans', 'muzik', 'piyano', 'filmgecesi', 'film', 'sinema', 'bizfm', 'seslerimiz', 'gunses', 'kabin', 'sofra', 'randevu', 'pinpon', 'belgesel', 'dgfilm', 'anlar', 'emojisarki', 'sarkimiz', 'sarkidefteri', 'kule2', 'kacis', 'gece', 'telsiz', 'masal'];
  let cur = '', nodes = [], timers = [], master = null, noiseBuf = null;
  const ok = () => {
    const s = K.atolye ? K.atolye.get() : {};
    return s.kanatses !== false && s.ses !== false && !(K.audio.music && K.audio.music.on) && !document.hidden;
  };
  const ctx = () => K.audio.ctx;
  function noise() {
    const c = ctx();
    if (!noiseBuf) {
      noiseBuf = c.createBuffer(1, c.sampleRate * 2, c.sampleRate);
      const d = noiseBuf.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    }
    const s = c.createBufferSource();
    s.buffer = noiseBuf;
    s.loop = true;
    return s;
  }
  const later = (fn, ms) => timers.push(setTimeout(fn, ms));
  const loop = (fn, min, max) => {
    const run = () => {
      if (!cur) return;
      fn();
      later(run, min + Math.random() * (max - min));
    };
    later(run, 400 + Math.random() * 900);
  };
  function env(g, t, a, peak, d) {
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(peak, t + a);
    g.gain.exponentialRampToValueAtTime(0.0001, t + a + d);
  }
  function tone(type, f0, f1, dur, peak, delay = 0) {
    const c = ctx(), t = c.currentTime + delay;
    const o = c.createOscillator(), g = c.createGain();
    o.type = type;
    o.frequency.setValueAtTime(f0, t);
    f1 && o.frequency.exponentialRampToValueAtTime(f1, t + dur);
    env(g, t, 0.01, peak, dur);
    o.connect(g).connect(master);
    o.start(t);
    o.stop(t + dur + 0.05);
  }
  function burst(freq, q, dur, peak, type = 'bandpass') {
    const c = ctx(), t = c.currentTime;
    const s = noise(), f = c.createBiquadFilter(), g = c.createGain();
    f.type = type;
    f.frequency.value = freq;
    f.Q.value = q;
    env(g, t, 0.003, peak, dur);
    s.connect(f).connect(g).connect(master);
    s.start(t, Math.random());
    s.stop(t + dur + 0.05);
  }
  function bed(freq, gain, lfo) {
    const c = ctx();
    const s = noise(), f = c.createBiquadFilter(), g = c.createGain();
    f.type = 'lowpass';
    f.frequency.value = freq;
    g.gain.value = gain;
    s.connect(f).connect(g).connect(master);
    s.start();
    nodes.push(s);
    if (lfo) {
      const o = c.createOscillator(), og = c.createGain();
      o.frequency.value = lfo;
      og.gain.value = gain * 0.8;
      o.connect(og).connect(g.gain);
      o.start();
      nodes.push(o);
    }
  }
  const PENTA = [523.25, 587.33, 659.25, 783.99, 880, 1046.5];
  const SCAPES = {
    mevsim() {
      bed(500, 0.012, 0.07);
      loop(() => {
        const n = 2 + Math.floor(Math.random() * 3), f = 2600 + Math.random() * 1400;
        for (let i = 0; i < n; i++) tone('sine', f, f * 1.45, 0.07, 0.05, i * 0.11);
      }, 1800, 5200);
    },
    zaman() {
      let tick = true;
      loop(() => {
        burst(tick ? 3200 : 2300, 8, 0.02, 0.09);
        tick = !tick;
      }, 1000, 1000);
    },
    anilar() {
      bed(520, 0.035, 0.09);
    },
    kalp() {
      bed(320, 0.03, 0.3);
      loop(() => burst(1800 + Math.random() * 2600, 2, 0.012 + Math.random() * 0.02, 0.05 + Math.random() * 0.06, 'highpass'), 70, 650);
    },
    oyun() {
      loop(() => tone('sine', PENTA[Math.floor(Math.random() * PENTA.length)] * 2, 0, 1.6, 0.025), 1400, 3800);
    },
    hazine() {
      loop(() => {
        const f = 900 + Math.random() * 700;
        tone('sine', f, f * 0.55, 0.12, 0.05);
        tone('sine', f, f * 0.55, 0.12, 0.018, 0.28);
      }, 1700, 4600);
    },
  };
  function stop() {
    cur = '';
    timers.forEach(clearTimeout);
    timers = [];
    const m = master, ns = nodes;
    nodes = [];
    master = null;
    if (!m) return;
    try {
      const t = ctx().currentTime;
      m.gain.setTargetAtTime(0.0001, t, 0.4);
      setTimeout(() => {
        ns.forEach((n) => {
          try {
            n.stop();
          } catch (e) {}
        });
        m.disconnect();
      }, 1600);
    } catch (e) {}
  }
  function play(wing) {
    if (wing === cur) return;
    stop();
    if (!wing || !SCAPES[wing] || !ok() || !ctx()) return;
    const c = ctx();
    if (c.state === 'suspended') return;
    cur = wing;
    master = c.createGain();
    master.gain.value = 0.0001;
    master.connect(c.destination);
    master.gain.setTargetAtTime(1, c.currentTime, 0.8);
    try {
      SCAPES[wing]();
    } catch (e) {
      stop();
    }
  }
  const wingOf = (id) => {
    const r = K.rooms.find((x) => x.id === id);
    return r ? K.val(r.wing) : '';
  };
  K.on('room', ({ id }) => play(SILENT.includes(id) ? '' : wingOf(id)));
  window.addEventListener('hashchange', () => setTimeout(() => !K.activeRoom && stop(), 0));
  document.addEventListener('visibilitychange', () => document.hidden && stop());
  K.on('atolyeTg', ({ k, v }) => {
    if ((k === 'kanatses' || k === 'ses') && !v) stop();
    if (k === 'kanatses' && v && K.activeRoom) play(wingOf(K.activeRoom));
  });
  K.kanatses = { play, stop, now: () => cur };
})();
