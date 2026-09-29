/* Oda: Bizim Filmimiz — kalenin sinema salonu. Gerçek hikâyemizden kurulmuş, her bölümü bir duygu olan bir film:
   yazılar, telefona düşen o bildirim, gerçek mesajlarımız, kasadaki fotoğraflar, benim sesim (altyazılı), harita,
   iki şehrin saati, sayaçlar, ekrana dokunma anı ve cevabı karşıya giden sorular. Her bölümün kendi rengi ve
   tarayıcıda üretilen müziği var. Sonunda jenerik bizim şarkımızla (site içinde) akar, ardından jenerik sonrası sahne.
   "Biz" bölümü kalede birlikte yaptıklarımızla kendiliğinden büyür; ikimiz de filme sahne ekleyebiliriz.
   İkimiz de salondaysak "Birlikte izle": film iki telefonda aynı anda oynar, tepkiler karşıya uçar.
   Kayıtlar: filmview {reacts, last, done, together} · filmline {key, text} · sahne {date, emotion, text, thumb, full} + sahneimg {img}. */
(function () {
  'use strict';
  const K = window.K;
  const A = K.art;
  const D = window.ELN;
  const C = D.config;
  const T = K.time;

  const F = () => D.film || { chapters: [], credits: [] };
  const mine = () => (K.isOwner() ? 'me' : 'her');
  const other = () => (K.isOwner() ? 'her' : 'me');
  const nameOf = (w) => (w === 'me' ? C.myPet : C.herPet);
  // Test için: ?hizli=0.3 sahneleri o oranda kısaltır
  const FASTM = location.search.match(/[?&]hizli=([\d.]+)/);
  const FAST = Boolean(FASTM);
  const SP = FAST ? +FASTM[1] || 0.1 : 1;
  const REACTS = ['😂', '🥹', '😍', '😭', '❤️'];

  let root, views = [], lines = [], scenesUser = [], film = null, invite = null, incoming = null, loaded = null;

  /* ---------- Film listesi ---------- */
  function flat() {
    const out = [];
    F().chapters.forEach((ch, ci) => {
      out.push({ t: 'chapter', ch, ci, key: ch.id + ':0' });
      ch.scenes.forEach((sc, si) => out.push({ t: sc[0], a: sc.slice(1), ch, ci, key: `${ch.id}:${si + 1}` }));
    });
    out.push({ t: 'credits', key: 'credits', ci: F().chapters.length }, { t: 'post', key: 'post', ci: F().chapters.length });
    return out;
  }
  const chatOf = (id) => (D.chats || []).find((c) => c.id === id);
  const voiceOf = (id) => (D.voices || []).find((v) => v.id === id);
  function sceneLabel(key) {
    const s = flat().find((x) => x.key === key);
    if (!s) return key === 'credits' ? 'Jenerik' : key === 'post' ? 'Jenerik sonrası' : key;
    const em = s.ch ? s.ch.emotion || s.ch.label : '';
    const d =
      s.t === 'chapter' ? 'bölüm açılışı'
      : s.t === 'chat' ? `"${(chatOf(s.a[0]) || {}).title || 'mesajlar'}"`
      : s.t === 'photo' ? s.a[1]
      : s.t === 'voice' ? `sesli not: ${(voiceOf(s.a[0]) || {}).title || ''}`
      : s.t === 'text' || s.t === 'big' ? `"${String(s.a[0]).slice(0, 48)}${String(s.a[0]).length > 48 ? '…' : ''}"`
      : s.t === 'touch' ? 'ekrana dokunma anı'
      : s.t === 'count' ? (s.a[0] === 'hugs' ? 'sarılma borcu' : 'birlikte geçen günler')
      : s.t === 'map' ? 'harita' : s.t === 'clocks' ? 'iki saat' : s.t === 'notif' ? 'o bildirim' : s.t;
    return `${em ? em + ' · ' : ''}${d}`;
  }

  /* ---------- Müzik: bölümün duygusuna göre tarayıcıda üretilen yumuşak bir fon ---------- */
  const MOODS = {
    soft: { ch: [[48, 52, 55, 59], [45, 48, 52, 55], [41, 45, 48, 52], [43, 47, 50, 55]], arp: 0.62 },
    warm: { ch: [[41, 45, 48, 53], [40, 43, 48, 52], [38, 41, 45, 50], [34, 38, 41, 46]], arp: 0.5 },
    tender: { ch: [[45, 48, 52, 57], [41, 45, 48, 53], [36, 40, 43, 48], [43, 47, 50, 55]], arp: 0.58 },
    bright: { ch: [[48, 52, 55, 60], [43, 47, 50, 55], [45, 48, 52, 57], [41, 45, 48, 53]], arp: 0.34 },
    melancholy: { ch: [[45, 48, 52, 57], [40, 43, 47, 52], [41, 45, 48, 53], [40, 44, 47, 52]], arp: 0.82 },
    storm: { ch: [[38, 41, 45, 50], [34, 38, 41, 46], [43, 46, 50, 55], [45, 49, 52, 57]], arp: 0.95, drone: 26 },
    hope: { ch: [[43, 47, 50, 55], [38, 42, 45, 50], [40, 43, 47, 52], [36, 40, 43, 48]], arp: 0.44 },
  };
  const hz = (m) => 440 * Math.pow(2, (m - 69) / 12);
  function makeScore() {
    let ctx = null, master = null, mood = 'soft', step = 0, timer = null, on = false;
    const init = () => {
      if (ctx) return;
      try {
        ctx = new (window.AudioContext || window.webkitAudioContext)();
      } catch (e) {
        return;
      }
      master = ctx.createGain();
      master.gain.value = 0;
      const lp = ctx.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.value = 1600;
      master.connect(lp);
      lp.connect(ctx.destination);
    };
    function note(m, t, dur, type, g, att) {
      const o = ctx.createOscillator(), v = ctx.createGain();
      o.type = type;
      o.frequency.value = hz(m);
      v.gain.setValueAtTime(0, t);
      v.gain.linearRampToValueAtTime(g, t + att);
      v.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(v);
      v.connect(master);
      o.start(t);
      o.stop(t + dur + 0.05);
    }
    function chord() {
      if (!on || !ctx) return;
      const M = MOODS[mood] || MOODS.soft;
      const c = M.ch[step++ % M.ch.length];
      const t = ctx.currentTime + 0.05, len = 4.8;
      c.forEach((m) => {
        note(m, t, len + 1.2, 'triangle', 0.035, 1.3);
        note(m + 0.07, t, len + 1.2, 'sine', 0.02, 1.5);
      });
      if (M.drone) note(M.drone, t, len + 1, 'sine', 0.05, 2);
      for (let k = 0, at = 0.3; at < len - 0.2; k++, at += M.arp) note(c[k % c.length] + 12 + (k % 8 >= 4 ? 7 : 0), t + at, 1.1, 'sine', 0.028, 0.015);
      timer = setTimeout(chord, len * 1000);
    }
    return {
      start(m) {
        init();
        if (!ctx) return;
        ctx.resume && ctx.resume();
        mood = m || mood;
        on = true;
        master.gain.cancelScheduledValues(ctx.currentTime);
        master.gain.linearRampToValueAtTime(0.9, ctx.currentTime + 2);
        clearTimeout(timer);
        chord();
      },
      mood(m) {
        if (m && m !== mood) {
          mood = m;
          step = 0;
        }
      },
      duck(d) {
        if (!ctx || !on) return;
        master.gain.cancelScheduledValues(ctx.currentTime);
        master.gain.linearRampToValueAtTime(d ? 0.18 : 0.9, ctx.currentTime + 0.8);
      },
      pause(p) {
        if (!ctx) return;
        p ? ctx.suspend && ctx.suspend() : ctx.resume && ctx.resume();
      },
      stop() {
        on = false;
        clearTimeout(timer);
        if (ctx && master) {
          master.gain.cancelScheduledValues(ctx.currentTime);
          master.gain.linearRampToValueAtTime(0, ctx.currentTime + 1.5);
        }
      },
      close() {
        this.stop();
        const c = ctx;
        ctx = null;
        setTimeout(() => c && c.close && c.close().catch(() => {}), 1800);
      },
    };
  }

  /* ---------- Oynatıcı ---------- */
  const send = (m) => K.cloud && K.cloud.enabled && K.cloud.send('sn', Object.assign({ sid: film ? film.sid : invite && invite.sid }, m));
  function open(fromChapter = 0, opt = {}) {
    if (film) return;
    const list = flat();
    const start = Math.max(0, list.findIndex((s) => s.ci === fromChapter));
    const el = K.el(`<div class="sn" role="dialog" aria-modal="true" aria-label="Bizim Filmimiz">
      <div class="sn-stage" id="snStage"></div>
      <div class="sn-grain" aria-hidden="true"></div>
      <div class="sn-curtain l" aria-hidden="true"></div><div class="sn-curtain r" aria-hidden="true"></div>
      <div class="sn-top"><span class="sn-chapl" id="snChap"></span>${opt.together ? `<span class="sn-tog"><i></i>${K.esc(nameOf(other()))} ile izliyorsunuz</span>` : ''}</div>
      <div class="sn-react-fly" id="snFly"></div>
      <div class="sn-bottom">
        <div class="sn-bar"><i id="snProg"></i>${F().chapters.map((ch, i) => `<b style="left:${(list.findIndex((s) => s.ci === i) / list.length) * 100}%"></b>`).join('')}</div>
        <div class="sn-ctl">
          <button type="button" data-sn="pause" aria-label="Durdur">${A.ui('pause')}</button>
          <button type="button" data-sn="next" aria-label="Sonraki sahne">${A.ui('next')}</button>
          <span class="sn-reacts">${REACTS.map((r) => `<button type="button" data-react="${r}" aria-label="Tepki ${r}">${r}</button>`).join('')}</span>
          <button type="button" data-sn="close" aria-label="Filmden çık">${A.ui('close')}</button>
        </div>
      </div>
    </div>`);
    document.body.appendChild(el);
    document.body.classList.add('has-modal', 'sn-on');
    film = { el, list, i: start, paused: false, cut: false, dead: false, jump: null, reacts: [], together: Boolean(opt.together), host: opt.host !== false, sid: opt.sid || 's' + Date.now().toString(36), score: makeScore(), done: false, resolve: null, audio: null, pk: null, touch: null };
    if (K.audio.music.on) K.audio.music.stop(false);
    if (K.voice && K.voice.stop) K.voice.stop();
    try {
      navigator.wakeLock && navigator.wakeLock.request('screen').then((l) => film && (film.lock = l)).catch(() => {});
    } catch (e) {}
    el.addEventListener('click', onCtl);
    document.addEventListener('keydown', onKey);
    film.score.start('soft');
    requestAnimationFrame(() => el.classList.add('in'));
    setTimeout(() => el.classList.add('opened'), FAST ? 50 : 900);
    run(start, FAST ? 100 : 2200);
  }
  function onKey(e) {
    if (!film) return;
    if (e.key === 'Escape') close();
    if (e.key === ' ') {
      e.preventDefault();
      togglePause();
    }
    if (e.key === 'ArrowRight') next();
  }
  function onCtl(e) {
    const r = e.target.closest('[data-react]');
    if (r) return react(r.dataset.react, true);
    const b = e.target.closest('[data-sn]');
    if (!b) return;
    const a = b.dataset.sn;
    if (a === 'pause') togglePause();
    if (a === 'next') next();
    if (a === 'close') close();
  }
  function togglePause(remote) {
    if (!film) return;
    film.paused = !film.paused;
    film.el.classList.toggle('paused', film.paused);
    const b = K.$('[data-sn="pause"]', film.el);
    b.innerHTML = A.ui(film.paused ? 'play' : 'pause');
    film.score.pause(film.paused);
    if (film.audio) film.paused ? film.audio.pause() : film.audio.play().catch(() => {});
    if (!remote && film.together) send({ t: film.paused ? 'pause' : 'resume' });
  }
  function next() {
    if (!film) return;
    if (film.together && !film.host) return send({ t: 'next' });
    cut();
  }
  function cut() {
    if (!film) return;
    film.cut = true;
    if (film.audio) {
      film.audio.pause();
      film.audio.dispatchEvent(new Event('ended'));
    }
    film.resolve && film.resolve();
  }
  function jump(i) {
    if (!film) return;
    film.jump = i;
    cut();
  }
  // Duraklatmaya uyan bekleme; sahne kesilirse hemen biter
  function wait(ms) {
    const f = film;
    return new Promise((res) => {
      if (!f || f.cut || f.dead) return res();
      let left = ms * SP, last = performance.now(), fin = false;
      const done = () => {
        if (fin) return;
        fin = true;
        f.resolve = null;
        res();
      };
      f.resolve = done;
      const tick = (now) => {
        if (fin) return;
        if (f.dead || f.cut) return done();
        if (!f.paused) left -= now - last;
        last = now;
        if (left <= 0) return done();
        requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
  }
  async function run(i, delay) {
    const f = film;
    await wait(delay);
    for (; i < f.list.length; i++) {
      if (f.dead) return;
      f.i = i;
      f.cut = false;
      const s = f.list[i];
      if (f.together && f.host) send({ t: 'at', i });
      progress();
      try {
        await play(s);
      } catch (e) {}
      if (f.dead) return;
      // Birlikte izlerken misafir, sahneyi bitirince davet edenin de bitirmesini bekler (geri sarma olmasın)
      if (f.together && !f.host && f.jump == null && (f.hostAt == null || f.hostAt <= i)) {
        await new Promise((res) => {
          f.hostWaiter = res;
          setTimeout(res, 4000);
        });
        f.hostWaiter = null;
      }
      if (f.dead) return;
      if (f.jump != null) {
        i = f.jump - 1;
        f.jump = null;
      }
    }
  }
  function progress() {
    const f = film;
    const s = f.list[f.i];
    K.$('#snProg', f.el).style.width = `${((f.i + 1) / f.list.length) * 100}%`;
    const ch = s.ch;
    K.$('#snChap', f.el).textContent = s.t === 'credits' ? 'Jenerik' : s.t === 'post' ? 'Jenerik sonrası' : ch ? `${ch.label}${ch.emotion ? ' · ' + ch.emotion : ''}` : '';
    if (ch) {
      f.el.style.setProperty('--c', ch.color || '#140f1c');
      f.score.mood(ch.mood);
    }
  }
  function layer(html, cls = '') {
    const st = K.$('#snStage', film.el);
    K.$$('.sn-layer', st).forEach((l) => {
      l.classList.add('out');
      setTimeout(() => l.remove(), 800);
    });
    const l = K.el(`<div class="sn-layer ${cls}">${html}</div>`);
    st.appendChild(l);
    requestAnimationFrame(() => requestAnimationFrame(() => l.classList.add('in')));
    return l;
  }
  const words = (t) => K.esc(K.fill(t)).split(' ').map((w, i) => `<span style="--i:${i}">${w}</span>`).join(' ');

  /* ---------- Sahneler ---------- */
  async function play(s) {
    const f = film;
    const ch = s.ch || {};
    if (s.t === 'chapter') {
      if (ch.id === F().chapters[0].id)
        layer(`<div class="sn-titlecard"><small>${K.esc(C.herPet)} &amp; ${K.esc(C.myPet)} sunar</small><b class="script">${K.esc(F().title)}</b><span>${K.esc(F().tagline || '')}</span></div>`, 'dark');
      else layer(`<div class="sn-chap"><small>${K.esc(ch.label)}</small><b>${K.esc(ch.emotion)}</b></div>`, 'chap');
      return wait(ch.id === F().chapters[0].id ? 5200 : 3400);
    }
    if (s.t === 'text') {
      const t = String(s.a[0]);
      layer(`<p class="sn-text">${words(t)}</p>`);
      return wait(K.clamp(2200 + t.length * 48, 3200, 8500));
    }
    if (s.t === 'big') {
      layer(`<p class="sn-big script">${K.esc(K.fill(s.a[0]))}</p>`, 'glow');
      return wait(4600);
    }
    if (s.t === 'notif') {
      layer(`<div class="sn-lock"><p class="sn-lock-t">20:47</p><p class="sn-lock-d">${K.esc(T.fmt(C.metDate, true))}</p><div class="sn-notif"><i></i><div><small>${K.esc(s.a[0])} · şimdi</small><p>${K.esc(K.fill(s.a[1]))}</p></div></div></div>`);
      void d;
      await wait(900);
      K.vibrate([40, 60, 40]);
      return wait(4600);
    }
    if (s.t === 'chat') return chat(s.a[0]);
    if (s.t === 'photo') return photo(s.a[0], s.a[1]);
    if (s.t === 'voice') return voice(s.a[0]);
    if (s.t === 'map') {
      layer(`<svg class="sn-map" viewBox="0 0 360 220" aria-hidden="true"><defs><linearGradient id="snArc" x1="0" x2="1"><stop offset="0" stop-color="#8FD3FF"/><stop offset="1" stop-color="#FF8FB8"/></linearGradient></defs>
        <path d="M20 150 C70 120 110 140 150 128 C200 112 250 136 340 118" fill="none" stroke="rgba(255,255,255,.12)" stroke-width="18" stroke-linecap="round"/>
        <path class="sn-arc" d="M60 140 Q180 20 300 128" fill="none" stroke="url(#snArc)" stroke-width="3" stroke-dasharray="4 7" stroke-linecap="round"/>
        <circle cx="60" cy="140" r="7" fill="#8FD3FF"/><circle cx="300" cy="128" r="7" fill="#FF8FB8"/>
        <text x="60" y="168" text-anchor="middle" class="sn-map-l">${K.esc(C.myCity)}</text><text x="300" y="156" text-anchor="middle" class="sn-map-l">${K.esc(C.herCity)}</text></svg>
        <p class="sn-km"><b data-count="${C.distanceKm}">0</b> km</p><p class="sn-sub-l">Aralarında bir saat fark ve koca bir Kafkasya.</p>`);
      countUp();
      return wait(7000);
    }
    if (s.t === 'clocks') {
      const ist = T.ist(), bak = T.baku();
      layer(`<div class="sn-clocks"><div><small>${K.esc(C.myCity)}</small><b>${K.pad(ist.h)}:${K.pad(ist.mi)}</b></div><i>+1</i><div><small>${K.esc(C.herCity)}</small><b>${K.pad(bak.h)}:${K.pad(bak.mi)}</b></div></div>
        <p class="sn-text">${words('Bir saat fark. O hep bir saat ilerideydi. Yani o, onun geleceğiydi.')}</p>`);
      return wait(7000);
    }
    if (s.t === 'count') {
      const hugs = s.a[0] === 'hugs';
      const n = hugs ? K.hugDebt() : Math.max(0, T.daysSince(C.togetherDate));
      layer(`<div class="sn-count"><b data-count="${n}">0</b><span>${hugs ? 'ödenmemiş sarılma' : 'gündür "biz"'}</span><p>${K.esc(hugs ? 'Borç her gün büyüyor. Ödeme yeri: ' + C.herCity + '.' : 'O günden beri her ayın 21\'i küçük bir bayram. Bugün ' + T.monthsTogether() + '. ay.')}</p></div>`);
      countUp();
      return wait(6000);
    }
    if (s.t === 'kumbara') {
      if (!K.kumbara || !K.kumbara.cfg) return;
      const cfg = K.kumbara.cfg(), tot = K.kumbara.total();
      if (!cfg.target) return;
      const p = K.clamp(tot / cfg.target, 0, 1);
      layer(`<div class="sn-jar"><div class="sn-jar-b"><i style="--p:${p}"></i></div><div><b>${K.num(Math.round(tot))} ${K.esc(cfg.currency || 'TL')}</b><span>hedef ${K.num(cfg.target)}</span></div></div><p class="sn-sub-l">${K.esc(tot > 0 ? 'Kuruş kuruş, bir bilete doğru.' : 'Kumbara henüz boş. İlk parayı atan bu sahneyi değiştirir.')}</p>`);
      return wait(5600);
    }
    if (s.t === 'target') {
      const fl = K.bilet && K.bilet.get && K.bilet.get();
      const tg = goal();
      const from = fl ? fl.date : tg && tg.from;
      if (!from) return;
      const n = T.daysUntil(from);
      layer(`<div class="sn-target"><small>${fl ? 'Biniş kartı hazır' : tg.agreed ? 'Hedef' : 'Öneri'}</small><b>${K.esc(fl ? T.fmt(fl.date) : `${T.fmtShort(tg.from)} – ${T.fmt(tg.to)}`)}</b>${n > 0 ? `<p><span data-count="${n}">0</span> gün kaldı</p>` : ''}${!fl && tg && tg.note ? `<em>${K.esc(String(tg.note).split('.')[0])}.</em>` : ''}</div>`);
      countUp();
      return wait(6000);
    }
    if (s.t === 'touch') return touch();
    if (s.t === 'ask') return ask(s.a[0], s.a[1]);
    if (s.t === 'us') return us();
    if (s.t === 'sahneler') return userScenes();
    if (s.t === 'credits') return credits();
    if (s.t === 'post') return post();
  }
  // Buluşma hedefi: ikisinin anlaştığı aralık, yoksa kale sahibinin önerisi (Ne Zaman?)
  function goal() {
    const p = K.nezaman && K.nezaman.proposal && K.nezaman.proposal();
    return p && p.from ? p : null;
  }
  function countUp() {
    const l = K.$('.sn-layer:last-child', K.$('#snStage', film.el));
    K.$$('[data-count]', l).forEach((b) => {
      const to = +b.dataset.count, t0 = performance.now(), dur = 1600 * SP;
      const st = (now) => {
        const k = Math.min(1, (now - t0) / dur);
        b.textContent = K.num(Math.round(to * (1 - Math.pow(1 - k, 3))));
        if (k < 1) requestAnimationFrame(st);
      };
      requestAnimationFrame(st);
    });
  }
  async function chat(id) {
    const c = chatOf(id);
    if (!c) return;
    const l = layer(`<div class="sn-phone"><div class="sn-ph-top"><i></i><b>${K.esc(C.herPet)} ♡ ${K.esc(C.myPet)}</b></div>${c.nowPlaying ? `<p class="sn-np">♫ ${K.esc(c.nowPlaying.artist)} · ${K.esc(c.nowPlaying.title)}</p>` : ''}<div class="sn-msgs"></div></div><p class="sn-note hand"></p>`);
    const box = K.$('.sn-msgs', l);
    for (const [w, text, time] of c.msgs) {
      if (film.cut || film.dead) return;
      const typing = K.el(`<p class="sn-m ${w} typing"><i></i><i></i><i></i></p>`);
      box.appendChild(typing);
      box.scrollTop = box.scrollHeight;
      await wait(550);
      typing.remove();
      box.appendChild(K.el(`<p class="sn-m ${w}">${K.esc(text)}${time ? `<small>${K.esc(time)}</small>` : ''}</p>`));
      box.scrollTop = box.scrollHeight;
      K.audio.sfx.tap && !FAST && K.audio.sfx.tap();
      await wait(K.clamp(650 + String(text).length * 32, 900, 3600));
    }
    if (c.note && !film.cut) {
      K.$('.sn-note', l).innerHTML = `${K.esc(K.fill(c.note))} <small>— ${K.esc(C.myPet)}</small>`;
      K.$('.sn-note', l).classList.add('on');
      await wait(K.clamp(1800 + c.note.length * 45, 3500, 7500));
    }
  }
  const urls = {};
  const photoUrl = (id) => (urls[id] = urls[id] || K.vault.url(id).catch(() => null));
  function prefetch() {
    const f = film;
    for (let j = f.i + 1; j < Math.min(f.list.length, f.i + 4); j++) if (f.list[j].t === 'photo') photoUrl(f.list[j].a[0]);
  }
  async function photo(id, cap) {
    prefetch();
    const url = await photoUrl(id);
    if (!url || film.cut) return;
    const dir = ['a', 'b', 'c', 'd'][Math.abs(K.hash(id)) % 4];
    layer(`<div class="sn-photo ${dir}"><img src="${url}" alt=""></div>${cap ? `<p class="sn-cap">${K.esc(K.fill(cap))}</p>` : ''}`, 'ph');
    return wait(5800);
  }
  async function voice(id) {
    const v = voiceOf(id);
    if (!v || !K.voice || !K.voice.has(id)) return;
    let url = null;
    try {
      url = await K.voice.url(id);
    } catch (e) {}
    if (!url || film.cut) return;
    const l = layer(`<div class="sn-voice"><div class="sn-wave">${Array.from({ length: 28 }, (_, i) => `<i style="--i:${i}"></i>`).join('')}</div><p class="sn-by">${K.esc(C.myPet)}'un sesi · ${K.esc(v.title)}</p><p class="sn-subt"></p></div>`, 'voice');
    const au = new Audio(url);
    film.audio = au;
    if (FAST) au.muted = true;
    film.score.duck(true);
    const tl = v.text.map((x) => K.fill(x));
    const total = tl.reduce((a, x) => a + x.length, 0) || 1;
    const sub = K.$('.sn-subt', l);
    let shown = -1;
    au.addEventListener('timeupdate', () => {
      if (!au.duration) return;
      const k = au.currentTime / au.duration;
      let acc = 0, idx = 0;
      for (; idx < tl.length; idx++) {
        acc += tl[idx].length / total;
        if (k < acc) break;
      }
      idx = Math.min(idx, tl.length - 1);
      if (idx !== shown) {
        shown = idx;
        sub.classList.remove('on');
        void sub.offsetWidth;
        sub.textContent = tl[idx];
        sub.classList.add('on');
      }
    });
    await new Promise((res) => {
      let fin = false;
      const done = () => {
        if (fin) return;
        fin = true;
        res();
      };
      au.addEventListener('ended', done);
      au.addEventListener('error', done);
      film.resolve = done;
      au.play().catch(done);
      if (FAST) setTimeout(done, 1200);
    });
    au.pause();
    film.audio = null;
    film.score.duck(false);
    if (!film.cut) await wait(900);
  }
  // Dokunma anı: iki elini ekrana koy; ikimiz de izliyorsak dokunuşlarımız birbirine görünür
  async function touch() {
    const f = film;
    const l = layer(`<div class="sn-touch"><p class="sn-text">${words('İki elini ekrana koy. Birkaç saniye bırakma.')}</p><div class="sn-dots"></div><div class="sn-heart">${A.icon('heart')}</div></div>`, 'touch');
    const dots = K.$('.sn-dots', l);
    let held = 0, since = 0, theirs = [], mineP = [], ok = false, lastSend = 0;
    const draw = () => {
      dots.innerHTML = mineP.map(([x, y]) => `<i class="me" style="left:${x * 100}%;top:${y * 100}%"></i>`).join('') + theirs.map(([x, y]) => `<i class="them" style="left:${x * 100}%;top:${y * 100}%"></i>`).join('');
    };
    const pts = (e) => Array.from(e.touches || (e.buttons ? [e] : [])).map((t) => [t.clientX / innerWidth, t.clientY / innerHeight]);
    const onT = (e) => {
      if (e.target.closest('.sn-bottom')) return;
      mineP = pts(e);
      if (mineP.length && !since) since = performance.now();
      if (!mineP.length) since = 0;
      draw();
      const now = performance.now();
      if (f.together && now - lastSend > 120) {
        lastSend = now;
        send({ t: 'touch', pts: mineP });
      }
    };
    ['touchstart', 'touchmove', 'touchend', 'touchcancel', 'pointerdown', 'pointermove', 'pointerup'].forEach((ev) => l.addEventListener(ev, onT, { passive: true }));
    f.touch = (p) => {
      theirs = p || [];
      draw();
    };
    const t0 = performance.now();
    while (!f.cut && !f.dead) {
      await wait(100);
      const both = f.together ? mineP.length && theirs.length : mineP.length;
      if (both && since) held = performance.now() - since;
      else held = 0;
      l.style.setProperty('--h', Math.min(1, held / 2500));
      if (held > 2500 / (FAST ? 10 : 1)) {
        ok = true;
        break;
      }
      if (performance.now() - t0 > (FAST ? 1500 : 26000) && !f.paused) break;
    }
    f.touch = null;
    if (f.cut || f.dead) return;
    l.classList.add(ok ? 'win' : 'miss');
    K.$('.sn-touch > .sn-text', l).innerHTML = words(ok ? (f.together ? 'İkiniz de dokunuyorsunuz. Bu ekranın iki tarafında aynı anda.' : 'Şu an o da ekrana dokunuyor olabilir.') : 'Ekran bile onları ayıramadı.');
    if (ok) {
      K.vibrate([60, 80, 60]);
      K.fx.burst && K.fx.burst(innerWidth / 2, innerHeight / 2, { count: 40, shapes: ['heart'] });
    }
    await wait(3200);
    if (ok && !f.cut) await voice('sarilma');
  }
  async function ask(key, q) {
    const f = film;
    const prev = lines.filter((r) => r.who === mine() && r.data.key === key).pop();
    const l = layer(`<form class="sn-ask" autocomplete="off"><p class="sn-q">${K.esc(K.fill(q))}</p>
      ${prev ? `<p class="sn-prev hand">"${K.esc(prev.data.text)}"</p><p class="sn-sub-l">Bunu daha önce yazmıştın.</p><div class="sn-ask-b"><button type="button" class="btn red small" data-ask-go>Devam</button></div>` : `<textarea class="textarea" name="snAsk" rows="3" maxlength="240" placeholder="Buraya yaz..."></textarea><div class="sn-ask-b"><button type="button" class="btn ghost small" data-ask-skip>Geç</button><button type="submit" class="btn red small">${A.ui('send')} Gönder</button></div><p class="sn-sub-l">${K.esc(F().askNote || '')}</p>`}</form>`, 'ask');
    const form = K.$('.sn-ask', l);
    await new Promise((res) => {
      let fin = false;
      const done = () => {
        if (fin) return;
        fin = true;
        res();
      };
      f.resolve = done;
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const text = String(new FormData(form).get('snAsk') || '').trim();
        if (!text) return;
        form.innerHTML = `<p class="sn-q">${K.esc(K.fill(q))}</p><p class="sn-prev hand">"${K.esc(text)}"</p><p class="sn-sub-l">Kaydedildi. ${K.esc(nameOf(other()))} de cevaplayınca ikisi yan yana açılır.</p>`;
        if (K.cloud && K.cloud.enabled) {
          const r = await K.cloud.add('filmline', { key, text });
          if (r) lines.push(r);
          if (!K.isOwner()) K.notify(`${C.herName} filmde bir soruya cevap verdi`, `${K.fill(q)} → ${text}`, ['clapper']);
        }
        setTimeout(done, 2600 * SP);
      });
      form.addEventListener('click', (e) => {
        if (e.target.closest('[data-ask-skip], [data-ask-go]')) done();
      });
      if (FAST) setTimeout(done, 1500);
    });
  }
  async function us() {
    const items = [];
    const strips = K.kabin && K.kabin.strips ? K.kabin.strips().filter((s) => s.me && s.her) : [];
    if (strips.length) items.push({ h: `<div class="sn-strips">${strips.slice(0, 3).map((s) => `<span><img src="${s.me.data.thumb}" alt=""><img src="${s.her.data.thumb}" alt=""></span>`).join('')}</div>`, t: `Fotoğraf Kabini'nde ${strips.length} şerit. Son karede hep aynı kalp.` });
    const nd = K.nerd && K.nerd.score && K.nerd.score();
    if (nd && nd.g.me + nd.g.her) items.push({ t: `${nd.g.me + nd.g.her} nərd oyunu. Skor: ${C.myPet} ${nd.t.me} · ${C.herPet} ${nd.t.her}.` });
    const sf = K.sofra && K.sofra.count ? K.sofra.count() : 0;
    if (sf) items.push({ t: `${sf} kez aynı sofraya oturdular; aralarında ${K.num(C.distanceKm)} km vardı.` });
    const st = K.dakika && K.dakika.stars ? K.dakika.stars().length : 0;
    if (st) items.push({ t: `Her akşam 21:21'de ${st} yıldız yaktılar.` });
    if (!items.length) {
      layer(`<p class="sn-text">${words(F().usEmpty || 'Bu bölüm henüz boş.')}</p>`);
      return wait(7000);
    }
    for (const it of items) {
      if (film.cut) return;
      layer(`${it.h || ''}<p class="sn-text">${words(it.t)}</p>`, 'us');
      await wait(it.h ? 6200 : 4800);
    }
  }
  async function userScenes() {
    const list = scenesUser.slice().sort((a, b) => (a.data.date || '').localeCompare(b.data.date || ''));
    for (const r of list) {
      if (film.cut || film.dead) return;
      let img = null;
      if (r.data.full) {
        const h = await K.cloud.get(r.data.full);
        img = (h && h.data && h.data.img) || r.data.thumb;
      }
      const em = (F().emotions || []).find((e) => e[0] === r.data.emotion);
      layer(`${img ? `<div class="sn-photo a"><img src="${img}" alt=""></div>` : ''}<p class="${img ? 'sn-cap' : 'sn-text'}">${K.esc(r.data.text)}</p><p class="sn-scene-by">${K.esc(T.fmt(r.data.date || T.todayKey()))}${em ? ' · ' + K.esc(em[1]) : ''} · ${K.esc(nameOf(r.who))} ekledi</p>`, img ? 'ph' : '');
      await wait(img ? 6200 : 5200);
    }
  }
  async function credits() {
    const f = film;
    f.score.stop();
    const days = Math.max(0, T.daysSince(C.metDate));
    const cr = (F().credits || []).map(([role, ...names]) => `<div class="sn-cr"><small>${K.esc(role)}</small>${names.map((n) => `<b>${K.esc(K.fill(n))}</b>`).join('')}</div>`).join('');
    const l = layer(`<div class="sn-credits"><div class="sn-song"></div><div class="sn-roll"><div class="sn-roll-in" style="--dur:${FAST ? 3 : 58}s">
      <p class="sn-cr-t script">${K.esc(F().title)}</p>${cr}<div class="sn-cr"><small>Süre</small><b>${K.num(days)} gün ve devam ediyor</b></div><p class="sn-cr-end">${K.esc(F().creditsEnd || '')}</p></div></div>
      <button type="button" class="btn ghost small sn-skipcr" data-cr-skip>Jenerik sonrası ${A.ui('next')}</button></div>`, 'credits');
    f.pk = K.pikap.mount(K.$('.sn-song', l), C.song || {}, { hint: true });
    await new Promise((res) => {
      let fin = false;
      const done = () => {
        if (fin) return;
        fin = true;
        res();
      };
      f.resolve = done;
      l.addEventListener('click', (e) => e.target.closest('[data-cr-skip]') && (f.together && !f.host ? send({ t: 'next' }) : done()));
      K.$('.sn-roll-in', l).addEventListener('animationend', () => setTimeout(done, 1500 * SP));
    });
    // Şarkıyı yavaşça kıs
    const pl = f.pk && f.pk.player;
    if (pl && pl.setVolume && !f.dead) {
      for (let v = 100; v >= 0; v -= 10) {
        try {
          pl.setVolume(v);
        } catch (e) {}
        await K.wait(120);
      }
    }
    f.pk && f.pk.stop();
    f.pk = null;
  }
  async function post() {
    const f = film;
    const P = F().post || {};
    const fl = K.bilet && K.bilet.get && K.bilet.get();
    const tg = goal();
    const when = fl ? T.fmt(fl.date) : tg ? `${T.fmtShort(tg.from)} – ${T.fmt(tg.to)}` : 'Yakında';
    layer(`<div class="sn-post"><small>${K.esc(P.kicker || '')}</small><b class="script">${K.esc(K.fill(P.title || ''))}</b><p>Vizyon: ${K.esc(when)}</p></div>`, 'dark');
    await wait(5200);
    if (f.cut || f.dead) return finish();
    await voice('film-son');
    if (f.dead) return;
    f.cut = false;
    if (P.ask) await ask(P.askKey || 'replik', P.ask);
    if (f.dead) return;
    f.cut = false;
    finish();
  }
  function finish() {
    const f = film;
    if (!f || f.dead) return;
    f.done = true;
    K.stickers.award('sinema');
    layer(`<div class="sn-end"><b class="script">${K.esc(F().post && F().post.end ? F().post.end : 'Son.')}</b><div class="sn-end-b"><button type="button" class="btn red" data-end="again">${A.ui('refresh')} Baştan izle</button><button type="button" class="btn ghost" data-end="close">Salona dön</button></div></div>`, 'dark');
    K.fx.confetti({ count: 120, shapes: ['heart', 'star'] });
    K.$('#snStage', f.el).addEventListener('click', (e) => {
      const b = e.target.closest('[data-end]');
      if (!b) return;
      const again = b.dataset.end === 'again';
      close();
      if (again) setTimeout(() => open(0), 700);
    });
  }
  function react(e, mine_) {
    if (!film) return;
    const fly = K.$('#snFly', film.el);
    const b = K.el(`<span class="${mine_ ? 'me' : 'them'}" style="left:${mine_ ? 60 + Math.random() * 30 : 8 + Math.random() * 30}%">${e}</span>`);
    fly.appendChild(b);
    setTimeout(() => b.remove(), 2600);
    if (mine_) {
      film.reacts.push([film.list[film.i].key, e]);
      K.vibrate(10);
      // "e" alanı bulutun olay adı; emoji "r" ile gider
      if (film.together) send({ t: 'react', r: e });
    }
  }
  async function close(remote) {
    const f = film;
    if (!f) return;
    f.dead = true;
    film = null;
    f.resolve && f.resolve();
    if (f.audio) f.audio.pause();
    f.pk && f.pk.stop();
    f.score.close();
    try {
      f.lock && f.lock.release();
    } catch (e) {}
    document.removeEventListener('keydown', onKey);
    if (f.together && !remote) send({ t: 'bye', sid: f.sid });
    f.el.classList.remove('opened');
    f.el.classList.add('closing');
    setTimeout(() => {
      f.el.remove();
      document.body.classList.remove('sn-on');
      if (!document.querySelector('.modal, .tur')) document.body.classList.remove('has-modal');
    }, FAST ? 50 : 700);
    // İzleme kaydı (tepkiler ve nereye kadar izlendiği)
    if (K.cloud && K.cloud.enabled && (f.reacts.length || f.i > 4)) {
      const r = await K.cloud.add('filmview', { reacts: f.reacts.slice(0, 300), last: f.list[f.i] ? f.list[f.i].key : '', done: f.done, together: f.together });
      if (r) views.push(r);
      if (!K.isOwner() && f.done) {
        const cnt = {};
        f.reacts.forEach(([, e]) => (cnt[e] = (cnt[e] || 0) + 1));
        K.notify(`${C.herName} filmimizi izledi`, Object.keys(cnt).length ? `Tepkileri: ${Object.entries(cnt).map(([e, n]) => `${e}×${n}`).join(' ')}` : 'Sonuna kadar.', ['clapper']);
      }
    }
    lobby();
  }

  /* ---------- Birlikte izle (canlı) ---------- */
  function onLive(m) {
    if (!m || m.who === mine()) return;
    if (m.t === 'invite') {
      if (film) return;
      if (invite && invite.sid < m.sid) return;
      invite = null;
      incoming = { sid: m.sid, from: m.from || 0 };
      if (K.activeRoom === 'sinema') {
        K.audio.sfx.chime();
        actions();
      } else K.fx.toast(`<b>${K.esc(nameOf(m.who))} seni sinemaya çağırıyor.</b> <a href="#sinema">Bizim Filmimiz</a>`, { icon: A.icon('film'), duration: 12000 });
      return;
    }
    if (m.t === 'ready' && invite && invite.sid === m.sid) {
      const inv = invite;
      invite = null;
      K.cloud.send('sn', { sid: inv.sid, t: 'go', from: inv.from, delay: 2500 });
      setTimeout(() => open(inv.from, { together: true, host: true, sid: inv.sid }), 2500);
      return;
    }
    if (m.t === 'go' && incoming && incoming.sid === m.sid) {
      incoming = null;
      setTimeout(() => open(m.from || 0, { together: true, host: false, sid: m.sid }), Math.max(300, (m.delay || 2500) - 300));
      return;
    }
    if (m.t === 'cancel' && incoming && incoming.sid === m.sid) {
      incoming = null;
      actions();
      return;
    }
    if (!film || m.sid !== film.sid) return;
    if (m.t === 'at' && !film.host) {
      film.hostAt = m.i;
      if (m.i > film.i) jump(m.i);
      film.hostWaiter && film.hostWaiter();
    }
    if (m.t === 'next' && film.host) cut();
    if (m.t === 'pause' && !film.paused) togglePause(true);
    if (m.t === 'resume' && film.paused) togglePause(true);
    if (m.t === 'react' && REACTS.includes(m.r)) react(m.r, false);
    if (m.t === 'touch' && film.touch) film.touch(m.pts);
    if (m.t === 'bye') {
      film.together = false;
      film.host = true;
      const tg = K.$('.sn-tog', film.el);
      if (tg) tg.remove();
      K.fx.toast(`${K.esc(nameOf(other()))} salondan çıktı. Film sende devam ediyor.`);
    }
  }
  function startTogether(from) {
    const sid = 's' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
    invite = { sid, from };
    K.cloud.send('sn', { sid, t: 'invite', from });
    actions();
    setTimeout(() => {
      if (invite && invite.sid === sid) {
        invite = null;
        K.cloud.send('sn', { sid, t: 'cancel' });
        K.fx.toast(`${K.esc(nameOf(other()))} cevap vermedi. İstersen tek başına izle.`);
        actions();
      }
    }, 60000);
  }

  /* ---------- Salon (lobi) ---------- */
  function poster() {
    const r = K.rng(7);
    const stars = Array.from({ length: 36 }, () => `<circle cx="${(r() * 300).toFixed(1)}" cy="${(r() * 260).toFixed(1)}" r="${(0.6 + r() * 1.6).toFixed(1)}" fill="#fff" opacity="${(0.3 + r() * 0.7).toFixed(2)}"/>`).join('');
    return `<svg class="sn-poster" viewBox="0 0 300 450" role="img" aria-label="${K.esc(F().title)} film afişi">
      <defs><linearGradient id="snPg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#140f2e"/><stop offset=".55" stop-color="#3b1640"/><stop offset="1" stop-color="#8c1f4a"/></linearGradient>
      <linearGradient id="snSea" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2a1d4f"/><stop offset="1" stop-color="#140f2e"/></linearGradient></defs>
      <rect width="300" height="450" fill="url(#snPg)"/>${stars}
      <circle cx="222" cy="92" r="26" fill="#FFE8A8" opacity=".9"/><circle cx="232" cy="86" r="24" fill="#241838" opacity=".55"/>
      <text x="150" y="42" text-anchor="middle" class="sn-p-bill">${K.esc(C.herPet.toLocaleUpperCase('tr-TR'))}   ·   ${K.esc(C.myPet.toLocaleUpperCase('tr-TR'))}</text>
      <path d="M58 250 Q150 130 242 250" fill="none" stroke="#FF8FB8" stroke-width="2" stroke-dasharray="3 6" opacity=".9"/>
      <path transform="translate(150 178) scale(.9)" d="M0 7 C-11 -1 -11 -12 -4.5 -12 C-1.5 -12 0 -9.5 0 -8 C0 -9.5 1.5 -12 4.5 -12 C11 -12 11 -1 0 7 Z" fill="#E3174D" stroke="#fff" stroke-width="1.5"/>
      <rect y="300" width="300" height="150" fill="url(#snSea)"/>
      <g fill="#0c0818"><ellipse cx="62" cy="300" rx="44" ry="8"/><rect x="50" y="248" width="24" height="52"/><rect x="42" y="272" width="10" height="28"/><path d="M46 248 L62 218 L78 248 Z"/><rect x="61" y="206" width="2" height="12"/>
      <rect x="216" y="222" width="40" height="78"/><path d="M256 244 L270 248 L270 300 L256 300 Z"/>${[0, 1, 2, 3, 4].map((k) => `<rect x="${216 + k * 8.2}" y="214" width="5" height="9"/>`).join('')}</g>
      <path d="M0 312 Q75 304 150 312 T300 312" fill="none" stroke="#8FD3FF" stroke-width="1" opacity=".35"/>
      <text x="150" y="360" text-anchor="middle" class="sn-p-title">${K.esc(F().title)}</text>
      <text x="150" y="384" text-anchor="middle" class="sn-p-tag">${K.esc(F().tagline || '')}</text>
      <text x="150" y="414" text-anchor="middle" class="sn-p-credits">${K.esc(`${C.myNick} FİLMİ · ${C.friendName ? C.friendName.toLocaleUpperCase('tr-TR') + ' SUNAR · ' : ''}MÜZİK ${C.song ? C.song.artist.toLocaleUpperCase('tr-TR') : ''}`)}</text>
      <text x="150" y="432" text-anchor="middle" class="sn-p-soon">YAKINDA · BÖLÜM 2 · ${K.esc(C.herCity.toLocaleUpperCase('tr-TR'))}'DE</text></svg>`;
  }
  function actions() {
    const el = root && K.$('#snActs', root);
    if (!el) return;
    const here = K.cloud && K.cloud.enabled && K.cloud.otherHere();
    const o = nameOf(other());
    if (incoming) {
      el.innerHTML = `<div class="pb-invite"><p><b>${K.esc(o)} seni sinemaya çağırıyor.</b> Kulaklığını tak; film ikinizde aynı anda başlayacak.</p><button type="button" class="btn red" data-sn-accept>${A.icon('film')} Geliyorum</button></div>`;
      return;
    }
    if (invite) {
      el.innerHTML = `<p class="pb-status">${K.esc(o)} bekleniyor... Salona girip "Geliyorum" deyince film başlar.</p><button type="button" class="btn ghost small" data-sn-uninvite>Vazgeç</button>`;
      return;
    }
    el.innerHTML = `<button type="button" class="btn red big" data-sn-start="0">${A.ui('play')} Filmi başlat</button>
      ${here ? `<button type="button" class="btn soft" data-sn-together>${A.ui('heart')} ${K.esc(o)} ile birlikte izle</button>` : ''}
      <p class="muted small">${here ? `<span class="sn-dot on"></span>${K.esc(o)} şu an kalede.` : `Yaklaşık 12 dakika · kulaklıkla izle. ${K.esc(o)} kaledeyken birlikte de izleyebilirsiniz.`}</p>`;
  }
  function lobby() {
    if (!root) return;
    actions();
    const seats = K.$('#snSeats', root);
    if (seats) {
      const here = K.cloud && K.cloud.enabled && K.cloud.otherHere();
      seats.innerHTML = [['A1', 'her'], ['A2', 'me']].map(([s, w]) => `<span class="${w === mine() || here ? 'on' : ''}"><small>${s}</small>${K.esc(nameOf(w))}</span>`).join('');
    }
    K.$('#snChaps', root).innerHTML = F()
      .chapters.map((ch, i) => `<button type="button" class="sn-chip" data-sn-start="${i}" style="--c:${ch.color}">${K.esc(ch.emotion || ch.label)}</button>`)
      .join('');
    // Cevaplar: onunki, sen de cevaplayınca açılır
    const qs = [];
    F().chapters.forEach((ch) => ch.scenes.forEach((s) => s[0] === 'ask' && qs.push([s[1], s[2]])));
    if (F().post && F().post.ask) qs.push([F().post.askKey || 'replik', F().post.ask]);
    const lastOf = (w, k) => lines.filter((r) => r.who === w && r.data.key === k).pop();
    const qhtml = qs
      .map(([k, q]) => {
        const a = lastOf(mine(), k), b = lastOf(other(), k);
        if (!a && !b) return '';
        return `<div class="sn-qa"><p class="card-eyebrow">${K.esc(K.fill(q))}</p><div><p><small>${K.esc(nameOf(mine()))}</small>${a ? `<span class="hand">"${K.esc(a.data.text)}"</span>` : '<em>Henüz cevaplamadın; filmde soruyu bulunca yaz.</em>'}</p>
          <p><small>${K.esc(nameOf(other()))}</small>${b ? (a ? `<span class="hand">"${K.esc(b.data.text)}"</span>` : '<em>Cevapladı. Sen de cevaplayınca açılır.</em>') : '<em>Henüz cevaplamadı.</em>'}</p></div></div>`;
      })
      .join('');
    K.$('#snLines', root).innerHTML = qhtml ? `<p class="card-eyebrow">Filmdeki sorular</p>${qhtml}` : '';
    K.$('#snLines', root).hidden = !qhtml;
    // Onun tepkileri (en çok hangi sahnede)
    const vs = views.filter((r) => r.who === other());
    const ins = K.$('#snInsight', root);
    if (!vs.length) {
      ins.hidden = true;
    } else {
      const by = {};
      vs.forEach((v) => (v.data.reacts || []).forEach(([key, e]) => ((by[e] = by[e] || {})[key] = (by[e][key] || 0) + 1)));
      const top = REACTS.filter((e) => by[e]).map((e) => {
        const [key, n] = Object.entries(by[e]).sort((a, b) => b[1] - a[1])[0];
        return `<li><span class="sn-e">${e}</span><div><b>${K.esc(sceneLabel(key))}</b><small>${n} kez</small></div></li>`;
      });
      ins.hidden = false;
      ins.innerHTML = `<p class="card-eyebrow">${K.esc(K.ek(nameOf(other()), 'in'))} tepkileri</p><p class="small">${vs.length} kez izledi · ${vs.filter((v) => v.data.done).length} kez sonuna kadar${vs.some((v) => v.data.together) ? ' · birlikte izlediniz' : ''}</p>${top.length ? `<ul class="sn-top">${top.join('')}</ul>` : ''}`;
    }
    // Eklenen sahneler
    K.$('#snScenes', root).innerHTML = scenesUser.length
      ? `<p class="card-eyebrow">Filme eklenen sahneler · ${scenesUser.length}</p><ul class="sn-slist">${scenesUser
          .slice()
          .sort((a, b) => (a.data.date || '').localeCompare(b.data.date || ''))
          .map((r) => `<li>${r.data.thumb ? `<img src="${r.data.thumb}" alt="">` : `<i>${A.icon('film')}</i>`}<div><b>${K.esc(r.data.text)}</b><small>${K.esc(T.fmtShort(r.data.date || T.todayKey()))} · ${K.esc(nameOf(r.who))}</small></div>${r.who === mine() ? `<button type="button" class="wn-x" data-sn-del="${r.id}" aria-label="Sil">${A.ui('close')}</button>` : ''}</li>`)
          .join('')}</ul>`
      : '';
  }
  function shrink(file, max, q) {
    return new Promise((res) => {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        const k = Math.min(1, max / Math.max(img.width, img.height));
        const c = document.createElement('canvas');
        c.width = Math.round(img.width * k);
        c.height = Math.round(img.height * k);
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
        URL.revokeObjectURL(url);
        res(c.toDataURL('image/jpeg', q));
      };
      img.onerror = () => res(null);
      img.src = url;
    });
  }
  async function addScene(form) {
    const fd = new FormData(form);
    const text = String(fd.get('snText') || '').trim();
    const date = String(fd.get('snDate') || T.todayKey());
    const emotion = String(fd.get('snEm') || '');
    const file = K.$('[name="snImg"]', form).files[0];
    if (!text) return K.fx.toast('Sahnenin bir cümlesi olsun.');
    const btn = K.$('button[type=submit]', form);
    btn.disabled = true;
    let thumb = '', full = '';
    if (file) {
      const big = await shrink(file, 1400, 0.8);
      thumb = (await shrink(file, 420, 0.7)) || '';
      const h = big && (await K.cloud.add('sahneimg', { img: big }));
      full = h ? h.id : '';
    }
    const r = await K.cloud.add('sahne', { text, date, emotion, thumb, full });
    btn.disabled = false;
    if (!r) return K.fx.toast('Sahne eklenemedi. İnterneti kontrol et.');
    form.reset();
    K.audio.sfx.chime();
    K.fx.toast('Sahne filme eklendi. "Biz" bölümünde oynayacak.', { icon: A.icon('film') });
    if (!K.isOwner()) K.notify(`${C.herName} filmimize bir sahne ekledi`, text, ['clapper']);
    lobby();
  }

  /* ---------- Bulut ---------- */
  function loadAll() {
    if (!K.cloud || !K.cloud.enabled) return Promise.resolve();
    return (loaded = loaded || (async () => {
      const [a, b, c] = await Promise.all([K.cloud.list('filmview', 300), K.cloud.list('filmline', 300), K.cloud.list('sahne', 200)]);
      const add = (arr, rs) => rs.forEach((r) => arr.some((x) => x.id === r.id) || arr.push(r));
      add(views, a);
      add(lines, b);
      add(scenesUser, c);
      if (K.activeRoom === 'sinema') lobby();
    })());
  }
  K.on('cloud', async (on) => {
    if (!on) return;
    K.cloud.onLive('sn', onLive);
    const recent = await K.cloud.list('sahne', 3);
    recent.forEach((r) => scenesUser.some((x) => x.id === r.id) || scenesUser.push(r));
    [['filmview', views], ['filmline', lines], ['sahne', scenesUser]].forEach(([k, arr]) =>
      K.cloud.on(k, (r) => {
        if (arr.some((x) => x.id === r.id)) return;
        arr.push(r);
        if (r.who !== mine() && k === 'sahne') K.fx.toast(`<b>${K.esc(nameOf(r.who))} filmimize bir sahne ekledi.</b> <a href="#sinema">Bizim Filmimiz</a>`, { icon: A.icon('film'), duration: 8000 });
        if (r.who !== mine() && k === 'filmline') K.fx.toast(`<b>${K.esc(nameOf(r.who))} filmdeki bir soruya cevap verdi.</b> Sen de cevaplayınca görürsün.`, { icon: A.icon('film'), duration: 8000 });
        if (K.activeRoom === 'sinema' && !film) lobby();
        else if (!K.activeRoom && K.renderSpecials) K.renderSpecials();
      })
    );
    K.cloud.on('deleted', ({ id }) => {
      scenesUser = scenesUser.filter((r) => r.id !== id);
      if (K.activeRoom === 'sinema' && !film) lobby();
    });
  });
  K.on('presence', () => {
    if (K.activeRoom === 'sinema' && !film) lobby();
    if (!K.cloud.otherHere() && incoming) {
      incoming = null;
      actions();
    }
  });
  // Ana salon: yeni eklenen sahne
  K.specialHooks = (K.specialHooks || []).concat(() => {
    const r = scenesUser.filter((x) => x.who === other() && Date.now() - x.at < 3 * 864e5).pop();
    return r ? [{ icon: 'film', title: 'Filmimize yeni bir sahne eklendi', text: `${nameOf(r.who)}: "${r.data.text}". "Biz" bölümünde oynuyor.`, room: 'sinema', cta: 'Salona gir' }] : [];
  });
  K.sinema = { open, flat, now: () => film && { i: film.i, t: film.list[film.i].t, key: film.list[film.i].key, together: film.together, host: film.host } };

  K.room({
    id: 'sinema',
    wing: 'anilar',
    title: 'Bizim Filmimiz',
    sub: () => F().tagline || 'Kalenin sinema salonu',
    icon: 'clapper',
    color: '#E9D9FF',
    hidden: () => !D.film,
    badge: () => (incoming ? 'Davet var' : ''),
    init(el) {
      root = el;
      el.innerHTML = `<div class="room-intro">${K.paras(F().intro || [])}</div>
        <div class="sn-lobby">
          ${poster()}
          <div class="sn-side">
            <div class="sn-ticket"><div><small>Salon 1 · Bizim Filmimiz</small><b>${K.esc(F().title)}</b><p class="sn-seats" id="snSeats"></p></div><i aria-hidden="true"></i><span>Seans<br><b>şimdi</b></span></div>
            <div class="sn-acts" id="snActs"></div>
            <p class="card-eyebrow" style="margin-top:6px">Bölümler</p>
            <div class="sn-chaps" id="snChaps"></div>
          </div>
        </div>
        <section class="card sn-lines" id="snLines" hidden></section>
        <section class="card sn-insight" id="snInsight" hidden></section>
        ${K.cloud && K.cloud.enabled ? `<form class="card sn-add" id="snAdd" autocomplete="off"><p class="card-eyebrow">Filme sahne ekle</p><p class="muted small">Kalede ya da hayatta birlikte yaşadığınız bir an: bir fotoğraf ve bir cümle. "Biz" bölümünde tarih sırasıyla oynar.</p>
          <textarea class="textarea" name="snText" rows="2" maxlength="160" placeholder="Sahnenin cümlesi (ör. İlk kez aynı anda uyuyakaldık)"></textarea>
          <div class="row"><input class="input" type="date" name="snDate" value="${T.todayKey()}" aria-label="Tarih"><select class="input" name="snEm" aria-label="Duygu">${(F().emotions || []).map(([id, n]) => `<option value="${id}">${K.esc(n)}</option>`).join('')}</select></div>
          <label class="btn soft small">${A.ui('image')} Fotoğraf (isteğe bağlı)<input type="file" name="snImg" accept="image/*" hidden></label>
          <button class="btn red small" type="submit">${A.ui('plus')} Filme ekle</button></form>` : ''}
        <div id="snScenes" class="card sn-scenes"></div>`;
      el.addEventListener('submit', (e) => {
        if (!e.target.closest('#snAdd')) return;
        e.preventDefault();
        addScene(e.target);
      });
      el.addEventListener('change', (e) => {
        if (e.target.name === 'snImg' && e.target.files[0]) e.target.closest('label').firstChild.nextSibling.textContent = ' Fotoğraf seçildi';
      });
      el.addEventListener('click', async (e) => {
        const st = e.target.closest('[data-sn-start]');
        if (st) return open(+st.dataset.snStart);
        if (e.target.closest('[data-sn-together]')) return startTogether(0);
        if (e.target.closest('[data-sn-accept]')) {
          if (!incoming) return;
          K.cloud.send('sn', { sid: incoming.sid, t: 'ready' });
          K.$('#snActs', root).innerHTML = `<p class="pb-status">Hazırsın. ${K.esc(nameOf(other()))} filmi başlatıyor...</p>`;
          return;
        }
        if (e.target.closest('[data-sn-uninvite]')) {
          if (invite) K.cloud.send('sn', { sid: invite.sid, t: 'cancel' });
          invite = null;
          return actions();
        }
        const d = e.target.closest('[data-sn-del]');
        if (d) {
          if (d.dataset.armed !== '1') {
            d.dataset.armed = '1';
            d.classList.add('armed');
            return;
          }
          const r = scenesUser.find((x) => x.id === d.dataset.snDel);
          await K.cloud.remove(d.dataset.snDel);
          if (r && r.data.full) await K.cloud.remove(r.data.full);
          scenesUser = scenesUser.filter((x) => x.id !== d.dataset.snDel);
          lobby();
        }
      });
    },
    enter() {
      lobby();
      loadAll();
      // Sahnelerin fotoğraflarını önceden hazırla
      F().chapters.forEach((ch) => ch.scenes.slice(0, 2).forEach((s) => s[0] === 'photo' && photoUrl(s[1])));
    },
    leave() {
      if (film) close();
      if (invite) K.cloud.send('sn', { sid: invite.sid, t: 'cancel' });
      invite = null;
    },
  });
})();
