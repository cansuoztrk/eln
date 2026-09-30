/* Oda: Hayalimizdeki Ev — bir gün aynı evin anahtarı ikisinde olacak; o güne kadar ev burada döşenir.
   Dört oda (salon, mutfak, yatak odası, balkon), her odanın penceresinden seçilen manzara (Boğaz, Hazar, yıldızlar, bahçe),
   salonun duvarında İstanbul ve Bakü saati. Eşyayı seç, odaya dokun, sürükle; her eşyaya bir not bırakılabilir.
   Biri eşya taşırken öbürünün ekranında canlı kayar. Bakü'de akşam olunca evin ışıkları yanar.
   Kayıtlar: ev {uid, room, it, x, y, s, z, note, gone} (aynı uid'nin son kaydı geçerli) · evwin {room, view} · canlı: ev {t: mv|at} */
(function () {
  'use strict';
  const K = window.K;
  const A = K.art;
  const D = window.ELN;
  const C = D.config;
  const T = K.time;

  const EV = () => D.ev || { intro: [] };
  const mine = () => (K.isOwner() ? 'me' : 'her');
  const other = () => (K.isOwner() ? 'her' : 'me');
  const nameOf = (w) => (w === 'me' ? C.myPet : C.herPet);

  const ROOMS = [
    ['salon', 'Salon', 'bogaz'],
    ['mutfak', 'Mutfak', 'bahce'],
    ['yatak', 'Yatak odası', 'yildiz'],
    ['balkon', 'Balkon', 'hazar'],
  ];
  const VIEWS = [
    ['bogaz', 'Boğaz'],
    ['hazar', 'Hazar'],
    ['yildiz', 'Yıldızlar'],
    ['bahce', 'Zambak bahçesi'],
  ];
  // [kimlik, ad, emoji ya da svg:<çizim>, kategori, varsayılan boy]
  const ITEMS = [
    ['kanepe', 'Kanepe', '🛋️', 'mobilya', 1.6], ['yatak', 'Yatak', '🛏️', 'mobilya', 1.8], ['sandalye', 'Sandalye', '🪑', 'mobilya', 1],
    ['ayna', 'Ayna', '🪞', 'mobilya', 1.1], ['kitaplik', 'Kitaplar', '📚', 'mobilya', 1], ['tv', 'Televizyon', '📺', 'mobilya', 1.2],
    ['lamba', 'Lamba', '💡', 'mobilya', 0.8], ['saat', 'Saat', '🕰️', 'mobilya', 0.9], ['piyano', 'Piyano', '🎹', 'mobilya', 1.3],
    ['kitty', 'Hello Kitty', 'svg:kitty', 'sevgi', 1.3], ['kopus', 'Köpüş', 'svg:kopus', 'sevgi', 1.2], ['kemik', 'Köpüş\'ün kemiği', '🦴', 'sevgi', 0.7],
    ['ayicik', 'Ayıcık', '🧸', 'sevgi', 0.9], ['fiyonk', 'Fiyonk', '🎀', 'sevgi', 0.8], ['mektup', 'Mektup', '💌', 'sevgi', 0.7],
    ['mum', 'Mum', '🕯️', 'sevgi', 0.7], ['tablo', 'Tablo', '🖼️', 'sevgi', 1.1], ['nerd', 'Nərd tahtası', '🎲', 'sevgi', 0.8],
    ['gitar', 'Gitar', '🎸', 'sevgi', 1], ['kamera', 'Fotoğraf makinesi', '📷', 'sevgi', 0.7], ['oyun', 'Oyun konsolu', '🎮', 'sevgi', 0.7],
    ['zambak', 'Zambak', '🌷', 'cicek', 0.9], ['gul', 'Gül', '🌹', 'cicek', 0.8], ['aycicegi', 'Ayçiçeği', '🌻', 'cicek', 0.9],
    ['saksi', 'Saksı', '🪴', 'cicek', 1], ['buket', 'Buket', '💐', 'cicek', 0.9], ['kaktus', 'Kaktüs', '🌵', 'cicek', 0.8],
    ['cay', 'Çaydanlık', '🫖', 'mutfak', 0.9], ['kupa', 'İki kupa', '☕️', 'mutfak', 0.8], ['cikolata', 'Çikolata', '🍫', 'mutfak', 0.7],
    ['pasta', 'Pasta', '🍰', 'mutfak', 0.8], ['kek', 'Kek', '🧁', 'mutfak', 0.7], ['tava', 'Tava', '🍳', 'mutfak', 0.9],
    ['cilek', 'Çilekler', '🍓', 'mutfak', 0.6], ['kruvasan', 'Kruvasan', '🥐', 'mutfak', 0.7], ['plov', 'Plov', '🍛', 'mutfak', 0.8],
    ['ay', 'Ay', '🌙', 'gece', 0.8], ['yildiz', 'Yıldız', '⭐', 'gece', 0.6], ['fener', 'Fener', '🏮', 'gece', 0.8], ['balon', 'Kalp balon', '🎈', 'gece', 0.9],
  ];
  const CATS = [['mobilya', 'Mobilya'], ['sevgi', 'Bizim'], ['cicek', 'Çiçek'], ['mutfak', 'Mutfak'], ['gece', 'Süs']];
  const itemDef = (id) => ITEMS.find((x) => x[0] === id);

  let root, rows = [], loaded = null, cur = K.store.get('evRoom', 'salon'), cat = 'sevgi', held = null, sel = null, drag = null, clockT = null, theirAt = null, lastSend = 0;

  /* ---------- Durum ---------- */
  function state() {
    const by = {};
    rows
      .filter((r) => r.kind === 'ev')
      .sort((a, b) => a.at - b.at)
      .forEach((r) => {
        by[r.data.uid] = Object.assign({}, by[r.data.uid] || {}, r.data, { by: (by[r.data.uid] && by[r.data.uid].by) || r.who, last: r.who, at: r.at });
      });
    return Object.values(by).filter((x) => !x.gone && itemDef(x.it));
  }
  const inRoom = (room) => state().filter((x) => x.room === room);
  const viewOf = (room) => {
    const r = rows.filter((x) => x.kind === 'evwin' && x.data.room === room).sort((a, b) => a.at - b.at).pop();
    return r ? r.data.view : ROOMS.find((x) => x[0] === room)[2];
  };
  const night = () => {
    const h = T.baku().h;
    return h >= 20 || h < 7;
  };

  /* ---------- Çizim ---------- */
  function glyph(def) {
    if (def[2] === 'svg:kitty') return A.kitty({ cls: 'ev-svg', label: 'Hello Kitty' });
    if (def[2] === 'svg:kopus') return A.kopus({ cls: 'ev-svg', label: C.herDog || 'Köpüş' });
    return `<span class="ev-emo">${def[2]}</span>`;
  }
  function viewHTML(v) {
    const stars = Array.from({ length: 18 }, (_, i) => `<i style="left:${(i * 53) % 100}%;top:${(i * 31) % 70}%;--d:${1 + (i % 5) * 0.4}s"></i>`).join('');
    if (v === 'bogaz')
      return `<div class="ev-view v-bogaz"><span class="ev-stars">${stars}</span><svg viewBox="0 0 200 80" preserveAspectRatio="none" class="ev-bridge" aria-hidden="true"><path d="M0 62 H200" stroke="#6E4A5A" stroke-width="3"/><path d="M40 62 V22 M160 62 V22" stroke="#6E4A5A" stroke-width="4"/><path d="M0 50 Q40 20 40 22 Q100 64 160 22 Q160 20 200 50" fill="none" stroke="#6E4A5A" stroke-width="2"/>${Array.from({ length: 11 }, (_, i) => {
        const x = 50 + i * 10;
        const y = 22 + 40 * (1 - Math.pow((x - 100) / 60, 2)) * 0.98;
        return `<path d="M${x} ${y.toFixed(1)} V62" stroke="#6E4A5A" stroke-width="1"/>`;
      }).join('')}</svg><span class="ev-sea"></span><span class="ev-tower">${A.kizKulesi('ev-kk')}</span></div>`;
    if (v === 'hazar') return `<div class="ev-view v-hazar"><span class="ev-stars">${stars}</span><span class="ev-flames">${A.flameTowers('#C9709A')}</span><span class="ev-sea"></span></div>`;
    if (v === 'yildiz') return `<div class="ev-view v-yildiz"><span class="ev-stars on">${stars}</span><span class="ev-moon"></span></div>`;
    return `<div class="ev-view v-bahce"><span class="ev-stars">${stars}</span><span class="ev-hill"></span><span class="ev-lilies">🌷🌷🌷</span></div>`;
  }
  function clock(label, off) {
    return `<figure class="ev-clock" data-off="${off}"><svg viewBox="-20 -20 40 40" aria-hidden="true"><circle r="17" fill="#fff" stroke="#2B2024" stroke-width="2.4"/>${[0, 1, 2, 3].map((i) => `<path d="M0 -14 V-12" transform="rotate(${i * 90})" stroke="#2B2024" stroke-width="2" stroke-linecap="round"/>`).join('')}<path class="h" d="M0 0 V-8" stroke="#2B2024" stroke-width="2.6" stroke-linecap="round"/><path class="m" d="M0 0 V-12.5" stroke="#E3174D" stroke-width="1.8" stroke-linecap="round"/><circle r="1.8" fill="#2B2024"/></svg><figcaption>${label}</figcaption></figure>`;
  }
  function tickClocks() {
    if (!root) return;
    K.$$('.ev-clock', root).forEach((f) => {
      const p = T.parts(+f.dataset.off);
      const h = p.h % 12, m = p.mi;
      K.$('.h', f).setAttribute('transform', `rotate(${h * 30 + m / 2})`);
      K.$('.m', f).setAttribute('transform', `rotate(${m * 6})`);
    });
    const st = K.$('#evStage', root);
    if (st) st.classList.toggle('night', night());
  }
  function itemHTML(x) {
    const def = itemDef(x.it);
    return `<button type="button" class="ev-it ${sel === x.uid ? 'sel' : ''} ${x.note ? 'has-note' : ''}" data-ev-uid="${x.uid}" style="left:${x.x}%;top:${x.y}%;--s:${x.s || def[4]};z-index:${10 + (x.z || 0)}" aria-label="${K.esc(def[1])}${x.note ? ': ' + K.esc(x.note) : ''}">${glyph(def)}${x.note ? `<span class="ev-note">${K.esc(x.note)}</span>` : ''}</button>`;
  }
  function stage() {
    const st = K.$('#evStage', root);
    if (!st) return;
    const v = viewOf(cur);
    st.className = `ev-stage r-${cur} ${night() ? 'night' : ''} ${held ? 'placing' : ''}`;
    st.innerHTML = `${cur === 'balkon' ? viewHTML(v) : `<div class="ev-wall"></div><div class="ev-window">${viewHTML(v)}<span class="ev-frame"></span></div>`}
      ${cur === 'salon' ? `<div class="ev-clocks">${clock('İstanbul', C.tzIstanbul)}${clock('Bakü', C.tzBaku)}</div><div class="ev-plate">${K.esc(EV().address || '')}</div>` : ''}
      <div class="ev-floor"></div>${cur === 'balkon' ? '<div class="ev-rail"></div>' : ''}
      ${inRoom(cur).map(itemHTML).join('')}
      ${theirAt && theirAt.room === cur && K.cloud.otherHere() ? `<span class="ev-them" style="left:${theirAt.x}%;top:${theirAt.y}%">${K.esc(nameOf(other()))}</span>` : ''}
      ${held ? `<p class="ev-hint">${K.esc(itemDef(held)[1])}: odada yerini seç</p>` : ''}`;
    tickClocks();
  }
  function tools() {
    const box = K.$('#evTools', root);
    const x = sel && state().find((i) => i.uid === sel);
    if (!x) {
      box.hidden = true;
      return;
    }
    const def = itemDef(x.it);
    box.hidden = false;
    box.innerHTML = `<p><b>${K.esc(def[1])}</b> · ${K.esc(nameOf(x.by))} koydu${x.last !== x.by ? `, ${K.esc(nameOf(x.last))} düzenledi` : ''}</p>
      <div class="row"><button type="button" class="chip" data-ev-s="-1">Küçült</button><button type="button" class="chip" data-ev-s="1">Büyüt</button><button type="button" class="chip" data-ev-front>Öne al</button><button type="button" class="chip" data-ev-del>${A.ui('trash')} Kaldır</button></div>
      <form class="row ev-nf" autocomplete="off"><input class="input" name="n" maxlength="60" placeholder="Bir not bırak (ör. buraya senin kitapların)" value="${K.esc(x.note || '')}"><button class="btn red small" type="submit">Kaydet</button></form>`;
  }
  function render() {
    if (!root) return;
    const all = state();
    K.$('#evTabs', root).innerHTML = ROOMS.map(([id, n]) => `<button type="button" class="${id === cur ? 'on' : ''}" data-ev-room="${id}">${K.esc(n)}<small>${inRoom(id).length}</small></button>`).join('');
    K.$('#evViews', root).innerHTML = `<span class="muted small">Pencereden:</span>${VIEWS.map(([id, n]) => `<button type="button" class="chip ${viewOf(cur) === id ? 'on' : ''}" data-ev-view="${id}">${K.esc(n)}</button>`).join('')}`;
    stage();
    tools();
    K.$('#evCats', root).innerHTML = CATS.map(([id, n]) => `<button type="button" class="${id === cat ? 'on' : ''}" data-ev-cat="${id}">${K.esc(n)}</button>`).join('');
    K.$('#evShelf', root).innerHTML = ITEMS.filter((x) => x[3] === cat).map((d) => `<button type="button" class="ev-pick ${held === d[0] ? 'on' : ''}" data-ev-pick="${d[0]}" title="${K.esc(d[1])}">${d[2].startsWith('svg:') ? `<span class="ev-mini">${glyph(d)}</span>` : `<span>${d[2]}</span>`}<small>${K.esc(d[1])}</small></button>`).join('');
    const mineN = all.filter((x) => x.by === mine()).length, theirN = all.filter((x) => x.by === other()).length;
    const notes = all.filter((x) => x.note);
    K.$('#evStats', root).innerHTML = `<p><b>${all.length}</b> eşya · ${K.esc(nameOf(mine()))} ${mineN}, ${K.esc(nameOf(other()))} ${theirN}${K.cloud.otherHere() ? ` · <span class="dot on"></span>${K.esc(nameOf(other()))} da evde` : ''}</p>
      ${notes.length ? `<ul class="ev-notes">${notes.slice(-8).reverse().map((x) => `<li><span>${itemDef(x.it)[2].startsWith('svg:') ? '♥' : itemDef(x.it)[2]}</span><em class="hand">${K.esc(x.note)}</em><small>${K.esc(ROOMS.find((r) => r[0] === x.room)[1])} · ${K.esc(nameOf(x.last))}</small></li>`).join('')}</ul>` : ''}`;
  }

  /* ---------- Kayıt ---------- */
  async function commit(x, patch) {
    const data = Object.assign({ uid: x.uid, room: x.room, it: x.it, x: x.x, y: x.y, s: x.s, z: x.z || 0, note: x.note || '', gone: false }, patch);
    const r = await K.cloud.add('ev', data);
    if (!r) {
      K.fx.toast('Kaydedilemedi. İnternet bağlantını kontrol et.');
      return null;
    }
    if (!rows.some((q) => q.id === r.id)) rows.push(r);
    return r;
  }
  async function place(it, x, y) {
    const def = itemDef(it);
    const uid = 'e' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
    const z = Math.max(0, ...inRoom(cur).map((q) => q.z || 0)) + 1;
    held = null;
    const r = await commit({ uid, room: cur, it, x, y, s: def[4], z }, {});
    if (!r) return;
    K.audio.sfx.pop();
    sel = uid;
    const n = state().filter((q) => q.by === mine()).length;
    if (n >= 5) K.stickers.award('ev');
    if (!K.isOwner() && (n === 1 || n % 5 === 0)) K.notify(`${C.herName} evimize bir şey koydu`, `${def[1]} · ${ROOMS.find((q) => q[0] === cur)[1]}`, ['house']);
    render();
  }

  /* ---------- Sürükleme ---------- */
  function pct(e) {
    const st = K.$('#evStage', root).getBoundingClientRect();
    return { x: K.clamp(((e.clientX - st.left) / st.width) * 100, 3, 97), y: K.clamp(((e.clientY - st.top) / st.height) * 100, 6, 96) };
  }
  function bindStage() {
    const st = K.$('#evStage', root);
    st.addEventListener('pointerdown', (e) => {
      const b = e.target.closest('[data-ev-uid]');
      if (held) {
        e.preventDefault();
        const p = pct(e);
        return place(held, +p.x.toFixed(1), +p.y.toFixed(1));
      }
      if (!b) {
        if (sel) {
          sel = null;
          stage();
          tools();
        }
        return;
      }
      e.preventDefault();
      drag = { uid: b.dataset.evUid, el: b, sx: e.clientX, sy: e.clientY, moved: false };
      try {
        b.setPointerCapture(e.pointerId);
      } catch (err) {}
    });
    st.addEventListener('pointermove', (e) => {
      if (!drag) {
        if (K.cloud.enabled && K.cloud.otherHere() && Date.now() - lastSend > 400 && e.pointerType === 'mouse') {
          lastSend = Date.now();
          const p = pct(e);
          K.cloud.send('ev', { t: 'at', room: cur, x: +p.x.toFixed(1), y: +p.y.toFixed(1) });
        }
        return;
      }
      if (!drag.moved && Math.hypot(e.clientX - drag.sx, e.clientY - drag.sy) < 6) return;
      drag.moved = true;
      const p = pct(e);
      drag.x = +p.x.toFixed(1);
      drag.y = +p.y.toFixed(1);
      drag.el.style.left = drag.x + '%';
      drag.el.style.top = drag.y + '%';
      drag.el.classList.add('drag');
      if (K.cloud.enabled && Date.now() - lastSend > 90) {
        lastSend = Date.now();
        K.cloud.send('ev', { t: 'mv', uid: drag.uid, x: drag.x, y: drag.y, room: cur });
      }
    });
    const up = async () => {
      if (!drag) return;
      const d = drag;
      drag = null;
      d.el.classList.remove('drag');
      const x = state().find((q) => q.uid === d.uid);
      if (!x) return;
      if (!d.moved) {
        sel = sel === d.uid ? null : d.uid;
        K.$$('.ev-it', root).forEach((b) => b.classList.toggle('sel', b.dataset.evUid === sel));
        return tools();
      }
      await commit(x, { x: d.x, y: d.y });
      K.audio.sfx.tap();
      render();
    };
    st.addEventListener('pointerup', up);
    st.addEventListener('pointercancel', up);
  }

  /* ---------- Canlı ---------- */
  function onLive(m) {
    if (!m || m.who === mine()) return;
    if (K.activeRoom !== 'ev') return;
    if (m.t === 'mv' && m.room === cur && !(drag && drag.uid === m.uid)) {
      const b = K.$(`[data-ev-uid="${m.uid}"]`, root);
      if (b) {
        b.style.left = m.x + '%';
        b.style.top = m.y + '%';
        b.classList.add('their');
        clearTimeout(b._t);
        b._t = setTimeout(() => b.classList.remove('their'), 800);
      }
    }
    if (m.t === 'at') {
      theirAt = { room: m.room, x: m.x, y: m.y };
      const tag = K.$('.ev-them', root);
      if (tag && m.room === cur) {
        tag.style.left = m.x + '%';
        tag.style.top = m.y + '%';
      } else if (m.room === cur && !drag) stage();
    }
  }

  /* ---------- Bulut ---------- */
  const KINDS = ['ev', 'evwin'];
  function loadAll() {
    if (!K.cloud || !K.cloud.enabled) return Promise.resolve();
    return (loaded = loaded || (async () => {
      const got = await Promise.all([K.cloud.list('ev', 1500), K.cloud.list('evwin', 100)]);
      got.flat().forEach((r) => rows.some((x) => x.id === r.id) || rows.push(r));
      if (K.activeRoom === 'ev' && !drag) render();
    })());
  }
  K.on('cloud', (on) => {
    if (!on) return;
    K.cloud.onLive('ev', onLive);
    KINDS.forEach((k) =>
      K.cloud.on(k, (r) => {
        if (rows.some((x) => x.id === r.id)) return;
        rows.push(r);
        if (r.who !== mine() && k === 'ev' && K.activeRoom !== 'ev') {
          const first = rows.filter((q) => q.kind === 'ev' && q.data.uid === r.data.uid).length === 1;
          const def = itemDef(r.data.it);
          if (first && def) K.fx.toast(`<b>${K.esc(nameOf(r.who))} evimize ${K.esc(def[1].toLocaleLowerCase('tr'))} koydu.</b> <a href="#ev">Bak</a>`, { icon: A.icon('house'), duration: 7000 });
        }
        if (K.activeRoom === 'ev' && !drag) render();
      })
    );
  });
  K.on('presence', () => K.activeRoom === 'ev' && !drag && render());
  K.ev = { count: () => state().length, load: loadAll, def: itemDef, roomName: (id) => (ROOMS.find((r) => r[0] === id) || [])[1] || '' };

  K.room({
    id: 'ev',
    wing: 'hazine',
    title: 'Hayalimizdeki Ev',
    sub: () => EV().address || 'Birlikte döşediğimiz ev',
    icon: 'house',
    color: '#FFE6EF',
    hidden: () => !D.ev || !K.cloud || !K.cloud.enabled,
    init(el) {
      root = el;
      el.innerHTML = `<div class="room-intro">${K.paras(EV().intro)}</div>
        <div class="seg ev-tabs" id="evTabs" role="tablist"></div>
        <div class="ev-views" id="evViews"></div>
        <div class="ev-stage" id="evStage"></div>
        <section class="card ev-tools" id="evTools" hidden></section>
        <section class="card ev-cat"><div class="seg ev-cats" id="evCats"></div><div class="ev-shelf" id="evShelf"></div></section>
        <section class="card ev-stats" id="evStats"></section>`;
      bindStage();
      el.addEventListener('click', async (e) => {
        const rm = e.target.closest('[data-ev-room]');
        if (rm) {
          cur = rm.dataset.evRoom;
          K.store.set('evRoom', cur);
          sel = null;
          return render();
        }
        const vw = e.target.closest('[data-ev-view]');
        if (vw) {
          const r = await K.cloud.add('evwin', { room: cur, view: vw.dataset.evView });
          if (r && !rows.some((x) => x.id === r.id)) rows.push(r);
          return render();
        }
        const ct = e.target.closest('[data-ev-cat]');
        if (ct) {
          cat = ct.dataset.evCat;
          return render();
        }
        const pk = e.target.closest('[data-ev-pick]');
        if (pk) {
          held = held === pk.dataset.evPick ? null : pk.dataset.evPick;
          sel = null;
          render();
          if (held) K.$('#evStage', root).scrollIntoView({ behavior: K.reduced ? 'auto' : 'smooth', block: 'center' });
          return;
        }
        const x = sel && state().find((q) => q.uid === sel);
        if (!x) return;
        const sz = e.target.closest('[data-ev-s]');
        if (sz) {
          const s = K.clamp(+((x.s || 1) * (sz.dataset.evS === '1' ? 1.2 : 1 / 1.2)).toFixed(2), 0.4, 3.2);
          await commit(x, { s });
          return render();
        }
        if (e.target.closest('[data-ev-front]')) {
          const z = Math.max(0, ...inRoom(cur).map((q) => q.z || 0)) + 1;
          await commit(x, { z });
          return render();
        }
        const del = e.target.closest('[data-ev-del]');
        if (del) {
          if (del.dataset.armed !== '1') {
            del.dataset.armed = '1';
            del.classList.add('armed');
            del.lastChild.textContent = ' Emin misin?';
            return;
          }
          await commit(x, { gone: true });
          sel = null;
          return render();
        }
      });
      el.addEventListener('submit', async (e) => {
        if (!e.target.closest('.ev-nf')) return;
        e.preventDefault();
        const x = sel && state().find((q) => q.uid === sel);
        if (!x) return;
        const note = String(e.target.n.value || '').trim();
        await commit(x, { note });
        K.audio.sfx.pop();
        if (!K.isOwner() && note) K.notify(`${C.herName} evimize bir not bıraktı`, `${itemDef(x.it)[1]}: ${note}`, ['house']);
        render();
      });
    },
    enter() {
      render();
      loadAll();
      clearInterval(clockT);
      clockT = setInterval(tickClocks, 20000);
    },
    leave() {
      clearInterval(clockT);
      held = null;
      sel = null;
      theirAt = null;
    },
  });
})();
