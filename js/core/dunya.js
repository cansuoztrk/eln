/* Dünya yardımcıları (Faz 30): Bizim Haritamız'ın dünya verisini (js/harita-veri.js, Natural Earth, kamu malı) başka
   odalar da kullanabilsin diye yükleme, Mercator izdüşümü, ters izdüşüm, iki nokta arası uzaklık ve küçük bir şehir listesi.
   Neredeyiz? ve İki Hayat Çizgisi kullanır. */
(function () {
  'use strict';
  const K = window.K;
  const PI = Math.PI;
  const H = () => window.HARITA;

  function load() {
    if (window.HARITA) return Promise.resolve();
    return new Promise((res, rej) => {
      const s = document.createElement('script');
      s.src = 'js/harita-veri.js';
      s.onload = res;
      s.onerror = rej;
      document.head.appendChild(s);
    });
  }
  const proj = (lat, lng) => [H().W / 2 + (H().k * lng * PI) / 180, H().ty - H().k * Math.log(Math.tan(PI / 4 + (Math.max(-80, Math.min(82, lat)) * PI) / 360))];
  const unproj = (x, y) => [(2 * Math.atan(Math.exp((H().ty - y) / H().k)) - PI / 2) * (180 / PI), ((x - H().W / 2) / H().k) * (180 / PI)];
  function km(a, b) {
    const r = PI / 180, R = 6371;
    const dl = (b[0] - a[0]) * r, dg = (b[1] - a[1]) * r;
    const h = Math.sin(dl / 2) ** 2 + Math.cos(a[0] * r) * Math.cos(b[0] * r) * Math.sin(dg / 2) ** 2;
    return Math.round(2 * R * Math.asin(Math.sqrt(h)));
  }
  // Bir kutuya (lat/lng sınırları) oturan viewBox: [x, y, w, h]
  function kutu(noktalar, pay = 0.25, oran = 1.25) {
    const xy = noktalar.map(([la, ln]) => proj(la, ln));
    let x0 = Math.min(...xy.map((p) => p[0])), x1 = Math.max(...xy.map((p) => p[0]));
    let y0 = Math.min(...xy.map((p) => p[1])), y1 = Math.max(...xy.map((p) => p[1]));
    let w = Math.max(14, x1 - x0), h = Math.max(10, y1 - y0);
    x0 -= w * pay; y0 -= h * pay; w *= 1 + 2 * pay; h *= 1 + 2 * pay;
    if (w / h > oran) (y0 -= (w / oran - h) / 2), (h = w / oran);
    else (x0 -= (h * oran - w) / 2), (w = h * oran);
    return [x0, y0, w, h];
  }
  const SEHIR = [
    ['İstanbul', 41.01, 28.98], ['Bakü', 40.41, 49.87], ['Ankara', 39.93, 32.86], ['İzmir', 38.42, 27.14], ['Bursa', 40.19, 29.06], ['Antalya', 36.9, 30.7],
    ['Trabzon', 41.0, 39.72], ['Erzurum', 39.9, 41.27], ['Kars', 40.6, 43.1], ['Iğdır', 39.92, 44.05], ['Konya', 37.87, 32.48], ['Adana', 37.0, 35.32],
    ['Gaziantep', 37.07, 37.38], ['Diyarbakır', 37.91, 40.23], ['Samsun', 41.29, 36.33], ['Eskişehir', 39.78, 30.52], ['Kocaeli', 40.77, 29.94], ['Edirne', 41.68, 26.56],
    ['Gəncə', 40.68, 46.36], ['Sumqayıt', 40.59, 49.67], ['Şəki', 41.19, 47.17], ['Quba', 41.36, 48.51], ['Lənkəran', 38.75, 48.85], ['Naxçıvan', 39.21, 45.41],
    ['Şamaxı', 40.63, 48.64], ['Mingəçevir', 40.76, 47.06], ['Qəbələ', 40.98, 47.85], ['Tiflis', 41.72, 44.79], ['Batum', 41.64, 41.64], ['Tahran', 35.69, 51.39],
    ['Moskova', 55.76, 37.62], ['Londra', 51.51, -0.13], ['Paris', 48.86, 2.35], ['Roma', 41.9, 12.5], ['Berlin', 52.52, 13.4], ['Viyana', 48.21, 16.37],
    ['Prag', 50.08, 14.44], ['Amsterdam', 52.37, 4.9], ['Barselona', 41.39, 2.17], ['Dubai', 25.2, 55.27], ['Tokyo', 35.68, 139.69], ['New York', 40.71, -74.01],
  ];
  const sehirBul = (ad) => {
    const n = (s) => s.toLocaleLowerCase('tr').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/ı/g, 'i').replace(/ə/g, 'e');
    return SEHIR.find((s) => n(s[0]) === n(ad || '')) || null;
  };
  /* ---------- Dokunmatik harita: sürükle, yakınlaştır, dokun ---------- */
  const BOLGE = {
    dunya: [[70, -170], [-50, 175]],
    avrupa: [[63, -10], [35, 45]],
    kafkas: [[44, 25], [37, 51]],
    istanbul: [[41.25, 28.6], [40.85, 29.35]],
    baku: [[40.6, 49.6], [40.3, 50.1]],
  };
  function harita(el, opt = {}) {
    let vb = kutu(opt.ilk || BOLGE.kafkas, 0.05, opt.oran || 1.25);
    let isaret = opt.isaretler || [], cizgi = opt.cizgiler || [];
    el.classList.add('dn-harita');
    el.innerHTML = `<svg class="dn-svg" viewBox="${vb.join(' ')}" preserveAspectRatio="xMidYMid slice"><rect class="dn-deniz" x="-2000" y="-2000" width="6000" height="6000"/><path class="dn-kara" d="${H().world}"/><path class="dn-sinir" d="${H().br || ''}"/><g class="dn-ust"></g></svg>
      <div class="dn-tuslar"><button type="button" data-dn="+" aria-label="Yakınlaştır">+</button><button type="button" data-dn="-" aria-label="Uzaklaştır">−</button></div>
      <div class="dn-bolge">${[['dunya', 'Dünya'], ['avrupa', 'Avrupa'], ['kafkas', 'Türkiye–Kafkasya'], ['istanbul', 'İstanbul'], ['baku', 'Bakü']].map(([k, a]) => `<button type="button" data-dn-b="${k}">${a}</button>`).join('')}</div>`;
    const svg = el.querySelector('svg');
    const ust = el.querySelector('.dn-ust');
    const olcek = () => vb[2] / 400;
    function boya() {
      svg.setAttribute('viewBox', vb.join(' '));
      const s = olcek();
      el.querySelector('.dn-sinir').setAttribute('stroke-width', 0.6 * s);
      el.querySelector('.dn-kara').setAttribute('stroke-width', 0.6 * s);
      ust.innerHTML = cizgi.map(([a, b, renk]) => {
        const [x1, y1] = proj(a[0], a[1]), [x2, y2] = proj(b[0], b[1]);
        return `<path d="M${x1} ${y1} L${x2} ${y2}" stroke="${renk || '#E3174D'}" stroke-width="${2.6 * s}" stroke-dasharray="${5 * s} ${4 * s}" stroke-linecap="round" fill="none"/>`;
      }).join('') + isaret.map((m) => {
        const [x, y] = proj(m.lat, m.lng);
        return `<g><path transform="translate(${x} ${y}) scale(${s})" d="M0 0 C-7 -9 -9 -13 -9 -17 A9 9 0 0 1 9 -17 C9 -13 7 -9 0 0 Z" fill="${m.renk || '#E3174D'}" stroke="#3A1F2D" stroke-width="2"/>${m.etiket ? `<text x="${x}" y="${y - 30 * s}" font-size="${12 * s}" text-anchor="middle" class="dn-etiket">${String(m.etiket).replace(/[<&]/g, '')}</text>` : ''}</g>`;
      }).join('');
    }
    const ekranAdres = (cx, cy) => {
      const r = svg.getBoundingClientRect();
      const kk = Math.min(vb[2] / r.width, vb[3] / r.height); // "slice": kısa kenar sığar
      const ox = vb[0] + (vb[2] - r.width * kk) / 2, oy = vb[1] + (vb[3] - r.height * kk) / 2;
      return [ox + (cx - r.left) * kk, oy + (cy - r.top) * kk, kk];
    };
    function zoom(f, cx, cy) {
      const [px, py] = cx == null ? [vb[0] + vb[2] / 2, vb[1] + vb[3] / 2] : ekranAdres(cx, cy);
      const w = Math.max(0.4, Math.min(H().W, vb[2] * f)), h = w * (vb[3] / vb[2]);
      vb = [px - (px - vb[0]) * (w / vb[2]), py - (py - vb[1]) * (h / vb[3]), w, h];
      boya();
    }
    let surukle = null, iki = null;
    const parmak = new Map();
    svg.addEventListener('pointerdown', (e) => {
      svg.setPointerCapture(e.pointerId);
      parmak.set(e.pointerId, [e.clientX, e.clientY]);
      if (parmak.size === 2) {
        const [a, b] = [...parmak.values()];
        iki = { d: Math.hypot(a[0] - b[0], a[1] - b[1]) };
        surukle = null;
      } else surukle = { x: e.clientX, y: e.clientY, vb: vb.slice(), oynadi: false };
    });
    svg.addEventListener('pointermove', (e) => {
      if (!parmak.has(e.pointerId)) return;
      parmak.set(e.pointerId, [e.clientX, e.clientY]);
      if (iki && parmak.size === 2) {
        const [a, b] = [...parmak.values()];
        const d = Math.hypot(a[0] - b[0], a[1] - b[1]);
        zoom(iki.d / d, (a[0] + b[0]) / 2, (a[1] + b[1]) / 2);
        iki.d = d;
        return;
      }
      if (!surukle) return;
      const dx = e.clientX - surukle.x, dy = e.clientY - surukle.y;
      if (Math.abs(dx) + Math.abs(dy) > 6) surukle.oynadi = true;
      const kk = ekranAdres(0, 0)[2];
      vb = [surukle.vb[0] - dx * kk, surukle.vb[1] - dy * kk, vb[2], vb[3]];
      boya();
    });
    const birak = (e) => {
      parmak.delete(e.pointerId);
      if (parmak.size < 2) iki = null;
      if (surukle && !surukle.oynadi && e.type === 'pointerup' && opt.onTap) {
        const [x, y] = ekranAdres(e.clientX, e.clientY);
        const [la, ln] = unproj(x, y);
        opt.onTap(la, ln);
      }
      surukle = null;
    };
    svg.addEventListener('pointerup', birak);
    svg.addEventListener('pointercancel', birak);
    svg.addEventListener('wheel', (e) => (e.preventDefault(), zoom(e.deltaY > 0 ? 1.2 : 0.83, e.clientX, e.clientY)), { passive: false });
    el.addEventListener('click', (e) => {
      const b = e.target.closest('[data-dn]');
      if (b) return zoom(b.dataset.dn === '+' ? 0.6 : 1.6);
      const g = e.target.closest('[data-dn-b]');
      if (g) (vb = kutu(BOLGE[g.dataset.dnB], 0.05, opt.oran || 1.25)), boya();
    });
    boya();
    return {
      guncelle(i, c) {
        isaret = i || isaret;
        cizgi = c || cizgi;
        boya();
      },
      odakla(noktalar, pay) {
        vb = kutu(noktalar, pay == null ? 0.3 : pay, opt.oran || 1.25);
        boya();
      },
    };
  }
  K.dunya = { load, proj, unproj, km, kutu, SEHIR, sehirBul, veri: H, harita, BOLGE };
})();
