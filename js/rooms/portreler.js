/* Oda: Portre Galerisi — kadife duvarlı küçük bir müze; her tabloda sen, her etikette benim notum */
(function () {
  'use strict';
  const K = window.K;
  const A = K.art;
  const D = window.ELN;
  const C = D.config;

  let root;
  const viewed = () => K.store.get('portraitsSeen', {});

  function frames() {
    const v = viewed();
    K.$('#muWall', root).innerHTML = D.portraits
      .map(
        (p, i) => `<button class="mu-item ${p.wide ? 'wide' : ''}" data-i="${i}" style="--d:${(i % 4) * 0.12}s">
          <span class="mu-spot" aria-hidden="true"></span>
          <span class="mu-frame"><span class="mu-mat"><img data-vault="${K.esc(p.id)}" data-thumb alt="${K.esc(p.title)}" style="object-position:${K.esc(p.pos || 'center')}"></span></span>
          <span class="mu-plaque"><b>${K.esc(p.title)}</b><small>No. ${K.pad(i + 1)} · ${v[p.id] ? 'Yakından bakıldı' : 'Yakından bak'}</small></span>
        </button>`
      )
      .join('');
    K.vault.fill(K.$('#muWall', root));
    const n = D.portraits.filter((p) => v[p.id]).length;
    K.$('#muCount', root).textContent = `${n} / ${D.portraits.length} tabloya yakından baktın`;
  }

  function open(i) {
    const m = K.ui.modal({ cls: 'portrait-modal', label: 'Portre', html: '<div class="pm"></div>', onClose: frames });
    const box = K.$('.pm', m.el);
    const show = () => {
      const p = D.portraits[i];
      const v = viewed();
      if (!v[p.id]) {
        v[p.id] = K.time.todayKey();
        K.store.set('portraitsSeen', v);
        if (D.portraits.every((x) => v[x.id])) K.stickers.award('portre');
      }
      box.innerHTML = `
        <div class="pm-frame ${p.wide ? 'wide' : ''}"><span class="mu-mat"><img data-vault="${K.esc(p.id)}" alt="${K.esc(p.title)}"></span></div>
        <div class="pm-label">
          <p class="card-eyebrow">No. ${K.pad(i + 1)} / ${K.pad(D.portraits.length)}</p>
          <h3>${K.esc(p.title)}</h3>
          <dl class="pm-meta">
            <div><dt>Model</dt><dd>Prenses ${K.esc(C.herPet)}</dd></div>
            <div><dt>Şehir</dt><dd>${K.esc(C.herCity)}</dd></div>
            <div><dt>Koleksiyon</dt><dd>${K.esc(C.myPet)}'un kalbi</dd></div>
            <div><dt>Değeri</dt><dd>Paha biçilemez</dd></div>
          </dl>
          <p class="pm-text">${K.esc(K.fill(p.text))}</p>
          <div class="actions">
            <button class="icon-btn" data-nav="-1" aria-label="Önceki tablo">${A.ui('back')}</button>
            <button class="btn soft small" data-heart>${A.ui('heart')} <span class="tnum">${K.num(hearts(p.id))}</span></button>
            <button class="icon-btn" data-nav="1" aria-label="Sonraki tablo">${A.ui('next')}</button>
          </div>
        </div>`;
      K.vault.fill(box);
    };
    show();
    box.addEventListener('click', (e) => {
      const nav = e.target.closest('[data-nav]');
      if (nav) {
        i = (i + +nav.dataset.nav + D.portraits.length) % D.portraits.length;
        K.audio.sfx.paper();
        show();
        return;
      }
      const h = e.target.closest('[data-heart]');
      if (h) {
        const id = D.portraits[i].id;
        const all = K.store.get('portraitHearts', {});
        all[id] = (all[id] || 0) + 1;
        K.store.set('portraitHearts', all);
        K.$('.tnum', h).textContent = K.num(all[id]);
        K.audio.sfx.pop();
        const r = h.getBoundingClientRect();
        K.fx.burst(r.left + r.width / 2, r.top, { count: 9, power: 4, shapes: ['heart'] });
      }
    });
    let sx = null;
    box.addEventListener('pointerdown', (e) => (sx = e.clientX));
    box.addEventListener('pointerup', (e) => {
      if (sx == null) return;
      const dx = e.clientX - sx;
      sx = null;
      if (Math.abs(dx) > 60) {
        i = (i + (dx < 0 ? 1 : -1) + D.portraits.length) % D.portraits.length;
        show();
      }
    });
  }
  const hearts = (id) => K.store.get('portraitHearts', {})[id] || 0;

  K.room({
    id: 'portreler',
    wing: 'anilar',
    title: 'Portre Galerisi',
    sub: 'Kadife duvarlı küçük bir müze',
    icon: 'frame',
    color: '#FFE9B8',
    badge: () => `${D.portraits.filter((p) => viewed()[p.id]).length}/${D.portraits.length}`,
    init(el) {
      root = el;
      el.innerHTML = `
        <div class="mu-intro">
          <p class="card-eyebrow">Küratörün notu</p>
          <p class="hand">Bu müzede tek bir sanatçı, tek bir model ve tek bir ziyaretçi var. Sanatçı doğa, model sensin, ziyaretçi ise her gece buraya gelip aynı tablolara bakmaktan hiç sıkılmayan ${K.esc(C.myPet)}. Tablolara dokun; her birinin etiketinde sana bir not bıraktım.</p>
          <p class="muted small" id="muCount"></p>
        </div>
        <div class="mu-hall"><div class="mu-wall" id="muWall"></div></div>`;
      frames();
      K.$('#muWall', el).addEventListener('click', (e) => {
        const b = e.target.closest('.mu-item');
        if (!b) return;
        K.audio.sfx.whoosh();
        open(+b.dataset.i);
      });
    },
    enter() {
      frames();
    },
  });
})();
