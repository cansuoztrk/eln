/* Oda: Gökyüzündeki Adımız — isimlerimizin harflerinden iki takımyıldız. Seçilen gecenin (bu gece, tanıştığımız gece,
   sevgili olduğumuz gece) Bakü gökyüzü gerçek yıldız konumlarıyla hesaplanır; her harfin köşesi o gece gökyüzünde
   ona en yakın parlak yıldıza bağlanır. Böylece "E" harfinin bir köşesi Vega, öbürü Deneb olur. Altında hangi
   harfin hangi yıldızlardan geçtiği yazar; poster telefona indirilebilir. Yeni kayıt tutmaz. */
(function () {
  'use strict';
  const K = window.K;
  const A = K.art;
  const D = window.ELN;
  const C = D.config;
  const T = K.time;

  // Çizgi harfler: her harf, 0..1 kutusunda çizgiler (x, y aşağı doğru)
  const F = {
    A: [[[0, 1], [0.5, 0], [1, 1]], [[0.22, 0.58], [0.78, 0.58]]], B: [[[0, 0], [0, 1], [0.75, 0.85], [0.75, 0.55], [0, 0.5], [0.7, 0.3], [0.65, 0.05], [0, 0]]],
    C: [[[1, 0.1], [0.4, 0], [0, 0.5], [0.4, 1], [1, 0.9]]], Ç: [[[1, 0.1], [0.4, 0], [0, 0.5], [0.4, 1], [1, 0.9]], [[0.45, 1], [0.4, 1.2]]],
    D: [[[0, 0], [0, 1], [0.7, 0.85], [1, 0.5], [0.7, 0.15], [0, 0]]], E: [[[1, 0], [0, 0], [0, 1], [1, 1]], [[0, 0.5], [0.75, 0.5]]],
    F: [[[1, 0], [0, 0], [0, 1]], [[0, 0.5], [0.7, 0.5]]], G: [[[1, 0.1], [0.4, 0], [0, 0.5], [0.4, 1], [1, 0.85], [1, 0.55], [0.6, 0.55]]],
    Ğ: [[[1, 0.1], [0.4, 0], [0, 0.5], [0.4, 1], [1, 0.85], [1, 0.55], [0.6, 0.55]], [[0.3, -0.25], [0.7, -0.25]]],
    H: [[[0, 0], [0, 1]], [[1, 0], [1, 1]], [[0, 0.5], [1, 0.5]]], I: [[[0.5, 0], [0.5, 1]]], İ: [[[0.5, 0.15], [0.5, 1]], [[0.5, -0.2], [0.5, -0.12]]],
    J: [[[1, 0], [1, 0.8], [0.5, 1], [0, 0.8]]], K: [[[0, 0], [0, 1]], [[1, 0], [0, 0.55], [1, 1]]], L: [[[0, 0], [0, 1], [1, 1]]],
    M: [[[0, 1], [0, 0], [0.5, 0.6], [1, 0], [1, 1]]], N: [[[0, 1], [0, 0], [1, 1], [1, 0]]], O: [[[0.5, 0], [0, 0.5], [0.5, 1], [1, 0.5], [0.5, 0]]],
    Ö: [[[0.5, 0], [0, 0.5], [0.5, 1], [1, 0.5], [0.5, 0]], [[0.3, -0.25], [0.7, -0.25]]], P: [[[0, 1], [0, 0], [0.8, 0.1], [0.8, 0.45], [0, 0.5]]],
    R: [[[0, 1], [0, 0], [0.8, 0.1], [0.8, 0.45], [0, 0.5], [1, 1]]], S: [[[1, 0.1], [0.4, 0], [0, 0.25], [1, 0.75], [0.6, 1], [0, 0.9]]],
    Ş: [[[1, 0.1], [0.4, 0], [0, 0.25], [1, 0.75], [0.6, 1], [0, 0.9]], [[0.55, 1], [0.45, 1.25]]], T: [[[0, 0], [1, 0]], [[0.5, 0], [0.5, 1]]],
    U: [[[0, 0], [0, 0.8], [0.5, 1], [1, 0.8], [1, 0]]], Ü: [[[0, 0], [0, 0.8], [0.5, 1], [1, 0.8], [1, 0]], [[0.3, -0.25], [0.7, -0.25]]],
    V: [[[0, 0], [0.5, 1], [1, 0]]], Y: [[[0, 0], [0.5, 0.5], [1, 0]], [[0.5, 0.5], [0.5, 1]]], Z: [[[0, 0], [1, 0], [0, 1], [1, 1]]],
  };
  const NIGHTS = () => [['bugece', 'Bu gece', T.todayKey()], ['sevgili', 'Sevgili olduğumuz gece', C.togetherDate], ['tanisma', 'Tanıştığımız gece', C.metDate]].filter((x) => x[2]);
  let root = null, night = 'bugece';
  const RAD = Math.PI / 180;
  function sky(day) {
    const [lat, lng] = K.gok.CITY.baku;
    const [y, m, d] = day.split('-').map(Number);
    const ms = Date.UTC(y, m - 1, d, 22 - C.tzBaku, 0);
    const J = ms / 864e5 + 2440587.5;
    const lst = (280.46061837 + 360.98564736629 * (J - 2451545.0) + lng) % 360;
    return K.yildizlar.STARS.map((s) => Object.assign({ name: s[0], mag: s[3], color: s[4] || '#fff' }, K.yildizlar.altAz(s[1] * 15, s[2], lst, lat))).filter((s) => s.alt > 8);
  }
  // Ufuk düzlemi: zenit ortada, ufuk çemberde (azimut: kuzey yukarı)
  const R = 300, CX = 320, CY = 320;
  const proj = (s) => {
    const r = ((90 - s.alt) / 90) * R;
    return [CX + Math.sin(s.az * RAD) * r * -1, CY - Math.cos(s.az * RAD) * r];
  };
  function name(word, stars, box, used) {
    const letters = [...word.toLocaleUpperCase('tr')].filter((c) => F[c]);
    const n = letters.length;
    const lw = box.w / n;
    const out = [];
    letters.forEach((ch, i) => {
      const x0 = box.x + i * lw + lw * 0.14, w = lw * 0.72;
      const strokes = F[ch].map((st) =>
        st.map(([x, y]) => {
          const p = [x0 + x * w, box.y + y * box.h];
          let best = null, bd = Infinity;
          stars.forEach((s) => {
            const dist = Math.hypot(s.p[0] - p[0], s.p[1] - p[1]) * (used.has(s.name) ? 1.35 : 1) * (1 + Math.max(0, s.mag) * 0.08);
            if (dist < bd) (bd = dist), (best = s);
          });
          used.add(best.name);
          return best;
        })
      );
      out.push({ ch, strokes, stars: [...new Set(strokes.flat().map((s) => s.name))] });
    });
    return out;
  }
  function poster(day) {
    const stars = sky(day).map((s) => Object.assign(s, { p: proj(s) }));
    const used = new Set();
    const her = name(C.herPet || 'ELN', stars, { x: 90, y: 150, w: 460, h: 120 }, used);
    const me = name(C.myPet || 'ARDA', stars, { x: 90, y: 380, w: 460, h: 120 }, used);
    const lines = (nm, cls) => nm.map((l) => l.strokes.map((st) => `<polyline class="${cls}" points="${st.map((s) => s.p.map((v) => v.toFixed(1)).join(',')).join(' ')}"/>`).join('')).join('');
    const svg = `<svg class="an-svg" viewBox="0 0 640 700" role="img" aria-label="Gökyüzündeki adımız">
      <rect width="640" height="700" fill="#120c2e"/><circle cx="${CX}" cy="${CY}" r="${R}" fill="#1b1442" stroke="#3a2f78" stroke-width="2"/>
      ${stars.map((s) => `<circle cx="${s.p[0].toFixed(1)}" cy="${s.p[1].toFixed(1)}" r="${Math.max(1, 3.4 - s.mag * 0.8).toFixed(1)}" fill="${s.color}"/>`).join('')}
      ${lines(her, 'an-her')}${lines(me, 'an-me')}
      ${[...used].map((n) => stars.find((s) => s.name === n)).map((s) => `<circle cx="${s.p[0].toFixed(1)}" cy="${s.p[1].toFixed(1)}" r="4.2" class="an-baglu"/>`).join('')}
      <text x="320" y="652" text-anchor="middle" class="an-alt">${K.esc(C.herCity)} · ${K.esc(T.fmt(day))} · 22:00</text><text x="${CX}" y="${CY - R - 6}" text-anchor="middle" class="an-yon">K</text>
    </svg>`;
    return { svg, her, me };
  }
  function render() {
    if (!root || K.activeRoom !== 'adimiz') return;
    const day = (NIGHTS().find((x) => x[0] === night) || NIGHTS()[0])[2];
    const p = poster(day);
    K.$('#anGece', root).innerHTML = NIGHTS().map(([id, n]) => `<button type="button" class="btn ${id === night ? 'red' : 'soft'} small" data-an="${id}">${n}</button>`).join('');
    K.$('#anPoster', root).innerHTML = p.svg;
    const list = (nm, who) => `<div class="an-liste ${who}"><b>${K.esc(who === 'her' ? C.herPet : C.myPet)}</b>${nm.map((l) => `<p><span>${K.esc(l.ch)}</span>${K.esc(l.stars.join(', '))}</p>`).join('')}</div>`;
    K.$('#anYildiz', root).innerHTML = list(p.her, 'her') + list(p.me, 'me') + look(p);
  }
  // Balkondan nereye bakılır: harflerin bağlandığı yıldızların ortalama yönü ve yüksekliği
  const YON = ['kuzey', 'kuzeydoğu', 'doğu', 'güneydoğu', 'güney', 'güneybatı', 'batı', 'kuzeybatı'];
  function look(p) {
    const st = [...new Set([...p.her, ...p.me].flatMap((l) => l.strokes.flat()))];
    if (!st.length) return '';
    const sx = st.reduce((a, s) => a + Math.sin(s.az * RAD), 0), cy = st.reduce((a, s) => a + Math.cos(s.az * RAD), 0);
    const az = (Math.atan2(sx, cy) / RAD + 360) % 360;
    const alt = Math.round(st.reduce((a, s) => a + s.alt, 0) / st.length);
    const yon = YON[Math.round(az / 45) % 8];
    const yuk = alt > 70 ? 'neredeyse tam tepene' : alt > 45 ? `ufkun ${alt}° yukarısına, başını epey kaldırarak` : `ufkun ${alt}° yukarısına`;
    return `<p class="an-bak">🔭 O gece saat 22:00'de balkondan <b>${yon}</b> yönüne, ${yuk} bak: isimlerimiz orada.</p>`;
  }
  async function save() {
    const svg = K.$('#anPoster svg', root);
    if (!svg) return;
    const img = await A.toImage(svg.outerHTML, 1280, 1400);
    if (!img) return K.fx.toast('Poster hazırlanamadı.');
    const c = document.createElement('canvas');
    c.width = 1280;
    c.height = 1400;
    c.getContext('2d').drawImage(img, 0, 0, 1280, 1400);
    K.download(c.toDataURL('image/png'), 'gokyuzundeki-adimiz.png');
    K.stickers.award('adimiz');
  }
  K.room({
    id: 'adimiz',
    wing: 'mevsim',
    title: 'Gökyüzündeki Adımız',
    sub: 'Gerçek yıldızlardan iki isim',
    icon: 'sky',
    color: '#E0DBFF',
    hidden: () => !K.yildizlar || !K.gok,
    init(el) {
      root = el;
      el.innerHTML = `<div class="room-intro"><p>İsimlerimizin harflerinden iki takımyıldız. Seçtiğin gecenin Bakü gökyüzü gerçek yıldız konumlarıyla hesaplanıyor; her harfin köşesi o gece ona en yakın parlak yıldıza bağlanıyor.</p></div>
        <div class="an-gece" id="anGece"></div><section class="card an-kart"><div id="anPoster"></div></section>
        <section class="card"><p class="card-eyebrow">Harf harf yıldızlar</p><div class="an-yildizlar" id="anYildiz"></div><div class="row center"><button type="button" class="btn soft small" data-an-indir>⬇️ Posteri indir</button></div></section>`;
      el.addEventListener('click', (e) => {
        const b = e.target.closest('[data-an]');
        if (b) return (night = b.dataset.an), render();
        e.target.closest('[data-an-indir]') && save();
      });
    },
    enter() {
      render();
      K.stickers.award('adimiz');
    },
  });
})();
