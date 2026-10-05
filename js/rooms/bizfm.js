/* Oda: Biz FM — her pazar akşamı Kitty'nin sunduğu haftalık radyo programı. Haftanın Kalp Raporu'ndan (K.rapor)
   kurulur: açılış, haftanın havası ve kalp endeksi, telesekreterden haftanın sesleri (gerçek kayıtlar çalar), kavanozdan
   haftanın notu, minnet köşesi, öne çıkanlar, haftanın şarkısı ve kapanış. Kitty telefonun Türkçe sesiyle okur
   (speechSynthesis); ses yoksa altyazıyla ilerler. Eski haftaların yayınları arşivde. Yeni kayıt tutmaz. */
(function () {
  'use strict';
  const K = window.K;
  const A = K.art;
  const D = window.ELN;
  const C = D.config;
  const T = K.time;

  const FM = () => D.bizfm || { intro: [], open: [''], kapanis: [''] };
  const nameOf = (w) => (w === 'me' ? C.myPet : C.herPet);
  const mine = () => (K.isOwner() ? 'me' : 'her');
  const HAVA = { gunes: 'güneşli', gokkusagi: 'gökkuşaklı', parcali: 'parçalı bulutlu', sis: 'sisli', yagmur: 'yağmurlu', firtina: 'fırtınalı', kar: 'karlı' };
  let root = null, week = null, show = null, run = null;

  const shift = (w, n) => {
    const d = new Date(w + 'T12:00:00Z');
    d.setUTCDate(d.getUTCDate() + n);
    return d.toISOString().slice(0, 10);
  };
  const fillT = (s, o = {}) => K.fill(String(s || '').replace(/\{(herPet|myPet|hava|endeks|from|song)\}/g, (m, k) => (k === 'herPet' ? C.herPet : k === 'myPet' ? C.myPet : o[k] != null ? o[k] : m)));

  // Yayın akışı: [{t: 'say', text, title} | {t: 'clip', audio, who, dur, title} | {t: 'jingle'}]
  async function build(w) {
    const r = await K.rapor.data(w);
    const since = T.at(w).getTime(), before = T.at(shift(w, 7)).getTime();
    const extra = await K.cloud.many(['tsmesaj', 'minnet', 'radyo'], { since, before, limit: 400 });
    const rnd = K.rng(K.hash('fm' + w));
    const P = FM();
    const seg = [{ t: 'jingle', title: 'Biz FM' }, { t: 'say', title: 'Açılış', text: fillT(K.pick(P.open || [''], rnd)) }];
    seg.push({ t: 'say', title: 'Haftanın havası', text: r.top ? fillT(P.hava, { hava: HAVA[r.top] || r.top, endeks: r.index }) : fillT(P.havaYok) });
    const clips = extra.filter((x) => x.kind === 'tsmesaj').sort((a, b) => a.at - b.at).slice(-3);
    seg.push({ t: 'say', title: 'Haftanın sesleri', text: fillT(clips.length ? P.sesler : P.sesYok) });
    clips.forEach((c) => {
      seg.push({ t: 'say', title: 'Haftanın sesleri', text: fillT(P.sesFrom, { from: nameOf(c.who) }).replace(`${nameOf(c.who)}'dan`, K.ek(nameOf(c.who), 'den')) });
      seg.push({ t: 'clip', title: `📼 ${nameOf(c.who)}`, audio: c.data.audio, dur: c.data.dur || 10 });
    });
    if (r.note) seg.push({ t: 'say', title: 'Kavanozdan', text: `${fillT(P.not, { from: nameOf(r.note.who) })} ${r.note.data.note}` });
    const mn = extra.filter((x) => x.kind === 'minnet' && x.data.text);
    if (mn.length) seg.push({ t: 'say', title: 'Minnet köşesi', text: `${fillT(P.minnet)} ${K.shuffle(mn, rnd).slice(0, 3).map((x) => `${nameOf(x.who)}: ${x.data.text}.`).join(' ')}` });
    if (r.hi.length) seg.push({ t: 'say', title: 'Öne çıkanlar', text: `${fillT(P.vurgular)} ${r.hi.map((h) => h[1]).join('. ')}.` });
    const rad = extra.filter((x) => x.kind === 'radyo' && x.data.song).pop();
    const pool = K.sarkidefteri ? K.sarkidefteri.songs() : [];
    const song = rad ? { id: rad.data.sid, title: rad.data.song.title } : pool.length ? (() => { const s = K.pick(pool, rnd); return { id: s.id, title: s.data.title }; })() : null;
    if (song) seg.push({ t: 'say', title: 'Haftanın şarkısı', text: fillT(P.sarki, { song: song.title }), song });
    seg.push({ t: 'say', title: 'Kapanış', text: fillT(K.pick(P.kapanis || [''], rnd)) }, { t: 'jingle', title: 'Biz FM' });
    return { w, r, seg, song };
  }

  /* ---------- Ses ---------- */
  function trVoice() {
    const vs = (window.speechSynthesis && speechSynthesis.getVoices()) || [];
    return vs.find((v) => /^tr/i.test(v.lang) && /female|kadın|yelda|filiz/i.test(v.name)) || vs.find((v) => /^tr/i.test(v.lang)) || null;
  }
  function say(text, cancel) {
    return new Promise((res) => {
      const v = trVoice();
      if (!window.speechSynthesis || !v) {
        // Ses yoksa altyazı: okuma hızında bekle
        const t = setTimeout(res, Math.min(14000, 1200 + text.length * 62));
        cancel.fn = () => (clearTimeout(t), res());
        return;
      }
      const u = new SpeechSynthesisUtterance(text);
      u.voice = v;
      u.lang = v.lang;
      u.pitch = 1.3;
      u.rate = 1.02;
      u.onend = u.onerror = () => res();
      cancel.fn = () => (speechSynthesis.cancel(), res());
      speechSynthesis.speak(u);
    });
  }
  function jingle(cancel) {
    return new Promise((res) => {
      const ctx = K.audio.ensure() ? K.audio.ctx : null;
      if (!ctx) return res();
      const t0 = ctx.currentTime + 0.05;
      [523.25, 659.25, 783.99, 1046.5, 783.99, 1046.5].forEach((f, i) => {
        const o = ctx.createOscillator(), g = ctx.createGain();
        o.type = i % 2 ? 'triangle' : 'sine';
        o.frequency.value = f;
        const t = t0 + i * 0.16 + (i > 3 ? 0.12 : 0);
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(0.22, t + 0.02);
        g.gain.exponentialRampToValueAtTime(0.0001, t + 0.5);
        o.connect(g).connect(ctx.destination);
        o.start(t);
        o.stop(t + 0.55);
      });
      const tm = setTimeout(res, 1700);
      cancel.fn = () => (clearTimeout(tm), res());
    });
  }
  async function clip(s, cancel) {
    const url = await K.mikrofon.url(s.audio);
    if (!url) return;
    return new Promise((res) => {
      const a = new Audio(url);
      a.onended = a.onerror = () => res();
      cancel.fn = () => (a.pause(), res());
      a.play().catch(() => res());
    });
  }
  async function start(from = 0) {
    if (!show) return;
    stop();
    if (K.audio.music && K.audio.music.on) K.audio.music.stop(false);
    const me = (run = { i: from, cancel: {}, skip: false });
    K.store.set('fmHeard-' + mine(), show.w);
    paint();
    for (; me.i < show.seg.length; me.i++) {
      if (run !== me) return;
      paint();
      const s = show.seg[me.i];
      me.cancel = {};
      if (s.t === 'jingle') await jingle(me.cancel);
      else if (s.t === 'clip') await clip(s, me.cancel);
      else await say(s.text, me.cancel);
      if (run !== me) return;
    }
    run = null;
    K.stickers.award('bizfm');
    paint();
  }
  function stop() {
    if (!run) return;
    const r = run;
    run = null;
    r.cancel && r.cancel.fn && r.cancel.fn();
    try {
      window.speechSynthesis && speechSynthesis.cancel();
    } catch (e) {}
  }
  function skip() {
    if (!run) return;
    const r = run;
    r.cancel.fn && r.cancel.fn();
  }

  function paint() {
    if (!root || K.activeRoom !== 'bizfm') return;
    const box = K.$('#fmStudio', root);
    if (!show) return (box.innerHTML = '<p class="muted center">Yayın hazırlanıyor...</p>');
    const i = run ? run.i : -1;
    const s = i >= 0 ? show.seg[i] : null;
    box.innerHTML = `<div class="fm-desk ${run ? 'live' : ''}">
        <div class="fm-top"><span class="fm-air"><i></i>${run ? 'YAYINDA' : 'HAZIR'}</span><b class="fm-freq">21.21 FM</b></div>
        <div class="fm-host">${A.kitty({ eyes: run ? 'happy' : 'normal', bow: '#E3174D', cls: 'fm-kitty' })}<span class="fm-mic" aria-hidden="true">🎙️</span>${run ? '<span class="fm-waves" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i></span>' : ''}</div>
        <p class="fm-seg">${s ? K.esc(s.title) : `${K.esc(T.fmtShort(show.w))} – ${K.esc(T.fmtShort(shift(show.w, 6)))} haftası`}</p>
        <p class="fm-sub" aria-live="polite">${s ? (s.t === 'say' ? K.esc(s.text) : s.t === 'clip' ? '📼 ...' : '🎶 ♪ ♫ ♪') : `${show.seg.length} bölüm · yaklaşık ${Math.max(2, Math.round(show.seg.reduce((a, x) => a + (x.t === 'say' ? x.text.length * 0.065 : x.t === 'clip' ? x.dur : 2), 0) / 60))} dakika`}</p>
        <div class="fm-dots">${show.seg.map((x, k) => `<i class="${k < i ? 'past' : k === i ? 'on' : ''} ${x.t}"></i>`).join('')}</div>
        <div class="row center">${run ? `<button type="button" class="btn ghost" data-fm="stop">${A.ui('pause')} Durdur</button><button type="button" class="btn soft" data-fm="skip">${A.ui('next')} Atla</button>` : `<button type="button" class="btn red fm-go" data-fm="go">${A.ui('play')} Yayını başlat</button>`}</div>
        ${show.song && K.radyo ? `<button type="button" class="btn soft small" data-fm="song">📻 Haftanın şarkısını radyoda aç</button>` : ''}
        ${!trVoice() ? '<p class="muted small center">Telefonunda Türkçe ses bulunamadı; Kitty altyazıyla sunacak.</p>' : ''}</div>`;
  }
  async function load() {
    const w = week || K.rapor.latest();
    show = null;
    paint();
    K.$('#fmNav', root).innerHTML = `<button type="button" class="icon-btn" data-fm-w="-7" aria-label="Önceki hafta">‹</button><b>${K.esc(T.fmtShort(w))} – ${K.esc(T.fmtShort(shift(w, 6)))}</b><button type="button" class="icon-btn" data-fm-w="7" aria-label="Sonraki hafta" ${w >= K.rapor.latest() ? 'disabled' : ''}>›</button>`;
    const s = await build(w);
    if ((week || K.rapor.latest()) !== w) return;
    show = s;
    paint();
  }

  if (window.speechSynthesis) speechSynthesis.onvoiceschanged = () => paint();
  K.specialHooks = (K.specialHooks || []).concat(() => {
    if (!K.cloud || !K.cloud.enabled || !D.bizfm || !K.rapor) return [];
    const w = K.rapor.latest();
    const opens = T.at(shift(w, 6)).getTime() + 20.5 * 36e5;
    if (T.now().getTime() < opens || T.now().getTime() - opens > 3 * 864e5 || K.store.get('fmHeard-' + mine()) === w) return [];
    return [{ icon: 'radio', title: '📻 Biz FM yayında', text: 'Kitty bu haftayı anlatıyor: havası, sesleri, kavanozdan notu ve şarkısı.', room: 'bizfm', cta: 'Dinle' }];
  });

  K.room({
    id: 'bizfm',
    wing: 'kalp',
    title: 'Biz FM',
    sub: 'Kitty\'nin haftalık radyo programı',
    icon: 'radio',
    color: '#FFE0EA',
    hidden: () => !D.bizfm || !K.cloud || !K.cloud.enabled || !K.rapor,
    badge: () => (K.rapor && K.store.get('fmHeard-' + mine()) !== K.rapor.latest() ? 'Yeni' : ''),
    init(el) {
      root = el;
      el.innerHTML = `<div class="room-intro">${K.paras(FM().intro || [])}</div>
        <div class="rp-nav" id="fmNav"></div>
        <section class="card fm-card" id="fmStudio"></section>`;
      el.addEventListener('click', (e) => {
        const n = e.target.closest('[data-fm-w]');
        if (n) {
          const nw = shift(week || K.rapor.latest(), +n.dataset.fmW);
          if (nw > K.rapor.latest()) return;
          stop();
          week = nw;
          return load();
        }
        const b = e.target.closest('[data-fm]');
        if (!b) return;
        const a = b.dataset.fm;
        if (a === 'go') return start(0);
        if (a === 'stop') return stop(), paint();
        if (a === 'skip') return skip();
        if (a === 'song' && show && show.song) {
          stop();
          K.radyo.start(show.song.id);
          K.go('radyo');
        }
      });
    },
    enter() {
      week = null;
      load();
    },
    leave() {
      stop();
    },
  });
})();
