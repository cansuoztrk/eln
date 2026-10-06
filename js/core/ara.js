/* Kale 2.0 — Kitty'ye Sor: kalenin her köşesinde arama. Odalar, sebepler, sohbetlerimiz, mektupların adları, şarkılar,
   portreler, izler, kuponlar, günün soruları, ilkler, film bölümleri ve birkaç kısayol (müzik, tur, hikâye, dürt).
   Türkçe harf duyarsız (ş=s, ı=i...). Masaüstünde Ctrl+K ya da "/" ile açılır; oklarla gezilir, Enter ile gidilir. */
(function () {
  'use strict';
  const K = window.K;
  const A = K.art;
  const D = window.ELN;
  const C = D.config;

  const AR = () => D.ara || { placeholder: 'Kitty\'ye sor...', tips: [], empty: 'Bulunamadı.', lucky: 'Şansıma bir kapı' };
  const visible = (r) => !(typeof r.hidden === 'function' ? r.hidden() : r.hidden);
  const roomT = (id) => {
    const r = K.rooms.find((x) => x.id === id);
    return r ? K.val(r.title) : '';
  };
  const has = (id) => K.rooms.some((r) => r.id === id && visible(r) && !r.secret);

  let idx = null, el = null, sel = 0, flat = [];

  function build() {
    const out = [];
    const add = (group, room, title, text, extra = {}) => room && has(room) && out.push(Object.assign({ group, room, title: String(title || ''), text: String(text || ''), n: K.norm(`${title} ${text}`) }, extra));
    K.rooms.filter((r) => visible(r) && !r.secret).forEach((r) => out.push({ group: 'Odalar', room: r.id, title: K.val(r.title), text: K.fill(K.val(r.sub) || ''), icon: r.icon, color: r.color, n: K.norm(`${K.val(r.title)} ${K.fill(K.val(r.sub) || '')} ${r.id}`), w: 3 }));
    // Kısayollar
    const cmd = (title, text, run, icon) => out.push({ group: 'Kısayollar', title, text, run, icon, n: K.norm(`${title} ${text}`), w: 2 });
    cmd('Müziği aç ya da kapat', 'müzik kutusu şarkı ses', () => K.audio.music.toggle(), 'music');
    if (K.tour) cmd('Kale turunu başlat', 'Kitty gezdirsin rehber', () => K.tour.start(), 'crown');
    if (K.stories && K.cloud && K.cloud.enabled) cmd('Hikâye paylaş', 'fotoğraf paylaş an', () => K.stories.compose(), 'camera');
    if (K.yan && K.cloud && K.cloud.enabled) cmd(`${K.isOwner() ? C.herPet : C.myPet} dürt`, 'dürt kalp dokun özledim', () => K.yan.nudge(), 'heart');
    cmd('Kalenin rengini değiştir', 'tema pembe renk pudra fuşya şeftali', () => {
      const f = K.$('#footTheme');
      if (f) f.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 'palette');
    // İçerik
    (D.reasons || []).forEach((t, i) => add('Sebepler', 'sebepler', `Sebep #${i + 1}`, K.fill(t)));
    (D.chats || []).forEach((c) => add('Sohbetimizden', 'sohbet', c.title, `${c.sub || ''} ${(c.msgs || []).map((m) => m[1]).join(' · ')}`));
    (D.letters || []).filter((l) => !l.hidden).forEach((l) => add('Mektuplar', 'mektuplar', l.title, ''));
    (D.portraits || []).forEach((p) => add('Portreler', 'portreler', p.title, K.fill(p.text || '')));
    (D.traces || []).forEach((p) => add('İzler', 'izler', p.title, `${p.where || ''} ${K.fill(p.text || '')}`));
    (D.coupons || []).forEach((p) => add('Kuponlar', 'kuponlar', p.title, K.fill(p.text || '')));
    (D.memories || []).forEach((p) => add('Anılar', 'sarkimiz', p.title, `${p.date || ''} ${K.fill(p.text || '')}`));
    (D.questions || []).forEach((q, i) => add('Günün soruları', 'sorular', `Soru ${i + 1}`, K.fill(q)));
    const songs = [].concat(C.song && C.song.title ? [{ title: C.song.title, artist: C.song.artist, room: 'sarkimiz' }] : [], C.song2 && C.song2.title ? [{ title: C.song2.title, artist: C.song2.artist, room: 'sarkimiz' }] : [], ((D.sarkidefteri && D.sarkidefteri.seed) || []).map((s) => Object.assign({ room: 'sarkidefteri' }, s)));
    songs.forEach((s) => add('Şarkılar', s.room, s.title, `${s.artist || ''} ${s.note || ''}`));
    ((D.ilkler && D.ilkler.items) || []).forEach((it) => add('İlklerimiz', 'ilkler', it[1], `${K.fill(it[2])} ${K.fill(it[3] || '')}`));
    ((D.film && D.film.chapters) || []).forEach((ch) => ch.label && add('Bizim Filmimiz', 'sinema', ch.label, ch.emotion || ''));
    ((D.story || []).filter((s) => s.title)).forEach((s) => add('İki Kule Masalı', 'masal', s.title, K.fill([].concat(s.text || []).join(' '))));
    ((D.dictionary || [])).forEach((w) => add('Sözlük', 'sinif', w[0], w.slice(1).join(' · ')));
    return out;
  }

  function search(q) {
    const n = K.norm(q).trim();
    if (!n) return [];
    const words = n.split(/\s+/).filter(Boolean);
    const res = [];
    idx.forEach((it) => {
      const tn = K.norm(it.title);
      let s = 0;
      for (const w of words) {
        const i = it.n.indexOf(w);
        if (i < 0) return;
        s += tn.startsWith(w) ? 12 : tn.includes(w) ? 8 : 3;
        if (i === 0 || it.n[i - 1] === ' ') s += 2;
      }
      res.push([s + (it.w || 0), it]);
    });
    return res.sort((a, b) => b[0] - a[0]).map((x) => x[1]);
  }
  // Uzunluğu koruyan harf katlama: işaretlenecek yeri özgün metinde bulmak için
  const fold = (s) =>
    String(s)
      .toLocaleLowerCase('tr')
      .replace(/ç/g, 'c')
      .replace(/ğ/g, 'g')
      .replace(/ı/g, 'i')
      .replace(/ö/g, 'o')
      .replace(/ş/g, 's')
      .replace(/ü/g, 'u')
      .replace(/ə/g, 'e')
      .replace(/[âà]/g, 'a')
      .replace(/[îì]/g, 'i')
      .replace(/[ûù]/g, 'u')
      .replace(/[^a-z0-9]/g, ' ');
  const mark = (text, q) => {
    const t = String(text || '');
    const f = fold(t);
    if (!q || f.length !== t.length) return K.esc(t);
    const ranges = [];
    K.norm(q)
      .split(' ')
      .filter((w) => w.length > 1)
      .forEach((w) => {
        const i = f.indexOf(w);
        if (i >= 0) ranges.push([i, i + w.length]);
      });
    ranges.sort((a, b) => a[0] - b[0]);
    let out = '', p = 0;
    ranges.forEach(([a, b]) => {
      if (a < p) return;
      out += K.esc(t.slice(p, a)) + '<mark>' + K.esc(t.slice(a, b)) + '</mark>';
      p = b;
    });
    return out + K.esc(t.slice(p));
  };
  const snippet = (text, q) => {
    const t = String(text || '');
    const w = K.norm(q).split(' ')[0] || '';
    const i = fold(t).indexOf(w);
    if (t.length <= 110 || i < 40) return t.slice(0, 110) + (t.length > 110 ? '…' : '');
    return '…' + t.slice(i - 30, i + 80) + (t.length > i + 80 ? '…' : '');
  };

  function render(q) {
    const box = K.$('.ara-res', el);
    if (!q.trim()) {
      const visited = K.store.get('lastVisit', {});
      const recent = Object.keys(visited)
        .filter(has)
        .sort((a, b) => visited[b] - visited[a])
        .slice(0, 6);
      flat = recent.map((id) => idx.find((x) => x.room === id && x.group === 'Odalar')).filter(Boolean);
      box.innerHTML = `<div class="ara-tips">${(AR().tips || []).concat(K.sor ? ['Geçen ay ne yaptık?', 'En son ne zaman barıştık?', 'Kaç kez özledim dedik?'] : []).map((t) => `<button type="button" class="chip" data-ara-tip="${K.esc(t)}">${K.esc(t)}</button>`).join('')}<button type="button" class="chip on" data-ara-lucky>${A.ui('shuffle')} ${K.esc(AR().lucky || 'Şansıma bir kapı')}</button></div>
        ${flat.length ? `<p class="ara-g">Son girdiklerin</p>${flat.map((it, i) => row(it, i, '')).join('')}` : ''}`;
      sel = 0;
      paintSel();
      K.sor && K.sor.attach(box, '');
      return;
    }
    const res = search(q).slice(0, 60);
    const groups = {};
    res.forEach((it) => (groups[it.group] = groups[it.group] || []).push(it));
    flat = [];
    let html = '';
    Object.entries(groups).forEach(([g, list]) => {
      html += `<p class="ara-g">${K.esc(g)} <small>${list.length}</small></p>`;
      list.slice(0, g === 'Odalar' ? 8 : 5).forEach((it) => {
        html += row(it, flat.length, q);
        flat.push(it);
      });
    });
    K.sor && K.sor.attach(box, q);
    box.innerHTML = html || (K.sor && K.sor.isQ(q) ? '' : `<p class="ara-empty">${K.esc(AR().empty)}</p>`) + `<div class="ara-tips"><button type="button" class="chip on" data-ara-lucky>${A.ui('shuffle')} ${K.esc(AR().lucky || 'Şansıma bir kapı')}</button></div>`;
    sel = 0;
    paintSel();
  }
  function row(it, i, q) {
    const ic = it.icon ? A.icon(it.icon) : '';
    const where = it.room && it.group !== 'Odalar' ? `<small class="ara-where">${K.esc(roomT(it.room))}</small>` : '';
    return `<button type="button" class="ara-row" data-ara-i="${i}" style="--c:${it.color || 'var(--petal)'}"><span class="ara-ic">${ic || '<b>' + K.esc(it.group.slice(0, 1)) + '</b>'}</span><span class="ara-tx"><b>${mark(it.title, q)}</b><span>${mark(snippet(it.text, q), q)}</span></span>${where}</button>`;
  }
  function paintSel() {
    K.$$('.ara-row', el).forEach((b) => b.classList.toggle('sel', +b.dataset.araI === sel));
    const s = K.$('.ara-row.sel', el);
    if (s) s.scrollIntoView({ block: 'nearest' });
  }
  function go(it) {
    close();
    if (it.run) return setTimeout(it.run, 200);
    if (it.room) {
      K.audio.sfx.whoosh();
      if (it.group !== 'Odalar') K.fx.toast(`<b>${K.esc(it.title)}</b> · ${K.esc(roomT(it.room))} odasında.`, { icon: A.ui('search'), duration: 3500 });
      setTimeout(() => (location.hash = it.room), 120);
    }
  }
  function lucky() {
    const pool = K.rooms.filter((r) => visible(r) && !r.secret && r.id !== 'panel');
    const visited = K.store.get('visited', {});
    const fresh = pool.filter((r) => !visited[r.id]);
    const r = K.pick(fresh.length ? fresh : pool);
    close();
    K.fx.toast(`Kitty seni <b>${K.esc(K.val(r.title))}</b> odasına götürüyor.`, { icon: A.icon(r.icon), duration: 3000 });
    setTimeout(() => (location.hash = r.id), 200);
  }

  function open() {
    if (el) return;
    idx = build();
    el = K.el(`<div class="ara" role="dialog" aria-modal="true" aria-label="Kitty'ye Sor">
      <div class="ara-back" data-ara-x></div>
      <div class="ara-panel">
        <div class="ara-bar">${A.ui('search')}<input type="search" class="ara-in" placeholder="${K.esc(AR().placeholder)}" autocomplete="off" enterkeyhint="go" aria-label="Ara"><button type="button" class="ara-x" data-ara-x aria-label="Kapat">${A.ui('close')}</button></div>
        <div class="ara-res"></div>
        <p class="ara-kb">Kitty ${K.num(idx.length)} şeyin içinde arıyor · <kbd>↑</kbd><kbd>↓</kbd> gez · <kbd>Enter</kbd> git · <kbd>Esc</kbd> kapat</p>
      </div></div>`);
    document.body.appendChild(el);
    document.body.classList.add('has-modal');
    requestAnimationFrame(() => el.classList.add('in'));
    const inp = K.$('.ara-in', el);
    setTimeout(() => inp.focus(), 60);
    render('');
    let t = 0;
    inp.addEventListener('input', () => {
      clearTimeout(t);
      t = setTimeout(() => render(inp.value), 60);
    });
    el.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') return close();
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        sel = K.clamp(sel + (e.key === 'ArrowDown' ? 1 : -1), 0, Math.max(0, flat.length - 1));
        paintSel();
      }
      if (e.key === 'Enter' && flat[sel]) {
        e.preventDefault();
        go(flat[sel]);
      }
    });
    el.addEventListener('click', (e) => {
      if (e.target.closest('[data-ara-x]')) return close();
      if (e.target.closest('[data-ara-lucky]')) return lucky();
      const tip = e.target.closest('[data-ara-tip]');
      if (tip) {
        inp.value = tip.dataset.araTip;
        render(inp.value);
        return inp.focus();
      }
      const r = e.target.closest('[data-ara-i]');
      if (r && flat[+r.dataset.araI]) go(flat[+r.dataset.araI]);
    });
    K.stickers && K.stickers.bump('ara', 5, 'ara');
  }
  function close() {
    if (!el) return;
    const e = el;
    el = null;
    e.classList.remove('in');
    setTimeout(() => {
      e.remove();
      if (!document.querySelector('.modal, .ara')) document.body.classList.remove('has-modal');
    }, 220);
  }

  document.addEventListener('keydown', (e) => {
    if (!document.querySelector('.brand')) return;
    const typing = e.target.closest && e.target.closest('input, textarea, [contenteditable]');
    if (((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') || (!typing && e.key === '/')) {
      e.preventDefault();
      el ? close() : open();
    }
  });
  // Son girilen odalar (arama boşken gösterilir)
  K.on('room', ({ id }) => {
    const v = K.store.get('lastVisit', {});
    v[id] = Date.now();
    K.store.set('lastVisit', v);
  });
  K.ara = { open, close };
})();
