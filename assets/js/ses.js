/* Kızıl Kapsül — ses efektleri. Hepsi Web Audio ile anlık sentezlenir, dosya yok. */
(function (kok) {
  'use strict';
  const KK = (kok.KK = kok.KK || {});
  let ctx = null;
  let ana = null;
  let acik = true;
  try { acik = localStorage.getItem('kk-ses') !== 'kapali'; } catch (e) { /* depolama yok */ }

  function baglam() {
    if (!ctx) {
      const AC = kok.AudioContext || kok.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
      ana = ctx.createGain();
      ana.gain.value = 0.32;
      ana.connect(ctx.destination);
    }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  function ton(frek, sure, opt) {
    if (!acik) return;
    const c = baglam(); if (!c) return;
    opt = opt || {};
    const t = c.currentTime + (opt.gecikme || 0);
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = opt.tip || 'sine';
    o.frequency.setValueAtTime(frek, t);
    if (opt.bitis) o.frequency.exponentialRampToValueAtTime(opt.bitis, t + sure);
    const v = opt.ses || 0.5;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(v, t + Math.min(0.02, sure / 4));
    g.gain.exponentialRampToValueAtTime(0.0001, t + sure);
    o.connect(g); g.connect(ana);
    o.start(t); o.stop(t + sure + 0.05);
  }

  function gurultu(sure, opt) {
    if (!acik) return;
    const c = baglam(); if (!c) return;
    opt = opt || {};
    const t = c.currentTime + (opt.gecikme || 0);
    const buf = c.createBuffer(1, Math.floor(c.sampleRate * sure), c.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / d.length, opt.sonum || 2);
    const s = c.createBufferSource(); s.buffer = buf;
    const f = c.createBiquadFilter(); f.type = opt.filtre || 'lowpass'; f.frequency.value = opt.frek || 900;
    const g = c.createGain(); g.gain.value = opt.ses || 0.5;
    s.connect(f); f.connect(g); g.connect(ana);
    s.start(t);
  }

  KK.Ses = {
    acikMi: () => acik,
    ayarla(v) {
      acik = !!v;
      try { localStorage.setItem('kk-ses', acik ? 'acik' : 'kapali'); } catch (e) { /* yok */ }
      if (acik) baglam();
    },
    uyandir() { if (acik) baglam(); },
    tik() { ton(1400, 0.04, { tip: 'square', ses: 0.08 }); },
    bip() { ton(880, 0.09, { tip: 'square', ses: 0.12 }); },
    mesaj() { ton(620, 0.05, { tip: 'triangle', ses: 0.12 }); ton(930, 0.06, { tip: 'triangle', ses: 0.1, gecikme: 0.05 }); },
    alarm() {
      for (let i = 0; i < 3; i++) ton(740, 0.28, { tip: 'sawtooth', ses: 0.16, bitis: 520, gecikme: i * 0.34 });
    },
    salter(yesil) {
      gurultu(0.08, { frek: 2400, ses: 0.5, filtre: 'bandpass' });
      ton(yesil ? 520 : 180, 0.16, { tip: 'square', ses: 0.12, gecikme: 0.05 });
    },
    fisilti() { gurultu(0.7, { frek: 3200, filtre: 'highpass', ses: 0.12, sonum: 0.6 }); },
    zil() {
      for (let i = 0; i < 6; i++) { ton(1250, 0.05, { tip: 'square', ses: 0.08, gecikme: i * 0.07 }); }
      for (let i = 0; i < 6; i++) { ton(1250, 0.05, { tip: 'square', ses: 0.08, gecikme: 0.7 + i * 0.07 }); }
    },
    eslesme() { ton(660, 0.12, { tip: 'triangle', ses: 0.2 }); ton(990, 0.2, { tip: 'triangle', ses: 0.2, gecikme: 0.12 }); },
    uyusmazlik() { ton(220, 0.35, { tip: 'sawtooth', ses: 0.16 }); ton(207, 0.35, { tip: 'sawtooth', ses: 0.16 }); },
    sayac() { ton(1046, 0.12, { tip: 'square', ses: 0.1 }); },
    oy() { ton(300, 0.07, { tip: 'square', ses: 0.12 }); gurultu(0.05, { frek: 600, ses: 0.3 }); },
    kilit() {
      gurultu(1.2, { frek: 500, ses: 0.7, sonum: 1.2 });
      ton(90, 1.0, { tip: 'sawtooth', ses: 0.2, bitis: 40 });
    },
    kalp() {
      ton(60, 0.12, { tip: 'sine', ses: 0.7 });
      ton(55, 0.14, { tip: 'sine', ses: 0.55, gecikme: 0.22 });
    },
    patlama() {
      gurultu(2.2, { frek: 400, ses: 1, sonum: 1.4 });
      ton(70, 1.6, { tip: 'sawtooth', ses: 0.3, bitis: 25 });
    },
    kalkis() {
      gurultu(2.6, { frek: 1200, ses: 0.5, sonum: 0.8 });
      ton(110, 2.6, { tip: 'sawtooth', ses: 0.12, bitis: 520 });
    },
    zafer() { [523, 659, 784, 1046].forEach((f, i) => ton(f, 0.3, { tip: 'triangle', ses: 0.18, gecikme: i * 0.13 })); },
    yenilgi() { [392, 349, 311, 262].forEach((f, i) => ton(f, 0.4, { tip: 'triangle', ses: 0.18, gecikme: i * 0.18 })); }
  };
})(typeof window !== 'undefined' ? window : globalThis);
