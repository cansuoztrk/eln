/* Oda: Canlı Pencereler — Boğaz ve Bakü Bulvarı'nın canlı kamera yayınları yan yana. Gün batımında kendiliğinden açılır:
   iki şehirden biri güneşi batırırken ana salonda "pencereler açıldı" kartı çıkar, aynı anda iki şehrin denizine bakarsınız.
   Canlı yayın adresleri zamanla değiştiği için yayınlar ayarlanabilir: YouTube'daki canlı yayının bağlantısını yapıştır.
   Kayıt: pencere {ist, baku} (YouTube bağlantıları; en son geçerli) */
(function () {
  'use strict';
  const K = window.K;
  const A = K.art;
  const D = window.ELN;
  const C = D.config;
  const T = K.time;

  const ARA = {
    ist: 'https://www.youtube.com/results?search_query=istanbul+bosphorus+live+cam&sp=EgJAAQ%253D%253D',
    baku: 'https://www.youtube.com/results?search_query=baku+boulevard+live+cam&sp=EgJAAQ%253D%253D',
  };
  let ayar = { ist: '', baku: '' }, root = null;
  const ytId = (u) => {
    const m = String(u || '').match(/(?:youtu\.be\/|v=|live\/|embed\/)([\w-]{11})/);
    return m ? m[1] : '';
  };
  const gunbatimi = () => {
    if (!K.gunbatimi) return null;
    const k = T.todayKey(), n = Date.now();
    const b = K.gunbatimi.sunset(k, 'baku'), i = K.gunbatimi.sunset(k, 'ist');
    if (Math.abs(n - b) < 25 * 6e4) return 'baku';
    if (Math.abs(n - i) < 25 * 6e4) return 'ist';
    return null;
  };
  function pencere(sehir, ad) {
    const id = ytId(ayar[sehir]);
    return `<figure class="pn-pencere ${sehir}"><div class="pn-cerceve">${id
      ? `<iframe src="https://www.youtube-nocookie.com/embed/${id}?autoplay=1&mute=1&playsinline=1&controls=0&modestbranding=1" allow="autoplay; encrypted-media; picture-in-picture" title="${K.esc(ad)} canlı"></iframe>`
      : `<div class="pn-bos"><p>${K.esc(ad)} penceresi henüz kurulmadı.</p><a class="btn ghost small" href="${ARA[sehir]}" target="_blank" rel="noopener">YouTube'da canlı yayın bul ›</a></div>`}</div>
      <figcaption><b>${K.esc(ad)}</b><span class="pn-canli">● CANLI</span><span class="tnum">${sehir === 'ist' ? T.istTime() : T.bakuTime()}</span></figcaption></figure>`;
  }
  function ciz() {
    if (!root || K.activeRoom !== 'pencereler') return;
    const gb = gunbatimi();
    K.$('#pnIcerik', root).innerHTML = `${gb ? `<p class="pn-not">🌅 Şu an ${gb === 'baku' ? C.herCity : C.myCity}'da güneş batıyor.</p>` : ''}
      <div class="pn-ikili">${pencere('ist', 'Boğaz · ' + C.myCity)}${pencere('baku', 'Bulvar · ' + C.herCity)}</div>
      <details class="card pn-ayar"><summary>Pencereleri ayarla</summary><p class="muted small">YouTube'da bir canlı kamera yayını aç, bağlantısını kopyala ve buraya yapıştır. Kaydettiğin pencere ikinizde de görünür.</p>
        <label>${K.esc(C.myCity)}<input class="input" id="pnIst" value="${K.esc(ayar.ist)}" placeholder="https://www.youtube.com/watch?v=..."></label>
        <label>${K.esc(C.herCity)}<input class="input" id="pnBaku" value="${K.esc(ayar.baku)}" placeholder="https://www.youtube.com/watch?v=..."></label>
        <button class="btn small" type="button" data-pn="kaydet">Kaydet</button></details>`;
  }
  async function yukle() {
    const l = await K.cloud.list('pencere', 20);
    const r = l.sort((a, b) => b.at - a.at)[0];
    if (r) ayar = { ist: r.data.ist || '', baku: r.data.baku || '' };
  }
  K.room({
    id: 'pencereler',
    wing: 'kalp',
    title: 'Canlı Pencereler',
    sub: 'Boğaz ve Bulvar, şu an, yan yana',
    icon: 'window',
    color: '#E1F3FF',
    hidden: () => !K.cloud || !K.cloud.enabled,
    init(el) {
      root = el;
      el.innerHTML = `<div class="room-intro"><p>İki şehrin denizi, canlı, yan yana. Gün batımında kendiliğinden açılır: biri güneşi batırırken öbürü aynı anda izler.</p></div><div id="pnIcerik"></div>`;
      el.addEventListener('click', async (e) => {
        if (!e.target.closest('[data-pn="kaydet"]')) return;
        const yeni = { ist: K.$('#pnIst', root).value.trim(), baku: K.$('#pnBaku', root).value.trim() };
        if ((yeni.ist && !ytId(yeni.ist)) || (yeni.baku && !ytId(yeni.baku))) return K.fx.toast('Bu bir YouTube bağlantısına benzemiyor.');
        await K.cloud.add('pencere', yeni);
        ayar = yeni;
        K.fx.toast('Pencereler kuruldu 🪟');
        ciz();
      });
    },
    async enter() {
      await yukle();
      ciz();
      K.stickers.award('pencereler');
    },
    leave() {
      const b = root && K.$('#pnIcerik', root);
      b && (b.innerHTML = '');
    },
  });
  K.on('cloud', (ok) => ok && yukle());
  K.specialHooks = (K.specialHooks || []).concat(() => {
    const gb = gunbatimi();
    if (!gb || !K.cloud || !K.cloud.enabled) return [];
    return [{ key: 'pencereler', icon: 'window', title: `🌅 ${gb === 'baku' ? C.herCity : C.myCity}'da güneş batıyor`, text: 'Canlı pencereler açıldı: aynı anda iki şehrin denizine bakın.', room: 'pencereler', cta: 'Pencereleri aç' }];
  });
})();
