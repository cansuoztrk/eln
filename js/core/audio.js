/* Eln'in Krallığı — ses motoru: müzik kutusu, efektler, mikrofon (hepsi Web Audio ile üretiliyor, dosya yok) */
(function () {
  'use strict';
  const K = window.K;
  let ctx, master, musicBus, sfxBus, reverb;

  function ensure() {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    if (!ctx) {
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = 0.9;
      master.connect(ctx.destination);
      reverb = ctx.createConvolver();
      reverb.buffer = impulse(2.4, 2.6);
      const wet = ctx.createGain();
      wet.gain.value = 0.32;
      reverb.connect(wet);
      wet.connect(master);
      musicBus = ctx.createGain();
      musicBus.gain.value = 0.5;
      musicBus.connect(master);
      musicBus.connect(reverb);
      sfxBus = ctx.createGain();
      sfxBus.gain.value = 0.55;
      sfxBus.connect(master);
      const sfxSend = ctx.createGain();
      sfxSend.gain.value = 0.25;
      sfxBus.connect(sfxSend);
      sfxSend.connect(reverb);
    }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  function impulse(seconds, decay) {
    const rate = ctx.sampleRate;
    const len = Math.floor(rate * seconds);
    const buf = ctx.createBuffer(2, len, rate);
    for (let ch = 0; ch < 2; ch++) {
      const d = buf.getChannelData(ch);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay);
    }
    return buf;
  }

  let noiseBuf;
  function noise() {
    if (!noiseBuf) {
      noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
      const d = noiseBuf.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    }
    const s = ctx.createBufferSource();
    s.buffer = noiseBuf;
    return s;
  }

  const NOTE = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
  const midi = (name) => {
    const m = name.match(/^([A-G])([#b]?)(\d)$/);
    return 12 * (+m[3] + 1) + NOTE[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0);
  };
  const freq = (m) => 440 * Math.pow(2, (m - 69) / 12);

  // Müzik kutusu dili: temel + hafif uyumsuz üst tınılar, hızlı atak, uzun sönüm
  function bell(f, t, opt = {}) {
    const { dur = 1.6, vol = 0.2, dest = musicBus } = opt;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.006);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    g.connect(dest);
    [
      [1, 1],
      [2, 0.26],
      [3.01, 0.09],
      [4.18, 0.035],
    ].forEach(([mul, amp]) => {
      const o = ctx.createOscillator();
      o.type = 'sine';
      o.frequency.value = f * mul;
      const og = ctx.createGain();
      og.gain.value = amp;
      o.connect(og);
      og.connect(g);
      o.start(t);
      o.stop(t + dur + 0.05);
    });
  }

  /* ---------- Melodiler ---------- */
  // "Eln'in Valsi" — bu site için yazılmış özgün bir vals (3/4). [nota, vuruş]
  const WALTZ_MELODY = [
    ['E5', 1], ['G5', 1], ['C6', 1],
    ['B5', 2], ['G5', 1],
    ['A5', 1], ['C6', 1], ['F6', 1],
    ['E6', 3],
    ['D6', 1], ['C6', 1], ['B5', 1],
    ['A5', 2], ['F5', 1],
    ['G5', 1], ['A5', 1], ['B5', 1],
    ['C6', 3],
    ['E6', 1], ['D6', 1], ['C6', 1],
    ['G6', 2], ['E6', 1],
    ['F6', 1], ['E6', 1], ['D6', 1],
    ['C6', 2], ['A5', 1],
    ['G5', 1], ['C6', 1], ['E6', 1],
    ['D6', 2], ['B5', 1],
    ['C6', 1], ['G5', 1], ['E5', 1],
    ['C6', 3],
  ];
  const WALTZ_CHORDS = [
    ['C3', 'E4', 'G4'], ['G2', 'D4', 'G4'], ['F2', 'C4', 'A4'], ['C3', 'E4', 'G4'],
    ['G2', 'D4', 'F4'], ['D3', 'F4', 'A4'], ['G2', 'B3', 'D4'], ['C3', 'E4', 'G4'],
    ['A2', 'C4', 'E4'], ['C3', 'E4', 'G4'], ['D3', 'F4', 'A4'], ['A2', 'C4', 'E4'],
    ['C3', 'E4', 'G4'], ['G2', 'B3', 'D4'], ['C3', 'E4', 'G4'], ['C3', 'G3', 'C4'],
  ];
  function buildWaltz() {
    const ev = [];
    let beat = 0;
    WALTZ_MELODY.forEach(([n, len]) => {
      ev.push({ beat, m: midi(n), len, vol: 0.22 });
      beat += len;
    });
    WALTZ_CHORDS.forEach((c, bar) => {
      const b = bar * 3;
      ev.push({ beat: b, m: midi(c[0]), len: 3, vol: 0.13 });
      ev.push({ beat: b + 1, m: midi(c[1]), len: 1, vol: 0.06 }, { beat: b + 1, m: midi(c[2]), len: 1, vol: 0.06 });
      ev.push({ beat: b + 2, m: midi(c[1]), len: 1, vol: 0.05 }, { beat: b + 2, m: midi(c[2]), len: 1, vol: 0.05 });
    });
    return { events: ev.sort((a, b) => a.beat - b.beat), beats: 48, bpm: 96 };
  }
  // "İyi ki doğdun" (Happy Birthday — kamu malı melodi), 3/4. Piyanodaki notalarla (G4–G5) çalınabilir.
  const BIRTHDAY = [
    ['G4', 0.75], ['G4', 0.25], ['A4', 1], ['G4', 1], ['C5', 1], ['B4', 2],
    ['G4', 0.75], ['G4', 0.25], ['A4', 1], ['G4', 1], ['D5', 1], ['C5', 2],
    ['G4', 0.75], ['G4', 0.25], ['G5', 1], ['E5', 1], ['C5', 1], ['B4', 1], ['A4', 2],
    ['F5', 0.75], ['F5', 0.25], ['E5', 1], ['C5', 1], ['D5', 1], ['C5', 3],
  ];
  function buildBirthday() {
    const ev = [];
    let beat = 0;
    BIRTHDAY.forEach(([n, len]) => {
      ev.push({ beat, m: midi(n), len, vol: 0.24, name: n });
      beat += len;
    });
    return { events: ev, beats: beat + 1, bpm: 110 };
  }
  const melodies = { waltz: buildWaltz(), birthday: buildBirthday() };

  // Bir melodiyi bir kez (ya da döngüde) çalar. onNote(ev) görsel senkron için.
  function play(name, opt = {}) {
    if (!ensure()) return { stop() {} };
    const mel = melodies[name];
    const spb = 60 / (opt.bpm || mel.bpm);
    const dest = opt.dest || musicBus;
    let i = 0,
      loop = 0,
      stopped = false;
    const start = ctx.currentTime + 0.08;
    const timers = [];
    const tick = () => {
      if (stopped) return;
      const horizon = ctx.currentTime + 0.25;
      while (true) {
        if (i >= mel.events.length) {
          if (!opt.loop) break;
          i = 0;
          loop++;
        }
        const e = mel.events[i];
        const t = start + (loop * mel.beats + e.beat) * spb;
        if (t > horizon) break;
        bell(freq(e.m), t, { vol: e.vol * (opt.vol || 1), dur: Math.max(0.9, e.len * spb * 1.6), dest });
        if (opt.onNote && e.vol > 0.15) {
          const delay = Math.max(0, (t - ctx.currentTime) * 1000);
          timers.push(setTimeout(() => !stopped && opt.onNote(e), delay));
        }
        i++;
      }
      if (!opt.loop && i >= mel.events.length) {
        const endIn = (start + mel.beats * spb - ctx.currentTime) * 1000;
        timers.push(setTimeout(() => !stopped && opt.onEnd && opt.onEnd(), Math.max(0, endIn)));
        return;
      }
      timers.push(setTimeout(tick, 60));
    };
    tick();
    return {
      stop() {
        stopped = true;
        timers.forEach(clearTimeout);
      },
    };
  }

  /* ---------- Arka plan müziği ---------- */
  const music = {
    on: false,
    handle: null,
    gain: null,
    start() {
      if (!ensure() || this.on) return;
      this.on = true;
      this.gain = ctx.createGain();
      this.gain.gain.setValueAtTime(0.0001, ctx.currentTime);
      this.gain.gain.exponentialRampToValueAtTime(1, ctx.currentTime + 1.2);
      this.gain.connect(musicBus);
      this.handle = play('waltz', { loop: true, dest: this.gain, vol: 0.85 });
      K.store.set('music', true);
      K.emit('music', true);
    },
    stop(remember = true) {
      if (!this.on) return;
      this.on = false;
      const g = this.gain,
        h = this.handle;
      if (g) {
        g.gain.cancelScheduledValues(ctx.currentTime);
        g.gain.setValueAtTime(g.gain.value, ctx.currentTime);
        g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.6);
      }
      setTimeout(() => {
        h && h.stop();
        g && g.disconnect();
      }, 700);
      if (remember) K.store.set('music', false);
      K.emit('music', false);
    },
    toggle() {
      this.on ? this.stop() : this.start();
    },
    wanted: () => K.store.get('music', true),
  };

  /* ---------- Efektler ---------- */
  function env(g, t, a, peak, d) {
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(peak, t + a);
    g.gain.exponentialRampToValueAtTime(0.0001, t + d);
  }
  const sfx = {
    pop() {
      if (!ensure()) return;
      const t = ctx.currentTime,
        o = ctx.createOscillator(),
        g = ctx.createGain();
      o.type = 'sine';
      o.frequency.setValueAtTime(880, t);
      o.frequency.exponentialRampToValueAtTime(440, t + 0.09);
      env(g, t, 0.005, 0.35, 0.12);
      o.connect(g).connect(sfxBus);
      o.start(t);
      o.stop(t + 0.15);
    },
    tap() {
      if (!ensure()) return;
      bell(1568 + Math.random() * 200, ctx.currentTime, { vol: 0.06, dur: 0.4, dest: sfxBus });
    },
    sparkle() {
      if (!ensure()) return;
      const t = ctx.currentTime;
      ['C6', 'E6', 'G6', 'C7'].forEach((n, i) => bell(freq(midi(n)), t + i * 0.07, { vol: 0.12, dur: 0.9, dest: sfxBus }));
    },
    chime() {
      if (!ensure()) return;
      const t = ctx.currentTime;
      ['G5', 'C6', 'E6', 'G6', 'C7'].forEach((n, i) => bell(freq(midi(n)), t + i * 0.09, { vol: 0.16, dur: 1.4, dest: sfxBus }));
    },
    success() {
      if (!ensure()) return;
      const t = ctx.currentTime;
      ['C6', 'G6'].forEach((n, i) => bell(freq(midi(n)), t + i * 0.1, { vol: 0.18, dur: 1, dest: sfxBus }));
    },
    fail() {
      if (!ensure()) return;
      const t = ctx.currentTime;
      ['E5', 'C5'].forEach((n, i) => bell(freq(midi(n)), t + i * 0.14, { vol: 0.14, dur: 0.7, dest: sfxBus }));
    },
    whoosh() {
      if (!ensure()) return;
      const t = ctx.currentTime,
        n = noise(),
        f = ctx.createBiquadFilter(),
        g = ctx.createGain();
      f.type = 'bandpass';
      f.Q.value = 1.2;
      f.frequency.setValueAtTime(400, t);
      f.frequency.exponentialRampToValueAtTime(2600, t + 0.35);
      env(g, t, 0.08, 0.4, 0.45);
      n.connect(f).connect(g).connect(sfxBus);
      n.start(t);
      n.stop(t + 0.5);
    },
    paper() {
      if (!ensure()) return;
      const t = ctx.currentTime,
        n = noise(),
        f = ctx.createBiquadFilter(),
        g = ctx.createGain();
      f.type = 'highpass';
      f.frequency.value = 2500;
      env(g, t, 0.01, 0.25, 0.25);
      n.connect(f).connect(g).connect(sfxBus);
      n.start(t);
      n.stop(t + 0.3);
    },
    meow(pitch = 1) {
      if (!ensure()) return;
      const t = ctx.currentTime,
        o = ctx.createOscillator(),
        f = ctx.createBiquadFilter(),
        f2 = ctx.createBiquadFilter(),
        g = ctx.createGain(),
        vib = ctx.createOscillator(),
        vibG = ctx.createGain();
      o.type = 'sawtooth';
      o.frequency.setValueAtTime(430 * pitch, t);
      o.frequency.linearRampToValueAtTime(820 * pitch, t + 0.2);
      o.frequency.linearRampToValueAtTime(540 * pitch, t + 0.6);
      vib.frequency.value = 7;
      vibG.gain.value = 12 * pitch;
      vib.connect(vibG).connect(o.frequency);
      f.type = 'bandpass';
      f.Q.value = 5;
      f.frequency.setValueAtTime(800, t);
      f.frequency.linearRampToValueAtTime(1900, t + 0.22);
      f.frequency.linearRampToValueAtTime(1000, t + 0.6);
      f2.type = 'lowpass';
      f2.frequency.value = 3200;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.7, t + 0.07);
      g.gain.setValueAtTime(0.7, t + 0.38);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.66);
      o.connect(f).connect(f2).connect(g).connect(sfxBus);
      o.start(t);
      vib.start(t);
      o.stop(t + 0.7);
      vib.stop(t + 0.7);
    },
    purr(sec = 1.6) {
      if (!ensure()) return;
      const t = ctx.currentTime,
        n = noise(),
        f = ctx.createBiquadFilter(),
        g = ctx.createGain(),
        lfo = ctx.createOscillator(),
        lfoG = ctx.createGain(),
        out = ctx.createGain();
      f.type = 'lowpass';
      f.frequency.value = 260;
      g.gain.value = 0.5;
      lfo.type = 'triangle';
      lfo.frequency.value = 24;
      lfoG.gain.value = 0.5;
      lfo.connect(lfoG).connect(g.gain);
      env(out, t, 0.2, 1.4, sec);
      n.connect(f).connect(g).connect(out).connect(sfxBus);
      n.start(t);
      lfo.start(t);
      n.stop(t + sec + 0.1);
      lfo.stop(t + sec + 0.1);
    },
    sneeze() {
      if (!ensure()) return;
      const t = ctx.currentTime;
      [
        [0, 1400, 0.18, 0.25],
        [0.28, 3800, 0.3, 0.5],
      ].forEach(([d, fr, peak, len]) => {
        const n = noise(),
          f = ctx.createBiquadFilter(),
          g = ctx.createGain();
        f.type = 'bandpass';
        f.frequency.value = fr;
        f.Q.value = 0.8;
        env(g, t + d, 0.02, peak * 2, len);
        n.connect(f).connect(g).connect(sfxBus);
        n.start(t + d);
        n.stop(t + d + len + 0.05);
      });
    },
    giggle() {
      if (!ensure()) return;
      const t = ctx.currentTime;
      for (let i = 0; i < 5; i++) {
        const o = ctx.createOscillator(),
          g = ctx.createGain();
        o.type = 'triangle';
        const s = t + i * 0.11;
        o.frequency.setValueAtTime(900 - i * 40, s);
        o.frequency.exponentialRampToValueAtTime(700 - i * 40, s + 0.08);
        env(g, s, 0.01, 0.2, 0.09);
        o.connect(g).connect(sfxBus);
        o.start(s);
        o.stop(s + 0.1);
      }
    },
    note(name, vol = 0.24) {
      if (!ensure()) return;
      bell(freq(typeof name === 'number' ? name : midi(name)), ctx.currentTime, { vol, dur: 1.5, dest: sfxBus });
    },
    tick() {
      if (!ensure()) return;
      bell(2200, ctx.currentTime, { vol: 0.03, dur: 0.15, dest: sfxBus });
    },
  };

  /* ---------- Mikrofon ---------- */
  async function micStream() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) throw new Error('no-mic');
    ensure();
    return navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: false, autoGainControl: true } });
  }

  // Ses kaydı (ham PCM). stop() → AudioBuffer
  async function recorder(onLevel) {
    const stream = await micStream();
    const src = ctx.createMediaStreamSource(stream);
    const proc = ctx.createScriptProcessor(4096, 1, 1);
    const mute = ctx.createGain();
    mute.gain.value = 0;
    const chunks = [];
    proc.onaudioprocess = (e) => {
      const d = e.inputBuffer.getChannelData(0);
      chunks.push(new Float32Array(d));
      if (onLevel) {
        let s = 0;
        for (let i = 0; i < d.length; i += 8) s += d[i] * d[i];
        onLevel(Math.sqrt(s / (d.length / 8)));
      }
    };
    src.connect(proc);
    proc.connect(mute).connect(ctx.destination);
    return {
      stop() {
        proc.disconnect();
        src.disconnect();
        stream.getTracks().forEach((t) => t.stop());
        const len = chunks.reduce((a, c) => a + c.length, 0);
        if (!len) return null;
        const all = new Float32Array(len);
        let o = 0;
        chunks.forEach((c) => {
          all.set(c, o);
          o += c.length;
        });
        // Baştaki ve sondaki sessizliği kırp
        const th = 0.02;
        let a = 0,
          b = all.length - 1;
        while (a < b && Math.abs(all[a]) < th) a++;
        while (b > a && Math.abs(all[b]) < th) b--;
        a = Math.max(0, a - 2000);
        b = Math.min(all.length, b + 4000);
        if (b - a < 2000) return null;
        const buf = ctx.createBuffer(1, b - a, ctx.sampleRate);
        buf.getChannelData(0).set(all.subarray(a, b));
        return buf;
      },
    };
  }

  // Kaydı "Angela sesi" ile (daha tiz ve hızlı) çal; seviye ile ağız animasyonu
  function playChipmunk(buffer, onLevel, onEnd) {
    ensure();
    const s = ctx.createBufferSource();
    s.buffer = buffer;
    s.playbackRate.value = 1.55;
    const an = ctx.createAnalyser();
    an.fftSize = 512;
    const g = ctx.createGain();
    g.gain.value = 1.6;
    s.connect(an);
    an.connect(g).connect(sfxBus);
    const data = new Uint8Array(an.fftSize);
    let raf;
    const loop = () => {
      an.getByteTimeDomainData(data);
      let sum = 0;
      for (let i = 0; i < data.length; i++) {
        const v = (data[i] - 128) / 128;
        sum += v * v;
      }
      onLevel && onLevel(Math.sqrt(sum / data.length));
      raf = requestAnimationFrame(loop);
    };
    loop();
    s.onended = () => {
      cancelAnimationFrame(raf);
      onLevel && onLevel(0);
      onEnd && onEnd();
    };
    s.start();
  }

  // Üfleme algılayıcı (pasta mumları için). onBlow(), stop() döndürür
  async function blowDetector(onBlow, onLevel) {
    const stream = await micStream();
    const src = ctx.createMediaStreamSource(stream);
    const an = ctx.createAnalyser();
    an.fftSize = 1024;
    src.connect(an);
    const data = new Float32Array(an.fftSize);
    let strong = 0,
      raf,
      done = false;
    const loop = () => {
      an.getFloatTimeDomainData(data);
      let s = 0;
      for (let i = 0; i < data.length; i++) s += data[i] * data[i];
      const rms = Math.sqrt(s / data.length);
      onLevel && onLevel(rms);
      strong = rms > 0.09 ? strong + 1 : Math.max(0, strong - 1);
      if (strong > 10 && !done) {
        done = true;
        onBlow();
      }
      raf = requestAnimationFrame(loop);
    };
    loop();
    return {
      stop() {
        cancelAnimationFrame(raf);
        src.disconnect();
        stream.getTracks().forEach((t) => t.stop());
      },
    };
  }

  K.audio = { ensure, play, music, sfx, melodies, midi, recorder, playChipmunk, blowDetector, get ctx() { return ctx; } };
})();
