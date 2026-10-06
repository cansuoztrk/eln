/* Oda: Kalp Mozaiği — kalenin bütün fotoğrafları (Günün Karesi, kartpostallar, hikâyeler, sahneler, kabin, rota) zaman
   sırasıyla kalp biçimli bir ızgarayı doldurur. Her yeni fotoğraf bir boşluğu doldurur; en yenisi parlar. Kalp dolunca
   bir sonraki, daha büyük kalp başlar (Küçük Kalp → Kocaman Kalp → Sonsuz Kalp) ve tamamlanan kalp telefon duvar kâğıdı
   olarak indirilebilir. Boşluk kalmasın diye buradan doğrudan da fotoğraf eklenebilir. Kayıtlar: mozaik {thumb} */
(function () {
  'use strict';
  const K = window.K;
  const A = K.art;
  const D = window.ELN;
  const C = D.config;
  const T = K.time;

  const nameOf = (w) => (w === 'me' ? C.myPet : C.herPet);
  const LEVELS = [
    ['Küçük Kalp', 11],
    ['Kocaman Kalp', 15],
    ['Sonsuz Kalp', 21],
  ];
  // Kalp denklemi: (x² + y² − 1)³ − x²y³ ≤ 0
  function cells(n) {
    const out = [];
    for (let r = 0; r < n; r++)
      for (let c = 0; c < n; c++) {
        const x = ((c + 0.5) / n) * 2.45 - 1.225;
        const y = 1.25 - ((r + 0.5) / n) * 2.3;
        const v = Math.pow(x * x + y * y - 1, 3) - x * x * y * y * y;
        if (v <= 0) out.push([r, c]);
      }
    // Ortadan dışarı doğru dolsun
    const cx = (n - 1) / 2, cy = n * 0.45;
    return out.sort((a, b) => Math.hypot(a[0] - cy, a[1] - cx) - Math.hypot(b[0] - cy, b[1] - cx));
  }
  const GRIDS = LEVELS.map(([, n]) => cells(n));
  let root = null, photos = [], loaded = false, view = -1;
  function state() {
    let left = photos.length, lvl = 0;
    while (lvl < GRIDS.length - 1 && left >= GRIDS[lvl].length) (left -= GRIDS[lvl].length), lvl++;
    const start = GRIDS.slice(0, lvl).reduce((s, g) => s + g.length, 0);
    return { lvl, start, filled: Math.min(GRIDS[lvl].length, photos.length - start) };
  }
  function grid(lvl) {
    const n = LEVELS[lvl][1], g = GRIDS[lvl];
    const start = GRIDS.slice(0, lvl).reduce((s, x) => s + x.length, 0);
    const newest = photos.length - 1;
    return `<div class="mo-kalp" style="--n:${n}">${g
      .map(([r, c], i) => {
        const p = photos[start + i];
        return p
          ? `<button type="button" class="mo-kare dolu ${start + i === newest ? 'yeni' : ''}" style="grid-row:${r + 1};grid-column:${c + 1}" data-mo="${start + i}"><img src="${p.thumb}" alt="" loading="lazy"></button>`
          : `<span class="mo-kare bos" style="grid-row:${r + 1};grid-column:${c + 1}"></span>`;
      })
      .join('')}</div>`;
  }
  function render() {
    if (!root || K.activeRoom !== 'mozaik') return;
    const s = state();
    const lvl = view < 0 ? s.lvl : view;
    const total = GRIDS[lvl].length;
    const start = GRIDS.slice(0, lvl).reduce((x, g) => x + g.length, 0);
    const filled = Math.max(0, Math.min(total, photos.length - start));
    const done = filled >= total;
    K.$('#moSekme', root).innerHTML = LEVELS.map(([n], i) => `<button type="button" class="chip ${i === lvl ? 'on' : ''}" data-mo-l="${i}" ${i > s.lvl ? 'disabled' : ''}>${i > s.lvl ? '🔒 ' : ''}${K.esc(n)}</button>`).join('');
    K.$('#moKalp', root).innerHTML = loaded ? grid(lvl) : '<p class="muted center">Kareler toplanıyor...</p>';
    const her = photos.slice(start, start + filled).filter((p) => p.who === 'her').length;
    K.$('#moDurum', root).innerHTML = `<div class="mo-bar"><span style="width:${((filled / total) * 100).toFixed(1)}%"></span></div>
      <p class="center"><b>${filled}/${total}</b> kare · ${done ? 'Bu kalp tamam! 💗' : `${total - filled} boşluk kaldı`}</p>
      <p class="muted small center">${K.esc(C.herPet)} ${her} kare · ${K.esc(C.myPet)} ${filled - her} kare</p>`;
    const dl = K.$('[data-mo-indir]', root);
    dl.disabled = !filled;
    dl.textContent = done ? '⬇️ Duvar kâğıdı olarak indir' : '⬇️ Şimdiki hâliyle indir';
  }
  async function wallpaper() {
    const s = state();
    const lvl = view < 0 ? s.lvl : view;
    const n = LEVELS[lvl][1], g = GRIDS[lvl];
    const start = GRIDS.slice(0, lvl).reduce((x, gg) => x + gg.length, 0);
    const W = 1179, H = 2556;
    const c = document.createElement('canvas');
    c.width = W;
    c.height = H;
    const x = c.getContext('2d');
    const bg = x.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, '#FFE3EE');
    bg.addColorStop(1, '#F3D9FF');
    x.fillStyle = bg;
    x.fillRect(0, 0, W, H);
    const size = 1000, cell = size / n, ox = (W - size) / 2, oy = 820;
    const imgs = await Promise.all(
      g.map(async (_, i) => {
        const p = photos[start + i];
        if (!p) return null;
        const im = new Image();
        im.src = p.thumb;
        try {
          await im.decode();
          return im;
        } catch (e) {
          return null;
        }
      })
    );
    g.forEach(([r, cc], i) => {
      const px = ox + cc * cell, py = oy + r * cell;
      if (imgs[i]) {
        const s2 = Math.min(imgs[i].width, imgs[i].height);
        x.drawImage(imgs[i], (imgs[i].width - s2) / 2, (imgs[i].height - s2) / 2, s2, s2, px + 2, py + 2, cell - 4, cell - 4);
      } else {
        x.fillStyle = 'rgba(255,255,255,.65)';
        x.fillRect(px + 2, py + 2, cell - 4, cell - 4);
      }
    });
    x.fillStyle = '#4A2138';
    x.textAlign = 'center';
    x.font = '700 64px Fredoka, sans-serif';
    x.fillText(`${C.herPet} & ${C.myPet}`, W / 2, oy + size + 150);
    x.font = '400 40px Nunito, sans-serif';
    x.fillStyle = '#8A5A78';
    x.fillText(`${LEVELS[lvl][0]} · ${Math.min(g.length, photos.length - start)} an · ${T.fmt(T.todayKey())}`, W / 2, oy + size + 215);
    K.download(c.toDataURL('image/jpeg', 0.9), 'kalp-mozaigi.jpg');
    K.stickers.award('mozaikduvar');
  }
  async function add(file) {
    if (!file || !K.medya) return;
    const thumb = await K.medya.thumb(file, 240);
    const r = await K.cloud.add('mozaik', { thumb });
    if (!r) return K.fx.toast('Eklenemedi.');
    K.arsiv.clear();
    await load();
    K.fx.confetti({ count: 40, shapes: ['heart'] });
    const s = state();
    if (s.filled === GRIDS[s.lvl].length || (s.filled === 0 && s.lvl > 0)) {
      K.stickers.award('mozaiktamam');
      K.ping(`💗 Kalp Mozaiği'nde bir kalp tamamlandı`, `${LEVELS[Math.max(0, s.filled ? s.lvl : s.lvl - 1)][0]} doldu. Kalede duvar kâğıdı hazır.`, ['heart'], { click: K.roomUrl('mozaik') });
    }
  }
  async function load() {
    if (!K.arsiv) return;
    photos = await K.arsiv.photos();
    loaded = true;
    render();
  }
  K.room({
    id: 'mozaik',
    wing: 'anilar',
    title: 'Kalp Mozaiği',
    sub: 'Her fotoğraf bir kare',
    icon: 'heart',
    color: '#FFE0EC',
    hidden: () => !K.cloud || !K.cloud.enabled,
    init(el) {
      root = el;
      el.innerHTML = `<div class="room-intro"><p>Kaledeki bütün fotoğraflar zaman sırasıyla bir kalbi dolduruyor: Günün Karesi, kartpostallar, hikâyeler, kabin şeritleri. Kalp dolunca daha büyüğü başlar; tamamlanan kalp telefonun duvar kâğıdı olur.</p></div>
        <div class="mo-sekme" id="moSekme"></div><section class="card mo-kart"><div id="moKalp"></div><div id="moDurum"></div>
        <div class="row center"><label class="btn soft small">📷 Kare ekle<input type="file" accept="image/*" hidden data-mo-ekle></label><button type="button" class="btn red small" data-mo-indir>⬇️ İndir</button></div></section>`;
      el.addEventListener('click', async (e) => {
        const l = e.target.closest('[data-mo-l]');
        if (l) return (view = +l.dataset.moL), render();
        const k = e.target.closest('[data-mo]');
        if (k) {
          const p = photos[+k.dataset.mo];
          if (!p) return;
          const m = K.ui.modal({ label: 'Kare', cls: 'mo-modal', html: `<img class="mo-buyuk" src="${p.thumb}" alt=""><p class="center"><b>${+k.dataset.mo + 1}. kare</b> · ${K.esc(p.label)}<br><small class="muted">${K.esc(nameOf(p.who))} · ${K.esc(T.fmt(p.day))}</small></p>${p.text ? `<p class="center">"${K.esc(p.text)}"</p>` : ''}` });
          if (p.full && K.medya) {
            const url = await K.medya.rowUrl(p.full, 'img');
            url && K.$('.mo-buyuk', m.el) && (K.$('.mo-buyuk', m.el).src = url);
          }
          return;
        }
        const d = e.target.closest('[data-mo-indir]');
        if (d) {
          d.disabled = true;
          await wallpaper();
          d.disabled = false;
        }
      });
      el.addEventListener('change', (e) => {
        const f = e.target.closest('[data-mo-ekle]');
        f && f.files[0] && add(f.files[0]).finally(() => (f.value = ''));
      });
    },
    enter() {
      view = -1;
      render();
      load();
      K.stickers.award('mozaik');
    },
  });
  K.mozaik = { state, LEVELS, size: (i) => GRIDS[i].length };
})();
