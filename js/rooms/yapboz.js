/* Oda: Ortak Yapboz — bir fotoğrafımız yapboz olur. Parçaların yarısı senin tepsinde, yarısı onunkinde; tahta ortak.
   Bir parçaya dokunup tahtadaki yerine dokununca oturur (yanlış yere oturmaz, sallanır). Öbürünün yerleştirdiği parça
   senin tahtanda da anında belirir. Hepsi yerine oturunca fotoğraf bütünleşir.
   Kayıtlar: yapboz {img, n} (son kayıt geçerli yapbozdur) · yapbozp {ref, p} (p numaralı parça yerine oturdu) */
(function () {
  'use strict';
  const K = window.K;
  const D = window.ELN;
  const C = D.config;

  const mine = () => (K.isOwner() ? 'me' : 'her');
  const nameOf = (w) => (w === 'me' ? C.myPet : C.herPet);
  let oyunlar = [], hamleler = [], root = null, secili = null;
  const aktif = () => oyunlar.slice().sort((a, b) => b.at - a.at)[0];
  const yerlesen = (o) => new Map(hamleler.filter((h) => h.data.ref === o.id).map((h) => [h.data.p, h.who]));
  // Parça dağıtımı: karışık sıra, çiftler kale sahibinde, tekler onda
  const sira = (o) => {
    const n = o.data.n * o.data.n, r = K.rng(K.hash(o.id));
    const a = Array.from({ length: n }, (_, i) => i);
    for (let i = n - 1; i > 0; i--) {
      const j = Math.floor(r() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };
  const benimMi = (o, p) => sira(o).indexOf(p) % 2 === (mine() === 'me' ? 0 : 1);
  const parca = (o, p, cls = '') => {
    const n = o.data.n, x = p % n, y = Math.floor(p / n);
    return `<span class="yb-p ${cls}" style="background-image:url('${o.data.img}');background-size:${n * 100}% ${n * 100}%;background-position:${(x / (n - 1)) * 100}% ${(y / (n - 1)) * 100}%"></span>`;
  };
  function render() {
    if (!root || K.activeRoom !== 'yapboz') return;
    const o = aktif();
    if (!o) {
      K.$('#ybTahta', root).innerHTML = '<p class="muted center">Henüz yapboz yok. Aşağıdan bir fotoğraf seç.</p>';
      K.$('#ybTepsi', root).innerHTML = '';
      return;
    }
    const n = o.data.n, y = yerlesen(o);
    const bitti = y.size === n * n;
    K.$('#ybUst', root).innerHTML = bitti ? '<b>Tamamlandı!</b>' : `<b>${y.size}</b> / ${n * n} parça · ${K.esc(nameOf(o.who))} başlattı`;
    K.$('#ybTahta', root).innerHTML = `<div class="yb-tahta ${bitti ? 'bitti' : ''}" style="--n:${n}">${Array.from({ length: n * n }, (_, p) => `<button type="button" class="yb-yuva" data-yb-yuva="${p}" aria-label="Yuva ${p + 1}">${y.has(p) ? parca(o, p, y.get(p) === mine() ? 'ben' : 'o') : ''}</button>`).join('')}</div>`;
    const tepsi = sira(o).filter((p) => benimMi(o, p) && !y.has(p));
    K.$('#ybTepsi', root).innerHTML = bitti ? '' : `<p class="card-eyebrow">Senin tepsin · ${tepsi.length} parça</p><div class="yb-tepsi" style="--n:${n}">${tepsi.map((p) => `<button type="button" class="yb-tp ${secili === p ? 'on' : ''}" data-yb-p="${p}">${parca(o, p)}</button>`).join('')}</div>${tepsi.length ? '' : `<p class="muted small">Senin parçaların bitti; ${K.esc(nameOf(o.who === mine() ? (mine() === 'me' ? 'her' : 'me') : o.who))} kalanları yerleştirecek.</p>`}`;
  }
  async function baslat(src, n) {
    const img = await K.medya.image(src, 540, 0.82, true);
    const r = await K.cloud.add('yapboz', { img, n });
    if (!r) return;
    oyunlar.some((x) => x.id === r.id) || oyunlar.push(r);
    secili = null;
    K.ping(`🧩 ${K.meName()} yeni bir ortak yapboz başlattı`, 'Parçaların yarısı sende.', ['jigsaw'], { click: K.roomUrl('yapboz') });
    render();
  }
  async function sec() {
    const ph = K.arsiv ? (await K.arsiv.photos()).slice(-18).reverse() : [];
    const m = K.ui.modal({
      label: 'Yapboz için fotoğraf',
      cls: 'yb-modal',
      html: `<h3>Hangi fotoğraf yapboz olsun?</h3><div class="seg-row"><label><input type="radio" name="ybN" value="3" checked> 9 parça</label><label><input type="radio" name="ybN" value="4"> 16 parça</label><label><input type="radio" name="ybN" value="5"> 25 parça</label></div>
        <div class="yb-sec">${ph.map((p, i) => `<button type="button" data-yb-ar="${i}"><img src="${p.thumb}" alt=""></button>`).join('')}</div><label class="btn soft">📷 Başka fotoğraf<input type="file" accept="image/*" hidden data-yb-dosya></label>`,
    });
    const n = () => +(K.$('input[name="ybN"]:checked', m.el) || { value: 3 }).value;
    m.el.addEventListener('click', (e) => {
      const b = e.target.closest('[data-yb-ar]');
      if (b) m.close(), baslat(ph[+b.dataset.ybAr].thumb, n());
    });
    m.el.addEventListener('change', (e) => {
      const f = e.target.closest('[data-yb-dosya]');
      if (f && f.files[0]) m.close(), baslat(f.files[0], n());
    });
  }
  K.on('cloud', async (ok) => {
    if (!ok) return;
    [oyunlar, hamleler] = await Promise.all([K.cloud.list('yapboz', 20), K.cloud.list('yapbozp', 600)]);
    K.cloud.on('yapboz', (r) => oyunlar.some((x) => x.id === r.id) || (oyunlar.push(r), (secili = null), render()));
    K.cloud.on('yapbozp', (r) => {
      if (hamleler.some((x) => x.id === r.id)) return;
      hamleler.push(r);
      render();
      const o = aktif();
      if (o && r.data.ref === o.id && yerlesen(o).size === o.data.n * o.data.n) K.fx.confetti({ count: 160, shapes: ['heart', 'star'] });
    });
  });
  K.room({
    id: 'yapboz',
    wing: 'oyun',
    title: 'Ortak Yapboz',
    sub: 'Yarısı sende, yarısı onda',
    icon: 'cards',
    color: '#E9F6FF',
    hidden: () => !K.cloud || !K.cloud.enabled,
    init(el) {
      root = el;
      el.innerHTML = `<div class="room-intro"><p>Bir fotoğrafımız yapboz oluyor. Parçaların yarısı senin tepsinde, yarısı onunkinde; aynı tahtada birleştiriyoruz.</p></div>
        <p class="yb-ust center" id="ybUst"></p><div id="ybTahta"></div><section class="card" id="ybTepsi"></section><div class="row center"><button type="button" class="btn soft" data-yb-yeni>🧩 Yeni yapboz</button></div>`;
      el.addEventListener('click', async (e) => {
        if (e.target.closest('[data-yb-yeni]')) return sec();
        const p = e.target.closest('[data-yb-p]');
        if (p) return (secili = secili === +p.dataset.ybP ? null : +p.dataset.ybP), render();
        const y = e.target.closest('[data-yb-yuva]');
        if (!y || secili == null) return;
        const o = aktif();
        if (+y.dataset.ybYuva !== secili) {
          y.classList.remove('yanlis');
          void y.offsetWidth;
          y.classList.add('yanlis');
          K.vibrate && K.vibrate(40);
          return;
        }
        const r = await K.cloud.add('yapbozp', { ref: o.id, p: secili });
        if (!r) return;
        hamleler.some((x) => x.id === r.id) || hamleler.push(r);
        secili = null;
        K.audio.sfx && K.audio.sfx.pop && K.audio.sfx.pop();
        if (yerlesen(o).size === o.data.n * o.data.n) {
          K.fx.confetti({ count: 160, shapes: ['heart', 'star'] });
          K.stickers.award('yapboz');
          K.ping('🧩 Ortak yapboz tamamlandı', 'Fotoğraf bütünleşti.', ['jigsaw'], { click: K.roomUrl('yapboz') });
        }
        render();
      });
    },
    enter() {
      render();
    },
  });
})();
