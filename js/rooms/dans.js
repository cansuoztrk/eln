/* Oda: Dans Pisti — bu site için yazılmış özgün bir swing parçası (Web Audio ile çalınır) ve iki şeritli ritim oyunu.
   İkisi aynı anda pistteyse (bulut) birlikte başlarlar: karşı tarafın her adımı öbür ekrandaki Kitty'yi oynatır, sonunda uyum ölçülür. */
(function () {
  'use strict';
  const K = window.K;
  const A = K.art;
  const D = window.ELN;
  const C = D.config;

  const BPM = 132;
  const SPB = 60 / BPM;
  const NOTE = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
  const midi = (n) => {
    const m = n.match(/^([A-G])([#b]?)(\d)$/);
    return 12 * (+m[3] + 1) + NOTE[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0);
  };
  const hz = (m) => 440 * Math.pow(2, (m - 69) / 12);

  /* ---------------- "Kilerdeki Swing" (özgün) ---------------- */
  const CH = {
    C6: { bass: ['C3', 'E3', 'G3', 'A3'], v: ['E4', 'G4', 'A4', 'C5'] },
    A7: { bass: ['A2', 'C#3', 'E3', 'G3'], v: ['C#4', 'E4', 'G4', 'A4'] },
    Dm7: { bass: ['D3', 'F3', 'A3', 'C3'], v: ['D4', 'F4', 'A4', 'C5'] },
    G7: { bass: ['G2', 'B2', 'D3', 'F3'], v: ['F4', 'G4', 'B4', 'D5'] },
    F6: { bass: ['F2', 'A2', 'C3', 'D3'], v: ['F4', 'A4', 'C5', 'D5'] },
    D7: { bass: ['D3', 'F#3', 'A3', 'C3'], v: ['F#4', 'A4', 'C5', 'D5'] },
  };
  const A_CH = ['C6', 'A7', 'Dm7', 'G7', 'C6', 'A7', ['Dm7', 'G7'], 'C6'];
  const B_CH = ['F6', 'F6', 'C6', 'C6', 'D7', 'D7', 'G7', 'G7'];
  const CHORDS = [...A_CH, ...A_CH, ...B_CH, ...A_CH];
  const t3 = 2 / 3, s3 = 1 / 3; // swing sekizlikleri
  const A_MEL = [
    [['E5', 0, t3], ['G5', t3, s3], ['A5', 1, 1], ['G5', 2, t3], ['E5', 2 + t3, 1 + s3]],
    [['C#5', 0, t3], ['E5', t3, s3], ['G5', 1, 1], ['A5', 2, 2]],
    [['F5', 0, t3], ['A5', t3, s3], ['C6', 1, 1], ['A5', 2, t3], ['F5', 2 + t3, 1 + s3]],
    [['D5', 0, 1], ['F5', 1, t3], ['G5', 1 + t3, s3], ['B4', 2, 2]],
    [['E5', 0, t3], ['G5', t3, s3], ['A5', 1, 1], ['C6', 2, t3], ['A5', 2 + t3, 1 + s3]],
    [['G5', 0, t3], ['E5', t3, s3], ['C#5', 1, 1], ['E5', 2, 1], ['G5', 3, 1]],
    [['F5', 0, 1], ['A5', 1, 1], ['G5', 2, t3], ['F5', 2 + t3, s3], ['D5', 3, 1]],
  ];
  const END1 = [['C5', 0, t3], ['E5', t3, s3], ['G5', 1, 1], ['C6', 2, 2]];
  const END2 = [['C6', 0, 1], ['G5', 1, t3], ['E5', 1 + t3, s3], ['C5', 2, 2]];
  const END3 = [['C6', 0, t3], ['A5', t3, s3], ['G5', 1, 1], ['E5', 2, t3], ['C6', 2 + t3, 1 + s3]];
  const B_MEL = [
    [['A5', 0, t3], ['C6', t3, s3], ['D6', 1, 1], ['C6', 2, t3], ['A5', 2 + t3, 1 + s3]],
    [['F5', 0, 1], ['A5', 1, 1], ['C6', 2, 2]],
    [['G5', 0, t3], ['E5', t3, s3], ['G5', 1, 1], ['A5', 2, t3], ['G5', 2 + t3, 1 + s3]],
    [['E5', 0, 1], ['C5', 1, 1], ['E5', 2, 2]],
    [['F#5', 0, t3], ['A5', t3, s3], ['C6', 1, 1], ['A5', 2, t3], ['F#5', 2 + t3, 1 + s3]],
    [['D5', 0, 1], ['F#5', 1, 1], ['A5', 2, 2]],
    [['B5', 0, t3], ['A5', t3, s3], ['G5', 1, 1], ['F5', 2, t3], ['D5', 2 + t3, 1 + s3]],
    [['G5', 0, 1], ['F5', 1, 1], ['D5', 2, 1], ['B4', 3, 1]],
  ];
  const MELODY = [...A_MEL, END1, ...A_MEL, END2, ...B_MEL, ...A_MEL, END3];
  const BARS = MELODY.length; // 32
  const LEAD = 4; // sayım vuruşu

  // Oyun notaları: kısa swing notaları hariç her ezgi notası; ses yükselirse sağ, inerse sol
  const NOTES = (() => {
    const out = [];
    let prev = 72, lane = 0;
    MELODY.forEach((bar, b) =>
      bar.forEach(([n, at, len]) => {
        if (len < 0.5) return;
        const m = midi(n);
        lane = m > prev ? 1 : m < prev ? 0 : 1 - lane;
        prev = m;
        out.push({ t: (LEAD + b * 4 + at) * SPB, lane });
      })
    );
    return out;
  })();

  /* ---------------- Ses ---------------- */
  let ctx, out, noiseBuf;
  function audio() {
    if (!K.audio.ensure()) return false;
    ctx = K.audio.ctx;
    if (!out) {
      out = ctx.createGain();
      out.gain.value = 0.8;
      out.connect(ctx.destination);
      noiseBuf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
      const d = noiseBuf.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    }
    return true;
  }
  function tone(f, t, dur, vol, type = 'triangle', lp = 3000) {
    const o = ctx.createOscillator(), g = ctx.createGain(), fl = ctx.createBiquadFilter();
    o.type = type;
    o.frequency.value = f;
    fl.type = 'lowpass';
    fl.frequency.value = lp;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(fl).connect(g).connect(out);
    o.start(t);
    o.stop(t + dur + 0.05);
  }
  function noise(t, dur, vol, type, f) {
    const s = ctx.createBufferSource(), g = ctx.createGain(), fl = ctx.createBiquadFilter();
    s.buffer = noiseBuf;
    fl.type = type;
    fl.frequency.value = f;
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(fl).connect(g).connect(out);
    s.start(t);
    s.stop(t + dur + 0.02);
  }
  function kick(t) {
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.frequency.setValueAtTime(110, t);
    o.frequency.exponentialRampToValueAtTime(45, t + 0.14);
    g.gain.setValueAtTime(0.35, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.18);
    o.connect(g).connect(out);
    o.start(t);
    o.stop(t + 0.2);
  }
  // Bütün parçayı t0'dan itibaren programla
  function schedule(t0) {
    for (let i = 0; i < LEAD; i++) noise(t0 + i * SPB, 0.05, i === 0 ? 0.5 : 0.3, 'highpass', 5000);
    const base = t0 + LEAD * SPB;
    CHORDS.forEach((c, b) => {
      const bt = base + b * 4 * SPB;
      const parts = Array.isArray(c) ? c : [c, c];
      const walk = Array.isArray(c) ? [CH[c[0]].bass[0], CH[c[0]].bass[2], CH[c[1]].bass[0], CH[c[1]].bass[2]] : CH[c].bass;
      walk.forEach((n, k) => tone(hz(midi(n)), bt + k * SPB, SPB * 0.95, 0.32, 'triangle', 700));
      // Charleston: 1 ve 2'nin "ve"si
      [[0, parts[0]], [1 + t3, parts[0]], [2, parts[1]], [3 + t3, parts[1]]].forEach(([at, ch], k) => CH[ch].v.forEach((n) => tone(hz(midi(n)), bt + at * SPB, k % 2 ? 0.18 : 0.32, 0.045, 'triangle', 2200)));
      for (let k = 0; k < 4; k++) {
        noise(bt + k * SPB, 0.12, 0.09, 'highpass', 7000);
        if (k % 2) {
          noise(bt + (k + t3) * SPB, 0.08, 0.06, 'highpass', 7000);
          noise(bt + k * SPB, 0.16, 0.08, 'bandpass', 1800);
        } else kick(bt + k * SPB);
      }
      MELODY[b].forEach(([n, at, len]) => {
        const f = hz(midi(n));
        tone(f, bt + at * SPB, Math.max(0.2, len * SPB * 1.1), 0.12, 'square', 1800);
        tone(f * 2, bt + at * SPB, Math.max(0.15, len * SPB * 0.8), 0.03, 'sine', 4000);
      });
    });
    tone(hz(midi('C4')), base + BARS * 4 * SPB, 1.6, 0.2, 'triangle', 900);
    CH.C6.v.forEach((n) => tone(hz(midi(n)), base + BARS * 4 * SPB, 1.8, 0.06));
  }

  /* ---------------- Oyun ---------------- */
  let root, cv, cx, raf = null, game = null, musicWas = false;
  let otherSeen = 0, pingT = null, partner = null;
  const PERFECT = 0.07, GOOD = 0.15, FALL = 1.7;

  function start(atWall, together) {
    if (!audio() || game) return;
    musicWas = K.audio.music.on;
    if (musicWas) K.audio.music.stop(false);
    const t0 = ctx.currentTime + Math.max(0.15, (atWall - Date.now()) / 1000);
    schedule(t0);
    game = { t0, notes: NOTES.map((n) => ({ ...n, hit: null })), combo: 0, best: 0, perf: 0, good: 0, miss: 0, together, fb: [], end: t0 + (LEAD + BARS * 4) * SPB + 0.5 };
    partner = together ? { combo: 0, acc: null } : null;
    K.$('#dnStart', root).hidden = true;
    K.$('#dnTogether', root).hidden = true;
    K.$('#dnHud', root).hidden = false;
    root.classList.add('playing');
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(loop);
  }
  function judge(lane) {
    if (!game) return;
    const now = ctx.currentTime - game.t0;
    const n = game.notes.find((x) => x.lane === lane && !x.hit && Math.abs(x.t - now) <= GOOD);
    press(lane);
    if (!n) return;
    const d = Math.abs(n.t - now);
    n.hit = d <= PERFECT ? 'p' : 'g';
    game[n.hit === 'p' ? 'perf' : 'good']++;
    game.combo++;
    game.best = Math.max(game.best, game.combo);
    feedback(n.hit === 'p' ? 'Harika!' : 'İyi', lane);
    step('me', lane, game.combo);
    if (game.together) K.cloud.send('dstep', { lane, c: game.combo });
  }
  function press(lane) {
    const b = K.$(`[data-lane="${lane}"]`, root);
    b.classList.add('down');
    setTimeout(() => b.classList.remove('down'), 110);
  }
  function feedback(txt, lane) {
    game.fb.push({ txt, lane, at: performance.now() });
  }
  // Kitty adımları: me = bu cihazdaki oyuncu, other = karşı taraf (ya da tek başınaysa hayalî eş)
  function step(who, lane, combo) {
    const k = K.$(who === 'me' ? '#dnMe' : '#dnOther', root);
    if (!k) return;
    k.classList.remove('l', 'r', 'spin');
    void k.getBoundingClientRect();
    k.classList.add(combo && combo % 16 === 0 ? 'spin' : lane ? 'r' : 'l');
    K.$('#dnFloor', root).classList.toggle('glow', game && game.combo >= 8);
  }
  function loop() {
    raf = requestAnimationFrame(loop);
    const now = ctx.currentTime - game.t0;
    // Kaçanlar
    game.notes.forEach((n) => {
      if (!n.hit && now - n.t > GOOD) {
        n.hit = 'm';
        game.miss++;
        game.combo = 0;
        feedback('Kaçtı', n.lane);
      }
      // Tek başınaysa hayalî eş de adım atar
      if (!game.together && !n.auto && now >= n.t) {
        n.auto = true;
        step('other', n.lane, 0);
      }
    });
    draw(now);
    K.$('#dnCombo', root).textContent = game.combo > 2 ? `${game.combo} kombo` : '';
    if (partner) K.$('#dnPartner', root).textContent = `${K.otherName()}: ${partner.combo} kombo`;
    if (ctx.currentTime > game.end) finish();
  }
  function draw(now) {
    const w = cv.width, h = cv.height, dpr = cv.width / cv.clientWidth || 1;
    const hitY = h - 46 * dpr;
    cx.clearRect(0, 0, w, h);
    [0, 1].forEach((l) => {
      const x = (l + 0.5) * (w / 2);
      cx.strokeStyle = 'rgba(255,255,255,.18)';
      cx.lineWidth = 2 * dpr;
      cx.beginPath();
      cx.moveTo(x, 0);
      cx.lineTo(x, hitY);
      cx.stroke();
      cx.beginPath();
      cx.arc(x, hitY, 24 * dpr, 0, Math.PI * 2);
      cx.stroke();
    });
    game.notes.forEach((n) => {
      if (n.hit === 'p' || n.hit === 'g') return;
      const dy = (n.t - now) / FALL;
      if (dy > 1.05 || dy < -0.2) return;
      const x = (n.lane + 0.5) * (w / 2), y = hitY - dy * hitY;
      heart(x, y, 17 * dpr, n.hit === 'm' ? 'rgba(255,255,255,.25)' : n.lane ? '#8FD3FF' : '#FF6FA3');
    });
    const t = performance.now();
    game.fb = game.fb.filter((f) => t - f.at < 600);
    game.fb.forEach((f) => {
      const a = 1 - (t - f.at) / 600;
      cx.globalAlpha = a;
      cx.fillStyle = f.txt === 'Kaçtı' ? '#B9A7C9' : '#FFF4C7';
      cx.font = `700 ${16 * dpr}px Fredoka, sans-serif`;
      cx.textAlign = 'center';
      cx.fillText(f.txt, (f.lane + 0.5) * (w / 2), hitY - 40 * dpr - (1 - a) * 20 * dpr);
      cx.globalAlpha = 1;
    });
  }
  function heart(x, y, r, c) {
    cx.fillStyle = c;
    cx.beginPath();
    cx.moveTo(x, y + r * 0.7);
    cx.bezierCurveTo(x - r * 1.1, y - r * 0.1, x - r * 1.1, y - r * 1.1, x - r * 0.45, y - r * 1.1);
    cx.bezierCurveTo(x - r * 0.15, y - r * 1.1, x, y - r * 0.85, x, y - r * 0.75);
    cx.bezierCurveTo(x, y - r * 0.85, x + r * 0.15, y - r * 1.1, x + r * 0.45, y - r * 1.1);
    cx.bezierCurveTo(x + r * 1.1, y - r * 1.1, x + r * 1.1, y - r * 0.1, x, y + r * 0.7);
    cx.fill();
  }
  function finish() {
    cancelAnimationFrame(raf);
    const total = game.notes.length;
    const acc = (game.perf + game.good * 0.6) / total;
    const pct = Math.round(acc * 100);
    const g = game;
    game = null;
    root.classList.remove('playing');
    K.$('#dnHud', root).hidden = true;
    K.$('#dnStart', root).hidden = false;
    presence();
    if (musicWas) K.audio.music.start();
    const best = Math.max(pct, K.store.get('danceBest', 0));
    K.store.set('danceBest', best);
    if (pct >= 60) K.stickers.award('dans');
    if (g.together) K.cloud.send('dend', { acc });
    const ends = (D.dans && (pct < 40 && D.dans.low ? D.dans.low : D.dans.end)) || [];
    const msg = ends.length ? K.fill(ends[Math.floor(Math.random() * ends.length)]) : '';
    const show = (pAcc) => {
      const pair = pAcc != null ? Math.round(((acc + pAcc) / 2) * (1 - Math.abs(acc - pAcc) / 2) * 100) : null;
      K.$('#dnResult', root).innerHTML = `<div class="dn-res card"><p class="card-eyebrow">Dans bitti</p>
        <p class="dn-pct">%${pct}</p><p>${g.perf} harika · ${g.good} iyi · ${g.miss} kaçan · en uzun kombo ${g.best}</p>
        ${pair != null ? `<p class="dn-pair">Birlikte uyumunuz: <b>%${pair}</b></p>` : ''}
        <p class="hand">${K.esc(msg)}</p><p class="muted small">En iyi skorun: %${best}</p></div>`;
    };
    show(partner && partner.acc != null ? partner.acc : null);
    if (partner) partner.show = show;
    K.fx.confetti({ count: pct >= 80 ? 140 : 60, shapes: ['heart', 'star'] });
    K.notify(`${C.herName} dans etti`, `Dans Pisti'nde %${pct} tutturdu${g.together ? ' (birlikte)' : ''}.`, ['dancer']);
  }

  /* ---------------- Birlikte ---------------- */
  function presence() {
    const on = K.cloud && K.cloud.enabled && Date.now() - otherSeen < 6500;
    const b = root && K.$('#dnTogether', root);
    if (b) b.hidden = !on || Boolean(game);
    const st = root && K.$('#dnHere', root);
    if (st) st.textContent = K.cloud && K.cloud.enabled ? (on ? `${K.otherName()} pistte!` : `${K.otherName()} pistte değil`) : '';
  }
  K.on('cloud', (on) => {
    if (!on) return;
    K.cloud.onLive('dhere', () => {
      otherSeen = Date.now();
      presence();
    });
    K.cloud.onLive('dinvite', (m) => {
      if (K.activeRoom !== 'dans') return K.fx.toast(`<b>${K.esc(K.otherName())} seni dansa kaldırıyor!</b> <a href="#dans">Piste git</a>`, { icon: A.icon('dance'), duration: 6000 });
      K.fx.toast(`${K.esc(K.otherName())} seni dansa kaldırdı. 3, 2, 1...`, { icon: A.icon('dance') });
      start(m.at, true);
    });
    K.cloud.onLive('dstep', (m) => {
      if (!partner) return;
      partner.combo = m.c;
      step('other', m.lane, m.c);
    });
    K.cloud.onLive('dend', (m) => {
      if (!partner) return;
      partner.acc = m.acc;
      partner.show && partner.show(m.acc);
    });
  });

  K.room({
    id: 'dans',
    wing: 'oyun',
    title: 'Dans Pisti',
    sub: () => (D.dans && D.dans.sub) || 'Birlikte dans',
    icon: 'dance',
    color: '#EDE3FF',
    hidden: () => !D.dans,
    init(el) {
      root = el;
      const other = K.isOwner() ? { crown: true, eyes: 'heart' } : { bow: '#4FA3E3' };
      const me = K.isOwner() ? { bow: '#4FA3E3' } : { crown: true };
      el.innerHTML = `
        <div class="room-intro">${K.paras((D.dans && D.dans.intro) || [])}</div>
        <div class="dn-stage">
          <div class="dn-floor" id="dnFloor"><i class="dn-spot"></i><i class="dn-ball"></i></div>
          <div class="dn-kit me" id="dnMe">${A.kitty(me)}<small>Sen</small></div>
          <div class="dn-kit other" id="dnOther">${A.kitty(other)}<small>${K.esc(K.otherName())}</small></div>
          <div class="dn-hud" id="dnHud" hidden><b id="dnCombo"></b><span id="dnPartner"></span></div>
        </div>
        <div class="dn-lanes">
          <canvas id="dnCv" aria-hidden="true"></canvas>
          <button class="dn-pad l" data-lane="0" aria-label="Sol adım">Sol</button>
          <button class="dn-pad r" data-lane="1" aria-label="Sağ adım">Sağ</button>
        </div>
        <div class="actions" style="justify-content:center">
          <button class="btn red big" id="dnStart">${A.icon('dance')} Dansa başla</button>
          <button class="btn big" id="dnTogether" hidden>${A.icon('hugs')} Birlikte dans et</button>
        </div>
        <p class="muted small dn-here" id="dnHere"></p>
        <p class="muted small" style="text-align:center">Kalpler çizgiye değdiği anda sol ya da sağ tarafa dokun. Klavyede F ve J.</p>
        <div id="dnResult"></div>`;
      cv = K.$('#dnCv', el);
      cx = cv.getContext('2d');
      const fit = () => {
        const r = cv.getBoundingClientRect();
        const dpr = Math.min(2, window.devicePixelRatio || 1);
        cv.width = Math.max(1, r.width * dpr);
        cv.height = Math.max(1, r.height * dpr);
      };
      fit();
      window.addEventListener('resize', fit);
      el.addEventListener('pointerdown', (e) => {
        const p = e.target.closest('[data-lane]');
        if (p) {
          e.preventDefault();
          judge(+p.dataset.lane);
        }
      });
      K.$('#dnStart', el).addEventListener('click', () => {
        K.$('#dnResult', el).innerHTML = '';
        start(Date.now() + 300, false);
      });
      K.$('#dnTogether', el).addEventListener('click', () => {
        const at = Date.now() + 3000;
        K.cloud.send('dinvite', { at });
        K.$('#dnResult', el).innerHTML = '';
        K.fx.toast(`${K.esc(K.otherName())} dansa davet edildi. 3, 2, 1...`, { icon: A.icon('dance') });
        start(at, true);
      });
      document.addEventListener('keydown', (e) => {
        if (K.activeRoom !== 'dans' || e.repeat) return;
        const l = { f: 0, F: 0, ArrowLeft: 0, j: 1, J: 1, ArrowRight: 1 }[e.key];
        if (l != null) judge(l);
      });
    },
    enter() {
      setTimeout(() => {
        const r = cv.getBoundingClientRect();
        const dpr = Math.min(2, window.devicePixelRatio || 1);
        cv.width = Math.max(1, r.width * dpr);
        cv.height = Math.max(1, r.height * dpr);
      }, 50);
      clearInterval(pingT);
      if (K.cloud && K.cloud.enabled) {
        K.cloud.send('dhere', {});
        pingT = setInterval(() => {
          K.cloud.send('dhere', {});
          presence();
        }, 2500);
      }
      presence();
    },
    leave() {
      clearInterval(pingT);
      if (game) {
        cancelAnimationFrame(raf);
        game = null;
        root.classList.remove('playing');
        K.$('#dnHud', root).hidden = true;
        K.$('#dnStart', root).hidden = false;
        try {
          out.gain.setTargetAtTime(0.0001, ctx.currentTime, 0.05);
          const old = out;
          out = null;
          setTimeout(() => old.disconnect(), 400);
        } catch (e) {}
        if (musicWas) K.audio.music.start();
      }
    },
  });
})();
