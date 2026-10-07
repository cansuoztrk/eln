/* Yaşayan Kitty ve Pamuk ile Kitty sahnesi.
   Yaşayan Kitty (ana salondaki büyük Kitty): ara ara göz kırpar, parmağın ya da imlecin yönüne bakar, hafifçe nefes alır;
   dokununca güler ve zıplar. Gece 23:00–06:00 (bu telefonun saatiyle) uyur, başının üstünde "z"ler uçar; dokununca
   esneyip bir süre uyanır. Kendi şehrinin gerçek havasına göre şemsiye (yağmur), atkı (soğuk), güneş gözlüğü (sıcak ve
   açık), bere (kar); sınav günü yaklaşırken (Sınav Kalkanı) okuma gözlüğü; yılbaşı haftası Noel şapkası. Kitty'nin
   Gardırobu'ndan seçilen kıyafet varsa o önce gelir.
   Pamuk ile Kitty: ana salonda günün saatine göre küçük bir sahne: sabah yumak kovalamaca, öğle süt molası, akşam
   pencereden yağmur ya da gün batımı, gece sepette uyku. Pamuk henüz sahiplenilmediyse Kitty yalnızdır. */
(function () {
  'use strict';
  const K = window.K;
  const A = K.art;
  const D = window.ELN;
  const C = D.config;
  const T = K.time;
  const INK = '#4A2138';

  /* ---------- Aksesuarlar (Kitty'nin 240×200 çiziminin koordinatlarında) ---------- */
  const AKS = {
    semsiye: `<g class="ks-semsiye"><path d="M-6 -6 Q-6 -78 120 -86 Q246 -78 246 -6 Q225 -20 204 -6 Q183 -20 162 -6 Q141 -20 120 -6 Q99 -20 78 -6 Q57 -20 36 -6 Q15 -20 -6 -6 Z" fill="#9FD8FF" stroke="${INK}" stroke-width="7" stroke-linejoin="round"/><path d="M36 -6 Q60 -70 120 -86 M204 -6 Q180 -70 120 -86" fill="none" stroke="${INK}" stroke-width="3" opacity=".35"/><path d="M120 -86 V-102" stroke="${INK}" stroke-width="7" stroke-linecap="round"/><g class="ks-damla" fill="#7CC1F0">${[18, 60, 182, 226].map((x, i) => `<path d="M${x} ${14 + (i % 2) * 18} q4 8 0 12 q-4 -4 0 -12z" style="--i:${i}"/>`).join('')}</g></g>`,
    atki: `<g class="ks-atki"><path d="M34 178 Q120 214 206 178 L210 198 Q120 232 30 198 Z" fill="#E3174D" stroke="${INK}" stroke-width="6" stroke-linejoin="round"/><path d="M150 204 L160 248 L182 244 L172 200 Z" fill="#E3174D" stroke="${INK}" stroke-width="6" stroke-linejoin="round"/><path d="M60 190 L60 205 M90 196 L90 212 M150 196 L150 212 M180 190 L180 205" stroke="#fff" stroke-width="5" opacity=".7"/></g>`,
    gunes: `<g class="ks-gunes"><rect x="54" y="108" width="52" height="34" rx="14" fill="#2B2024" stroke="${INK}" stroke-width="5"/><rect x="134" y="108" width="52" height="34" rx="14" fill="#2B2024" stroke="${INK}" stroke-width="5"/><path d="M106 120 Q120 112 134 120" fill="none" stroke="${INK}" stroke-width="5"/><path d="M64 116 L80 116" stroke="#fff" stroke-width="4" stroke-linecap="round" opacity=".6"/><path d="M144 116 L160 116" stroke="#fff" stroke-width="4" stroke-linecap="round" opacity=".6"/></g>`,
    gozluk: `<g class="ks-gozluk" fill="none" stroke="${INK}" stroke-width="5"><circle cx="80" cy="124" r="22"/><circle cx="160" cy="124" r="22"/><path d="M102 122 Q120 114 138 122"/><circle cx="80" cy="124" r="22" fill="#fff" opacity=".18" stroke="none"/><circle cx="160" cy="124" r="22" fill="#fff" opacity=".18" stroke="none"/></g>`,
    bere: `<g class="ks-bere"><path d="M30 70 Q40 2 120 -4 Q200 2 210 70 Q120 52 30 70 Z" fill="#CDBBFF" stroke="${INK}" stroke-width="7" stroke-linejoin="round"/><path d="M28 70 Q120 48 212 70 L214 86 Q120 66 26 86 Z" fill="#fff" stroke="${INK}" stroke-width="6" stroke-linejoin="round"/><circle cx="120" cy="-10" r="16" fill="#fff" stroke="${INK}" stroke-width="6"/></g>`,
    noel: `<g class="ks-noel" transform="translate(62 46) rotate(-22)"><path d="M-46 14 Q-30 -60 34 -74 Q14 -40 40 14 Z" fill="#E3174D" stroke="${INK}" stroke-width="7" stroke-linejoin="round"/><rect x="-54" y="6" width="104" height="22" rx="11" fill="#fff" stroke="${INK}" stroke-width="6"/><circle cx="36" cy="-76" r="13" fill="#fff" stroke="${INK}" stroke-width="6"/></g>`,
  };
  const ZZZ = `<g class="ks-zzz" fill="${INK}" font-family="Fredoka, Nunito, sans-serif" font-weight="700"><text x="206" y="34" font-size="26">z</text><text x="222" y="10" font-size="34">z</text><text x="236" y="-18" font-size="42">Z</text></g>`;
  const ESNEME = `<ellipse class="ks-esneme" cx="120" cy="170" rx="9" ry="12" fill="#C2264F" stroke="${INK}" stroke-width="4"/>`;

  function havaAks() {
    const w = K.gercekhava && K.gercekhava.now && K.gercekhava.now();
    const c = w && (K.isOwner() ? w.ist : w.baku);
    const out = [];
    if (c && c.code != null) {
      const yagmur = (c.code >= 51 && c.code <= 67) || (c.code >= 80 && c.code <= 82) || c.code >= 95;
      const kar = (c.code >= 71 && c.code <= 77) || c.code === 85 || c.code === 86;
      const h = new Date().getHours();
      if (yagmur) out.push('semsiye');
      else if (kar) out.push('bere');
      if (c.temp != null && c.temp < 8) out.push('atki');
      if (!yagmur && !kar && c.code <= 1 && c.temp >= 24 && h >= 9 && h < 18) out.push('gunes');
    }
    const p = T.baku();
    const md = `${K.pad(p.mo)}-${K.pad(p.d)}`;
    if ((md >= '12-24' || md <= '01-01') && !out.includes('bere')) out.push('noel');
    // Sınav günü yaklaşırken okuma gözlüğü
    if (K.kalkan && !out.includes('gunes')) {
      const ben = K.isOwner() ? 'me' : 'her';
      const yakin = K.kalkan.ranges().some(([d, , , w]) => w === ben && T.daysUntil(d) >= 0 && T.daysUntil(d) <= 3);
      if (yakin) out.push('gozluk');
    }
    return out;
  }

  /* ---------- Yaşayan Kitty ---------- */
  let svg = null, uyanikT = 0, kirpT = 0;
  const uykuSaati = () => {
    const h = new Date().getHours(), m = new Date().getMinutes();
    return h >= 23 || h < 6 || (h === 22 && m >= 59);
  };
  function giydir() {
    if (!svg) return;
    K.$$('.ks-aks, .ks-zzz-g, .ks-esneme-g', svg).forEach((g) => g.remove());
    const kiyafet = K.giysi && K.giysi.secili && K.giysi.secili();
    const l = havaAks().filter((a) => !(kiyafet && kiyafet.bas && ['bere', 'noel'].includes(a)) && !(kiyafet && kiyafet.goz && ['gunes', 'gozluk'].includes(a)) && !(kiyafet && kiyafet.boyun && a === 'atki'));
    const ns = 'http://www.w3.org/2000/svg';
    const g = document.createElementNS(ns, 'g');
    g.setAttribute('class', 'ks-aks');
    g.innerHTML = l.map((a) => AKS[a]).join('');
    svg.appendChild(g);
    const z = document.createElementNS(ns, 'g');
    z.setAttribute('class', 'ks-zzz-g');
    z.innerHTML = ZZZ;
    svg.appendChild(z);
    const e = document.createElementNS(ns, 'g');
    e.setAttribute('class', 'ks-esneme-g');
    e.innerHTML = ESNEME;
    svg.insertBefore(e, svg.querySelector('.k-nose'));
    svg.dataset.aks = l.join(' ');
  }
  function durum() {
    if (!svg) return;
    const uyku = uykuSaati() && Date.now() > uyanikT;
    svg.classList.toggle('is-sleep', uyku);
    svg.classList.toggle('ks-uyuyor', uyku);
  }
  function kirp() {
    clearTimeout(kirpT);
    kirpT = setTimeout(() => {
      if (svg && !svg.classList.contains('ks-uyuyor') && !document.hidden) {
        svg.classList.add('kirp');
        setTimeout(() => svg && svg.classList.remove('kirp'), 150);
        if (Math.random() < 0.18) setTimeout(() => svg && (svg.classList.add('kirp'), setTimeout(() => svg && svg.classList.remove('kirp'), 130)), 300);
      }
      kirp();
    }, 2200 + Math.random() * 4200);
  }
  function bak(x, y) {
    if (!svg) return;
    const r = svg.getBoundingClientRect();
    const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    const dx = K.clamp((x - cx) / (innerWidth / 2), -1, 1), dy = K.clamp((y - cy) / (innerHeight / 2), -1, 1);
    svg.style.setProperty('--kx', dx.toFixed(3));
    svg.style.setProperty('--ky', dy.toFixed(3));
  }
  function kur() {
    const s = K.$('#heroKitty .kitty');
    if (!s || s === svg) return;
    svg = s;
    svg.classList.add('yasar');
    giydir();
    durum();
    kirp();
    const btn = K.$('#heroKitty');
    btn.addEventListener('click', () => {
      if (svg.classList.contains('ks-uyuyor')) {
        uyanikT = Date.now() + 25000;
        svg.classList.add('ks-esniyor');
        setTimeout(() => svg && svg.classList.remove('ks-esniyor'), 1600);
        durum();
      }
      svg.classList.remove('ks-zipla');
      void svg.getBBox();
      svg.classList.add('ks-zipla');
      const r = btn.getBoundingClientRect();
      K.fx.burst && K.fx.burst(r.left + r.width / 2, r.top + r.height * 0.3, { count: 8, power: 4 });
    });
  }
  let son = 0;
  addEventListener(
    'pointermove',
    (e) => {
      if (Date.now() - son < 40 || K.activeRoom) return;
      son = Date.now();
      bak(e.clientX, e.clientY);
    },
    { passive: true }
  );
  addEventListener(
    'deviceorientation',
    (e) => {
      if (!svg || K.activeRoom || e.gamma == null) return;
      svg.style.setProperty('--kx', K.clamp(e.gamma / 30, -1, 1).toFixed(3));
      svg.style.setProperty('--ky', K.clamp((e.beta - 45) / 40, -1, 1).toFixed(3));
    },
    { passive: true }
  );

  /* ---------- Pamuk ile Kitty sahnesi ---------- */
  const SAHNE = [
    [6, 11, 'sabah', 'Pamuk yumağın peşinde, Kitty gülmekten duramıyor.', 'Kitty pencereyi açtı: günaydın.'],
    [11, 17, 'ogle', 'Süt molası: Pamuk kâseyi Kitty ile paylaşıyor.', 'Kitty öğle güneşinde kitap okuyor.'],
    [17, 21, 'aksam', 'İkisi pencerenin önünde, akşamı izliyorlar.', 'Kitty pencereden akşamı izliyor.'],
    [21, 30, 'gece', 'Sepette iki tombul top: Pamuk ve Kitty uyuyor.', 'Kitty yorganına sarıldı, uyuyor.'],
  ];
  function sahne() {
    const box = K.$('#k4Sahne');
    if (!box) return;
    const h = new Date().getHours(), hh = h < 6 ? h + 24 : h;
    const [, , ad, ikili, tek] = SAHNE.find(([a, b]) => hh >= a && hh < b) || SAHNE[0];
    const pamuk = K.kedi && K.kedi.adopted && K.kedi.adopted();
    const w = K.gercekhava && K.gercekhava.now && K.gercekhava.now();
    const c = w && (K.isOwner() ? w.ist : w.baku);
    const yagmur = c && ((c.code >= 51 && c.code <= 67) || (c.code >= 80 && c.code <= 82) || c.code >= 95);
    const kedi = pamuk ? `<div class="ps-pamuk">${K.kedi.svg()}</div>` : '';
    const kit = `<div class="ps-kitty">${A.kitty({ cls: ad === 'gece' ? 'is-sleep' : ad === 'sabah' ? 'is-happy' : '', label: 'Kitty' })}</div>`;
    const ek = ad === 'sabah' && pamuk ? '<span class="ps-yumak"></span>' : ad === 'ogle' ? '<span class="ps-kase"></span>' : ad === 'gece' ? '<span class="ps-sepet"></span><span class="ps-z">z z z</span>' : '';
    box.className = `wrap k4-sahne ps-${ad} ${yagmur ? 'ps-yagmur' : ''} ${pamuk ? 'ikili' : 'tek'}`;
    box.innerHTML = `<div class="ps-sahne" role="img" aria-label="${K.esc(pamuk ? ikili : tek)}"><span class="ps-pencere">${yagmur ? '<i></i><i></i><i></i><i></i>' : ''}</span>${ek}${kit}${kedi}</div><p class="ps-yazi">${K.esc(yagmur && ad !== 'gece' ? (pamuk ? 'Dışarıda yağmur var; Pamuk ile Kitty camdaki damlaları sayıyor.' : 'Dışarıda yağmur var; Kitty camdaki damlaları sayıyor.') : pamuk ? ikili : tek)}</p>`;
  }
  function sahneKur() {
    if (K.$('#k4Sahne')) return;
    const t = K.$('.together');
    t && t.insertAdjacentHTML('beforebegin', '<section class="wrap k4-sahne" id="k4Sahne"></section>');
    sahne();
  }
  document.addEventListener('click', (e) => {
    const s = e.target.closest('#k4Sahne .ps-sahne');
    if (!s) return;
    s.classList.remove('ps-oyna');
    void s.offsetWidth;
    s.classList.add('ps-oyna');
    K.audio.sfx.pop && K.audio.sfx.pop();
    K.stickers.award('pamukkitty');
  });

  K.on('built', () => {
    setTimeout(() => {
      kur();
      sahneKur();
    }, 60);
  });
  K.on('cloud', (ok) => ok && setTimeout(() => (giydir(), sahne()), 3500));
  K.on('giysi', giydir);
  setInterval(() => {
    durum();
    sahne();
  }, 60000);
  setInterval(giydir, 10 * 60000);
  K.yasayan = { giydir, durum, havaAks, sahne, AKS };
})();
