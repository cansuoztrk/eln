/* Kale 2.0 — Oda kapakları, kapı geçişi ve Kitty Rehber.
   Her odanın başında, odanın rengi ve kanadının deseniyle çizilmiş bir kapak sahnesi (kaçıncı gelişin olduğu yazar).
   Odaya girerken iki kanatlı bir kapı açılır. Bir odaya ilk kez girildiğinde Kitty köşeden kısaca anlatır; uzun süredir
   uğranmayan bir odayı da ana salonda hatırlatır. Hepsi Tema Atölyesi'nden kapatılabilir. */
(function () {
  'use strict';
  const K = window.K;
  const A = K.art;
  const D = window.ELN;
  const T = K.time;

  const SKIP = ['panel', 'panelek', 'son', 'kopus', 'hediye-kutusu'];
  const RH = () => D.rehber || { tips: {}, generic: [], uzak: '' };
  const opt = () => (K.atolye ? K.atolye.get() : { kapak: true, kapi: true });
  const DECOR = { anilar: ['camera', 'film', 'book', 'star'], kalp: ['heart', 'letter', 'hug', 'jar'], oyun: ['cards', 'dice', 'palette', 'star'], zaman: ['hourglass', 'pigeon', 'moon', 'key'], hazine: ['crown', 'gift', 'star', 'ticket'], mevsim: ['snow', 'cake', 'star', 'gift'], sahip: ['key', 'crown', 'note', 'heart'] };

  function cover(room, el) {
    if (!opt().kapak || SKIP.includes(room.id)) return;
    const wing = (K.WINGS || []).find((w) => w.id === (room.wing || 'hazine')) || { title: '', color: room.color, id: 'hazine' };
    const cnt = K.store.get('odaSay', {});
    const n = cnt[room.id] || 1;
    const old = K.$('.oda-kapak', el);
    if (old) {
      const sm = K.$('.ok-yazi small', old);
      if (sm) sm.textContent = `${wing.title} · ${n === 1 ? 'ilk gelişin' : `${n}. gelişin`}`;
      if (el.firstElementChild !== old) el.insertBefore(old, el.firstChild);
      return;
    }
    const r = K.rng(K.hash(room.id));
    const icons = DECOR[wing.id] || DECOR.hazine;
    const floats = Array.from({ length: 6 }, (_, i) => `<i style="left:${(8 + i * 15 + r() * 6).toFixed(1)}%;top:${(14 + r() * 56).toFixed(1)}%;--s:${(0.5 + r() * 0.45).toFixed(2)};--d:${(r() * -6).toFixed(1)}s;--r:${Math.round(r() * 40 - 20)}deg"><svg viewBox="0 0 64 64">${A.ICONS[icons[i % icons.length]] || ''}</svg></i>`).join('');
    el.insertAdjacentHTML(
      'afterbegin',
      `<div class="oda-kapak k-${wing.id}" style="--c:${room.color};--w:${wing.color}" aria-hidden="true">
        <div class="ok-desen"></div><div class="ok-floats">${floats}</div>
        <div class="ok-kemer"><span class="ok-ic">${A.icon(room.icon)}</span></div>
        <div class="ok-yazi"><small>${K.esc(wing.title)} · ${n === 1 ? 'ilk gelişin' : `${n}. gelişin`}</small><b>${K.esc(K.val(room.title))}</b></div>
      </div>`
    );
  }
  function door(room) {
    if (!opt().kapi || K.reduced) return;
    const old = K.$('.kapi-gecis');
    old && old.remove();
    const d = K.el(`<div class="kapi-gecis" style="--c:${room.color}" aria-hidden="true"><i class="kg-sol"><b></b></i><i class="kg-sag"><b></b></i><span class="kg-ic">${A.icon(room.icon)}</span></div>`);
    document.body.appendChild(d);
    requestAnimationFrame(() => requestAnimationFrame(() => d.classList.add('acik')));
    setTimeout(() => d.remove(), 1100);
  }

  /* ---------- Kitty Rehber ---------- */
  let bub = null;
  function hideBub() {
    if (!bub) return;
    const b = bub;
    bub = null;
    b.classList.remove('in');
    setTimeout(() => b.remove(), 300);
  }
  function guide(room, el) {
    if (opt().rehber === false || SKIP.includes(room.id)) return;
    const tip = (RH().tips || {})[room.id];
    const intro = K.$('.room-intro p', el);
    const m1 = intro ? intro.textContent.match(/^[^.!?]*[.!?]/) : null;
    const first = m1 ? m1[0] : '';
    const text = tip || first || K.fill(K.val(room.sub) || '');
    if (!text) return;
    hideBub();
    bub = K.el(`<div class="rehber" role="status"><span class="rh-k">${A.kitty({ cls: 'rh-kitty' })}</span><div><b>${K.esc(K.pick(RH().hello || ['Burası', 'Hoş geldin!']))} ${K.esc(K.val(room.title))}</b><p>${K.esc(K.fill(text))}</p>
      <div class="rh-acts"><button type="button" class="btn small" data-rh="ok">Anladım</button><button type="button" class="btn ghost small" data-rh="sus">Kitty sussun</button></div></div></div>`);
    document.body.appendChild(bub);
    setTimeout(() => bub && bub.classList.add('in'), 700);
    bub.addEventListener('click', (e) => {
      const b = e.target.closest('[data-rh]');
      if (!b) return;
      if (b.dataset.rh === 'sus') {
        K.atolye && K.atolye.save({ rehber: false });
        K.fx.toast('Kitty artık susuyor. İstersen Tema Atölyesi\'nden yeniden açabilirsin.', { duration: 3200 });
      }
      hideBub();
    });
    setTimeout(hideBub, 14000);
  }

  K.on('room', ({ id, el }) => {
    const room = K.rooms.find((r) => r.id === id);
    if (!room) return;
    const first = !(K.store.get('visited', {})[id]);
    const cnt = K.store.get('odaSay', {});
    cnt[id] = (cnt[id] || 0) + 1;
    K.store.set('odaSay', cnt);
    door(room);
    cover(room, el);
    if (first) guide(room, el);
    else hideBub();
    // Bazı odalar içeriklerini baştan çizer: kapak düşerse geri koy
    setTimeout(() => K.activeRoom === id && cover(room, el), 600);
  });
  // app.js'in yönlendiricisi odayı kapattıktan sonra bak
  window.addEventListener('hashchange', () => setTimeout(() => !K.activeRoom && hideBub(), 0));

  // Uzun süredir uğranmayan bir oda (hareketli olan önce)
  K.specialHooks = (K.specialHooks || []).concat(() => {
    if (opt().rehber === false || K.store.get('rehberCard') === T.todayKey()) return [];
    const last = K.store.get('lastVisit', {});
    const now = Date.now();
    const vis = (r) => !r.secret && !SKIP.includes(r.id) && !(typeof r.hidden === 'function' ? r.hidden() : r.hidden);
    const old = K.rooms.filter((r) => vis(r) && last[r.id] && now - last[r.id] > 14 * 864e5);
    if (!old.length) return [];
    const hot = old.filter((r) => r.badge && r.badge());
    const r = (hot.length ? hot : old)[K.hash(T.todayKey()) % (hot.length || old.length)];
    const days = Math.round((now - last[r.id]) / 864e5);
    return [{ key: 'rehber', icon: r.icon, title: `🐾 Kitty: ${K.val(r.title)} seni özledi`, text: `${days} gündür uğramadın.${r.badge && r.badge() ? ` Orada yeni bir şey var: ${r.badge()}.` : ''}`, run: () => (K.store.set('rehberCard', T.todayKey()), K.go(r.id)), cta: 'Uğra' }];
  });
  K.kapak = { cover, door };
})();
