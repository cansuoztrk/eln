/* Oda: Seni Sevmemin Sebepleri — kaydırılan kart destesi */
(function () {
  'use strict';
  const K = window.K;
  const A = K.art;
  const D = window.ELN;

  let root, order, pos = 0, busy = false;
  const COLORS = ['#FFD6E5', '#E6DCFF', '#D6F1FF', '#FFF3C4', '#D8F5E8', '#FFE0E0'];
  const DOODLES = ['heart', 'bow', 'star', 'moon', 'letter', 'crown', 'apple', 'plane', 'palette', 'cake'];
  const seen = () => new Set(K.store.get('reasonsSeen', []));
  const favs = () => new Set(K.store.get('reasonsFav', []));

  function cardHTML(idx, depth) {
    const text = K.fill(D.reasons[idx]);
    const fav = favs().has(idx);
    return `<article class="rcard d${depth}" data-idx="${idx}" style="--rc:${COLORS[idx % COLORS.length]}" ${depth ? 'aria-hidden="true"' : ''}>
      <span class="rc-tape"></span>
      <p class="rc-num">#${idx + 1}</p>
      <p class="rc-text">${K.esc(text)}</p>
      <span class="rc-doodle">${A.icon(DOODLES[idx % DOODLES.length])}</span>
      ${fav ? `<span class="rc-fav">${A.ui('heart')}</span>` : ''}
    </article>`;
  }
  function render() {
    const n = order.length;
    const stack = K.$('#rStack', root);
    stack.innerHTML = [2, 1, 0].map((d) => cardHTML(order[(pos + d) % n], d)).join('');
    const idx = order[pos];
    const s = seen();
    if (!s.has(idx)) {
      s.add(idx);
      K.store.set('reasonsSeen', [...s]);
      if (s.size >= 30) K.stickers.award('sebep');
    }
    K.$('#rCount', root).textContent = `${s.size} / ${D.reasons.length} sebep okundu`;
    K.$('#rProg', root).style.width = `${(s.size / D.reasons.length) * 100}%`;
    const f = favs().has(idx);
    const fb = K.$('#rFav', root);
    fb.setAttribute('aria-pressed', f ? 'true' : 'false');
    fb.querySelector('span').textContent = f ? 'Favorimde' : 'Favorime ekle';
    bindDrag();
  }
  function step(dir, fly = 0) {
    if (busy) return;
    const top = K.$('.rcard.d0', root);
    const n = order.length;
    const go = () => {
      pos = (pos + dir + n) % n;
      render();
    };
    if (!top || K.reduced) return go();
    busy = true;
    K.audio.sfx.paper();
    top.style.transition = 'transform .35s ease, opacity .35s';
    top.style.transform = `translateX(${(fly || (dir > 0 ? -1 : 1)) * 130}%) rotate(${(fly || -dir) * 18}deg)`;
    top.style.opacity = '0';
    setTimeout(() => {
      busy = false;
      go();
    }, 300);
  }
  function bindDrag() {
    const top = K.$('.rcard.d0', root);
    if (!top) return;
    let sx = null,
      dx = 0;
    top.addEventListener('pointerdown', (e) => {
      sx = e.clientX;
      dx = 0;
      top.setPointerCapture(e.pointerId);
      top.style.transition = 'none';
    });
    top.addEventListener('pointermove', (e) => {
      if (sx == null) return;
      dx = e.clientX - sx;
      top.style.transform = `translateX(${dx}px) rotate(${dx / 14}deg)`;
    });
    const up = () => {
      if (sx == null) return;
      sx = null;
      if (Math.abs(dx) > 80) step(1, dx > 0 ? 1 : -1);
      else {
        top.style.transition = 'transform .3s cubic-bezier(.34,1.56,.64,1)';
        top.style.transform = '';
      }
    };
    top.addEventListener('pointerup', up);
    top.addEventListener('pointercancel', up);
  }
  function toggleFav() {
    const idx = order[pos];
    const f = favs();
    if (f.has(idx)) f.delete(idx);
    else {
      f.add(idx);
      K.audio.sfx.pop();
      const r = K.$('#rFav', root).getBoundingClientRect();
      K.fx.burst(r.left + r.width / 2, r.top, { count: 10, shapes: ['heart'] });
    }
    K.store.set('reasonsFav', [...f]);
    render();
    if (!K.$('#rFavList', root).hidden) favList(true);
  }
  function favList(keepOpen) {
    const box = K.$('#rFavList', root);
    if (!keepOpen && !box.hidden) {
      box.hidden = true;
      return;
    }
    const f = [...favs()].sort((a, b) => a - b);
    box.hidden = false;
    box.innerHTML = f.length
      ? `<ol class="fav-list">${f.map((i) => `<li><b>#${i + 1}</b> ${K.esc(K.fill(D.reasons[i]))}</li>`).join('')}</ol>`
      : '<p class="muted">Henüz favori yok. Kalbine dokunan bir kartı favorine ekle; ekran görüntüsünü alıp bana gönder, hangisi olduğunu merak ediyorum.</p>';
  }

  K.room({
    id: 'sebepler',
    wing: 'kalp',
    title: 'Seni Sevmemin Sebepleri',
    sub: () => `${D.reasons.length} sebep ve sayılmayan binlercesi`,
    icon: 'cards',
    color: '#E6DCFF',
    badge: () => `${seen().size}/${D.reasons.length}`,
    init(el) {
      root = el;
      order = D.reasons.map((_, i) => i);
      const s = seen();
      const firstUnseen = order.findIndex((i) => !s.has(i));
      pos = firstUnseen < 0 ? 0 : firstUnseen;
      el.innerHTML = `
        <p class="room-intro">Kartları sağa ya da sola kaydır. Hepsini okumak zorunda değilsin; her gün birkaç tane yeter. Liste bitince baştan başlar, ama bil ki gerçek liste hiç bitmiyor.</p>
        <div class="r-progress"><div class="r-bar"><i id="rProg"></i></div><p class="muted small" id="rCount"></p></div>
        <div class="r-stack" id="rStack"></div>
        <div class="r-nav">
          <button class="icon-btn" id="rPrev" aria-label="Önceki">${A.ui('back')}</button>
          <button class="btn soft" id="rFav" aria-pressed="false">${A.ui('heart')}<span>Favorime ekle</span></button>
          <button class="icon-btn" id="rShuffle" aria-label="Rastgele">${A.ui('shuffle')}</button>
          <button class="icon-btn" id="rNext" aria-label="Sonraki">${A.ui('next')}</button>
        </div>
        <div style="text-align:center;margin-top:18px"><button class="btn ghost small" id="rFavBtn">Favorilerim</button></div>
        <div class="card" id="rFavList" hidden style="margin-top:14px"></div>`;
      K.$('#rPrev', el).addEventListener('click', () => step(-1));
      K.$('#rNext', el).addEventListener('click', () => step(1));
      K.$('#rShuffle', el).addEventListener('click', () => {
        pos = Math.floor(Math.random() * order.length);
        K.audio.sfx.sparkle();
        render();
      });
      K.$('#rFav', el).addEventListener('click', toggleFav);
      K.$('#rFavBtn', el).addEventListener('click', () => favList(false));
      document.addEventListener('keydown', (e) => {
        if (K.activeRoom !== 'sebepler' || e.target.closest('input,textarea')) return;
        if (e.key === 'ArrowRight') step(1);
        if (e.key === 'ArrowLeft') step(-1);
      });
      render();
    },
  });
})();
