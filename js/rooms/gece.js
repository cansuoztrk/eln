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
    if (K.cloud && K.cloud.enabled) K.cloud.add('sleep', { at: Date.now() }).then((r) => r && (pushRow(r), bizRender(), bothCheck()));
    K.ping(`${K.meName()} uyudu`, 'Işığını kapattı. Sen de iyi uykular.', ['crescent_moon'], { priority: 3 });
    root.classList.add('asleep');
    K.$('#glMsg', root).innerHTML = `<p class="hand">${K.esc(line)}</p><p class="muted small">Ekran kısıldı. Ses açıksa zamanlayıcı bitince yavaşça susacak.</p>`;
    if (K.voice && K.voice.has('iyi-geceler')) K.$('#glMsg', root).insertAdjacentHTML('beforeend', K.voice.btn('iyi-geceler', 'Sesimle iyi geceler'));
    K.$('#glMsg', root).scrollIntoView({ behavior: K.reduced ? 'auto' : 'smooth', block: 'center' });
    K.stickers.award('uykucu');
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
    const pick = (rows) => rows.filter((r) => r.who !== mine()).pop();
    rows = await K.cloud.many(['sleep', 'uyandim'], { since: Date.now() - 40 * 864e5, limit: 400 });
    otherSleep = pick(rows.filter((r) => r.kind === 'sleep')) || null;
    bizLoaded = true;
    K.cloud.on('sleep', (r) => {
      if (!pushRow(r) || r.who === mine()) return;
      otherSleep = r;
      K.fx.toast(asleep(mine()) ? `${K.esc(K.otherName())} da uyudu. İki kule birlikte karardı.` : `${K.esc(K.otherName())} uyudu. İyi geceler de.`, { icon: A.icon('moon') });
      bothCheck();
      if (K.activeRoom === 'gece') status(), bizRender();
      K.renderSpecials && !K.activeRoom && K.renderSpecials();
    });
    K.cloud.on('uyandim', (r) => {
      if (!pushRow(r) || r.who === mine()) return;
      if (!asleep(mine())) K.fx.toast(`☀️ <b>${K.esc(K.otherName())} uyandı.</b>${r.data.text ? ` "${K.esc(r.data.text)}"` : ''}`, { duration: 7000 });
      if (K.activeRoom === 'gece') bizRender();
      K.renderSpecials && !K.activeRoom && K.renderSpecials();
    });
    K.renderSpecials && !K.activeRoom && K.renderSpecials();
  });

  /* ---------- Birlikte Uyuyalım: iki kule birlikte kararır, sabah ilk uyananın günaydını mühürlü bekler ---------- */
  const BZ = () => D.uykubiz || { both: [], morningIdeas: [] };
  const mine = () => (K.isOwner() ? 'me' : 'her');
  const other = () => (K.isOwner() ? 'her' : 'me');
  let rows = [], bizLoaded = false;
  const pushRow = (r) => (r && !rows.some((x) => x.id === r.id) ? (rows.push(r), true) : false);
  const lastSleep = (w) => rows.filter((r) => r.kind === 'sleep' && r.who === w && Date.now() - r.at < 16 * 36e5).sort((a, b) => b.at - a.at)[0] || null;
  const wakeAfter = (w, at) => rows.filter((r) => r.kind === 'uyandim' && r.who === w && r.at > at).sort((a, b) => a.at - b.at)[0] || null;
  const asleep = (w) => {
    const s = lastSleep(w);
    return Boolean(s && !wakeAfter(w, s.at));
  };
  // Gece anahtarı: öğleden 12 saat geri (gece 01:00'de yatmak önceki akşama sayılır)
  const nightOf = (at) => T.key(T.baku(new Date(at - 12 * 36e5)));
  function nights() {
    const by = {};
    rows.filter((r) => r.kind === 'sleep').forEach((r) => ((by[nightOf(r.at)] = by[nightOf(r.at)] || {})[r.who] = r.at));
    return Object.keys(by).filter((k) => by[k].me && by[k].her).sort();
  }
  const hm = (at) => {
    const p = T.parts(K.isOwner() ? C.tzIstanbul : C.tzBaku, new Date(at));
    return `${K.pad(p.h)}:${K.pad(p.mi)}`;
  };
  const bothAsleep = () => asleep('me') && asleep('her') && Math.abs(lastSleep('me').at - lastSleep('her').at) < 8 * 36e5;
  function bothCheck() {
    if (!bothAsleep()) return;
    const k = nightOf(Math.max(lastSleep('me').at, lastSleep('her').at));
    if (K.store.get('uykuBizSeen') === k) return;
    K.store.set('uykuBizSeen', k);
    K.stickers.award('uykubiz');
  }
  // Uyandığımda öbürünün bıraktığı günaydın (benim son uykumdan sonra yazılan, metinli)
  function noteFor() {
    const mySleep = rows.filter((r) => r.kind === 'sleep' && r.who === mine()).sort((a, b) => b.at - a.at)[0];
    if (!mySleep || Date.now() - mySleep.at > 20 * 36e5) return null;
    const n = rows.filter((r) => r.kind === 'uyandim' && r.who === other() && r.at > mySleep.at && r.data.first).sort((a, b) => a.at - b.at)[0];
    return n ? { note: n, mine: wakeAfter(mine(), mySleep.at) } : null;
  }
  const morningForMe = () => {
    const s = lastSleep(mine());
    return Boolean(s && Date.now() - s.at > 3 * 36e5 && !wakeAfter(mine(), s.at));
  };
  function scene() {
    const me = asleep(mine()), ot = asleep(other());
    const tw = (w, on) => `<div class="gb2-tower ${w} ${on ? 'off' : ''}"><span class="gb2-win"></span><span class="gb2-win"></span><span class="gb2-zz">${on ? 'z z z' : ''}</span><small>${K.esc(w === 'me' ? C.myCity : C.herCity)}</small></div>`;
    return `<div class="gb2-scene ${me && ot ? 'both' : ''}" aria-hidden="true"><span class="gb2-moon"></span>${tw('me', asleep('me'))}<span class="gb2-bridge"><i class="gb2-cat">🐈</i></span>${tw('her', asleep('her'))}</div>`;
  }
  function bizRender() {
    const box = root && K.$('#glBiz', root);
    if (!box) return;
    if (!bizLoaded || !K.cloud || !K.cloud.enabled) return (box.hidden = true);
    box.hidden = false;
    const n = nights().length;
    const me = asleep(mine()), ot = asleep(other());
    const line = bothAsleep() ? K.pick(BZ().both || ['']) : ot ? `${K.otherName()} ${hm(lastSleep(other()).at)}'de uyudu. ${BZ().waiting || ''}` : me ? `Sen uyudun; ${K.otherName()} hâlâ uyanık.` : 'İkiniz de uyanıksınız.';
    const nt = noteFor();
    box.innerHTML = `<p class="card-eyebrow">🌙 ${K.esc(BZ().title || 'Birlikte Uyuyalım')}</p>${scene()}<p class="gb2-line">${K.esc(line)}</p>
      <p class="muted small">Birlikte uyuduğumuz geceler: <b>${n}</b></p>
      ${nt && nt.mine ? `<div class="en-reply"><small>${K.esc(K.otherName())} · ${K.esc(hm(nt.note.at))}</small><p class="hand">${K.esc(nt.note.data.text)}</p></div>` : ''}
      ${morningForMe() ? `<button type="button" class="btn red" data-gl-wake>☀️ Uyandım${nt ? ' · günaydınını aç' : ''}</button>` : ''}`;
  }
  async function wake() {
    const s = lastSleep(mine());
    const first = asleep(other());
    if (!first) {
      const r = await K.cloud.add('uyandim', {});
      pushRow(r);
      const nt = noteFor();
      K.audio.sfx.chime();
      if (nt) {
        const d = Math.max(1, Math.round((r.at - nt.note.at) / 6e4));
        K.ui.modal({
          label: 'Günaydın',
          cls: 'gl-wake',
          html: `<div class="gl-morning">${A.kitty({ eyes: 'happy', crown: true })}<p class="card-eyebrow">${K.esc(K.otherName())} senden ${d < 60 ? `${d} dakika` : `${Math.round(d / 60)} saat`} önce uyandı</p><p class="hand gl-wake-note">${K.esc(nt.note.data.text)}</p></div>`,
        });
      } else K.fx.toast('☀️ Günaydın! İkiniz de uyandınız.', { duration: 3000 });
      K.ping(`☀️ ${K.meName()} uyandı`, 'Günaydın!', ['sunrise'], { priority: 2 });
      bizRender();
      K.renderSpecials && !K.activeRoom && K.renderSpecials();
      return;
    }
    // Önce ben uyandım: ona mühürlü bir günaydın
    const m = K.ui.modal({
      label: 'Günaydın bırak',
      cls: 'br-sheet',
      html: `<p class="card-eyebrow">☀️ Önce sen uyandın</p><h2>${K.esc(K.otherName())} hâlâ uyuyor</h2><p class="muted">${K.esc(BZ().morningIntro || '')}</p>
        <div class="br-chips">${(BZ().morningIdeas || []).map((x) => `<button type="button" class="chip" data-gm>${K.esc(x)}</button>`).join('')}</div>
        <input class="input" maxlength="140" placeholder="Günaydın..."><button type="button" class="btn red" data-gm-go>☀️ Bırak</button>`,
    });
    m.body.addEventListener('click', async (e) => {
      const c = e.target.closest('[data-gm]');
      if (c) return (K.$('input', m.body).value = c.textContent);
      const g = e.target.closest('[data-gm-go]');
      if (!g) return;
      g.disabled = true;
      const text = K.$('input', m.body).value.trim() || (BZ().morningIdeas || ['Günaydın'])[0];
      const r = await K.cloud.add('uyandim', { text, first: true, slept: s ? s.at : 0 });
      if (!r) return (g.disabled = false), K.fx.toast('Gönderilemedi.');
      pushRow(r);
      m.close();
      K.audio.sfx.chime();
      K.fx.toast('☀️ Bırakıldı. O uyanıp "Uyandım" deyince açılacak.', { duration: 3500 });
      // Uyuyanı uyandırmasın: düşük öncelik, sessiz
      K.ping(`☀️ ${K.meName()} sana bir günaydın bıraktı`, 'Uyanınca kalede "Uyandım" de, açılsın.', ['sunrise'], { priority: 2 });
      bizRender();
    });
  }
  document.addEventListener('click', (e) => e.target.closest('[data-gl-wake]') && wake());
  K.specialHooks = (K.specialHooks || []).concat(() => {
    if (!bizLoaded || !D.gece) return [];
    if (morningForMe()) {
      const nt = rows.find((r) => r.kind === 'uyandim' && r.who === other() && r.data.first && r.at > lastSleep(mine()).at);
      return [{ icon: 'sun', title: nt ? `💌 Sen uyurken ${K.otherName()} bir günaydın bıraktı` : '☀️ Günaydın! Uyandığını ona söyle', text: nt ? 'Mühürlü. "Uyandım" deyince açılır.' : asleep(other()) ? `${K.otherName()} hâlâ uyuyor; ona mühürlü bir günaydın bırakabilirsin.` : 'Tek dokunuş: "Uyandım".', run: wake, cta: 'Uyandım' }];
    }
    const h = T.parts(K.isOwner() ? C.tzIstanbul : C.tzBaku).h;
    if (asleep(other()) && !asleep(mine()) && (h >= 21 || h < 4)) return [{ icon: 'moon', title: `🌙 ${K.otherName()} ${hm(lastSleep(other()).at)}'de uyudu`, text: 'Sen de "uyuyorum" deyince iki kule birlikte kararır.', room: 'gece', cta: 'Gece Lambası' }];
    return [];
  });
  K.uykubiz = { nights: () => nights().length, asleep, bothAsleep };
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
        <section class="card gl-biz" id="glBiz" hidden></section>
        <a class="card gl-uyku" href="#uyku"><span aria-hidden="true">📚</span><div><b>Uyku Masalları</b><small>${K.esc(C.myPet)}'un sesinden on iki masal</small></div></a>
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
      bizRender();
    },
    leave() {
      // Oda kapansa da ses zamanlayıcıya kadar çalmaya devam eder; sadece ekran normale döner
      root.classList.remove('asleep');
    },
  });
})();
