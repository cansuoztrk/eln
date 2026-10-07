/* Bir Yıl Önce Bugün — kalenin arşivinde tam bir yıl (ya da iki, üç...) önceki bugüne ait bir şey varsa ana salonda
   her sabah küçük bir kart çıkar: o gün hangi kare paylaşıldı, kim kime ne yazdı. İlk yıl dolana kadar aynı kart
   "Bir ay önce bugün" olarak küçük hâliyle çıkar. Kart açılınca o günün fotoğrafları ve notları bir sayfada durur. */
(function () {
  'use strict';
  const K = window.K;
  const D = window.ELN;
  const C = D.config;
  const T = K.time;

  const nameOf = (w) => (w === 'me' ? C.myPet : C.herPet);
  let bulunan = null; // {kac, birim, day, photos, notes}
  // Bugünden n yıl/ay önceki günün anahtarı (29 Şubat gibi olmayan günler o ayın son gününe kayar)
  function once(n, birim) {
    const [y, m, d] = T.todayKey().split('-').map(Number);
    let yy = y, mm = m;
    if (birim === 'yil') yy -= n;
    else {
      mm -= n;
      while (mm < 1) (mm += 12), yy--;
    }
    const son = new Date(Date.UTC(yy, mm, 0)).getUTCDate();
    return `${yy}-${K.pad(mm)}-${K.pad(Math.min(d, son))}`;
  }
  async function bul() {
    if (!K.arsiv || !K.cloud || !K.cloud.enabled) return null;
    const [p, n] = await Promise.all([K.arsiv.photos(), K.arsiv.notes()]);
    const ilk = Math.min(...[...p, ...n].map((x) => x.at), Date.now());
    const adaylar = [];
    for (let k = 1; k <= 10; k++) adaylar.push([k, 'yil']);
    adaylar.push([1, 'ay']);
    for (const [kac, birim] of adaylar) {
      const day = once(kac, birim);
      if (T.at(day).getTime() + 864e5 < ilk) continue;
      const photos = p.filter((x) => x.day === day), notes = n.filter((x) => x.day === day);
      if (photos.length || notes.length) return { kac, birim, day, photos, notes };
    }
    return null;
  }
  const baslik = (b) => (b.birim === 'yil' ? `${b.kac === 1 ? 'Bir' : b.kac} yıl önce bugün` : 'Bir ay önce bugün');
  function ac(b = bulunan) {
    if (!b) return;
    K.store.set('gecmisGun', T.todayKey());
    const m = K.ui.modal({
      label: baslik(b),
      cls: 'gb-modal',
      html: `<p class="card-eyebrow">${K.esc(T.fmt(b.day, true))}</p><h3>${K.esc(baslik(b))}</h3>
        ${b.photos.length ? `<div class="gb-foto">${b.photos.map((x) => `<figure><img src="${x.thumb}" alt=""><figcaption>${K.esc(x.label)} · ${K.esc(nameOf(x.who))}${x.text ? `<br>${K.esc(x.text.slice(0, 80))}` : ''}</figcaption></figure>`).join('')}</div>` : ''}
        ${b.notes.length ? `<ul class="gb-not">${b.notes.map((x) => `<li><b>${K.esc(nameOf(x.who))}</b> <small>${K.esc(x.label)}</small><p>${K.esc(x.text.slice(0, 240))}</p></li>`).join('')}</ul>` : ''}
        ${b.birim === 'yil' ? '<p class="muted small center">Bir yıl geçti ve hâlâ buradayız.</p>' : ''}`,
    });
    b.photos.forEach((x, i) => x.full && K.medya.rowUrl(x.full, 'img').then((u) => u && K.$$('.gb-foto img', m.el)[i] && (K.$$('.gb-foto img', m.el)[i].src = u)));
    K.stickers.award(b.birim === 'yil' ? 'biryilonce' : 'biraylonce');
  }
  K.on('cloud', async (ok) => {
    if (!ok) return;
    setTimeout(async () => {
      bulunan = await bul();
      bulunan && K.renderSpecials && K.renderSpecials();
    }, 2500);
  });
  K.specialHooks = (K.specialHooks || []).concat(() => {
    const b = bulunan;
    if (!b || K.store.get('gecmisGun') === T.todayKey()) return [];
    const ne = [b.photos.length && `${b.photos.length} fotoğraf`, b.notes.length && `${b.notes.length} not`].filter(Boolean).join(' ve ');
    return [{ key: 'gecmisbugun', icon: 'hourglass', title: `⏳ ${baslik(b)}`, text: `${T.fmt(b.day)} günü kalede ${ne} kalmış.`, run: () => ac(b), cta: 'Bak', mini: b.birim !== 'yil' }];
  });
  K.gecmisbugun = { bul, ac, once };
})();
