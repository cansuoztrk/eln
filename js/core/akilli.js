/* Kale 2.0 — Akıllı Ana Salon, Kendi Dock'un, Gece Kalesi 2 ve geniş ekran düzeni.
   Akıllı Salon: ana salondaki kartlar günün saatine (sabah alarm ve iyilik, akşam rapor, gece masal) ve dokunma
   alışkanlığına göre dizilir; ilk dördü büyük, gerisi küçük kartlar. Günlerdir dokunulmayan kart geriye düşer.
   Dock: alttaki çubuğun iki yeri (Ara ve Gün Gün yerine) istediğin odalar olabilir; "Salon"a basılı tutunca
   en sevdiğin dört oda açılır. Gece Kalesi 2: gece ilerledikçe ekran sıcaklaşır, odaların tavanı yıldızlanır ve
   gece 01–08 arası (alıcının saatiyle) giden bildirimler sessiz gelir. Geniş ekranda sağda canlı bir pano. */
(function () {
  'use strict';
  const K = window.K;
  const A = K.art;
  const D = window.ELN;
  const C = D.config;
  const T = K.time;

  const myTz = () => (K.isOwner() ? C.tzIstanbul : C.tzBaku);
  const hourNow = () => T.parts(myTz()).h;

  /* ---------- Akıllı Salon ---------- */
  const SLOTS = [
    [5, 11, ['alarm', 'iyilik', 'gece', 'kare', 'hava', 'gunses', 'soz', 'uyandim']],
    [11, 17, ['oyun', 'pinpon', 'kelime', 'yarisma', 'amiral', 'bulmaca', 'emojisarki', 'prenses', 'tahmin', 'kedi']],
    [17, 22, ['rapor', 'bizfm', 'gunbatimi', 'dakika', 'radyo', 'minnet', 'kavanoz', 'gorev', 'kelimebulutu']],
    [22, 29, ['uyku', 'gece', 'masal', 'mektuplar', 'telesekreter', 'sesli']],
  ];
  const keyOf = (s) => s.key || s.room || 'k' + K.hash(String(s.title || '').slice(0, 24));
  function rank(list) {
    if (list.length <= 3) return list;
    const h = hourNow(), hh = h < 5 ? h + 24 : h;
    const slot = (SLOTS.find(([a, b]) => hh >= a && hh < b) || SLOTS[0])[2];
    const seen = K.store.get('spSeen', {}), clicks = K.store.get('spClick', {});
    const today = T.todayKey();
    const scored = list.map((s, i) => {
      const k = keyOf(s);
      const sv = seen[k] || [0, ''];
      if (sv[1] !== today) seen[k] = [sv[0] + 1, today];
      const days = seen[k][0], cl = clicks[k] || 0;
      let sc = ((list.length - i) / list.length) * 3;
      if (slot.includes(s.room) || slot.includes(s.key)) sc += 2.2;
      if (s.big) sc += 3;
      if (days >= 4 && !cl) sc -= 1.6;
      if (cl && cl / Math.max(1, days) > 0.4) sc += 1;
      return { s: Object.assign({}, s, { key: k }), sc };
    });
    K.store.set('spSeen', seen);
    scored.sort((a, b) => b.sc - a.sc);
    return scored.map((x, i) => Object.assign(x.s, { mini: i >= 4 }));
  }
  document.addEventListener('click', (e) => {
    const b = e.target.closest('.special-card .btn');
    const card = b && b.closest('.special-card');
    if (!card || !card.dataset.sk) return;
    const c = K.store.get('spClick', {});
    c[card.dataset.sk] = (c[card.dataset.sk] || 0) + 1;
    K.store.set('spClick', c);
  });
  // Küçük karta dokununca büyür
  document.addEventListener('click', (e) => {
    const c = e.target.closest('.special-card.mini');
    if (c && !e.target.closest('.btn')) c.classList.remove('mini');
  });

  /* ---------- Kendi Dock'un ---------- */
  const DOCK = () => Object.assign({ a: '', b: '', fav: [] }, K.store.get('dock', {}));
  const roomBy = (id) => K.rooms.find((r) => r.id === id && !(typeof r.hidden === 'function' ? r.hidden() : r.hidden));
  function favs() {
    const d = DOCK();
    if (d.fav.length) return d.fav.map(roomBy).filter(Boolean).slice(0, 4);
    const cnt = K.store.get('odaSay', {});
    return Object.keys(cnt).sort((x, y) => cnt[y] - cnt[x]).map(roomBy).filter((r) => r && r.id !== 'panel').slice(0, 4);
  }
  function paintDock() {
    const dock = K.$('#dock');
    if (!dock) return;
    const d = DOCK();
    [['a', 'ara', A.ui('search'), 'Ara'], ['b', 'gungun', A.ui('cal'), 'Gün Gün']].forEach(([slot, def, ic, label]) => {
      const btn = K.$(`[data-slot="${slot}"]`, dock) || K.$(`[data-dock="${def}"]`, dock);
      if (!btn) return;
      btn.dataset.slot = slot;
      const r = d[slot] && roomBy(d[slot]);
      btn.dataset.dock = r ? 'oda:' + r.id : def;
      btn.innerHTML = r ? `<span class="dk-oda">${A.icon(r.icon)}</span><span>${K.esc(K.val(r.title))}</span>` : `${ic}<span>${label}</span>`;
      btn.setAttribute('aria-label', r ? K.val(r.title) : label);
    });
  }
  function tray() {
    const list = favs();
    const old = K.$('.dock-tray');
    if (old) return old.remove();
    const t = K.el(`<div class="dock-tray" role="menu" aria-label="En sevdiğin odalar">${list.map((r) => `<button type="button" role="menuitem" data-tray="${r.id}" style="--c:${r.color}">${A.icon(r.icon)}<small>${K.esc(K.val(r.title))}</small></button>`).join('')}<button type="button" class="dt-edit" data-tray="duzenle">${A.ui('brush')}<small>Düzenle</small></button></div>`);
    document.body.appendChild(t);
    requestAnimationFrame(() => t.classList.add('in'));
    const close = () => (t.classList.remove('in'), setTimeout(() => t.remove(), 250));
    t.addEventListener('click', (e) => {
      const b = e.target.closest('[data-tray]');
      if (!b) return;
      close();
      if (b.dataset.tray === 'duzenle') return edit();
      K.go(b.dataset.tray);
    });
    // Uzun basmayı bitiren dokunuş menüyü kapatmasın: dışarıda yeni bir basış kapatır
    setTimeout(() => document.addEventListener('pointerdown', function off(e) {
      if (!e.target.closest('.dock-tray')) {
        close();
        document.removeEventListener('pointerdown', off, true);
      }
    }, true), 50);
  }
  function edit() {
    const d = DOCK();
    const rooms = K.rooms.filter((r) => roomBy(r.id) && !r.secret && r.id !== 'panel').sort((x, y) => String(K.val(x.title)).localeCompare(String(K.val(y.title)), 'tr'));
    const opts = (cur) => `<option value="">Varsayılan</option>` + rooms.map((r) => `<option value="${r.id}" ${cur === r.id ? 'selected' : ''}>${K.esc(K.val(r.title))}</option>`).join('');
    const m = K.ui.modal({
      label: 'Dock\'u düzenle',
      cls: 'dock-edit',
      html: `<h2>Kendi Dock'un</h2><p class="muted">Alttaki çubuğun iki yerine sevdiğin odaları koy. "Salon"a basılı tutunca en sevdiğin dört oda açılır.</p>
        <label class="de-row"><span>Sol yer <small>(Ara yerine)</small></span><select class="input" data-de="a">${opts(d.a)}</select></label>
        <label class="de-row"><span>Sağ yer <small>(Gün Gün yerine)</small></span><select class="input" data-de="b">${opts(d.b)}</select></label>
        <p class="card-eyebrow">En sevdiğin dört oda</p>${[0, 1, 2, 3].map((i) => `<select class="input" data-fav="${i}">${opts((d.fav || [])[i] || (favs()[i] || {}).id)}</select>`).join('')}
        <div class="row"><button type="button" class="btn red" data-de-save>${A.ui('check')} Kaydet</button></div>`,
    });
    m.body.addEventListener('click', (e) => {
      if (!e.target.closest('[data-de-save]')) return;
      const nd = { a: K.$('[data-de="a"]', m.body).value, b: K.$('[data-de="b"]', m.body).value, fav: K.$$('[data-fav]', m.body).map((s) => s.value).filter(Boolean) };
      K.store.set('dock', nd);
      paintDock();
      m.close();
      K.audio.sfx.success();
      K.stickers.award('dock');
      K.fx.toast('Dock senin oldu.', { duration: 1800 });
    });
  }
  function wireDock() {
    const dock = K.$('#dock');
    if (!dock || dock.dataset.akilli) return;
    dock.dataset.akilli = '1';
    paintDock();
    dock.addEventListener(
      'click',
      (e) => {
        const b = e.target.closest('[data-dock^="oda:"]');
        if (!b) return;
        e.stopPropagation();
        K.audio.sfx.tap();
        K.go(b.dataset.dock.slice(4));
      },
      true
    );
    uzunBas(K.$('[data-dock="home"]', dock));
  }
  // Basılı tutunca en sevdiğin odalar tepsisi (Salon düğmesi; Kale 4.0'da Bugün sekmesi de)
  function uzunBas(home) {
    if (!home || home._uzun) return;
    home._uzun = true;
    let t = 0, held = false;
    home.addEventListener('pointerdown', () => {
      held = false;
      t = setTimeout(() => {
        held = true;
        K.vibrate(20);
        tray();
      }, 480);
    });
    ['pointerup', 'pointerleave', 'pointercancel'].forEach((ev) => home.addEventListener(ev, () => clearTimeout(t)));
    home.addEventListener('click', (e) => held && (e.stopImmediatePropagation(), e.preventDefault(), (held = false)), true);
    home.addEventListener('contextmenu', (e) => e.preventDefault());
  }
  K.dockTray = { tray, uzunBas };

  /* ---------- Gece Kalesi 2 ---------- */
  function night() {
    const h = hourNow();
    // 21:00'de hafif, 01:00 ve sonrasında en sıcak
    const x = h >= 21 ? (h - 21) / 4 : h < 6 ? 1 : 0;
    document.documentElement.style.setProperty('--amber', (0.1 + Math.min(1, x) * 0.2).toFixed(3));
    document.body.classList.toggle('gece-tavan', document.body.classList.contains('gece-modu') || document.body.classList.contains('night'));
  }
  // Alıcının saatiyle gece 01–08 arası: bildirimler sessiz (acil olanlar hariç)
  const ping0 = K.ping;
  K.ping = (title, msg, tags, extra) => {
    const tz = K.isOwner() ? C.tzBaku : C.tzIstanbul;
    const h = T.parts(tz).h;
    const x = Object.assign({}, extra || {});
    if (h >= 1 && h < 8 && !(x.priority >= 5) && !x.delay) x.priority = Math.min(x.priority || 4, 2);
    return ping0(title, msg, tags, x);
  };

  /* ---------- Geniş ekran: sağda canlı pano ---------- */
  const wide = () => window.innerWidth >= 1180;
  function pano() {
    let p = K.$('#genisPano');
    document.body.classList.toggle('genis', wide());
    if (!wide()) return p && p.remove();
    if (!p) {
      p = K.el('<aside class="genis-pano" id="genisPano" aria-label="Canlı pano"></aside>');
      document.body.appendChild(p);
      p.addEventListener('click', (e) => {
        const g = e.target.closest('[data-gp]');
        if (g) K.go(g.dataset.gp);
      });
    }
    const o = K.isOwner() ? 'her' : 'me';
    const here = K.cloud && K.cloud.enabled && K.cloud.otherHere();
    const items = K.akis ? K.akis.recent().slice(-8).reverse() : [];
    p.innerHTML = `<section class="gp-kart"><p class="card-eyebrow">Şimdi</p>
        <p class="gp-ot">${K.avatar(o, 'yan-av ' + (here ? 'on' : ''))}<span><b>${K.esc(K.otherName())}</b><small>${here ? 'Şu an kalede' : 'Kalede değil'}</small></span></p>
        <p class="gp-saat"><span>${K.esc(C.herCity)} <b>${T.hm(C.tzBaku)}</b></span><span>${K.esc(C.myCity)} <b>${T.hm(C.tzIstanbul)}</b></span></p></section>
      <section class="gp-kart"><p class="card-eyebrow">Son anlar</p>${items.length ? `<ul class="gp-akis">${items.map((x) => `<li>${x.room ? `<button type="button" data-gp="${K.esc(x.room)}">` : '<span>'}<i>${x.emoji || '💗'}</i><span><b>${K.esc(K.akis.nameOf(x.who))}</b> ${K.esc(x.title)}<small>${K.esc(K.ago(x.at))}</small></span>${x.room ? '</button>' : '</span>'}</li>`).join('')}</ul>` : '<p class="muted small">Henüz bir şey yok.</p>'}</section>
      <section class="gp-kart"><p class="card-eyebrow">En sevdiklerin</p><div class="gp-fav">${favs().map((r) => `<button type="button" data-gp="${r.id}" style="--c:${r.color}">${A.icon(r.icon)}<small>${K.esc(K.val(r.title))}</small></button>`).join('')}</div></section>`;
  }

  K.on('built', () => {
    setTimeout(wireDock, 200);
    night();
    pano();
  });
  window.addEventListener('resize', () => {
    clearTimeout(pano.t);
    pano.t = setTimeout(pano, 300);
  });
  K.on('presence', () => wide() && pano());
  if (K.akis) K.akis.onChange(() => wide() && pano());
  setInterval(() => {
    night();
    wide() && pano();
  }, 60e3);
  K.akilli = { rank, edit, tray, favs };
})();
