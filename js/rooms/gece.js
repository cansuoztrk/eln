/* Oda: Gece Lambası — uyumadan önce: kısılan bir Kitty lambası, tarayıcıda üretilen uyku sesleri (yağmur, dalga, rüzgâr, ninni),
   zamanlayıcı ve "uyuyorum" düğmesi (bana haber gider). Ertesi sabah kaleye gelince küçük bir uyku raporu ve günaydın notu. */
(function () {
  'use strict';
  const K = window.K;
  const A = K.art;
  const D = window.ELN;
  const C = D.config;
  const T = K.time;

  let root, snd = null, timer = null, otherSleep = null;
  const G = () => D.gece || { intro: [], sounds: [], night: [], morning: [] };

  /* ---------- Sesler (dosya yok, hepsi üretiliyor) ---------- */
  function noiseBuf(ctx, kind) {
    const len = ctx.sampleRate * 4;
    const b = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = b.getChannelData(0);
    let last = 0;
    for (let i = 0; i < len; i++) {
      const w = Math.random() * 2 - 1;
      if (kind === 'brown') {
        last = (last + 0.02 * w) / 1.02;
        d[i] = last * 3.5;
      } else d[i] = w;
    }
    return b;
  }
  function startSound(id) {
    stopSound();
    if (!K.audio.ensure()) return;
    const ctx = K.audio.ctx;
    const out = ctx.createGain();
    out.gain.setValueAtTime(0.0001, ctx.currentTime);
    out.gain.exponentialRampToValueAtTime(0.5, ctx.currentTime + 2);
    out.connect(ctx.destination);
    const nodes = [];
    const loop = (buf) => {
      const s = ctx.createBufferSource();
      s.buffer = buf;
      s.loop = true;
      s.start();
      nodes.push(s);
      return s;
    };
    const lfo = (freq, depth, target, base) => {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.frequency.value = freq;
      g.gain.value = depth;
      o.connect(g).connect(target);
      target.value = base;
      o.start();
      nodes.push(o);
    };
    let extra = null;
    if (id === 'yagmur') {
      const s = loop(noiseBuf(ctx, 'white'));
      const lp = ctx.createBiquadFilter(), hp = ctx.createBiquadFilter(), g = ctx.createGain();
      lp.type = 'lowpass';
      lp.frequency.value = 1400;
      hp.type = 'highpass';
      hp.frequency.value = 300;
      g.gain.value = 0.35;
      s.connect(hp).connect(lp).connect(g).connect(out);
      // Cama düşen damlalar
      const drop = () => {
        if (!snd) return;
        const t = ctx.currentTime;
        const o = ctx.createOscillator(), dg = ctx.createGain();
        o.frequency.setValueAtTime(2200 + Math.random() * 1800, t);
        o.frequency.exponentialRampToValueAtTime(600, t + 0.05);
        dg.gain.setValueAtTime(0.03 + Math.random() * 0.03, t);
        dg.gain.exponentialRampToValueAtTime(0.0001, t + 0.07);
        o.connect(dg).connect(out);
        o.start(t);
        o.stop(t + 0.08);
        extra = setTimeout(drop, 60 + Math.random() * 380);
      };
      setTimeout(drop, 300);
    }
    if (id === 'hazar') {
      const s = loop(noiseBuf(ctx, 'brown'));
      const lp = ctx.createBiquadFilter(), g = ctx.createGain();
      lp.type = 'lowpass';
      lp.frequency.value = 600;
      s.connect(lp).connect(g).connect(out);
      lfo(0.09, 0.28, g.gain, 0.32); // dalgalar gelip gider
      lfo(0.05, 250, lp.frequency, 650);
    }
    if (id === 'xezri') {
      const s = loop(noiseBuf(ctx, 'white'));
      const bp = ctx.createBiquadFilter(), g = ctx.createGain();
      bp.type = 'bandpass';
      bp.Q.value = 1.4;
      s.connect(bp).connect(g).connect(out);
      lfo(0.13, 300, bp.frequency, 650);
      lfo(0.07, 0.12, g.gain, 0.16);
    }
    if (id === 'ninni') extra = K.audio.play('waltz', { loop: true, bpm: 66, vol: 0.55 });
    snd = { id, out, nodes, extra: () => extra };
    K.$$('[data-snd]', root).forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.snd === id)));
  }
  function stopSound(fade = 1.2) {
    if (!snd) return;
    const s = snd;
    snd = null;
    const ctx = K.audio.ctx;
    try {
      s.out.gain.cancelScheduledValues(ctx.currentTime);
      s.out.gain.setValueAtTime(s.out.gain.value, ctx.currentTime);
      s.out.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + fade);
    } catch (e) {}
    const ex = s.extra();
    if (ex && ex.stop) ex.stop();
    else clearTimeout(ex);
    setTimeout(() => {
      s.nodes.forEach((n) => {
        try {
          n.stop();
        } catch (e) {}
      });
      s.out.disconnect();
    }, fade * 1000 + 200);
    root && K.$$('[data-snd]', root).forEach((b) => b.setAttribute('aria-pressed', 'false'));
  }
  function setTimer(min) {
    clearTimeout(timer);
    K.$$('[data-min]', root).forEach((b) => b.setAttribute('aria-pressed', String(+b.dataset.min === min)));
    if (!min) return;
    timer = setTimeout(() => stopSound(20), min * 60e3);
  }

  /* ---------- Sesimle uyu: uykusuz → masal → iyi geceler, arka arkaya ---------- */
  const PL = ['uykusuz', 'masal', 'iyi-geceler'];
  let pl = null;
  const plIds = () => PL.filter((id) => K.voice && K.voice.has(id));
  function plRender() {
    const box = root && K.$('#glPl', root);
    if (!box) return;
    box.hidden = !plIds().length;
    const now = pl && K.voice.def(pl.ids[pl.i]);
    K.$('#glPlBtn', box).innerHTML = pl ? `${A.ui('pause')} Durdur` : `${A.ui('play')} Başlat`;
    K.$('#glPlNow', box).innerHTML = now ? `<b>${pl.i + 1}/${pl.ids.length}</b> ${K.esc(now.title)}` : plIds().map((id) => K.esc(K.voice.def(id).title)).join(' · ');
  }
  function playlist() {
    const ids = plIds();
    if (!ids.length) return;
    if (K.audio.music.on) K.audio.music.stop(false);
    pl = { i: 0, ids };
    plNext();
  }
  async function plNext() {
    if (!pl) return;
    if (pl.i >= pl.ids.length) {
      stopPl();
      return K.fx.toast('İyi uykular.', { icon: A.icon('moon') });
    }
    plRender();
    let url = null;
    try {
      url = await K.voice.url(pl.ids[pl.i]);
    } catch (e) {}
    if (!pl) return;
    if (!url) {
      pl.i++;
      return plNext();
    }
    const a = new Audio(url);
    a.volume = 0.85;
    pl.audio = a;
    a.addEventListener('ended', () => {
      if (!pl) return;
      pl.i++;
      pl.t = setTimeout(plNext, 2500);
    });
    a.play().catch(() => stopPl());
  }
  function stopPl() {
    if (pl) {
      clearTimeout(pl.t);
      if (pl.audio) pl.audio.pause();
    }
    pl = null;
    plRender();
  }

  /* ---------- Uyuyorum ---------- */
  function sleep() {
    K.store.set('sleep', { at: Date.now(), shown: false });
    const lines = G().night;
    const line = lines.length ? K.fill(lines[Math.floor(Math.random() * lines.length)]) : '';
    if (K.cloud && K.cloud.enabled) K.cloud.add('sleep', { at: Date.now() });
    K.ping(`${K.meName()} uyudu`, 'Işığını kapattı. Sen de iyi uykular.', ['crescent_moon'], { priority: 3 });
    root.classList.add('asleep');
    K.$('#glMsg', root).innerHTML = `<p class="hand">${K.esc(line)}</p><p class="muted small">Ekran kısıldı. Ses açıksa zamanlayıcı bitince yavaşça susacak.</p>`;
    if (K.voice && K.voice.has('iyi-geceler')) K.$('#glMsg', root).insertAdjacentHTML('beforeend', K.voice.btn('iyi-geceler', 'Sesimle iyi geceler'));
    K.$('#glMsg', root).scrollIntoView({ behavior: K.reduced ? 'auto' : 'smooth', block: 'center' });
    K.stickers.award('gece');
  }
  // Sabah: kaleye ilk gelişte uyku raporu
  K.on('built', () => {
    const s = K.store.get('sleep');
    if (!s || s.shown || !D.gece) return;
    const hrs = (Date.now() - s.at) / 3600e3;
    const p = T.baku();
    if (hrs < 3 || hrs > 20 || p.h < 5 || p.h > 15) return;
    s.shown = true;
    K.store.set('sleep', s);
    const sp = T.split(Date.now() - s.at);
    const lines = G().morning;
    const line = lines.length ? K.fill(lines[T.dayNumber(T.now()) % lines.length]) : '';
    setTimeout(
      () =>
        K.ui.modal({
          label: 'Günaydın',
          html: `<div class="gl-morning">${A.kitty({ crown: true, eyes: 'happy' })}<p class="card-eyebrow">Uyku raporu</p><p class="gl-hrs"><b>${sp.h + sp.d * 24}</b> saat <b>${sp.m}</b> dakika</p><p class="hand">${K.esc(line)}</p>${K.voice && K.voice.has('gunaydin') ? K.voice.btn('gunaydin', 'Sesimle günaydın') : ''}</div>`,
        }),
      2600
    );
  });
  K.on('cloud', async (on) => {
    if (!on) return;
    const pick = (rows) => rows.filter((r) => r.who !== (K.isOwner() ? 'me' : 'her')).pop();
    otherSleep = pick(await K.cloud.list('sleep', 60)) || null;
    K.cloud.on('sleep', (r) => {
      if (r.who === (K.isOwner() ? 'me' : 'her')) return;
      otherSleep = r;
      K.fx.toast(`${K.esc(K.otherName())} uyudu. İyi geceler de.`, { icon: A.icon('moon') });
      if (K.activeRoom === 'gece') status();
    });
  });
  function status() {
    const el = root && K.$('#glOther', root);
    if (!el) return;
    if (otherSleep && Date.now() - otherSleep.at < 14 * 3600e3) {
      const p = T.baku(new Date(otherSleep.at));
      el.innerHTML = `${A.icon('moon')}<span>${K.esc(K.otherName())} Bakü saatiyle ${K.pad(p.h)}:${K.pad(p.mi)}'de "uyuyorum" dedi.</span>`;
      el.hidden = false;
    } else el.hidden = true;
  }

  K.room({
    id: 'gece',
    wing: 'kalp',
    title: 'Gece Lambası',
    sub: 'Uyumadan önce: ışık, ses, iyi geceler',
    icon: 'moon',
    color: '#DCD6F7',
    hidden: () => !D.gece,
    badge: () => {
      const h = T.baku().h;
      return D.gece && (h >= 22 || h < 3) ? 'Uyku vakti' : '';
    },
    init(el) {
      root = el;
      el.innerHTML = `
        <div class="gl-room">
          <div class="gl-stars" aria-hidden="true">${Array.from({ length: 26 }, (_, i) => `<i style="left:${(i * 37) % 100}%;top:${(i * 23) % 70}%;--d:${(i % 7) * 0.6}s"></i>`).join('')}</div>
          <button class="gl-lamp no-burst" id="glLamp" aria-label="Lambayı aç kapa"><span class="gl-glow"></span>${A.kitty({ crown: true, eyes: 'sleep' })}<span class="gl-base"></span></button>
          <div class="gl-dim"><label for="glDim">Işık</label><input type="range" id="glDim" min="10" max="100" value="70"></div>
        </div>
        <div class="room-intro gl-intro">${K.paras(G().intro)}</div>
        <p class="gl-other" id="glOther" hidden></p>
        <section class="card gl-snd">
          <p class="card-eyebrow">Uyku sesi</p>
          <div class="kc-presets">${G().sounds.map((s) => `<button type="button" class="chip" data-snd="${K.esc(s.id)}" aria-pressed="false">${K.esc(s.name)}</button>`).join('')}<button type="button" class="chip" data-snd="off">Sessiz</button></div>
          <p class="card-eyebrow" style="margin-top:12px">Zamanlayıcı</p>
          <div class="kc-presets">${[15, 30, 60, 0].map((m) => `<button type="button" class="chip" data-min="${m}" aria-pressed="${m === 30}">${m ? `${m} dk` : 'Sabaha kadar'}</button>`).join('')}</div>
        </section>
        <section class="card gl-pl" id="glPl" hidden>
          <p class="card-eyebrow">Sesimle uyu</p>
          <p class="muted small">Uyuyamadığında: ${K.esc(C.myPet)}'un sesi arka arkaya, kısık sesle. Uyku sesi açıksa onunla birlikte çalar.</p>
          <div class="gl-pl-row"><button type="button" class="btn soft" id="glPlBtn">${A.ui('play')} Başlat</button><p class="gl-pl-now" id="glPlNow"></p></div>
        </section>
        <div class="actions" style="justify-content:center"><button class="btn red big" id="glSleep">${A.icon('moon')} Uyuyorum</button></div>
        <div class="gl-msg" id="glMsg"></div>`;
      let min = 30;
      el.addEventListener('click', (e) => {
        const s = e.target.closest('[data-snd]');
        if (s) {
          if (s.dataset.snd === 'off' || (snd && snd.id === s.dataset.snd)) stopSound();
          else {
            if (K.audio.music.on) K.audio.music.stop(false);
            startSound(s.dataset.snd);
            setTimer(min);
          }
        }
        const m = e.target.closest('[data-min]');
        if (m) {
          min = +m.dataset.min;
          setTimer(snd ? min : 0);
          K.$$('[data-min]', el).forEach((b) => b.setAttribute('aria-pressed', String(b === m)));
        }
        if (e.target.closest('#glSleep')) sleep();
        if (e.target.closest('#glPlBtn')) (pl ? stopPl() : playlist());
        if (e.target.closest('#glLamp')) el.classList.toggle('lamp-off');
      });
      K.$('#glDim', el).addEventListener('input', (e) => el.style.setProperty('--glow', e.target.value / 100));
    },
    enter() {
      root.classList.remove('asleep');
      status();
      plRender();
    },
    leave() {
      // Oda kapansa da ses zamanlayıcıya kadar çalmaya devam eder; sadece ekran normale döner
      root.classList.remove('asleep');
    },
  });
})();
