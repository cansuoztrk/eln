/* Oda: Anı Duvarı — ipe asılı polaroidler: fotoğraflarımız, masal kartları ve Eln'in çizimleri */
(function () {
  'use strict';
  const K = window.K;
  const A = K.art;
  const D = window.ELN;
  const C = D.config;
  const T = K.time;

  let root;
  const MEMORIES = () => [
    { scene: 'nehir', caption: `Peri ${C.friendName} işbaşında`, date: C.metDate },
    { scene: 'winter', caption: 'Gruptaki ilk "merhaba"', date: C.metDate },
    { scene: 'question', caption: 'Adı konmamış günler' },
    { scene: 'birthday', caption: 'Senin doğum günün', date: `2026-${C.herBirthday}` },
    { scene: 'together', caption: 'Sevgili olduğumuz gün', date: C.togetherDate },
    { scene: 'istanbul', caption: 'gartic.io geceleri' },
    { scene: 'distance', caption: `${K.num(C.distanceKm)} km ve bir kalp` },
    { scene: 'future', caption: 'Devamı gelecek...' },
  ];

  const uploads = () => K.store.get('wallPhotos', []);

  function items() {
    const photos = D.photos.map((p, i) => ({ kind: 'photo', id: 'p' + i, src: p.src, vault: p.vault, caption: p.caption || '', date: p.date || '' }));
    const mine = uploads().map((p) => ({ kind: 'upload', id: 'u' + p.id, src: p.img, caption: p.caption || '', date: p.date, uid: p.id }));
    const draws = K.store.get('drawings', []).map((d) => ({ kind: 'drawing', id: 'd' + d.id, src: d.img, caption: d.prompt || 'Çizimim', date: d.date }));
    const cards = MEMORIES().map((m, i) => ({ kind: 'scene', id: 's' + i, scene: m.scene, caption: m.caption, date: m.date || '' }));
    return { photos: photos.concat(mine), draws, cards };
  }

  // Kasadaki fotoğraflar şifreli: <img data-vault> olarak basılır, K.vault.fill çözer
  const imgTag = (it, thumb) =>
    it.vault ? `<img data-vault="${K.esc(it.vault)}" ${thumb ? 'data-thumb' : ''} alt="${K.esc(it.caption)}">` : `<img src="${K.esc(it.src)}" alt="${K.esc(it.caption)}" ${thumb ? 'loading="lazy"' : ''}>`;
  function polaroid(it, i) {
    const rot = [-4, 3, -2, 5, -3, 2, -5, 4][i % 8];
    const media = it.kind === 'scene' ? `<svg viewBox="0 0 320 200" aria-hidden="true">${K.scenes[it.scene] ? K.scenes[it.scene]() : ''}</svg>` : imgTag(it, true);
    return `<button class="polaroid" data-id="${it.id}" style="--rot:${rot}deg;--d:${(i % 5) * 0.2}s">
      <span class="pin">${A.bow(['#E3174D', '#FF6FA3', '#8F73E6', '#4FC3D9'][i % 4])}</span>
      <span class="pol-media">${media}</span>
      <span class="pol-cap">${K.esc(it.caption)}</span>
      ${it.date ? `<span class="pol-date">${T.fmtShort(it.date)}</span>` : ''}
    </button>`;
  }
  function row(title, list, note) {
    if (!list.length) return '';
    return `<section class="wall-row"><h3 class="sub-h">${title}</h3>${note ? `<p class="muted small">${note}</p>` : ''}
      <div class="string"><svg class="string-line" viewBox="0 0 100 10" preserveAspectRatio="none" aria-hidden="true"><path d="M0 1 Q50 12 100 1" fill="none" stroke="#B9869C" stroke-width=".6" vector-effect="non-scaling-stroke"/></svg>
      <div class="pols">${list.map(polaroid).join('')}</div></div></section>`;
  }
  let flat = [];
  function render() {
    const { photos, draws, cards } = items();
    flat = [...photos, ...draws, ...cards];
    K.$('#wall', root).innerHTML =
      (photos.length ? row('Fotoğraflarımız', photos) : '') +
      row('Masal kartları', cards, photos.length ? '' : 'Bu ipte şimdilik masalımızdan resimler var. Fotoğraflarımız da yakında buraya asılacak.') +
      row('Senin çizimlerin', draws, 'Gartic Odası\'nda "Duvara as" dediğin her çizim buraya gelir.');
    K.vault.fill(root);
  }

  function lightbox(id) {
    let i = flat.findIndex((x) => x.id === id);
    if (i < 0) return;
    const m = K.ui.modal({ cls: 'lightbox', label: 'Anı', html: '<div class="lb"></div>' });
    const box = K.$('.lb', m.el);
    let armed = false;
    const show = () => {
      const it = flat[i];
      armed = false;
      const media = it.kind === 'scene' ? `<svg viewBox="0 0 320 200" aria-hidden="true">${K.scenes[it.scene]()}</svg>` : imgTag(it, false);
      box.innerHTML = `<div class="lb-frame">${media}</div>
        <p class="lb-cap hand">${K.esc(it.caption)}</p>
        ${it.date ? `<p class="muted">${T.fmt(it.date)}</p>` : ''}
        <div class="actions" style="justify-content:center">
          <button class="icon-btn" data-nav="-1" aria-label="Önceki">${A.ui('back')}</button>
          <span class="muted small tnum">${i + 1} / ${flat.length}</span>
          <button class="icon-btn" data-nav="1" aria-label="Sonraki">${A.ui('next')}</button>
          ${it.kind === 'upload' ? `<button class="btn ghost small" data-del>${A.ui('trash')} Duvardan indir</button>` : ''}
        </div>`;
      K.vault.fill(box);
    };
    show();
    box.addEventListener('click', (e) => {
      const nav = e.target.closest('[data-nav]');
      if (nav) {
        i = (i + +nav.dataset.nav + flat.length) % flat.length;
        K.audio.sfx.paper();
        show();
      }
      const del = e.target.closest('[data-del]');
      if (del) {
        if (!armed) {
          armed = true;
          del.textContent = 'Emin misin? Tekrar bas';
          del.classList.add('red');
          return;
        }
        const uid = flat[i].uid;
        K.store.set('wallPhotos', uploads().filter((p) => p.id !== uid));
        m.close();
        render();
      }
    });
    let sx = null;
    box.addEventListener('pointerdown', (e) => (sx = e.clientX));
    box.addEventListener('pointerup', (e) => {
      if (sx == null) return;
      const dx = e.clientX - sx;
      sx = null;
      if (Math.abs(dx) > 60) {
        i = (i + (dx < 0 ? 1 : -1) + flat.length) % flat.length;
        show();
      }
    });
  }

  // Fotoğrafı küçültüp bu cihazda sakla
  function addFiles(files) {
    const list = [...files].filter((f) => f.type.startsWith('image/')).slice(0, 10);
    if (!list.length) return;
    let done = 0;
    list.forEach((f) => {
      const url = URL.createObjectURL(f);
      const img = new Image();
      img.onload = () => {
        const max = 900;
        const k = Math.min(1, max / Math.max(img.width, img.height));
        const c = document.createElement('canvas');
        c.width = Math.round(img.width * k);
        c.height = Math.round(img.height * k);
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
        URL.revokeObjectURL(url);
        const data = c.toDataURL('image/jpeg', 0.78);
        const all = uploads();
        all.unshift({ id: Date.now() + Math.random(), img: data, caption: f.name.replace(/\.[^.]+$/, '').slice(0, 40), date: T.todayKey() });
        if (!K.store.set('wallPhotos', all)) {
          K.fx.toast('Bu fotoğraf sığmadı: tarayıcının hafızası dolu. Bazı fotoğrafları duvardan indirip tekrar dene.');
        }
        if (++done === list.length) {
          render();
          K.audio.sfx.success();
          K.fx.toast('Fotoğraflar duvara asıldı.', { icon: A.icon('camera') });
        }
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        done++;
      };
      img.src = url;
    });
  }

  K.room({
    id: 'galeri',
    wing: 'anilar',
    title: 'Anı Duvarı',
    sub: 'İpe asılı anılarımız',
    icon: 'camera',
    color: '#FFD6E5',
    init(el) {
      root = el;
      el.innerHTML = `
        <p class="room-intro">Polaroidlere dokun, büyüsünler. Mandallar Kitty'nin fiyonklarından.</p>
        <div class="wall" id="wall"></div>
        <div class="card upload">
          <div><p class="card-eyebrow">Duvara sen de bir şey as</p>
          <p class="muted small">Buraya eklediğin fotoğraflar sadece bu cihazda, senin duvarında kalır.</p></div>
          <label class="btn" for="wallFile">${A.ui('image')} Fotoğraf seç</label>
          <input type="file" id="wallFile" accept="image/*" multiple hidden>
        </div>`;
      K.$('#wall', el).addEventListener('click', (e) => {
        const p = e.target.closest('.polaroid');
        if (p) lightbox(p.dataset.id);
      });
      K.$('#wallFile', el).addEventListener('change', (e) => {
        addFiles(e.target.files);
        e.target.value = '';
      });
    },
    enter() {
      render();
    },
  });
})();
