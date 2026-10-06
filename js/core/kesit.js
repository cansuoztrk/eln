/* Kale 2.0 — Kale Haritasıyla Gezinme: haritada bir kuleye dokununca kamera o kuleye uçar ve kulenin kesiti açılır.
   Her kat bir sıra oda; her oda bir pencere. Yeni ya da hareketli odanın ışığı yanar, o an hangi odadaysa orada
   onun küçük resmi durur, Pamuk da saatine göre bir odada dolaşır. Bir pencereye dokununca o odaya girilir. */
(function () {
  'use strict';
  const K = window.K;
  const A = K.art;
  const T = K.time;

  let ov = null;
  function close() {
    if (!ov) return;
    const o = ov;
    ov = null;
    o.classList.remove('in');
    setTimeout(() => o.remove(), 350);
  }
  function open(wingId, from) {
    const w = (K.WINGS || []).find((x) => x.id === wingId);
    if (!w) return;
    const rooms = K.wingRooms(wingId);
    if (!rooms.length) return K.toWing && K.toWing(wingId);
    close();
    const visited = K.store.get('visited', {});
    const where = K.yan && K.yan.where && K.yan.where();
    const other = K.isOwner() ? 'her' : 'me';
    const cat = K.kedi && K.kedi.adopted && K.kedi.adopted() ? rooms[(T.baku().h + K.hash(wingId)) % rooms.length].id : '';
    const floors = [];
    for (let i = 0; i < rooms.length; i += 2) floors.push(rooms.slice(i, i + 2));
    const box = (r) => {
      const fresh = !visited[r.id];
      const badge = !fresh && r.badge ? r.badge() : '';
      return `<button type="button" class="ks-oda ${fresh ? 'yeni' : badge ? 'isik' : ''}" data-ks="${r.id}" style="--c:${r.color}">
        <span class="ks-pencere">${A.icon(r.icon)}</span><b>${K.esc(K.val(r.title))}</b>${fresh ? '<em>Yeni</em>' : badge ? `<em>${K.esc(badge)}</em>` : ''}
        ${where && where.room === r.id ? `<span class="ks-o">${K.avatar(other, 'yan-av on')}</span>` : ''}${cat === r.id ? '<span class="ks-kedi" aria-label="Pamuk burada">🐈</span>' : ''}</button>`;
    };
    ov = K.el(`<div class="kesit" role="dialog" aria-modal="true" aria-label="${K.esc(w.title)} kesiti" style="--w:${w.color}">
      <div class="ks-back" data-ks-x></div>
      <div class="ks-kule">
        <div class="ks-cati"><span class="ks-bayrak"></span><h2>${A.icon(w.icon)} ${K.esc(w.title)}</h2><button type="button" class="icon-btn" data-ks-x aria-label="Kapat">${A.ui('close')}</button></div>
        <div class="ks-katlar">${floors.reverse().map((f, i) => `<div class="ks-kat" style="--k:${i}">${f.map(box).join('')}</div>`).join('')}</div>
        <div class="ks-zemin"><span class="ks-kapi"></span><button type="button" class="btn ghost small" data-ks-raf>Rafta göster</button></div>
      </div></div>`);
    if (from) {
      const r = from.getBoundingClientRect();
      ov.style.setProperty('--ox', `${r.left + r.width / 2}px`);
      ov.style.setProperty('--oy', `${r.top + r.height / 2}px`);
    }
    document.body.appendChild(ov);
    requestAnimationFrame(() => ov && ov.classList.add('in'));
    K.audio.sfx.whoosh();
    ov.addEventListener('click', (e) => {
      if (e.target.closest('[data-ks-x]')) return close();
      if (e.target.closest('[data-ks-raf]')) return close(), setTimeout(() => K.toWing && K.toWing(wingId), 200);
      const b = e.target.closest('[data-ks]');
      if (!b) return;
      b.classList.add('giris');
      setTimeout(() => {
        close();
        K.go(b.dataset.ks);
      }, K.reduced ? 0 : 260);
    });
    document.addEventListener('keydown', function esc(e) {
      if (e.key === 'Escape') close(), document.removeEventListener('keydown', esc);
    });
    K.stickers.award('kesit');
  }
  // Haritadaki kulenin konumu "kameranın" çıkış noktası olsun
  document.addEventListener('pointerdown', (e) => {
    const t = e.target.closest('.km-t');
    if (t) open.from = t;
  });
  window.addEventListener('hashchange', close);
  K.kesit = { open: (id) => open(id, open.from), close };
})();
