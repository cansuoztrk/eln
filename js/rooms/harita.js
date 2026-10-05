/* Oda: Bizim Haritamız — dünya haritasında iki ev (İstanbul ve Bakü), aradaki yol ve birlikte gitmek istediğimiz yerler.
   Harita verisi (Natural Earth, js/harita-veri.js) oda ilk açılınca yüklenir. Parmakla kaydırılır, iki parmakla
   yakınlaştırılır; "Dünya / Avrupa / Bizim yol" kısayolları. Bir iğneye dokununca iki evden oraya kesik çizgiler,
   uzaklıklar, notu, "ben de istiyorum" ve gidince "Gittik!". İkimiz de iğne ekleriz (listeden ya da haritaya dokunarak).
   Kayıtlar: pin {name, place, lat, lng, emoji, kind, note} · pinsev {ref} · pingittik {ref, note, day} */
(function () {
  'use strict';
  const K = window.K;
  const A = K.art;
  const D = window.ELN;
  const C = D.config;
  const T = K.time;

  const HM = () => D.harita || { intro: [], homes: [], seeds: [] };
  const mine = () => (K.isOwner() ? 'me' : 'her');
  const other = () => (K.isOwner() ? 'her' : 'me');
  const nameOf = (w) => (w === 'me' ? C.myPet : C.herPet);
  const PI = Math.PI;
  const NS = 'http://www.w3.org/2000/svg';
  // Hızlı ekleme için yerler (genel bilgi)
  const GAZ = [
    ['Paris', 'Fransa', 48.8566, 2.3522, '🗼'], ['Roma', 'İtalya', 41.9028, 12.4964, '🏛️'], ['Venedik', 'İtalya', 45.4408, 12.3155, '🛶'], ['Floransa', 'İtalya', 43.7696, 11.2558, '🎨'],
    ['Amalfi', 'İtalya', 40.634, 14.6027, '🍋'], ['Barselona', 'İspanya', 41.3874, 2.1686, '⛪'], ['Madrid', 'İspanya', 40.4168, -3.7038, '💃'], ['Lizbon', 'Portekiz', 38.7223, -9.1393, '🚋'],
    ['Londra', 'İngiltere', 51.5074, -0.1278, '💂'], ['Amsterdam', 'Hollanda', 52.3676, 4.9041, '🌷'], ['Prag', 'Çekya', 50.0755, 14.4378, '🏰'], ['Viyana', 'Avusturya', 48.2082, 16.3738, '🎻'],
    ['Budapeşte', 'Macaristan', 47.4979, 19.0402, '🌉'], ['Berlin', 'Almanya', 52.52, 13.405, '🐻'], ['Zermatt', 'İsviçre', 46.0207, 7.7491, '🏔️'], ['Santorini', 'Yunanistan', 36.3932, 25.4615, '🌅'],
    ['Atina', 'Yunanistan', 37.9838, 23.7275, '🏛️'], ['Dubrovnik', 'Hırvatistan', 42.6507, 18.0944, '⚓'], ['Reykjavik', 'İzlanda', 64.1466, -21.9426, '🌋'], ['Tromsø', 'Norveç', 69.6492, 18.9553, '✨'],
    ['Laponya (Rovaniemi)', 'Finlandiya', 66.5039, 25.7294, '🎅'], ['Kopenhag', 'Danimarka', 55.6761, 12.5683, '🧜'], ['Stockholm', 'İsveç', 59.3293, 18.0686, '⛵'], ['Disneyland Paris', 'Fransa', 48.8722, 2.7758, '🏰'],
    ['Tiflis', 'Gürcistan', 41.7151, 44.8271, '🍷'], ['Batum', 'Gürcistan', 41.6168, 41.6367, '🌊'], ['Şəki', 'Azerbaycan', 41.1975, 47.1571, '🏯'], ['Qəbələ', 'Azerbaycan', 40.9982, 47.87, '🚡'],
    ['Şahdağ', 'Azerbaycan', 41.2857, 48.0216, '⛷️'], ['Quba', 'Azerbaycan', 41.3611, 48.5134, '🍎'], ['Gəncə', 'Azerbaycan', 40.6828, 46.3606, '🌳'], ['Kapadokya', 'Türkiye', 38.6431, 34.8289, '🎈'],
    ['Antalya', 'Türkiye', 36.8969, 30.7133, '🏖️'], ['Kaş', 'Türkiye', 36.2018, 29.6377, '🐢'], ['Ölüdeniz', 'Türkiye', 36.5498, 29.1153, '🪂'], ['Bodrum', 'Türkiye', 37.0344, 27.4305, '⛵'],
    ['Pamukkale', 'Türkiye', 37.9204, 29.1205, '🤍'], ['Uzungöl', 'Türkiye', 40.6194, 40.2925, '🌲'], ['Uludağ', 'Türkiye', 40.0702, 29.2207, '🏔️'], ['Galata', 'İstanbul', 41.0256, 28.9744, '🗼'],
    ['Tokyo', 'Japonya', 35.6762, 139.6503, '🗾'], ['Kyoto', 'Japonya', 35.0116, 135.7681, '⛩️'], ['Seul', 'Güney Kore', 37.5665, 126.978, '🌸'], ['Bali', 'Endonezya', -8.3405, 115.092, '🌺'],
    ['Maldivler', 'Maldivler', 3.2028, 73.2207, '🐠'], ['Dubai', 'BAE', 25.2048, 55.2708, '🏙️'], ['Kahire', 'Mısır', 30.0444, 31.2357, '🐪'], ['Marakeş', 'Fas', 31.6295, -7.9811, '🕌'],
    ['New York', 'ABD', 40.7128, -74.006, '🗽'], ['Los Angeles', 'ABD', 34.0522, -118.2437, '🌴'], ['Rio de Janeiro', 'Brezilya', -22.9068, -43.1729, '🎉'], ['Sidney', 'Avustralya', -33.8688, 151.2093, '🦘'],
  ];
  const EMO = ['📍', '❤️', '✨', '🌉', '⛲', '🏰', '🌅', '🏖️', '🏔️', '🎈', '🌸', '🍰', '☕', '🎀'];

  let root = null, svg = null, rows = [], loaded = false, sel = null, placing = false;
  let vb = { x: 0, y: 0, w: 1000, h: 586 };
  const push = (r) => r && !rows.some((x) => x.id === r.id) && rows.push(r);
  const of = (k) => rows.filter((r) => r.kind === k);

  /* ---------- İzdüşüm ---------- */
  const H = () => window.HARITA;
  const proj = (lat, lng) => [H().W / 2 + (H().k * lng * PI) / 180, H().ty - H().k * Math.log(Math.tan(PI / 4 + (Math.max(-80, Math.min(82, lat)) * PI) / 360))];
  const inv = (x, y) => [((2 * Math.atan(Math.exp((H().ty - y) / H().k)) - PI / 2) * 180) / PI, ((x - H().W / 2) / H().k) * (180 / PI)];
  function km(a, b) {
    const R = 6371, r = PI / 180;
    const dl = (b.lat - a.lat) * r, dg = (b.lng - a.lng) * r;
    const h = Math.sin(dl / 2) ** 2 + Math.cos(a.lat * r) * Math.cos(b.lat * r) * Math.sin(dg / 2) ** 2;
    return Math.round(2 * R * Math.asin(Math.sqrt(h)));
  }
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

  /* ---------- İğneler ---------- */
  const homes = () => (HM().homes || []).map((h) => Object.assign({ ref: 'home:' + h.id, kind: 'ev' }, h));
  function pins() {
    const out = (HM().seeds || []).map((s) => Object.assign({ ref: 'seed:' + s.id, kind: 'hayal', who: null }, s));
    of('pin').forEach((r) => out.push(Object.assign({ ref: r.id, who: r.who, row: r }, r.data)));
    return out;
  }
  const all = () => homes().concat(pins());
  const loves = (ref) => of('pinsev').filter((r) => r.data.ref === ref);
  const loved = (ref, w) => loves(ref).some((r) => r.who === w);
  const went = (ref) => of('pingittik').filter((r) => r.data.ref === ref).sort((a, b) => a.at - b.at)[0] || null;
  const homeOf = (w) => homes().find((h) => h.who === w);

  /* ---------- Çizim ---------- */
  function draw() {
    const box = K.$('#hmMap', root);
    if (!box || !H()) return;
    const h = H();
    const b = h.box;
    box.innerHTML = `<svg class="hm-svg" xmlns="${NS}" viewBox="0 0 ${h.W} ${h.H}" preserveAspectRatio="xMidYMid slice" role="img" aria-label="Bizim haritamız">
      <defs><linearGradient id="hmSea" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="var(--hm-sea1)"/><stop offset="1" stop-color="var(--hm-sea2)"/></linearGradient>
        <pattern id="hmWave" width="14" height="10" patternUnits="userSpaceOnUse"><path d="M0 6 Q3.5 3 7 6 T14 6" fill="none" stroke="var(--hm-wave)" stroke-width=".5"/></pattern>
        <clipPath id="hmOut"><path clip-rule="evenodd" d="M-3000 -3000H4000V4000H-3000Z M${b[0][0] + 0.5} ${b[0][1] + 0.5}H${b[1][0] - 0.5}V${b[1][1] - 0.5}H${b[0][0] + 0.5}Z"/></clipPath></defs>
      <rect x="-2000" y="-2000" width="${h.W + 4000}" height="${h.H + 4000}" fill="url(#hmSea)"/><rect x="-2000" y="-2000" width="${h.W + 4000}" height="${h.H + 4000}" fill="url(#hmWave)" opacity=".7"/>
      <path class="hm-land" d="${h.world}" clip-path="url(#hmOut)"/><path class="hm-land" d="${h.eu}"/>
      <path class="hm-coast" d="${h.c1}" clip-path="url(#hmOut)" vector-effect="non-scaling-stroke"/><path class="hm-coast" d="${h.c2}" vector-effect="non-scaling-stroke"/><path class="hm-br" d="${h.br}" vector-effect="non-scaling-stroke"/>
      <g id="hmLines"></g><g id="hmPins"></g></svg>`;
    svg = K.$('svg', box);
    drawLines();
    drawPins();
    setVB(vb, true);
  }
  function arc(a, b, bend = 0.18) {
    const [x1, y1] = proj(a.lat, a.lng), [x2, y2] = proj(b.lat, b.lng);
    const mx = (x1 + x2) / 2, my = (y1 + y2) / 2, dx = x2 - x1, dy = y2 - y1;
    return `M${x1.toFixed(1)} ${y1.toFixed(1)} Q${(mx + dy * bend).toFixed(1)} ${(my - Math.abs(dx) * bend).toFixed(1)} ${x2.toFixed(1)} ${y2.toFixed(1)}`;
  }
  function drawLines() {
    const g = svg && K.$('#hmLines', svg);
    if (!g) return;
    const a = homeOf('me'), b = homeOf('her');
    let html = '';
    if (a && b) html += `<path id="hmRoute" class="hm-route" d="${arc(a, b, 0.35)}" vector-effect="non-scaling-stroke"/><g class="hm-plane"><g class="hm-sc"><text text-anchor="middle" dy=".35em">✈️</text></g><animateMotion dur="7s" repeatCount="indefinite" rotate="0"><mpath href="#hmRoute"/></animateMotion></g>`;
    const p = sel && all().find((x) => x.ref === sel);
    if (p && p.kind !== 'ev') [a, b].forEach((h, i) => h && (html += `<path class="hm-to ${i ? 'her' : 'me'}" d="${arc(h, p, 0.12)}" vector-effect="non-scaling-stroke"/>`));
    g.innerHTML = html;
  }
  function drawPins() {
    const g = svg && K.$('#hmPins', svg);
    if (!g) return;
    g.innerHTML = all()
      .map((p) => {
        const [x, y] = proj(p.lat, p.lng);
        const st = p.kind === 'ev' ? 'ev' : went(p.ref) ? 'gittik' : loved(p.ref, 'me') && loved(p.ref, 'her') ? 'ikimiz' : p.kind;
        return `<g class="hm-pin ${st} ${sel === p.ref ? 'sel' : ''}" data-ref="${K.esc(p.ref)}" transform="translate(${x.toFixed(1)} ${y.toFixed(1)})"><g class="hm-sc">
          <path class="hm-drop" d="M0 0 C-3 -6 -11 -11 -11 -19 A11 11 0 1 1 11 -19 C11 -11 3 -6 0 0Z"/><text class="hm-emo" y="-15" text-anchor="middle" dominant-baseline="middle">${K.esc(p.emoji || '📍')}</text>
          ${p.kind === 'ev' || sel === p.ref ? `<text class="hm-name" y="12" text-anchor="middle">${K.esc(p.name)}</text>` : ''}</g></g>`;
      })
      .join('');
    scalePins();
  }
  function scalePins() {
    if (!svg) return;
    if (!svg.clientWidth) return;
    const s = vb.w / svg.clientWidth;
    K.$$('.hm-sc', svg).forEach((e) => e.setAttribute('transform', `scale(${s.toFixed(4)})`));
  }
  // Görünür alanın en-boy oranını kutuya uydur
  // Görünür kutunun en-boy oranı (oda gizliyken ölçü 0 olur; o zaman son bilinen oran)
  let lastAr = 0.78;
  const aspect = () => {
    const w = svg && svg.clientWidth, h = svg && svg.clientHeight;
    if (w > 0 && h > 0) lastAr = w / h;
    return lastAr;
  };
  function fit(r) {
    const ar = aspect();
    let { x, y, w, h } = r;
    if (w / h > ar) {
      const nh = w / ar;
      y -= (nh - h) / 2;
      h = nh;
    } else {
      const nw = h * ar;
      x -= (nw - w) / 2;
      w = nw;
    }
    return { x, y, w, h };
  }
  function setVB(r, doFit) {
    vb = doFit ? fit(r) : r;
    const M = H();
    vb.w = K.clamp(vb.w, 18, M.W * 1.05);
    vb.h = vb.w / aspect();
    if (![vb.x, vb.y, vb.w, vb.h].every(Number.isFinite)) return;
    vb.x = K.clamp(vb.x, -vb.w * 0.4, M.W - vb.w * 0.6);
    vb.y = K.clamp(vb.y, -vb.h * 0.4, M.H - vb.h * 0.6);
    svg.setAttribute('viewBox', `${vb.x.toFixed(2)} ${vb.y.toFixed(2)} ${vb.w.toFixed(2)} ${vb.h.toFixed(2)}`);
    scalePins();
  }
  let tween = 0;
  function fly(r) {
    cancelAnimationFrame(tween);
    const from = Object.assign({}, vb), to = fit(r);
    const t0 = performance.now(), dur = K.reduced ? 1 : 650;
    const step = (t) => {
      if (K.activeRoom !== 'harita') return;
      const k = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - k, 3);
      setVB({ x: from.x + (to.x - from.x) * e, y: from.y + (to.y - from.y) * e, w: from.w + (to.w - from.w) * e, h: from.h + (to.h - from.h) * e });
      if (k < 1) tween = requestAnimationFrame(step);
    };
    tween = requestAnimationFrame(step);
  }
  function boxOf(list, pad = 0.25) {
    const pts = list.map((p) => proj(p.lat, p.lng));
    let x1 = Math.min(...pts.map((p) => p[0])), x2 = Math.max(...pts.map((p) => p[0])), y1 = Math.min(...pts.map((p) => p[1])), y2 = Math.max(...pts.map((p) => p[1]));
    const w = Math.max(30, x2 - x1), h = Math.max(20, y2 - y1);
    return { x: x1 - w * pad, y: y1 - h * pad - 8, w: w * (1 + 2 * pad), h: h * (1 + 2 * pad) + 8 };
  }
  const VIEWS = {
    dunya: () => ({ x: 0, y: 30, w: H().W, h: H().H - 60 }),
    avrupa: () => boxOf([{ lat: 70, lng: -12 }, { lat: 34, lng: 52 }], 0.02),
    yol: () => boxOf([homeOf('me'), homeOf('her')], 0.35),
    hepsi: () => boxOf(all(), 0.12),
  };

  /* ---------- Dokunma: kaydır, yakınlaştır, seç ---------- */
  function bindGestures() {
    const pts = new Map();
    let start = null, moved = false;
    const toUnits = (dx, dy) => [(dx * vb.w) / svg.clientWidth, (dy * vb.h) / svg.clientHeight];
    const local = (cx, cy) => {
      const r = svg.getBoundingClientRect();
      return [vb.x + ((cx - r.left) / r.width) * vb.w, vb.y + ((cy - r.top) / r.height) * vb.h];
    };
    const zoomAt = (cx, cy, f) => {
      const [ux, uy] = local(cx, cy);
      const w = K.clamp(vb.w * f, 18, H().W * 1.05);
      const k = w / vb.w;
      setVB({ x: ux - (ux - vb.x) * k, y: uy - (uy - vb.y) * k, w, h: vb.h * k });
    };
    svg.addEventListener('pointerdown', (e) => {
      cancelAnimationFrame(tween);
      pts.set(e.pointerId, [e.clientX, e.clientY]);
      try {
        svg.setPointerCapture(e.pointerId);
      } catch (x) {}
      if (pts.size === 1) (start = { x: e.clientX, y: e.clientY, vb: Object.assign({}, vb), t: e.target }), (moved = false);
      if (pts.size === 2) {
        const [a, b] = [...pts.values()];
        start = { pinch: Math.hypot(a[0] - b[0], a[1] - b[1]), vb: Object.assign({}, vb), mid: [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2] };
        moved = true;
      }
    });
    svg.addEventListener('pointermove', (e) => {
      if (!pts.has(e.pointerId) || !start) return;
      pts.set(e.pointerId, [e.clientX, e.clientY]);
      if (pts.size === 1 && !start.pinch) {
        const dx = e.clientX - start.x, dy = e.clientY - start.y;
        if (Math.abs(dx) + Math.abs(dy) > 6) moved = true;
        if (!moved) return;
        const [ux, uy] = toUnits(dx, dy);
        setVB({ x: start.vb.x - ux, y: start.vb.y - uy, w: start.vb.w, h: start.vb.h });
      } else if (pts.size === 2 && start.pinch) {
        const [a, b] = [...pts.values()];
        const d = Math.hypot(a[0] - b[0], a[1] - b[1]);
        vb = Object.assign({}, start.vb);
        zoomAt(start.mid[0], start.mid[1], start.pinch / Math.max(20, d));
      }
    });
    const up = (e) => {
      const was = pts.has(e.pointerId);
      pts.delete(e.pointerId);
      if (!was) return;
      if (!pts.size && start && !moved && !start.pinch) tap(e);
      if (!pts.size) start = null;
    };
    svg.addEventListener('pointerup', up);
    svg.addEventListener('pointercancel', up);
    svg.addEventListener('wheel', (e) => (e.preventDefault(), zoomAt(e.clientX, e.clientY, e.deltaY > 0 ? 1.18 : 1 / 1.18)), { passive: false });
    function tap(e) {
      if (placing) {
        const [ux, uy] = local(e.clientX, e.clientY);
        const [lat, lng] = inv(ux, uy);
        placing = false;
        root.classList.remove('hm-placing');
        return addSheet({ name: '', place: `${lat.toFixed(2)}°, ${lng.toFixed(2)}°`, lat, lng, emoji: '📍' });
      }
      const el = document.elementFromPoint(e.clientX, e.clientY);
      const p = el && el.closest && el.closest('.hm-pin');
      select(p ? p.dataset.ref : null);
    }
  }

  /* ---------- Kart ve liste ---------- */
  function select(ref, flyTo) {
    sel = ref;
    drawLines();
    drawPins();
    card();
    const p = ref && all().find((x) => x.ref === ref);
    if (p && flyTo) {
      const [x, y] = proj(p.lat, p.lng);
      const w = Math.min(vb.w, 160);
      fly({ x: x - w / 2, y: y - w * 0.45, w, h: w * 0.8 });
    }
  }
  function card() {
    const box = K.$('#hmCard', root);
    const p = sel && all().find((x) => x.ref === sel);
    if (!p) {
      box.innerHTML = `<p class="muted small hm-hint">Bir iğneye dokun. İki parmakla yakınlaştır, tek parmakla kaydır.</p>`;
      return;
    }
    const a = homeOf('me'), b = homeOf('her');
    const g = went(p.ref);
    const lm = loved(p.ref, mine()), lo = loved(p.ref, other());
    const by = p.kind === 'ev' ? `${nameOf(p.who)}'un evi` : p.who ? `${nameOf(p.who)} ekledi` : 'Hayal listemizden';
    box.innerHTML = `<div class="hm-c ${g ? 'gittik' : ''}"><span class="hm-c-emo" aria-hidden="true">${K.esc(p.emoji || '📍')}</span><div class="hm-c-tx">
        <p class="card-eyebrow">${K.esc(p.place || '')} · ${K.esc(by)}</p><h3>${K.esc(p.name)}</h3>${p.note ? `<p class="hand">${K.esc(p.note)}</p>` : ''}
        ${p.kind !== 'ev' && a && b ? `<p class="hm-km">${K.esc(C.myCity)}'dan <b>${K.num(km(a, p))} km</b> · ${K.esc(C.herCity)}'den <b>${K.num(km(b, p))} km</b></p>` : p.kind === 'ev' && a && b ? `<p class="hm-km">Aradaki yol: <b>${K.num(C.distanceKm || km(a, b))} km</b> · bir saat fark</p>` : ''}
        ${g ? `<p class="hm-went">🎉 Gittik! · ${K.esc(T.fmt(g.data.day || new Date(g.at)))}${g.data.note ? ` · "${K.esc(g.data.note)}"` : ''}</p>` : ''}
        ${p.kind !== 'ev' ? `<div class="hm-acts">${g ? '' : `<button type="button" class="chip ${lm ? 'on' : ''}" data-hm-love>${lm ? '💗' : '🤍'} Ben de istiyorum</button><span class="hm-lo ${lo ? 'on' : ''}">${lo ? '💗' : '🤍'} ${K.esc(nameOf(other()))}</span>`}
          ${lm && lo && !g ? '<span class="hm-both">🌟 İkimiz de istiyoruz</span>' : ''}
          ${!g && p.kind === 'hayal' ? '<button type="button" class="btn soft small" data-hm-went>🎉 Gittik!</button>' : ''}
          ${p.masal && K.uyku ? `<button type="button" class="btn ghost small" data-hm-masal="${K.esc(p.masal)}">🌙 Masalını dinle</button>` : ''}
          ${p.row && p.who === mine() && !g ? '<button type="button" class="linkish" data-hm-del>Sil</button>' : ''}</div>` : ''}</div></div>`;
  }
  function list() {
    const box = K.$('#hmList', root);
    const ps = pins();
    const gw = ps.filter((p) => went(p.ref)), hy = ps.filter((p) => p.kind === 'hayal' && !went(p.ref)), an = ps.filter((p) => p.kind === 'ani' && !went(p.ref));
    const a = homeOf('me');
    const sec = (t, l) => (l.length ? `<p class="card-eyebrow">${t} · ${l.length}</p><div class="hm-chips">${l.map((p) => `<button type="button" class="hm-chip ${loved(p.ref, 'me') && loved(p.ref, 'her') ? 'both' : ''}" data-hm-go="${K.esc(p.ref)}"><span>${K.esc(p.emoji || '📍')}</span><b>${K.esc(p.name)}</b>${a ? `<small>${K.num(km(a, p))} km</small>` : ''}</button>`).join('')}</div>` : '');
    box.innerHTML = sec('Hayallerimiz', hy) + sec('Gittiklerimiz', gw) + sec('Anılar', an);
    const st = K.$('#hmStats', root);
    st.innerHTML = `<span>🗺️ <b>${hy.length}</b> hayal</span><span>🎉 <b>${gw.length}</b> gittik</span><span>🌟 <b>${ps.filter((p) => loved(p.ref, 'me') && loved(p.ref, 'her')).length}</b> ikimiz de</span><span>✈️ <b>${K.num(C.distanceKm || 1758)}</b> km arada</span>`;
  }
  function refresh() {
    if (!root || K.activeRoom !== 'harita' || !svg) return;
    drawLines();
    drawPins();
    card();
    list();
  }

  /* ---------- Eylemler ---------- */
  function addSheet(pre) {
    if (!K.cloud || !K.cloud.enabled) return K.fx.toast('İğne eklemek için bulut gerekiyor.');
    let pick = pre || null, kind = 'hayal', emo = (pre && pre.emoji) || '📍';
    const m = K.ui.modal({
      label: 'İğne ekle',
      cls: 'br-sheet hm-add',
      html: `<p class="card-eyebrow">📍 Yeni iğne</p><h2>${pre ? 'Seçtiğin yer' : 'Nereye?'}</h2>
        ${pre ? '' : `<input class="input" data-hm-q placeholder="Şehir ya da yer ara: Paris, Şəki, Santorini..."><div class="hm-res" data-hm-res></div><button type="button" class="btn ghost small" data-hm-tap>👆 Haritaya dokunarak seç</button>`}
        <div class="hm-form" ${pre ? '' : 'hidden'}><input class="input" data-hm-name maxlength="40" placeholder="Adı" value="${K.esc((pre && pre.name) || '')}">
          <div class="br-chips" data-hm-kind><button type="button" class="chip on" data-k="hayal">💭 Birlikte gidelim</button><button type="button" class="chip" data-k="ani">📷 Bir anı</button></div>
          <div class="hm-emos">${EMO.map((e) => `<button type="button" class="${e === emo ? 'on' : ''}" data-e="${e}">${e}</button>`).join('')}</div>
          <input class="input" data-hm-note maxlength="140" placeholder="Bir not ya da söz (isteğe bağlı)">
          <button type="button" class="btn red" data-hm-save>📍 İğneyi tak</button></div>`,
    });
    const form = K.$('.hm-form', m.body);
    const showForm = (p) => {
      pick = p;
      form.hidden = false;
      K.$('[data-hm-name]', m.body).value = p.name;
      emo = p.emoji || '📍';
      K.$$('.hm-emos button', m.body).forEach((b) => b.classList.toggle('on', b.dataset.e === emo));
      K.$('h2', m.body).textContent = `${p.name}${p.place ? ' · ' + p.place : ''}`;
    };
    const q = K.$('[data-hm-q]', m.body);
    const norm = (s) => s.toLocaleLowerCase('tr').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/ı/g, 'i').replace(/ə/g, 'e');
    q &&
      q.addEventListener('input', () => {
        const t = norm(q.value.trim());
        K.$('[data-hm-res]', m.body).innerHTML = t
          ? GAZ.filter((g) => norm(g[0] + ' ' + g[1]).includes(t))
              .slice(0, 8)
              .map((g, i) => `<button type="button" data-hm-pick="${GAZ.indexOf(g)}"><span>${g[4]}</span><b>${K.esc(g[0])}</b><small>${K.esc(g[1])}</small></button>`)
              .join('') || `<p class="muted small">Listede yok. "Haritaya dokunarak seç" ile istediğin yeri işaretleyebilirsin.</p>`
          : '';
      });
    m.body.addEventListener('click', async (e) => {
      const pk = e.target.closest('[data-hm-pick]');
      if (pk) {
        const g = GAZ[+pk.dataset.hmPick];
        return showForm({ name: g[0], place: g[1], lat: g[2], lng: g[3], emoji: g[4] });
      }
      if (e.target.closest('[data-hm-tap]')) {
        m.close();
        placing = true;
        root.classList.add('hm-placing');
        K.fx.toast('👆 Haritada bir yere dokun.', { duration: 3000, log: false });
        return;
      }
      const kb = e.target.closest('[data-k]');
      if (kb) {
        kind = kb.dataset.k;
        return K.$$('[data-k]', m.body).forEach((b) => b.classList.toggle('on', b === kb));
      }
      const eb = e.target.closest('[data-e]');
      if (eb) {
        emo = eb.dataset.e;
        return K.$$('.hm-emos button', m.body).forEach((b) => b.classList.toggle('on', b === eb));
      }
      const sv = e.target.closest('[data-hm-save]');
      if (!sv || !pick) return;
      const name = K.$('[data-hm-name]', m.body).value.trim() || pick.name || 'Bir yer';
      sv.disabled = true;
      const r = await K.cloud.add('pin', { name, place: pick.place || '', lat: +pick.lat.toFixed(4), lng: +pick.lng.toFixed(4), emoji: emo, kind, note: K.$('[data-hm-note]', m.body).value.trim() });
      if (!r) return (sv.disabled = false), K.fx.toast('Eklenemedi.');
      push(r);
      // Ekleyen zaten istiyor
      if (kind === 'hayal') push(await K.cloud.add('pinsev', { ref: r.id }));
      m.close();
      K.audio.sfx.sparkle();
      K.stickers.award('harita');
      K.ping(`📍 ${K.meName()} haritamıza bir iğne taktı: ${name}`, kind === 'hayal' ? 'Sen de istiyorsan kalbe dokun.' : r.data.note || 'Bir anı.', ['round_pushpin'], { click: K.roomUrl('harita') });
      select(r.id, true);
      list();
    });
  }
  async function love(ref) {
    const mineL = loves(ref).find((r) => r.who === mine());
    if (mineL) {
      await K.cloud.remove(mineL.id);
      rows = rows.filter((x) => x.id !== mineL.id);
    } else {
      const r = await K.cloud.add('pinsev', { ref });
      push(r);
      K.audio.sfx.pop();
      const p = all().find((x) => x.ref === ref);
      if (loved(ref, other())) K.fx.toast('🌟 <b>İkimiz de istiyoruz.</b>', { duration: 2500 });
      else if (p) K.ping(`💗 ${K.meName()} "${p.name}" için "ben de istiyorum" dedi`, 'Bizim Haritamız', ['heart'], { click: K.roomUrl('harita') });
    }
    refresh();
  }
  function wentSheet(ref) {
    const p = all().find((x) => x.ref === ref);
    if (!p) return;
    const m = K.ui.modal({
      label: 'Gittik!',
      cls: 'br-sheet',
      html: `<p class="card-eyebrow">🎉 Hayal gerçek oldu</p><h2>${K.esc(p.emoji || '')} ${K.esc(p.name)}</h2><input class="input" maxlength="140" placeholder="Bir satır: nasıldı?"><button type="button" class="btn red" data-go>🎉 Gittik!</button>`,
    });
    m.body.addEventListener('click', async (e) => {
      const b = e.target.closest('[data-go]');
      if (!b) return;
      b.disabled = true;
      const r = await K.cloud.add('pingittik', { ref, note: K.$('input', m.body).value.trim(), day: T.todayKey() });
      if (!r) return (b.disabled = false);
      push(r);
      m.close();
      K.fx.confetti({ count: 120 });
      K.audio.sfx.success();
      K.ping(`🎉 ${p.name}: gittik!`, r.data.note || 'Haritamızda bir hayal daha gerçek oldu.', ['tada'], { click: K.roomUrl('harita') });
      refresh();
    });
  }

  K.on('cloud', async (ok) => {
    if (!ok) return;
    rows = await K.cloud.many(['pin', 'pinsev', 'pingittik'], { limit: 1000 });
    loaded = true;
    ['pin', 'pinsev', 'pingittik'].forEach((k) =>
      K.cloud.on(k, (r) => {
        if (!push(r)) return;
        if (r.who !== mine() && k === 'pin') K.fx.toast(`📍 <b>${K.esc(nameOf(r.who))} haritamıza bir iğne taktı:</b> ${K.esc(r.data.emoji || '')} ${K.esc(r.data.name)} <a href="#harita">Bak</a>`, { duration: 7000 });
        refresh();
      })
    );
    K.cloud.on('deleted', ({ id }) => rows.some((r) => r.id === id) && ((rows = rows.filter((r) => r.id !== id)), refresh()));
  });
  K.harita = { count: () => pins().length, dreams: () => pins().filter((p) => p.kind === 'hayal' && !went(p.ref)).length, went: () => pins().filter((p) => went(p.ref)).length, places: () => pins().filter((p) => p.kind === 'hayal').map((p) => ({ ref: p.ref, name: p.name, place: p.place || '', emoji: p.emoji || '📍' })) };

  K.room({
    id: 'harita',
    wing: 'anilar',
    title: 'Bizim Haritamız',
    sub: 'İki şehir, aradaki yol ve hayallerimiz',
    icon: 'map',
    color: '#DDF0FF',
    hidden: () => !D.harita,
    init(el) {
      root = el;
      el.innerHTML = `<div class="room-intro">${K.paras(HM().intro || [])}</div>
        <p class="hm-stats" id="hmStats"></p>
        <section class="hm-wrap"><div class="hm-map" id="hmMap"><p class="muted center">Harita yükleniyor...</p></div>
          <div class="hm-views">${[['yol', 'Bizim yol'], ['avrupa', 'Avrupa'], ['dunya', 'Dünya'], ['hepsi', 'Hepsi']].map(([k, l]) => `<button type="button" data-hm-view="${k}">${l}</button>`).join('')}</div>
          <button type="button" class="hm-add btn red small" data-hm-add>${A.ui('plus')} İğne ekle</button><p class="hm-placing-tip">👆 Haritada bir yere dokun</p></section>
        <section class="card hm-card" id="hmCard"></section>
        <section class="card hm-list" id="hmList"></section>`;
      el.addEventListener('click', (e) => {
        const v = e.target.closest('[data-hm-view]');
        if (v && svg) return fly(VIEWS[v.dataset.hmView]());
        if (e.target.closest('[data-hm-add]')) return addSheet(null);
        const g = e.target.closest('[data-hm-go]');
        if (g) {
          K.$('#hmMap', el).scrollIntoView({ block: 'center', behavior: K.reduced ? 'auto' : 'smooth' });
          return select(g.dataset.hmGo, true);
        }
        if (e.target.closest('[data-hm-love]')) return sel && love(sel);
        if (e.target.closest('[data-hm-went]')) return sel && wentSheet(sel);
        const ms = e.target.closest('[data-hm-masal]');
        if (ms) return K.go('uyku'), setTimeout(() => K.uyku.open(ms.dataset.hmMasal), 600);
        if (e.target.closest('[data-hm-del]')) {
          const p = all().find((x) => x.ref === sel);
          if (!p || !p.row) return;
          K.cloud.remove(p.row.id);
          rows = rows.filter((r) => r.id !== p.row.id);
          sel = null;
          return refresh();
        }
      });
    },
    async enter() {
      try {
        await load();
      } catch (e) {
        K.$('#hmMap', root).innerHTML = '<p class="muted center">Harita yüklenemedi. İnterneti kontrol et.</p>';
        return;
      }
      if (!svg) {
        draw();
        bindGestures();
        setVB(VIEWS.yol(), true);
        setTimeout(() => K.activeRoom === 'harita' && fly(VIEWS.hepsi()), 900);
      }
      refresh();
    },
  });
})();
