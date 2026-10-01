/* Kale Turu — Eln kurdeleyi kesip açılış filmini izledikten sonra Kitty ana salonu gezdirir:
   ekranda sırayla bir yer aydınlanır, yanında Kitty'nin balonu. "Sonra" derse ana salonda turu başlatan bir kart kalır.
   Sonraki haftalarda ana salonda "Bugünün keşfi": henüz girmediği odalardan her gün bir öneri (61 oda bir anda üstüne yığılmasın). */
(function () {
  'use strict';
  const K = window.K;
  const D = window.ELN;
  const T = K.time;

  const TT = () => D.tur || { steps: [], kesif: [] };
  // Adımların ana salondaki yerleri (metinler kasada)
  const SEL = {
    hos: null,
    nerede: '#whereChip',
    sayac: '.tc-chips',
    ozel: '#special',
    bugun: '.today-grid',
    album: '.top-actions a[href="#album"]',
    muzik: '#musicBtn',
    kanat: '#castleMap',
    hikaye: '#stories',
    dock: '#dock',
    son: '#special',
  };
  const shown = (el) => {
    if (!el) return false;
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0 && !el.closest('[hidden]');
  };

  let box = null, i = 0, steps = [], raf = 0;

  function place() {
    if (!box) return;
    const st = steps[i];
    const el0 = st && st.sel ? K.$(st.sel) : null;
    const el = shown(el0) ? el0 : null;
    const hole = K.$('.tur-hole', box);
    const bub = K.$('.tur-bub', box);
    const W = window.innerWidth, H = window.innerHeight;
    const bw = Math.min(360, W - 32);
    bub.style.width = bw + 'px';
    const bh = bub.offsetHeight;
    if (el) {
      const r = el.getBoundingClientRect();
      const pad = 8;
      const top = Math.max(6, r.top - pad), left = Math.max(6, r.left - pad);
      const h = Math.min(r.height + pad * 2, H - top - 6);
      Object.assign(hole.style, { top: top + 'px', left: left + 'px', width: Math.min(r.width + pad * 2, W - left - 6) + 'px', height: h + 'px', opacity: 1 });
      let by = top + h + 14;
      if (by + bh > H - 12) by = Math.max(12, top - bh - 14);
      // Ekrandan uzun bölümlerde (kanatlar gibi) balon ekranın altında durur
      if (by + bh > H - 12 || r.height > H * 0.55) by = Math.max(12, H - bh - 16);
      bub.style.top = by + 'px';
      bub.style.left = K.clamp(r.left + r.width / 2 - bw / 2, 16, W - bw - 16) + 'px';
    } else {
      Object.assign(hole.style, { top: H / 2 + 'px', left: W / 2 + 'px', width: '0px', height: '0px', opacity: 0 });
      bub.style.top = Math.max(16, (H - bh) / 2) + 'px';
      bub.style.left = (W - bw) / 2 + 'px';
    }
  }
  const onMove = () => {
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(place);
  };

  async function show(n) {
    i = n;
    // Görünmeyen yerler atlanır; son adım (kapanış) yeri yoksa ortada gösterilir
    const vis = (sel) => {
      const e = K.$(sel);
      if (e && K.salon) K.salon.reveal(e);
      return shown(e);
    };
    while (i < steps.length - 1 && steps[i].sel && !vis(steps[i].sel)) i++;
    if (i >= steps.length) return finish();
    const st = steps[i];
    const el = st.sel && shown(K.$(st.sel)) ? K.$(st.sel) : null;
    if (el) {
      el.scrollIntoView({ block: 'center', behavior: K.reduced ? 'auto' : 'smooth' });
      // Kaydırma durana kadar bekle (en fazla ~1,5 sn)
      let last = -1, same = 0;
      for (let t = 0; t < 30 && same < 3; t++) {
        await K.wait(50);
        same = Math.abs(window.scrollY - last) < 1 ? same + 1 : 0;
        last = window.scrollY;
      }
    }
    const bub = K.$('.tur-bub', box);
    const last = i === steps.length - 1;
    const first = i === 0;
    bub.innerHTML = `<div class="tur-kitty">${K.art.kitty({ eyes: first || last ? 'heart' : undefined, crown: last })}</div>
      <div class="tur-tx"><b>${K.esc(K.fill(st.title))}</b><p>${K.esc(K.fill(st.text))}</p>
        <div class="tur-foot"><span class="tur-dots" aria-hidden="true">${steps.map((_, j) => `<i class="${j === i ? 'on' : ''}"></i>`).join('')}</span>
          ${first ? '<button type="button" class="btn ghost small" data-tur="later">Sonra</button><button type="button" class="btn red small" data-tur="next" autofocus>Gezdir</button>' : last ? '<button type="button" class="btn red small" data-tur="end">Kaleye dön</button>' : '<button type="button" class="btn ghost small" data-tur="skip">Turu bitir</button><button type="button" class="btn red small" data-tur="next">İleri</button>'}</div></div>`;
    place();
    K.audio.sfx.tap();
    const b = K.$('[data-tur="next"], [data-tur="end"]', bub);
    b && b.focus({ preventScroll: true });
  }

  function start() {
    if (box || !K.$('#home')) return;
    K.renderSpecials && K.renderSpecials();
    steps = (TT().steps || []).map(([key, title, text]) => ({ key, sel: SEL[key] || null, title, text }));
    if (!steps.length) return;
    if (K.activeRoom) location.hash = '';
    box = K.el('<div class="tur" role="dialog" aria-modal="true" aria-label="Kale turu"><div class="tur-hole"></div><div class="tur-bub"></div></div>');
    document.body.appendChild(box);
    document.body.classList.add('has-modal');
    requestAnimationFrame(() => box.classList.add('in'));
    box.addEventListener('click', (e) => {
      const b = e.target.closest('[data-tur]');
      if (!b) return;
      const a = b.dataset.tur;
      if (a === 'next') return show(i + 1);
      if (a === 'later') return close('later');
      if (a === 'skip' || a === 'end') return finish();
    });
    window.addEventListener('resize', onMove);
    window.addEventListener('scroll', onMove, { passive: true });
    document.addEventListener('keydown', onKey);
    show(0);
  }
  const onKey = (e) => {
    if (!box) return;
    if (e.key === 'Escape') close('later');
    if (e.key === 'ArrowRight') show(i + 1);
  };
  function close(state) {
    if (!box) return;
    K.store.set('tour', state);
    window.removeEventListener('resize', onMove);
    window.removeEventListener('scroll', onMove);
    document.removeEventListener('keydown', onKey);
    const b = box;
    box = null;
    b.classList.remove('in');
    setTimeout(() => {
      b.remove();
      if (!document.querySelector('.modal, .tur')) document.body.classList.remove('has-modal');
    }, 300);
    K.renderSpecials && K.renderSpecials();
  }
  function finish() {
    close(T.todayKey());
    K.stickers.award('tur');
    K.fx.confetti({ count: 80, shapes: ['heart', 'bow'] });
    window.scrollTo({ top: 0, behavior: K.reduced ? 'auto' : 'smooth' });
  }

  /* ---------- Bugünün keşfi ---------- */
  function kesif() {
    if (K.isOwner() && !K.store.get('tourPreview')) return [];
    const out = [];
    const t = K.store.get('tour', null);
    if (t === 'later') out.push({ icon: 'crown', title: 'Kitty seni gezdirmek istiyor', text: 'Bir dakikalık kale turu: neyin nerede olduğunu gösterir, sonra sen gezersin.', room: 'tur', cta: 'Turu başlat' });
    const opened = K.store.get('acilis', null);
    if (!opened || T.daysSince(opened) > 45) return out;
    const visited = K.store.get('visited', {});
    const today = T.todayKey();
    const key = 'kesif-' + today;
    const vis = (id) => {
      const r = K.rooms.find((x) => x.id === id);
      return r && !(typeof r.hidden === 'function' ? r.hidden() : r.hidden) ? r : null;
    };
    let pick = K.store.get(key, null);
    if (!pick) {
      const next = (TT().kesif || []).find(([id]) => !visited[id] && vis(id));
      if (!next) return out;
      pick = next[0];
      K.store.set(key, pick);
    }
    const item = (TT().kesif || []).find(([id]) => id === pick);
    const room = vis(pick);
    if (!item || !room || visited[pick]) return out;
    out.push({ icon: room.icon || 'door', title: `Bugünün keşfi: ${K.val(room.title)}`, text: K.fill(item[1]), room: pick, cta: 'Kapıyı aç' });
    return out;
  }
  K.specialHooks = (K.specialHooks || []).concat(kesif);

  window.addEventListener('hashchange', () => {
    if (location.hash !== '#tur') return;
    history.replaceState(null, '', location.pathname + location.search);
    setTimeout(start, 350);
  });
  K.tour = { offer: start, start };
})();
