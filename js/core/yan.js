/* Kale 2.0 — Yanında: kalede aynı anda olduğunuzda birbirinizi görmek.
   Alt menüde onun kulesi: yeşil nokta varsa kalede, hangi odada olduğu yazar; "Yanına git" seni aynı odaya götürür.
   "Dürt": onun ekranında kenarlardan kalpler akar, telefonu titrer. Aynı odadaysanız oda pembe bir ışıkla çevrilir.
   Alt menü (dock): Salon · Kanatlar · Kitty'ye Sor · Gün Gün · onun kulesi. Canlı mesajlar: yer {room} · durt {n} */
(function () {
  'use strict';
  const K = window.K;
  const A = K.art;
  const D = window.ELN;
  const C = D.config;

  const YN = () => D.yan || { nudges: ['{from} seni dürttü.'], back: 'Ben de ♥', same: 'İkiniz de buradasınız' };
  const mine = () => (K.isOwner() ? 'me' : 'her');
  const other = () => (K.isOwner() ? 'her' : 'me');
  const nameOf = (w) => (w === 'me' ? C.myPet : C.herPet);
  const here = () => Boolean(K.cloud && K.cloud.enabled && K.cloud.otherHere());
  const roomOf = (id) => id && K.rooms.find((r) => r.id === id);

  let their = null, lastSent = '', sentAt = 0, sameShown = '';

  /* ---------- Yer bilgisi ---------- */
  function send(force) {
    if (!K.cloud || !K.cloud.enabled) return;
    const room = K.activeRoom || '';
    if (!force && room === lastSent && Date.now() - sentAt < 50000) return;
    lastSent = room;
    sentAt = Date.now();
    K.cloud.send('yer', { room });
  }
  function where() {
    if (!here()) return null;
    if (!their) return { text: 'Kalede', room: '' };
    const r = roomOf(their.room);
    return { text: r ? K.val(r.title) : 'Ana salonda', room: r ? r.id : '' };
  }
  function same() {
    return here() && their && their.room && their.room === K.activeRoom;
  }
  function paint() {
    const w = where();
    const on = Boolean(w);
    K.$$('.yan-av').forEach((el) => el.classList.toggle('on', on));
    const lbl = K.$('#dockYanL');
    if (lbl) lbl.textContent = on && w.room ? w.text : nameOf(other());
    const s = same();
    document.body.classList.toggle('same-room', Boolean(s));
    const bub = K.$('#yanBubble');
    if (bub) {
      // Alt kenarı kullanan oyunlarda (kelime klavyesi, pinpon raketi) baloncuk gizlenir
      bub.hidden = !(on && K.activeRoom) || ['kelime', 'pinpon', 'nerd'].includes(K.activeRoom);
      bub.classList.toggle('same', Boolean(s));
      K.$('.yb-t', bub).textContent = s ? YN().same || 'Buradasınız' : w && w.room ? w.text : 'Kalede';
    }
    if (s && sameShown !== K.activeRoom) {
      sameShown = K.activeRoom;
      K.audio.sfx.sparkle();
      K.fx.toast(`<b>${K.esc(YN().same || 'İkiniz de buradasınız')}</b> ${K.esc(nameOf(other()))} da şu an bu odada.`, { icon: A.icon('hugs'), duration: 4000 });
    }
    if (!s) sameShown = '';
  }

  /* ---------- Dürt ---------- */
  function nudge() {
    if (!K.cloud || !K.cloud.enabled) return;
    K.cloud.send('durt', { n: Math.floor(Math.random() * 1000) });
    K.vibrate(30);
    K.audio.sfx.pop();
    K.stickers.award('durt');
    // Kalede değilse telefonuna da gitsin (beş dakikada bir)
    if (!here() && Date.now() - K.store.get('durtPing', 0) > 5 * 6e4) {
      K.store.set('durtPing', Date.now());
      K.ping(`💗 ${K.meName()} seni dürttü`, 'Kalbini hissettirmek istedi. Kaleye uğra.', ['heart']);
    }
    if (!here()) K.fx.toast(K.esc(K.fill((YN().away || '{other} şu an kalede değil.').replace('{other}', nameOf(other())))), { icon: A.icon('heart'), duration: 4500 });
    else K.fx.toast(`<b>Dürttün.</b> ${K.esc(nameOf(other()))} şu an kalbini hissediyor.`, { icon: A.icon('heart'), duration: 2500 });
  }
  function nudged(m) {
    const texts = YN().nudges || [];
    const t = K.fill((texts[m.n % texts.length] || '{from} seni dürttü.').replace('{from}', nameOf(m.who)));
    const ov = K.el(`<div class="yan-pulse" aria-hidden="true">${Array.from({ length: 18 }, (_, i) => `<i style="--x:${(i * 53) % 100}%;--d:${(i % 6) * 0.12}s;--s:${0.7 + (i % 4) * 0.2};--side:${i % 2 ? 1 : -1}">♥</i>`).join('')}</div>`);
    document.body.appendChild(ov);
    setTimeout(() => ov.remove(), 2600);
    K.vibrate([60, 50, 60, 50, 120]);
    K.audio.sfx.chime();
    K.fx.toast(`<b>${K.esc(t)}</b> <button type="button" class="linkish" data-yan-back>${K.esc(YN().back || 'Ben de ♥')}</button>`, { icon: A.icon('heart'), duration: 8000 });
  }

  /* ---------- Sayfa ---------- */
  function sheet() {
    const w = where();
    const o = other();
    const wx = K.hava && K.hava.today(o);
    const wxT = wx && K.hava.type(wx.data.type);
    const tz = o === 'her' ? C.tzBaku : C.tzIstanbul;
    const city = o === 'her' ? C.herCity || 'Bakü' : C.myCity || 'İstanbul';
    const r = w && w.room && roomOf(w.room);
    const canGo = r && r.id !== K.activeRoom && !(typeof r.hidden === 'function' ? r.hidden() : r.hidden);
    const lastSeen = K.store.get('yanLast', 0);
    const wc = K.$('#whereChip');
    const plan = o === 'me' && wc && !wc.hidden ? K.$('span', wc).textContent : '';
    const m = K.ui.modal({
      label: nameOf(o),
      cls: 'yan-sheet',
      html: `<div class="yan-top">${K.avatar(o, 'big yan-av ' + (w ? 'on' : ''))}<div><p class="card-eyebrow">${K.esc(city)} · ${K.esc(K.time.hm(tz))}</p><h2>${K.esc(nameOf(o))}</h2>
          <p class="yan-st">${w ? `<span class="dot on"></span>${r ? `Şu an <b>${K.esc(w.text)}</b> odasında` : w.text === 'Ana salonda' ? 'Şu an ana salonda' : 'Şu an kalede'}` : `<span class="dot"></span>Kalede değil${lastSeen ? ` · son görülme ${K.esc(K.ago(lastSeen))}` : ''}`}</p></div></div>
        <ul class="yan-facts">${K.durum && K.durum.of(o) ? `<li><span>${K.durum.of(o).data.emoji}</span>${K.esc(K.durum.of(o).data.text)} · ${K.esc(K.ago(K.durum.of(o).at))}</li>` : ''}${wxT ? `<li><span>${K.hava.emo[wxT[0]]}</span>İçi bugün ${K.esc(wxT[1].toLocaleLowerCase('tr'))}${wx.data.note ? `: "${K.esc(wx.data.note)}"` : ''}</li>` : ''}${plan ? `<li><span>📅</span>${K.esc(plan)}</li>` : ''}</ul>
        <div class="yan-acts">
          ${canGo ? `<a class="btn red" href="#${r.id}" data-close>${A.ui('next')} Yanına git: ${K.esc(K.val(r.title))}</a>` : ''}
          <button type="button" class="btn ${canGo ? 'soft' : 'red'}" data-yan-durt>${A.ui('heart')} Dürt</button>
          ${!w ? `<button type="button" class="btn soft" data-yan-call>${A.icon('bow')} ${K.esc(K.ek(nameOf(o), 'i'))} kaleye çağır</button>` : ''}
          <a class="btn ghost" href="#birlikte" data-close>${A.icon('hugs')} Birlikte odası</a>
        </div>`,
    });
    m.body.addEventListener('click', (e) => {
      if (e.target.closest('[data-yan-durt]')) nudge();
      if (e.target.closest('[data-yan-call]')) {
        const last = K.store.get('yanCall', 0);
        if (Date.now() - last < 10 * 6e4) return K.fx.toast('Az önce çağırdın; bildirimi gitti. Biraz bekle.');
        K.store.set('yanCall', Date.now());
        K.ping(K.isOwner() ? `${C.myPet} seni kaleye çağırıyor` : K.fill(YN().call || '{herPet} seni kaleye çağırıyor'), K.fill(YN().callText || ''), ['bell', 'heart'], { priority: 5 });
        K.fx.toast(`<b>Çağırdın.</b> ${K.esc(K.ek(nameOf(o), 'in'))} telefonuna bildirim gitti.`, { icon: A.icon('bow') });
        m.close();
      }
    });
  }

  /* ---------- Alt menü ---------- */
  function dock() {
    if (K.$('#dock')) return;
    const d = K.el(`<nav class="dock" id="dock" aria-label="Kale menüsü">
      <button type="button" data-dock="home" aria-label="Ana salon; bir daha dokununca kalenin haritası">${A.ui('home')}<span>Salon</span></button>
      <button type="button" data-dock="ara" aria-label="Kitty'ye Sor">${A.ui('search')}<span>Ara</span></button>
      <button type="button" data-dock="kalp" class="dock-kalp" aria-label="Kalp menüsü (basılı tut: dürt)"><i class="dk-heart" aria-hidden="true"><svg viewBox="-13 -14 26 23"><path d="M0 7 C-11 -1 -11 -12 -4.5 -12 C-1.5 -12 0 -9.5 0 -8 C0 -9.5 1.5 -12 4.5 -12 C11 -12 11 -1 0 7 Z"/></svg></i><em id="dockFlame" hidden></em></button>
      <button type="button" data-dock="gungun" aria-label="Gün Gün Biz">${A.ui('cal')}<span>Gün Gün</span></button>
      <button type="button" data-dock="yan" class="dock-yan" aria-label="${K.esc(nameOf(other()))}">${K.avatar(other(), 'yan-av')}<b class="dk-st" id="dockSt" hidden></b><span id="dockYanL">${K.esc(nameOf(other()))}</span></button>
    </nav>`);
    const bub = K.el(`<button type="button" class="yan-bubble" id="yanBubble" hidden aria-label="${K.esc(nameOf(other()))} kalede">${K.avatar(other(), 'yan-av on')}<span class="yb-t"></span></button>`);
    document.body.appendChild(d);
    document.body.appendChild(bub);
    document.body.classList.add('has-dock');
    // Kalp: dokun → menü, basılı tut → dürt
    const heart = K.$('.dock-kalp', d);
    let holdT = 0, held = false;
    heart.addEventListener('pointerdown', () => {
      held = false;
      holdT = setTimeout(() => {
        held = true;
        heart.classList.add('beat');
        setTimeout(() => heart.classList.remove('beat'), 700);
        const r = heart.getBoundingClientRect();
        K.fx.burst(r.left + r.width / 2, r.top, { count: 14, power: 6 });
        nudge();
      }, 480);
    });
    ['pointerup', 'pointerleave', 'pointercancel'].forEach((ev) => heart.addEventListener(ev, () => clearTimeout(holdT)));
    heart.addEventListener('contextmenu', (e) => e.preventDefault());
    d.addEventListener('click', (e) => {
      const b = e.target.closest('[data-dock]');
      if (!b) return;
      const a = b.dataset.dock;
      if (a === 'kalp') {
        if (held) return (held = false);
        return K.kalp && K.kalp.openMenu();
      }
      K.audio.sfx.tap();
      if (a === 'home') {
        const wasRoom = Boolean(K.activeRoom);
        if (wasRoom) location.hash = '';
        setTimeout(() => {
          // Zaten en üstteyken bir daha dokunmak kalenin haritasına indirir
          const el = !wasRoom && window.scrollY < 200 ? K.$('#castleMap') : null;
          if (el) el.scrollIntoView({ behavior: K.reduced ? 'auto' : 'smooth', block: 'start' });
          else window.scrollTo({ top: 0, behavior: K.reduced ? 'auto' : 'smooth' });
        }, wasRoom ? 480 : 0);
      }
      if (a === 'ara') K.ara && K.ara.open();
      if (a === 'gungun') location.hash = 'gungun';
      if (a === 'yan') {
        if (!K.cloud || !K.cloud.enabled) return K.fx.toast('Bulut kapalı; birbirinizi görmek için Kale Paneli\'nden bulutu açın.');
        sheet();
      }
    });
    bub.addEventListener('click', () => sheet());
    // Kaydırırken aşağı inince menü kısılır, yukarı çıkınca geri gelir
    let lastY = window.scrollY;
    window.addEventListener(
      'scroll',
      () => {
        const y = window.scrollY;
        d.classList.toggle('tuck', y > lastY + 4 && y > 400);
        if (y < lastY - 4 || y < 400) d.classList.remove('tuck');
        lastY = y;
      },
      { passive: true }
    );
    paint();
  }

  /* ---------- Bağlantılar ---------- */
  K.on('built', dock);
  K.on('room', () => {
    send();
    paint();
  });
  window.addEventListener('hashchange', () => setTimeout(() => {
    send();
    paint();
  }, 60));
  document.addEventListener('click', (e) => {
    if (e.target.closest('[data-yan-back]')) nudge();
  });
  document.addEventListener('visibilitychange', () => !document.hidden && send(true));
  K.on('presence', (on) => {
    if (on) send(true);
    else {
      their = null;
      K.store.set('yanLast', Date.now());
    }
    paint();
  });
  K.on('cloud', (on) => {
    if (!on) return;
    K.cloud.onLive('yer', (m) => {
      if (m.who === mine()) return;
      const first = !their;
      their = { room: m.room || '', at: Date.now() };
      if (first) send(true);
      paint();
    });
    K.cloud.onLive('durt', (m) => m.who !== mine() && nudged(m));
    setInterval(() => here() && send(), 55000);
  });
  K.yan = { where, nudge, sheet, same };
})();
