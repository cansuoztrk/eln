/* Oda: El Ele — ikimiz de aynı anda ekrana avucumuzu koyarız; iki el izi üst üste biner ve tuttuğumuz sürece yavaşça
   ısınıp renklenir (pembeden altın sarısına). Bırakınca kale o günü yazar: "Bugün 3 dakika el ele." En uzun süremiz
   rekor tahtasında durur. Yalnızca ikimiz de bu odadayken çalışır; değilse öbürünü çağırabilirsin.
   Canlı: el {on} · Kayıtlar: elele {sec} (kale sahibinin telefonu yazar, çift sayılmasın diye) */
(function () {
  'use strict';
  const K = window.K;
  const A = K.art;
  const D = window.ELN;
  const C = D.config;
  const T = K.time;

  const mine = () => (K.isOwner() ? 'me' : 'her');
  const other = () => (K.isOwner() ? 'her' : 'me');
  const nameOf = (w) => (w === 'me' ? C.myPet : C.herPet);
  let rows = [], root = null, ben = false, o = false, oAt = 0, beat = 0, t0 = 0, tick = 0;
  const birlikte = () => ben && o && Date.now() - oAt < 2600;
  const dayOf = (r) => T.key(T.baku(new Date(r.at)));
  const bugun = () => rows.filter((r) => dayOf(r) === T.todayKey()).reduce((a, r) => a + r.data.sec, 0);
  const rekor = () => rows.reduce((a, r) => Math.max(a, r.data.sec), 0);
  const fmt = (s) => (s >= 60 ? `${Math.floor(s / 60)} dk ${s % 60} sn` : `${s} sn`);
  function el(side, active) {
    return `<svg class="ee-el ${side} ${active ? 'on' : ''}" viewBox="0 0 100 130" aria-hidden="true"><path d="M30 128 C18 104 12 82 14 62 C15 52 25 50 28 60 L31 74 L28 28 C27 18 39 16 41 26 L44 60 L44 14 C44 4 57 4 57 14 L58 60 L61 22 C62 12 74 13 73 24 L71 64 L77 42 C80 32 91 36 88 46 L80 88 C76 106 70 118 66 128 Z"/></svg>`;
  }
  function paint() {
    if (!root || K.activeRoom !== 'elele') return;
    const both = birlikte();
    const sec = both && t0 ? Math.floor((Date.now() - t0) / 1000) : 0;
    const warm = Math.min(1, sec / 90);
    const stage = K.$('#eeSahne', root);
    stage.style.setProperty('--sicak', warm.toFixed(3));
    stage.classList.toggle('birlikte', both);
    K.$('#eeEller', root).innerHTML = el('ben', ben) + el('o', o && Date.now() - oAt < 2600);
    K.$('#eeDurum', root).innerHTML = both ? `<b>${fmt(sec)}</b><span>el ele</span>` : ben ? `<span>${K.esc(nameOf(other()))} elini koyunca başlar...</span>` : o ? `<span>${K.esc(nameOf(other()))} elini koydu. Seninki?</span>` : `<span>Avucunu ekrana koy ve bekle</span>`;
  }
  function render() {
    if (!root || K.activeRoom !== 'elele') return;
    const here = K.cloud && K.cloud.otherHere && K.cloud.otherHere();
    K.$('#eeBilgi', root).innerHTML = `<div class="ee-sayi"><div><b>${fmt(bugun())}</b><small>bugün</small></div><div><b>${fmt(rekor())}</b><small>rekor</small></div><div><b>${rows.length}</b><small>kez</small></div></div>
      ${here ? '' : `<p class="muted small center">${K.esc(nameOf(other()))} şu an kalede değil. <button type="button" class="linkish" data-ee-cagir>Çağır</button></p>`}`;
    paint();
  }
  function bas(v) {
    if (ben === v) return;
    ben = v;
    K.cloud && K.cloud.send && K.cloud.send('el', { on: v });
    clearInterval(beat);
    if (v) beat = setInterval(() => K.cloud.send('el', { on: true }), 1000);
    check();
  }
  function check() {
    const both = birlikte();
    if (both && !t0) {
      t0 = Date.now();
      K.vibrate(30);
      K.audio.sfx.chime();
    }
    if (!both && t0) {
      const sec = Math.floor((Date.now() - t0) / 1000);
      t0 = 0;
      if (sec >= 3 && mine() === 'me' && K.cloud && K.cloud.enabled) K.cloud.add('elele', { sec }).then((r) => r && (rows.push(r), render()));
      if (sec >= 3) {
        K.stickers.award('elele');
        if (sec >= 60) K.stickers.award('elele60');
        K.fx.toast(`🤝 <b>${fmt(sec)}</b> el ele tuttunuz.`, { duration: 3000 });
      }
    }
    paint();
  }
  K.on('cloud', async (ok) => {
    if (!ok) return;
    rows = await K.cloud.list('elele', 400);
    K.cloud.on('elele', (r) => rows.some((x) => x.id === r.id) || (rows.push(r), render()));
    K.cloud.onLive('el', (m) => {
      if (m.who === mine()) return;
      o = Boolean(m.on);
      oAt = Date.now();
      if (K.activeRoom !== 'elele' && m.on && !K.store.get('eleleCagri' + T.todayKey())) {
        K.store.set('eleleCagri' + T.todayKey(), 1);
        K.fx.toast(`🤝 ${K.esc(nameOf(m.who))} elini uzattı. <a href="#elele">Tut</a>`, { duration: 8000 });
      }
      check();
    });
  });
  K.room({
    id: 'elele',
    wing: 'kalp',
    title: 'El Ele',
    sub: 'İki avuç, bir ekran',
    icon: 'hugs',
    color: '#FFE7DC',
    hidden: () => !K.cloud || !K.cloud.enabled,
    init(el) {
      root = el;
      el.innerHTML = `<div class="room-intro"><p>İkimiz de aynı anda avucumuzu ekrana koyarız. Tuttuğumuz sürece eller ısınır, pembeden altın sarısına döner. Bırakınca kale o günü yazar.</p></div>
        <section class="card ee-kart"><div class="ee-sahne" id="eeSahne"><div class="ee-eller" id="eeEller"></div><div class="ee-durum" id="eeDurum"></div></div></section>
        <section class="card" id="eeBilgi"></section>`;
      const stage = K.$('#eeSahne', el);
      stage.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        stage.setPointerCapture && stage.setPointerCapture(e.pointerId);
        bas(true);
      });
      ['pointerup', 'pointercancel', 'lostpointercapture'].forEach((ev) => stage.addEventListener(ev, () => bas(false)));
      stage.addEventListener('contextmenu', (e) => e.preventDefault());
      el.addEventListener('click', (e) => {
        if (e.target.closest('[data-ee-cagir]')) K.ping(`🤝 ${K.meName()} elini uzattı`, 'Kaleye gel, El Ele odasında elini tut.', ['handshake'], { click: K.roomUrl('elele') }), K.fx.toast('Çağrıldı.');
      });
    },
    enter() {
      render();
      clearInterval(tick);
      tick = setInterval(() => (t0 && !birlikte() ? check() : paint()), 250);
    },
    leave() {
      bas(false);
      clearInterval(tick);
    },
  });
})();
