/* Kale 2.0 — Canlı Kale (Ana Salon 5.0), Mevsim Kıyafetleri ve Hareketli Kitty.
   Gökyüzü iki yarı: sol İstanbul, sağ Bakü; her yarının rengi o şehirde güneşin o anki gerçek yüksekliğine göre
   (altın saat, alacakaranlık, gece). Bakü bir saat önde olduğu için gün batımında iki yarı farklı renkte olur.
   Kim kaledeyse kulesinin pencereleri yanar. Kaydırırken sahne katman katman (derinlik) hareket eder.
   Mevsime ve özel günlere göre Kitty'nin kıyafeti, kulelerin süsü değişir. Kitty kendi kendine göz kırpar, etrafına
   bakar, zıplar, gece esner. */
(function () {
  'use strict';
  const K = window.K;
  const D = window.ELN;
  const C = D.config;
  const T = K.time;

  /* ---------- Güneşin yüksekliği (yaklaşık, derece) ---------- */
  function sunElev(lat, lng, date) {
    const r = Math.PI / 180;
    const d = date.getTime() / 864e5 - 10957.5;
    const g = (357.529 + 0.98560028 * d) * r;
    const q = 280.459 + 0.98564736 * d;
    const L = (q + 1.915 * Math.sin(g) + 0.02 * Math.sin(2 * g)) * r;
    const e = (23.439 - 0.00000036 * d) * r;
    const ra = Math.atan2(Math.cos(e) * Math.sin(L), Math.cos(L));
    const dec = Math.asin(Math.sin(e) * Math.sin(L));
    const gmst = (((18.697374558 + 24.06570982441908 * d) % 24) + 24) % 24;
    const H = (gmst * 15 + lng) * r - ra;
    const la = lat * r;
    return Math.asin(Math.sin(la) * Math.sin(dec) + Math.cos(la) * Math.cos(dec) * Math.cos(H)) / r;
  }
  // Yükseklik → üst ve alt renk (yarı saydam; gündüz temanın kendi rengi görünür)
  function skyOf(el) {
    if (el > 12) return ['rgba(255,255,255,0)', 'rgba(255,255,255,0)', 'gun'];
    if (el > 0) {
      const a = ((12 - el) / 12) * 0.42;
      return [`rgba(255,150,120,${(a * 0.8).toFixed(3)})`, `rgba(255,196,120,${a.toFixed(3)})`, 'altin'];
    }
    if (el > -8) {
      const a = 0.3 + ((0 - el) / 8) * 0.15;
      return [`rgba(98,64,160,${a.toFixed(3)})`, `rgba(240,120,150,${(a * 0.8).toFixed(3)})`, 'alaca'];
    }
    return ['rgba(22,18,64,0.45)', 'rgba(60,40,110,0.32)', 'gece'];
  }
  const PHASE = { gun: 'gündüz', altin: 'altın saat', alaca: 'alacakaranlık', gece: 'gece' };
  function paintSky() {
    const sky = K.$('#hero .hero-sky');
    if (!sky || !C.coords) return;
    let el = K.$('.cs-sky', sky);
    if (!el) {
      el = K.el('<div class="cs-sky" aria-hidden="true"><i class="cs-l"></i><i class="cs-r"></i></div>');
      sky.insertBefore(el, sky.firstChild);
    }
    const now = T.now();
    const ei = sunElev(C.coords.istanbul[0], C.coords.istanbul[1], now);
    const eb = sunElev(C.coords.baku[0], C.coords.baku[1], now);
    const [it, ib, ip] = skyOf(ei), [bt, bb, bp] = skyOf(eb);
    el.style.cssText = `--it:${it};--ib:${ib};--bt:${bt};--bb:${bb}`;
    el.dataset.ist = ip;
    el.dataset.baku = bp;
    const hero = K.$('#hero');
    hero.dataset.gok = `${ip}-${bp}`;
    hero.title = ip !== bp ? `İstanbul'da ${PHASE[ip]}, Bakü'de ${PHASE[bp]}` : '';
  }
  // Kim kaledeyse kulesinin pencereleri yanar (ben her zaman buradayım)
  function paintTowers() {
    const tw = K.$$('#hero .scene-tower');
    if (tw.length < 2) return;
    const meSide = K.isOwner() ? tw[0] : tw[tw.length - 1];
    const otherSide = K.isOwner() ? tw[tw.length - 1] : tw[0];
    meSide.classList.add('burada');
    otherSide.classList.toggle('burada', Boolean(K.cloud && K.cloud.enabled && K.cloud.otherHere()));
  }

  /* ---------- Derinlik: kaydırırken katmanlar ---------- */
  let raf = 0;
  function parallax() {
    raf = 0;
    const hero = K.$('#hero');
    if (!hero || K.activeRoom) return;
    const y = Math.min(window.scrollY, 600);
    hero.style.setProperty('--py', y.toFixed(0));
  }
  if (!K.reduced) window.addEventListener('scroll', () => raf || (raf = requestAnimationFrame(parallax)), { passive: true });

  /* ---------- Mevsim ve özel gün kıyafetleri ---------- */
  function outfit() {
    const p = T.baku();
    const md = `${K.pad(p.mo)}-${K.pad(p.d)}`;
    const between = (a, b) => (a <= b ? md >= a && md <= b : md >= a || md <= b);
    let o = p.mo === 12 || p.mo <= 2 ? 'kis' : p.mo <= 5 ? 'bahar' : p.mo <= 8 ? 'yaz' : 'guz';
    let ozel = '';
    if (between('12-20', '01-02')) ozel = 'yilbasi';
    else if (between('03-15', '03-25')) ozel = 'novruz';
    else if (md === '02-14') ozel = 'sevgili';
    else if (C.herBirthday && md === C.herBirthday.slice(5)) ozel = 'dogumgunu';
    else if (p.d === 21) ozel = 'yirmibir';
    return { mevsim: o, ozel };
  }
  // Kıyafet parçaları Kitty'nin kendi koordinatlarında (240×200)
  const GIYSI = {
    guz: '<path class="ks-atki" d="M58 176 C90 196 150 196 182 176 L186 190 C150 208 90 208 54 190 Z"/><path class="ks-atki" d="M150 192 L164 224 L148 226 L138 196 Z"/><path class="ks-cizgi" d="M70 184 L76 196 M90 190 L94 202 M112 192 L114 204 M134 192 L134 204 M156 188 L154 200"/>',
    kis: '<path class="ks-atki kis" d="M58 176 C90 196 150 196 182 176 L186 190 C150 208 90 208 54 190 Z"/><path class="ks-atki kis" d="M150 192 L164 224 L148 226 L138 196 Z"/><circle class="ks-ponpon" cx="160" cy="226" r="7"/><path class="ks-cizgi" d="M64 186 h120 M70 196 h104"/>',
    bahar: '<g class="ks-cicek"><circle cx="40" cy="70" r="9"/><circle cx="52" cy="58" r="8"/><circle cx="30" cy="56" r="7"/><circle cx="40" cy="62" r="4" class="ic"/></g>',
    yaz: '<g class="ks-gozluk"><rect x="58" y="108" width="44" height="30" rx="12"/><rect x="138" y="108" width="44" height="30" rx="12"/><path d="M102 120 H138"/></g>',
  };
  const OZEL = {
    yilbasi: '<path class="ks-sapka" d="M30 70 C40 20 90 6 120 30 C96 30 70 48 62 78 Z"/><path class="ks-sapka-k" d="M24 74 C40 62 58 66 70 80 L64 90 C52 78 38 76 28 86 Z"/><circle class="ks-ponpon" cx="122" cy="28" r="9"/>',
    novruz: '<g class="ks-lale"><path d="M36 88 V54" class="sap"/><path d="M26 56 C24 40 32 34 36 30 C40 34 48 40 46 56 C42 60 30 60 26 56 Z"/></g>',
    sevgili: '<g class="ks-kalpler"><path d="M30 60 c-8 -10 -22 0 -10 12 l10 9 l10 -9 c12 -12 -2 -22 -10 -12 z"/><path d="M206 120 c-6 -8 -17 0 -8 9 l8 7 l8 -7 c9 -9 -2 -17 -8 -9 z"/></g>',
    dogumgunu: '<path class="ks-parti" d="M40 74 L58 18 L84 66 Z"/><circle class="ks-ponpon" cx="58" cy="16" r="7"/><path class="ks-cizgi" d="M48 54 L72 46 M44 66 L78 58"/>',
    yirmibir: '<g class="ks-balon"><path d="M22 120 C10 96 18 70 34 70 C50 70 56 96 40 120 Z"/><path d="M31 120 C30 140 36 150 32 170" class="ip"/><text x="31" y="100" text-anchor="middle">21</text></g>',
  };
  function dress() {
    const svg = K.$('#heroKitty svg');
    if (!svg) return;
    const o = outfit();
    let g = K.$('.ks-giysi', svg);
    if (!g) {
      g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      g.setAttribute('class', 'ks-giysi');
      svg.appendChild(g);
      svg.setAttribute('overflow', 'visible');
    }
    g.innerHTML = (GIYSI[o.mevsim] || '') + (OZEL[o.ozel] || '');
    document.body.dataset.mevsim = o.mevsim;
    o.ozel ? (document.body.dataset.ozelgun = o.ozel) : delete document.body.dataset.ozelgun;
  }

  /* ---------- Hareketli Kitty ---------- */
  let idleT = 0;
  function act(name, ms) {
    const k = K.$('#heroKitty .kitty');
    if (!k || K.activeRoom || document.hidden) return;
    k.classList.add('ka-' + name);
    setTimeout(() => k.classList.remove('ka-' + name), ms);
  }
  function idle() {
    clearTimeout(idleT);
    idleT = setTimeout(() => {
      const night = document.body.classList.contains('night');
      const pool = night ? ['esne', 'bak', 'goz', 'bak'] : ['goz', 'bak', 'zipla', 'kulak', 'bak'];
      const a = K.pick(pool);
      if (a === 'goz') act('goz', 700);
      else if (a === 'bak') act(K.pick(['bak-sol', 'bak-sag']), 1600);
      else if (a === 'zipla') act('zipla', 700);
      else if (a === 'kulak') act('kulak', 900);
      else if (a === 'esne') act('esne', 2200);
      idle();
    }, 7000 + Math.random() * 6000);
  }
  // Dokununca gülme ve zıplama app.js'te (is-happy + wiggle); burada yalnız kendi kendine hareketler

  function all() {
    paintSky();
    paintTowers();
    dress();
    parallax();
  }
  K.on('built', () => {
    setTimeout(all, 300);
    idle();
  });
  K.on('presence', paintTowers);
  K.on('cloud', () => setTimeout(paintTowers, 1500));
  setInterval(() => document.visibilityState === 'visible' && (paintSky(), dress()), 5 * 60e3);
  K.canli = { sunElev, skyOf, outfit, act };
})();
