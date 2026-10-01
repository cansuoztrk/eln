/* Kale 2.0 — Kalede yeni ne var? Güncellemeden sonra kaleye ilk gelişte bir kez, hikâye gibi kayan sayfalar:
   her yenilik bir sayfa, "Dene" ile doğrudan oraya. Zilden ("Kalede yeni ne var?") her zaman yeniden açılır.
   İlk kez gelen biri bunu görmez (ona zaten kale turu var). */
(function () {
  'use strict';
  const K = window.K;
  const A = K.art;
  const D = window.ELN;
  const C = D.config;

  const key = () => 'yeni-' + (K.isOwner() ? 'me' : 'her');
  const latest = () => (D.yenilikler || []).slice(-1)[0] || null;
  // Görülmemiş bütün sürümlerin yenilikleri birlikte (elle açınca son ikisi)
  function pack(manual) {
    const all = D.yenilikler || [];
    const seen = K.store.get(key(), 0) || 0;
    const vs = manual ? all.slice(-2) : all.filter((v) => v.v > seen);
    const pick = vs.length ? vs : all.slice(-1);
    const items = [];
    pick.slice().reverse().forEach((v) => (v.items || []).forEach((it) => items.some((x) => x[0] === it[0]) || items.push(it)));
    return { v: all.length ? all[all.length - 1].v : 0, title: (pick[pick.length - 1] || {}).title, items };
  }
  const NOROOM = ['kaydir', 'hatirlat'];
  const target = (id) => id.replace(/21$/, '');
  const roomOk = (id) => {
    const r = K.rooms.find((x) => x.id === id);
    return Boolean(r && !(typeof r.hidden === 'function' ? r.hidden() : r.hidden));
  };
  function items(v) {
    return (v.items || []).filter(([id]) => {
      if (id === 'telefon') return !K.isOwner() && Boolean(C.ntfyTopicHer) && Boolean(K.telefon);
      if (id === 'cicek') return Boolean(K.$('#cicek') && !K.$('#cicek').hidden);
      if (id === 'kaydir') return true;
      if (id === 'hatirlat') return Boolean(K.hatirlat && C.ntfyTopicHer);
      if (id === 'kavanoz21') return !K.isOwner() && roomOk('kavanoz');
      return roomOk(id);
    });
  }
  let view = null;
  function open(manual) {
    const v = pack(manual === true);
    if (!v.items.length || view) return;
    const list = items(v);
    if (!list.length) return;
    K.store.set(key(), v.v);
    let i = 0;
    view = K.el(`<div class="yn" role="dialog" aria-modal="true" aria-label="${K.esc(v.title || 'Kalede yeni ne var?')}">
      <div class="yn-top"><div class="yn-segs">${list.map(() => '<i><b></b></i>').join('')}</div><button type="button" class="yn-x" aria-label="Kapat">${A.ui('close')}</button></div>
      <p class="yn-kicker">✨ ${K.esc(v.title || 'Kalede yeni ne var?')}</p>
      <div class="yn-stage"></div>
      <button type="button" class="yn-nav prev" aria-label="Önceki"></button><button type="button" class="yn-nav next" aria-label="Sonraki"></button>
      <div class="yn-foot"></div></div>`);
    document.body.appendChild(view);
    document.body.classList.add('has-story');
    requestAnimationFrame(() => view && view.classList.add('in'));
    const draw = () => {
      const [id, ic, title, text] = list[i];
      K.$$('.yn-segs i', view).forEach((s, k) => s.classList.toggle('done', k <= i));
      K.$('.yn-stage', view).innerHTML = `<div class="yn-card" data-id="${K.esc(id)}"><div class="yn-ic">${A.icon(ic)}</div><h2>${K.esc(title)}</h2><p>${K.esc(K.fill(text))}</p></div>`;
      const last = i === list.length - 1;
      const go = NOROOM.includes(id) ? '' : `<button type="button" class="btn red" data-yn-go="${K.esc(id)}">${id === 'telefon' ? 'Kur' : id === 'cicek' ? 'Çiçeğe bak' : 'Dene'}</button>`;
      K.$('.yn-foot', view).innerHTML = `${go}<button type="button" class="btn ${go ? 'ghost' : 'red'}" data-yn-next>${last ? 'Kaleye dön' : 'Sıradaki'}</button>`;
      K.audio.sfx.tap();
    };
    const close = () => {
      if (!view) return;
      const v2 = view;
      view = null;
      v2.classList.remove('in');
      document.body.classList.remove('has-story');
      setTimeout(() => v2.remove(), 300);
    };
    const move = (d) => {
      if (i + d >= list.length) return close();
      i = Math.max(0, i + d);
      draw();
    };
    window.addEventListener('hashchange', close, { once: true });
    view.addEventListener('click', (e) => {
      if (e.target.closest('.yn-x')) return close();
      if (e.target.closest('.yn-nav.prev')) return move(-1);
      if (e.target.closest('.yn-nav.next') || e.target.closest('[data-yn-next]')) return move(1);
      const g = e.target.closest('[data-yn-go]');
      if (g) {
        const id = g.dataset.ynGo;
        close();
        setTimeout(() => {
          if (id === 'telefon') return K.telefon.sheet();
          if (id === 'cicek') {
            K.go('');
            return setTimeout(() => K.$('#cicek') && K.$('#cicek').scrollIntoView({ behavior: 'smooth', block: 'center' }), 300);
          }
          K.go(target(id));
        }, 320);
      }
    });
    let sy = null;
    view.addEventListener('touchstart', (e) => (sy = e.touches[0].clientY), { passive: true });
    view.addEventListener('touchend', (e) => {
      if (sy != null && e.changedTouches[0].clientY - sy > 90) close();
      sy = null;
    });
    document.addEventListener('keydown', function esc(e) {
      if (!view) return document.removeEventListener('keydown', esc);
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowRight') move(1);
      if (e.key === 'ArrowLeft') move(-1);
    });
    draw();
  }
  // Kaleye gelince: tur ve açılış bittiyse, bu sürümü görmediyse
  K.on('built', () => {
    const v = latest();
    if (!v) return;
    if (!K.store.get('tour')) {
      K.store.set(key(), v.v);
      return;
    }
    if ((K.store.get(key(), 0) || 0) >= v.v) return;
    let tries = 0;
    const t = setInterval(() => {
      tries++;
      const busy = K.activeRoom || K.$('.modal') || K.$('.tur') || K.$('.ac') || K.$('.hk-view') || K.$('.kmenu') || K.$('.pl');
      if (!busy && K.cloud && (K.cloud.enabled ? K.$('#cicek') : true)) {
        clearInterval(t);
        open();
      } else if (tries > 40) clearInterval(t);
    }, 2500);
  });
  K.yeni = { open };
})();
