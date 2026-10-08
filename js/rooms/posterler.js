/* Oda: Poster Seti — kalenin altı posteri baskıya hazır (A3 oranında, SVG ve yüksek çözünürlüklü PNG):
   tanıştığımız gecenin gökyüzü (İstanbul ve Bakü, 6 Aralık 2025 21:00), rota, kalp mozaiği (kalenin fotoğraflarından),
   iki kule, iki şehir ve birlikte ilk on yılın ömür takvimi. Hepsi tarayıcıda çizilir; dışarıdan resim gelmez.
   Yeni kayıt tutmaz; okunanlar: arşivdeki fotoğraflar. */
(function () {
  'use strict';
  const K = window.K;
  const A = K.art;
  const D = window.ELN;
  const C = D.config;
  const T = K.time;

  const W = 1188, H = 1680;
  const FONT = "Fredoka, 'Arial Rounded MT Bold', 'Helvetica Neue', Arial, sans-serif";
  const IST = [41.01, 28.98], BAK = [40.41, 49.87];
  const RAD = Math.PI / 180;
  let root = null, foto = [];

  const baslik = (y, ust, ana, alt, renk = '#3A1F2D') => `<text x="${W / 2}" y="${y}" text-anchor="middle" font-family="${FONT}" font-size="30" letter-spacing="8" fill="${renk}" opacity=".7">${K.esc(ust)}</text>
    <text x="${W / 2}" y="${y + 92}" text-anchor="middle" font-family="${FONT}" font-size="86" font-weight="700" fill="${renk}">${K.esc(ana)}</text>
    ${alt ? `<text x="${W / 2}" y="${y + 150}" text-anchor="middle" font-family="${FONT}" font-size="32" fill="${renk}" opacity=".75">${K.esc(alt)}</text>` : ''}`;
  const kalp = (x, y, k, renk = '#E3174D') => `<path transform="translate(${x} ${y}) scale(${k})" d="M0 7 C-11 -1 -11 -12 -4.5 -12 C-1.5 -12 0 -9.5 0 -8 C0 -9.5 1.5 -12 4.5 -12 C11 -12 11 -1 0 7 Z" fill="${renk}"/>`;
  const sar = (ic, bg) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}"><rect width="${W}" height="${H}" fill="${bg}"/>${ic}</svg>`;

  /* ---------- 1 · Tanıştığımız gecenin gökyüzü ---------- */
  function gokyuzu(cx, cy, r, [lat, lng], ad) {
    const t = Date.UTC(2025, 11, 6, 18, 0); // 21:00 İstanbul, 22:00 Bakü
    const jd = t / 864e5 + 2440587.5;
    const lst = (((280.46061837 + 360.98564736629 * (jd - 2451545) + lng) % 360) + 360) % 360;
    const st = (K.yildizlar ? K.yildizlar.STARS : []).map(([n, ra, dec, mag, renk]) => {
      const p = K.yildizlar.altAz(ra * 15, dec, lst, lat);
      if (p.alt < 0) return '';
      const rr = (r * Math.tan(((90 - p.alt) * RAD) / 2)) / Math.tan((90 * RAD) / 2);
      const x = cx + rr * Math.sin(p.az * RAD), y = cy - rr * Math.cos(p.az * RAD);
      return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${Math.max(1.6, 6.5 - mag * 1.6).toFixed(1)}" fill="${renk || '#FFFFFF'}"/>`;
    }).join('');
    const rng = K.rng(K.hash(ad));
    const toz = Array.from({ length: 260 }, () => {
      const a = rng() * Math.PI * 2, d = Math.sqrt(rng()) * r;
      return `<circle cx="${(cx + Math.cos(a) * d).toFixed(1)}" cy="${(cy + Math.sin(a) * d).toFixed(1)}" r="${(0.6 + rng() * 1.1).toFixed(1)}" fill="#fff" opacity="${(0.25 + rng() * 0.5).toFixed(2)}"/>`;
    }).join('');
    return `<circle cx="${cx}" cy="${cy}" r="${r + 10}" fill="none" stroke="#F6D7A8" stroke-width="3"/><circle cx="${cx}" cy="${cy}" r="${r}" fill="#211A55"/>${toz}${st}
      ${[['K', 0], ['D', 90], ['G', 180], ['B', 270]].map(([h, a]) => `<text x="${cx + (r + 34) * Math.sin(a * RAD)}" y="${cy - (r + 34) * Math.cos(a * RAD) + 10}" text-anchor="middle" font-family="${FONT}" font-size="26" fill="#F6D7A8">${h}</text>`).join('')}
      <text x="${cx}" y="${cy + r + 90}" text-anchor="middle" font-family="${FONT}" font-size="40" font-weight="600" fill="#FFF0F5">${K.esc(ad)}</text>
      <text x="${cx}" y="${cy + r + 132}" text-anchor="middle" font-family="${FONT}" font-size="22" fill="#F6D7A8">${Math.abs(lat).toFixed(2)}° K · ${Math.abs(lng).toFixed(2)}° D</text>`;
  }
  const P = {
    gok: { ad: 'Tanıştığımız gece', alt: 'İki şehrin gökyüzü', ciz: () => sar(`${baslik(170, '6 ARALIK 2025 · 21:00', 'Aynı gece, iki gökyüzü', 'Bir mesajla başlayan masalın ilk yıldızları', '#FFF0F5')}${gokyuzu(320, 820, 230, IST, C.myCity)}${gokyuzu(868, 820, 230, BAK, C.herCity)}${kalp(594, 820, 2.4)}<text x="${W / 2}" y="1500" text-anchor="middle" font-family="${FONT}" font-size="28" fill="#F6D7A8">${K.esc(C.myPet)} ♡ ${K.esc(C.herPet)}</text>`, '#14113A') },
    rota: {
      ad: 'Rota',
      alt: `${C.myCity} — ${C.herCity}`,
      ciz: () => {
        if (!window.HARITA) return sar(baslik(300, 'ROTA', 'Harita yükleniyor…'), '#FFF0F5');
        const [x0, y0, w, h] = K.dunya.kutu([IST, BAK], 0.35, W / 1000);
        const s = W / w;
        const [ax, ay] = K.dunya.proj(...IST), [bx, by] = K.dunya.proj(...BAK);
        const mx = (ax + bx) / 2, my = Math.min(ay, by) - 9;
        const km = K.dunya.km(IST, BAK);
        return sar(`${baslik(160, 'İKİ KIYI ARASINDA', `${K.num(km)} km`, `${C.myCity}'dan ${C.herCity}'ya, kuş uçuşu`)}
          <g transform="translate(0 360) scale(${s}) translate(${-x0} ${-y0})"><rect x="${x0}" y="${y0}" width="${w}" height="${h}" fill="#DDF0FF"/><path d="${window.HARITA.world}" fill="#FFF7EC" stroke="#C9B4A6" stroke-width="${1.2 / s}"/><path d="${window.HARITA.br || ''}" fill="none" stroke="#E0CFC4" stroke-width="${0.9 / s}"/>
            <path d="M${ax} ${ay} Q${mx} ${my} ${bx} ${by}" fill="none" stroke="#E3174D" stroke-width="${6 / s}" stroke-dasharray="${14 / s} ${10 / s}" stroke-linecap="round"/>
            <circle cx="${ax}" cy="${ay}" r="${14 / s}" fill="#5AA9E6" stroke="#3A1F2D" stroke-width="${4 / s}"/><circle cx="${bx}" cy="${by}" r="${14 / s}" fill="#FF6FA3" stroke="#3A1F2D" stroke-width="${4 / s}"/></g>
          <rect x="0" y="${360 + h * s}" width="${W}" height="${H}" fill="#FFF0F5"/>
          <text x="${W / 2}" y="1480" text-anchor="middle" font-family="${FONT}" font-size="34" fill="#3A1F2D">${K.esc(C.myCity)} · ${IST[0]}° K ${IST[1]}° D   ♡   ${K.esc(C.herCity)} · ${BAK[0]}° K ${BAK[1]}° D</text>`, '#FFF0F5');
      },
    },
    mozaik: {
      ad: 'Kalp mozaiği',
      alt: 'Kalenin fotoğraflarından',
      ciz: () => {
        const N = 22, hucre = 46, ox = (W - N * hucre) / 2, oy = 380;
        const kare = [];
        for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
          const x = ((i + 0.5) / N) * 2.6 - 1.3, y = 1.25 - ((j + 0.5) / N) * 2.5;
          if ((x * x + y * y - 1) ** 3 - x * x * y ** 3 <= 0) kare.push([i, j]);
        }
        const l = foto.length ? foto : [];
        const pembe = ['#FFB3CC', '#FF8FB8', '#FFD1E1', '#E3174D', '#FFC6A6'];
        const ic = kare.map(([i, j], n) => {
          const x = ox + i * hucre, y = oy + j * hucre;
          const p = l.length ? l[(n * 7) % l.length] : null;
          return p ? `<image href="${p.thumb}" x="${x + 1}" y="${y + 1}" width="${hucre - 2}" height="${hucre - 2}" preserveAspectRatio="xMidYMid slice"/>` : `<rect x="${x + 1}" y="${y + 1}" width="${hucre - 2}" height="${hucre - 2}" rx="6" fill="${pembe[(i * 3 + j) % pembe.length]}"/>`;
        }).join('');
        return sar(`${baslik(170, 'KALP MOZAİĞİ', `${K.num(l.length || kare.length)} an`, `Tanıştığımızdan beri ${K.num(T.daysSince(C.metDate))} gün`)}${ic}`, '#FFF0F5');
      },
    },
    kuleler: {
      ad: 'İki kule',
      alt: 'Kız Kulesi ve Qız Qalası',
      ciz: () => sar(`${baslik(170, 'İKİ KULE, BİR KALE', 'Kızın kulesi', `${C.myCity} ve ${C.herCity}`)}
        <svg x="90" y="520" width="460" height="640" viewBox="0 0 160 220">${A.kizKulesi().replace(/^<svg[^>]*>|<\/svg>$/g, '')}</svg>
        <svg x="640" y="520" width="460" height="640" viewBox="0 0 160 220">${A.qizQalasi().replace(/^<svg[^>]*>|<\/svg>$/g, '')}</svg>
        ${kalp(594, 860, 3.2)}<path d="M120 1240 Q594 1170 1068 1240" fill="none" stroke="#FF8FB8" stroke-width="6" stroke-dasharray="4 18" stroke-linecap="round"/>
        <text x="${W / 2}" y="1420" text-anchor="middle" font-family="${FONT}" font-size="34" fill="#3A1F2D" opacity=".75">İki kulenin de adında aynı kelime var.</text>`, '#EAF6FF'),
    },
    sehir: {
      ad: 'İki şehir',
      alt: 'Boğaz ve Hazar',
      ciz: () => {
        const ft = A.flameTowers ? A.flameTowers() : '';
        const vb = (ft.match(/viewBox="([^"]+)"/) || [])[1] || '0 0 200 200';
        return sar(`${baslik(170, 'BOĞAZ ♡ HAZAR', 'İki şehir', 'Bir gün aynı pencereden bakacağız')}
          <rect x="0" y="560" width="${W / 2}" height="900" fill="#FFE3EC"/><rect x="${W / 2}" y="560" width="${W / 2}" height="900" fill="#E1F3FF"/>
          <svg x="70" y="700" width="460" height="640" viewBox="0 0 160 220">${A.kizKulesi().replace(/^<svg[^>]*>|<\/svg>$/g, '')}</svg>
          <svg x="660" y="700" width="460" height="640" viewBox="${vb}">${ft.replace(/^<svg[^>]*>|<\/svg>$/g, '')}</svg>
          <text x="${W / 4}" y="1530" text-anchor="middle" font-family="${FONT}" font-size="44" font-weight="600" fill="#3A1F2D">${K.esc(C.myCity)}</text><text x="${(3 * W) / 4}" y="1530" text-anchor="middle" font-family="${FONT}" font-size="44" font-weight="600" fill="#3A1F2D">${K.esc(C.herCity)}</text>
          <text x="${W / 4}" y="1574" text-anchor="middle" font-family="${FONT}" font-size="24" fill="#3A1F2D" opacity=".6">${IST[0]}° K · ${IST[1]}° D</text><text x="${(3 * W) / 4}" y="1574" text-anchor="middle" font-family="${FONT}" font-size="24" fill="#3A1F2D" opacity=".6">${BAK[0]}° K · ${BAK[1]}° D</text>`, '#FFF0F5');
      },
    },
    omur: {
      ad: 'Ömür takvimi',
      alt: 'Birlikte ilk on yıl, hafta hafta',
      ciz: () => {
        const bas = T.at(C.togetherDate || C.metDate).getTime();
        const gecen = Math.floor((Date.now() - bas) / (7 * 864e5));
        const ox = 120, oy = 420, a = 18.4;
        let ic = '';
        for (let y = 0; y < 10; y++) {
          ic += `<text x="${ox - 22}" y="${oy + y * 100 + 26}" text-anchor="end" font-family="${FONT}" font-size="24" fill="#3A1F2D" opacity=".6">${y + 1}</text>`;
          for (let w = 0; w < 52; w++) {
            const n = y * 52 + w;
            const x = ox + (w % 26) * a * 2, yy = oy + y * 100 + Math.floor(w / 26) * 36;
            ic += n === 0 ? kalp(x + 8, yy + 12, 1.1) : `<circle cx="${x + 8}" cy="${yy + 8}" r="7.5" fill="${n < gecen ? '#E3174D' : 'none'}" stroke="#3A1F2D" stroke-width="2" opacity="${n < gecen ? 1 : 0.35}"/>`;
          }
        }
        return sar(`${baslik(150, 'ÖMÜR TAKVİMİ', 'İlk on yılımız', `${K.num(gecen)} hafta geçti · her daire bir hafta`)}${ic}`, '#FFF7EC');
      },
    },
  };
  function indir(id, tur) {
    const svg = P[id].ciz();
    const ad = `kale-poster-${id}`;
    if (tur === 'svg') return K.download('data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg), ad + '.svg');
    const img = new Image();
    img.onload = () => {
      const c = document.createElement('canvas');
      c.width = W * 2;
      c.height = H * 2;
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
      K.download(c.toDataURL('image/png'), ad + '.png');
      K.stickers.award('posterler');
    };
    img.onerror = () => K.fx.toast('PNG çizilemedi; SVG olarak indir.');
    img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  }
  function ciz() {
    if (!root || K.activeRoom !== 'posterler') return;
    K.$('#psIcerik', root).innerHTML = Object.entries(P).map(([id, p]) => `<article class="ps-poster"><div class="ps-onizle">${p.ciz().replace('<svg ', '<svg class="ps-svg" ')}</div><div><h3>${K.esc(p.ad)}</h3><small class="muted">${K.esc(p.alt)}</small><div class="cl-dugmeler"><button class="btn small" type="button" data-ps="${id}:png">PNG indir</button><button class="btn ghost small" type="button" data-ps="${id}:svg">SVG</button></div></div></article>`).join('');
  }
  K.room({
    id: 'posterler',
    wing: 'hazine',
    title: 'Poster Seti',
    sub: 'Altı poster, baskıya hazır',
    icon: 'poster',
    color: '#EFE9FF',
    init(el) {
      root = el;
      el.innerHTML = `<div class="room-intro"><p>Kalenin altı posteri A3 oranında, baskıya hazır: duvara, kavuşma kutusuna ya da iki şehre birer tane. PNG yüksek çözünürlüklü; SVG'yi bir matbaa istediği boyutta basar.</p></div><div class="ps-liste" id="psIcerik"></div>`;
      el.addEventListener('click', (e) => {
        const b = e.target.closest('[data-ps]');
        if (!b) return;
        const [id, tur] = b.dataset.ps.split(':');
        indir(id, tur);
      });
    },
    async enter() {
      await (K.dunya ? K.dunya.load().catch(() => {}) : null);
      foto = K.arsiv && K.cloud && K.cloud.enabled ? await K.arsiv.photos() : [];
      ciz();
    },
  });
  K.posterler = { P };
})();
