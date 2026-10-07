/* Günün Rengi ve Uyku Işığı (Kale 4.0).
   Günün Rengi: kale her sabah rengini o günden alır. Sıra: bugünün Günün Karesi fotoğrafının baskın tonu → Kalbin
   Hava Durumu'nda bugün seçilen hava → gerçek hava (kendi şehrin) → tarihten gelen bir pastel. Fiyonk kırmızısı hep
   kalır; değişen yalnızca kahramanın gökyüzü, sekme çubuğunun vurgusu ve küçük süsler (--k4-gun, --k4-gun-2).
   Uyku Işığı: gece 00:00–06:00 arası (bu telefonun saatiyle) kale siyaha ve göz yormayan kırmızı ışığa geçer. */
(function () {
  'use strict';
  const K = window.K;
  const T = K.time;

  const PASTEL = {
    pembe: ['#FFB3CC', '#FFE3EC', 'Gül pembesi'],
    tereyag: ['#FFE27A', '#FFF5CC', 'Tereyağı'],
    gok: ['#9FD8FF', '#E1F3FF', 'Gök mavisi'],
    nane: ['#9FE5C4', '#E0F8EC', 'Nane'],
    lila: ['#CDBBFF', '#EFE9FF', 'Leylak'],
    seftali: ['#FFC6A6', '#FFEDE2', 'Şeftali'],
  };
  const HAVA = { gunes: 'tereyag', parcali: 'seftali', bulut: 'gok', yagmur: 'lila', firtina: 'lila', sis: 'nane', kar: 'gok', gokkusagi: 'pembe' };
  const ayar = () => (K.atolye ? K.atolye.get() : {});
  let secim = null;

  function hsl(hex) {
    const n = parseInt(hex.slice(1), 16), r = (n >> 16) / 255, g = ((n >> 8) & 255) / 255, b = (n & 255) / 255;
    const mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn;
    let h = 0;
    if (d) h = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
    return (h * 60 + 360) % 360;
  }
  // En yakın pastel: tona göre
  function yakin(h) {
    let best = 'pembe', bd = 999;
    Object.entries(PASTEL).forEach(([k, v]) => {
      const d = Math.min(Math.abs(hsl(v[0]) - h), 360 - Math.abs(hsl(v[0]) - h));
      if (d < bd) (bd = d), (best = k);
    });
    return best;
  }
  // Bir fotoğrafın baskın tonu (doygun piksellerin ağırlıklı ortalaması)
  function ton(src) {
    return new Promise((res) => {
      const img = new Image();
      img.onload = () => {
        try {
          const c = document.createElement('canvas');
          c.width = c.height = 40;
          const g = c.getContext('2d');
          g.drawImage(img, 0, 0, 40, 40);
          const d = g.getImageData(0, 0, 40, 40).data;
          let x = 0, y = 0, w = 0;
          for (let i = 0; i < d.length; i += 4) {
            const r = d[i] / 255, gg = d[i + 1] / 255, b = d[i + 2] / 255;
            const mx = Math.max(r, gg, b), mn = Math.min(r, gg, b), s = mx - mn;
            if (s < 0.15 || mx < 0.2) continue;
            let h = 0;
            h = mx === r ? ((gg - b) / s) % 6 : mx === gg ? (b - r) / s + 2 : (r - gg) / s + 4;
            const a = ((h * 60 + 360) % 360) * (Math.PI / 180);
            x += Math.cos(a) * s;
            y += Math.sin(a) * s;
            w += s;
          }
          res(w > 2 ? ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360 : null);
        } catch (e) {
          res(null);
        }
      };
      img.onerror = () => res(null);
      img.src = src;
    });
  }
  async function hesapla() {
    const gun = T.todayKey();
    if (K.cloud && K.cloud.enabled) {
      const kare = (await K.cloud.list('kare', 6)).filter((r) => r.data.day === gun && r.data.thumb).sort((a, b) => b.at - a.at)[0];
      if (kare) {
        const h = await ton(kare.data.thumb);
        if (h != null) return { k: yakin(h), neden: 'Günün Karesi\'nden' };
      }
      const hv = (await K.cloud.list('hava', 20)).filter((r) => r.data.day === gun && r.who === (K.isOwner() ? 'me' : 'her')).sort((a, b) => b.at - a.at)[0];
      if (hv && HAVA[hv.data.type]) return { k: HAVA[hv.data.type], neden: 'Kalbinin havasından' };
    }
    const w = K.gercekhava && K.gercekhava.now && K.gercekhava.now();
    const c = w && (K.isOwner() ? w.ist : w.baku);
    if (c && c.code != null) {
      const k = c.code <= 1 ? 'tereyag' : c.code <= 3 ? 'seftali' : c.code < 50 ? 'nane' : c.code < 70 || (c.code >= 80 && c.code < 90) ? 'lila' : c.code < 80 ? 'gok' : 'lila';
      return { k, neden: 'Bugünün havasından' };
    }
    const keys = Object.keys(PASTEL);
    return { k: keys[K.hash(gun) % keys.length], neden: 'Takvimden' };
  }
  async function uygula() {
    const b = document.body;
    if (!b || !b.classList.contains('k4') || ayar().gunrengi === false) {
      b && b.style.removeProperty('--k4-gun');
      b && b.style.removeProperty('--k4-gun-2');
      return;
    }
    secim = await hesapla();
    const p = PASTEL[secim.k];
    b.style.setProperty('--k4-gun', p[0]);
    b.style.setProperty('--k4-gun-2', p[1]);
    const chip = K.$('#k4GunRengi');
    if (chip) {
      chip.style.background = p[0];
      chip.setAttribute('aria-label', `Günün rengi: ${p[2]}`);
    }
  }

  /* ---------- Uyku Işığı ---------- */
  function uyku() {
    const b = document.body;
    if (!b) return;
    const h = new Date().getHours();
    const acik = b.classList.contains('k4') && ayar().uykuisigi !== false && h >= 0 && h < 6;
    if (acik !== b.classList.contains('uyku-isigi')) {
      b.classList.toggle('uyku-isigi', acik);
      acik && K.fx && K.fx.toast('🌙 Uyku ışığı açıldı: kale göz yormayan kırmızıya geçti. Tema Atölyesi\'nden kapatabilirsin.', { duration: 3500, log: false });
    }
  }

  K.on('built', () => {
    // Saat hapının sonunda küçük bir renk noktası; dokununca neden o renk olduğu söylenir
    const saat = K.$('.hero-clock');
    if (saat && !K.$('#k4GunRengi')) saat.insertAdjacentHTML('beforeend', '<button type="button" class="k4-gun-nokta" id="k4GunRengi" aria-label="Günün rengi"></button>');
    uygula();
    uyku();
  });
  K.on('cloud', (ok) => ok && setTimeout(uygula, 2500));
  document.addEventListener('click', (e) => {
    if (!e.target.closest('#k4GunRengi') || !secim) return;
    const p = PASTEL[secim.k];
    K.fx.toast(`<b>Günün rengi: ${p[2]}</b> · ${secim.neden}. Kale her gün rengini o günden alır.`, { duration: 4200 });
  });
  const etiket = () => secim && `${PASTEL[secim.k][2]} · ${secim.neden}`;
  K.on('atolyeTg', ({ k }) => (k === 'gunrengi' ? uygula() : k === 'uykuisigi' ? uyku() : null));
  setInterval(uyku, 60000);
  K.gunrengi = { uygula, hesapla, secim: () => secim, etiket, PASTEL, uyku };
})();
