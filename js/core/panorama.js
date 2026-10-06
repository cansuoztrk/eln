/* Kale 2.0 — Yol Panoraması: ana salonun hemen altında yana kaydırılan uzun, çizimli bir manzara. Solda Kız Kulesi,
   sonra Karadeniz kıyısı, Kaçkarlar, Batum'daki Ali ve Nino heykeli, Tiflis, Kafkas dağları, Gence, Alev Kuleleri ve en
   sağda Qız Qalası. Her durak bir odanın kapısı. Gökyüzü iki şehrin gerçek güneşiyle renklenir (batı yarısı İstanbul,
   doğu yarısı Bakü); geceleri köylerin ışıkları yanar. Pamuk yolda yürür. Ortada Buluşalım açıksa iki yürüyüşçü de
   yolda, attıkları adımlar kadar ilerlemiş olarak görünür. */
(function () {
  'use strict';
  const K = window.K;
  const A = K.art;
  const D = window.ELN;
  const C = D.config;
  const T = K.time;

  const W = 2240, H = 200, ROAD = 158;
  const X0 = 96, X1 = 2150; // İstanbul ve Bakü durakları (Ortada Buluşalım bu aralıkta)
  // [x, oda, ad, alt yazı, çizim, yerel saat dilimi]
  const STOPS = [
    [96, 'uzak', 'İstanbul', 'Kız Kulesi', 'kule', 'ist'],
    [330, 'guvercin', 'Karadeniz', 'Fener', 'fener', 'ist'],
    [590, 'kedi', 'Ordu', 'Fındık bahçesi', 'findik', 'ist'],
    [820, 'kiler', 'Trabzon', 'Sümela', 'sumela', 'ist'],
    [1060, 'randevu', 'Batum', 'Ali ve Nino', 'alinino', 'baku'],
    [1300, 'harita', 'Tiflis', 'Narikala', 'narikala', 'baku'],
    [1530, 'yildizlar', 'Kafkaslar', 'Karlı tepeler', 'dag', 'baku'],
    [1760, 'masal', 'Gence', 'Nizami türbesi', 'nizami', 'baku'],
    [1960, 'kare', 'Bakü', 'Alev Kuleleri', 'alev', 'baku'],
    [2150, 'ilk-sarilma', 'Bakü', 'Qız Qalası', 'qala', 'baku'],
  ];
  const ART = {
    fener: '<svg viewBox="0 0 40 70"><path d="M14 68 L17 20 H23 L26 68 Z" fill="#fff" stroke="#c7386f" stroke-width="2"/><path d="M15 34 H25 M16 48 H24" stroke="#e3174d" stroke-width="5"/><rect x="13" y="10" width="14" height="11" rx="2" fill="#ffd34e" class="pn-win"/><path d="M11 10 L20 2 L29 10 Z" fill="#c7386f"/></svg>',
    findik: '<svg viewBox="0 0 60 60"><circle cx="20" cy="26" r="15" fill="#7fc9a0"/><circle cx="40" cy="22" r="17" fill="#5fb487"/><path d="M28 58 V34 M36 58 V36" stroke="#8a5a3c" stroke-width="4"/><circle cx="18" cy="24" r="3" fill="#b8763c"/><circle cx="42" cy="18" r="3" fill="#b8763c"/><circle cx="34" cy="30" r="3" fill="#b8763c"/></svg>',
    sumela: '<svg viewBox="0 0 70 70"><path d="M0 70 L10 20 L26 6 L44 14 L62 4 L70 70 Z" fill="#a98fd0"/><rect x="18" y="30" width="30" height="16" fill="#fff4e8" stroke="#86566f" stroke-width="1.5"/><path d="M18 30 L33 22 L48 30" fill="#e7a9c4"/><rect x="24" y="35" width="5" height="6" fill="#ffd34e" class="pn-win"/><rect x="37" y="35" width="5" height="6" fill="#ffd34e" class="pn-win"/></svg>',
    alinino: '<svg viewBox="0 0 60 70"><path d="M8 70 L14 30 C14 22 22 14 26 24 L24 70 Z" fill="none" stroke="#8f73e6" stroke-width="3"/><circle cx="21" cy="14" r="6" fill="none" stroke="#8f73e6" stroke-width="3"/><path d="M52 70 L46 32 C46 24 38 16 34 26 L36 70 Z" fill="none" stroke="#f0578f" stroke-width="3"/><circle cx="39" cy="16" r="6" fill="none" stroke="#f0578f" stroke-width="3"/><path d="M30 8 c-3 -4 -8 -2 -6 2 c1 2 6 5 6 5 s5 -3 6 -5 c2 -4 -3 -6 -6 -2 z" fill="#e3174d" class="pn-kalp"/></svg>',
    narikala: '<svg viewBox="0 0 80 64"><path d="M0 64 L14 34 L30 26 L50 30 L80 64 Z" fill="#c9b6ff"/><path d="M22 34 V18 H28 V22 H33 V18 H39 V36 Z" fill="#fff4e8" stroke="#86566f" stroke-width="1.5"/><rect x="28" y="26" width="5" height="6" fill="#ffd34e" class="pn-win"/><path d="M40 6 L78 40" stroke="#86566f" stroke-width="1.2"/><rect x="55" y="18" width="9" height="7" rx="2" fill="#f0578f" class="pn-teleferik"/></svg>',
    dag: '<svg viewBox="0 0 90 60"><path d="M0 60 L28 10 L46 38 L60 18 L90 60 Z" fill="#8f73e6"/><path d="M28 10 L20 25 L27 22 L32 27 L36 18 Z M60 18 L54 28 L60 26 L64 30 L66 26 Z" fill="#fff"/></svg>',
    nizami: '<svg viewBox="0 0 40 74"><rect x="12" y="10" width="16" height="62" rx="2" fill="#f3e3cf" stroke="#86566f" stroke-width="1.5"/><path d="M12 22 H28 M12 34 H28 M12 46 H28 M12 58 H28" stroke="#c7386f" stroke-width="1.2" stroke-dasharray="2 3"/><path d="M10 10 H30 L20 2 Z" fill="#3fa37a"/><rect x="17" y="26" width="6" height="7" fill="#ffd34e" class="pn-win"/></svg>',
  };
  const art = (k) => (k === 'kule' ? A.kizKulesi() : k === 'qala' ? A.qizQalasi() : k === 'alev' ? A.flameTowers('#e7a9c4') : ART[k] || '');
  const zoneOf = (w) => (w === 'ist' ? K.gok.CITY.ist : K.gok.CITY.baku);
  // Güneş yüksekliği → gökyüzü rengi (üst, alt) ve gece mi
  function sky(el) {
    if (el > 10) return ['#bfe6ff', '#fff1f7', false];
    if (el > 0) return ['#ffc6a8', '#ffe7c2', false];
    if (el > -8) return ['#8a6ac8', '#f6a0bd', true];
    return ['#241a4a', '#4a3a86', true];
  }
  function landscape() {
    // Tepeler ve deniz: sabit tohumla çizilen yumuşak eğriler
    const r = K.rng(1758);
    const hills = (y0, amp, step, col) => {
      let d = `M0 ${H} L0 ${y0}`;
      for (let x = 0; x <= W; x += step) d += ` Q${x + step / 2} ${(y0 - amp * r()).toFixed(1)} ${x + step} ${(y0 - amp * 0.4 * r()).toFixed(1)}`;
      return `<path d="${d} L${W} ${H} Z" fill="${col}"/>`;
    };
    const sea = (x0, x1, col) => `<path d="M${x0} ${ROAD + 10} Q${(x0 + x1) / 2} ${ROAD - 2} ${x1} ${ROAD + 10} L${x1} ${H} L${x0} ${H} Z" fill="${col}"/><path d="M${x0 + 20} ${ROAD + 22} q12 -6 24 0 t24 0 t24 0 M${x0 + 140} ${ROAD + 30} q12 -6 24 0 t24 0" stroke="#fff" stroke-width="2" fill="none" opacity=".7"/>`;
    const snowy = [1380, 1450, 1530, 1610, 1680].map((x, i) => `<path d="M${x - 70} 150 L${x} ${70 + (i % 2) * 18} L${x + 70} 150 Z" fill="#a98fd0"/><path d="M${x} ${70 + (i % 2) * 18} l-16 26 l10 -5 l7 7 l6 -8 l9 4 Z" fill="#fff"/>`).join('');
    const kackar = [720, 790, 860].map((x, i) => `<path d="M${x - 60} 150 L${x} ${92 + i * 6} L${x + 60} 150 Z" fill="#b9a4e6"/>`).join('');
    return `<svg class="pn-land" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" aria-hidden="true">
      ${kackar}${snowy}
      ${hills(150, 26, 160, '#ffd0e1')}
      ${sea(170, 1010, '#8fd0f5')}${sea(2060, W, '#8fd0f5')}
      ${hills(176, 12, 120, '#ffe1ec')}
      <path class="pn-road" d="M0 ${ROAD} C300 ${ROAD - 14} 600 ${ROAD + 12} 900 ${ROAD} S1500 ${ROAD - 12} 1800 ${ROAD} S2100 ${ROAD + 8} ${W} ${ROAD}" fill="none" stroke="#fff" stroke-width="5" stroke-dasharray="1 12" stroke-linecap="round"/>
    </svg>`;
  }
  let box = null;
  function build() {
    const hero = K.$('#hero');
    if (!hero || K.$('#yolPano')) return;
    box = K.el(`<section class="yol-pano" id="yolPano" aria-label="Boğaz'dan Hazar'a yol">
      <div class="pn-scroll" tabindex="0" aria-label="Yol: sola ve sağa kaydır"><div class="pn-strip" style="width:${W}px">
        <div class="pn-sky"></div>${landscape()}
        <div class="pn-stars" aria-hidden="true">${Array.from({ length: 40 }, (_, i) => `<i style="left:${(i * 173) % W}px;top:${(i * 37) % 90}px"></i>`).join('')}</div>
        ${STOPS.map(([x, room, city, sub, a, z], i) => `<button type="button" class="pn-stop pn-${a}" data-pn="${room}" data-z="${z}" style="left:${x}px" aria-label="${K.esc(city)}, ${K.esc(sub)}"><span class="pn-art">${art(a)}</span><span class="pn-tag"><b>${K.esc(city)}</b><small>${K.esc(sub)}</small></span></button>`).join('')}
        <span class="pn-cat" aria-hidden="true">${A.kitty({ cls: 'pn-kitty' })}</span>
        <span class="pn-walk me" id="pnMe" hidden>${K.avatar('me', 'pn-av')}<i></i></span>
        <span class="pn-walk her" id="pnHer" hidden>${K.avatar('her', 'pn-av')}<i></i></span>
        <span class="pn-meet" id="pnMeet" hidden>💞</span>
      </div></div>
      <p class="pn-cap"><span>${K.esc(C.myCity)}</span><b id="pnKm">${K.num(C.km || 1758)} km</b><span>${K.esc(C.herCity)}</span></p>
    </section>`);
    hero.after(box);
    box.addEventListener('click', (e) => {
      const s = e.target.closest('[data-pn]');
      if (!s) return;
      K.audio.sfx.tap();
      const id = s.dataset.pn;
      const ok = K.rooms.some((r) => r.id === id && !(typeof r.hidden === 'function' ? r.hidden() : r.hidden));
      if (ok) K.go(id);
      else K.fx.toast(`${K.esc(s.querySelector('b').textContent)}: bu durağın kapısı henüz kapalı.`, { duration: 2200, log: false });
    });
    paint();
    // İlk açılışta yolun ortasına (Batum'a) kaydır; sonra kaldığı yer
    const sc = K.$('.pn-scroll', box);
    const saved = K.store.get('pnScroll', null);
    requestAnimationFrame(() => (sc.scrollLeft = saved != null ? saved : 1060 - sc.clientWidth / 2));
    let t = 0;
    sc.addEventListener('scroll', () => {
      clearTimeout(t);
      t = setTimeout(() => K.store.set('pnScroll', Math.round(sc.scrollLeft)), 300);
    }, { passive: true });
  }
  function paint() {
    if (!box) return;
    const now = T.now();
    const ist = sky(elev('ist', now)), bak = sky(elev('baku', now));
    const strip = K.$('.pn-strip', box);
    strip.style.setProperty('--it', ist[0]);
    strip.style.setProperty('--ib', ist[1]);
    strip.style.setProperty('--bt', bak[0]);
    strip.style.setProperty('--bb', bak[1]);
    strip.classList.toggle('gece-bati', ist[2]);
    strip.classList.toggle('gece-dogu', bak[2]);
    K.$$('.pn-stop', box).forEach((b) => b.classList.toggle('yanik', b.dataset.z === 'ist' ? ist[2] : bak[2]));
    walkers();
  }
  const elev = (z, d) => (K.canli && K.canli.sunElev ? K.canli.sunElev(zoneOf(z)[0], zoneOf(z)[1], d) : 20);
  // Ortada Buluşalım: yürüyüşçüler yolda
  function walkers() {
    const me = K.$('#pnMe', box), her = K.$('#pnHer', box), meet = K.$('#pnMeet', box);
    const p = K.bulusalim && K.bulusalim.progress && K.bulusalim.progress();
    if (!p) return (me.hidden = her.hidden = meet.hidden = true);
    const total = p.total || 1758;
    const xm = X0 + Math.min(1, p.me / total) * (X1 - X0);
    const xh = X1 - Math.min(1, p.her / total) * (X1 - X0);
    const met = p.me + p.her >= total;
    const mid = met ? X0 + (p.me / (p.me + p.her)) * (X1 - X0) : 0;
    me.hidden = her.hidden = false;
    me.style.left = `${met ? mid - 14 : xm}px`;
    her.style.left = `${met ? mid + 14 : xh}px`;
    K.$('i', me).textContent = `${K.num(Math.round(p.me))} km`;
    K.$('i', her).textContent = `${K.num(Math.round(p.her))} km`;
    meet.hidden = !met;
    if (met) meet.style.left = `${mid}px`;
    const left = Math.max(0, total - p.me - p.her);
    K.$('#pnKm', box).textContent = met ? 'Ortada buluştunuz' : `${K.num(Math.round(left))} km kaldı`;
  }
  K.on('built', () => {
    build();
    setInterval(paint, 120000);
  });
  K.on('adim', () => box && walkers());
  K.panorama = { paint, walkers, STOPS, X0, X1 };
})();
