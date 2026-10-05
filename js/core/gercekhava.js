/* Kale 2.0 — Gerçek Hava ve Aynı Gökyüzü. Ana salonun gökyüzü iki şehrin o anki gerçek havasını taşır: sol yarı
   İstanbul, sağ yarı Bakü (Open-Meteo, K.weather). Yağmur yağıyorsa o yarıda damlalar, kar varsa taneler, sis varsa
   bir tül, açıksa sıcak bir ışık. Kulelerin altındaki şehir etiketinde derece. İki şehrin havası aynı türdense
   ("ikinizin de üstünde yağmur var") ana salonda kart ve çıkartma; günde bir kez kayda geçer: aynigok {day, cat} */
(function () {
  'use strict';
  const K = window.K;
  const D = window.ELN;
  const C = D.config;
  const T = K.time;

  const AG = () => D.aynigok || { lines: {} };
  const EMO = { acik: '☀️', bulut: '☁️', sis: '🌫️', yagmur: '🌧️', kar: '❄️', firtina: '⛈️' };
  const cat = (code) => {
    if (code == null) return null;
    if (code <= 1) return 'acik';
    if (code <= 3) return 'bulut';
    if (code === 45 || code === 48) return 'sis';
    if (code >= 95) return 'firtina';
    if ((code >= 71 && code <= 77) || code === 85 || code === 86) return 'kar';
    if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) return 'yagmur';
    return 'bulut';
  };
  let w = null, same = null, rows = [], loaded = false;

  function layer(side, c) {
    if (!c) return '';
    const n = K.reduced ? 6 : c === 'kar' ? 18 : 22;
    const drops = c === 'yagmur' || c === 'firtina' || c === 'kar' ? Array.from({ length: n }, (_, i) => `<i style="left:${((i * 37) % 100).toFixed(0)}%;--d:${((i * 0.29) % 1.4).toFixed(2)}s;--t:${(c === 'kar' ? 5 + (i % 4) : 0.8 + (i % 3) * 0.2).toFixed(1)}s"></i>`).join('') : '';
    return `<div class="rw-half rw-${side} rw-${c}" aria-hidden="true">${drops}${c === 'firtina' ? '<b class="rw-flash"></b>' : ''}${c === 'sis' ? '<b class="rw-fog"></b><b class="rw-fog f2"></b>' : ''}${c === 'acik' ? '<b class="rw-glow"></b>' : ''}</div>`;
  }
  function paint() {
    const sky = K.$('#hero .hero-sky');
    if (!sky || !w) return;
    const ci = cat(w.ist && w.ist.code), cb = cat(w.baku && w.baku.code);
    let el = K.$('.rw', sky);
    if (!el) {
      el = K.el('<div class="rw"></div>');
      sky.appendChild(el);
    }
    el.innerHTML = layer('l', ci) + layer('r', cb);
    const hero = K.$('#hero');
    hero.classList.toggle('rw-grey', ['yagmur', 'firtina', 'sis'].includes(ci) && ['yagmur', 'firtina', 'sis'].includes(cb));
    const tags = K.$$('#hero .scene-tower .city-tag');
    [[tags[0], w.ist, ci], [tags[tags.length - 1], w.baku, cb]].forEach(([t, x, c]) => {
      if (!t || !x) return;
      let b = K.$('.rw-t', t);
      if (!b) {
        b = K.el('<b class="rw-t"></b>');
        t.appendChild(b);
      }
      b.textContent = `${EMO[c] || ''} ${x.temp}°`;
    });
  }
  async function refresh() {
    if (!K.weather || !K.$('#hero')) return;
    const x = await K.weather();
    if (!x) return;
    w = x;
    paint();
    const ci = cat(w.ist.code), cb = cat(w.baku.code);
    same = ci && ci === cb ? ci : null;
    if (same && loaded) note();
    K.renderSpecials && !K.activeRoom && K.renderSpecials();
  }
  async function note() {
    const day = T.todayKey();
    if (rows.some((r) => r.data.day === day)) return;
    if (K.store.get('aynigokSeen') !== day) K.stickers.award('aynigok');
    if (!K.cloud || !K.cloud.enabled || K.previewDate) return;
    rows.push({ id: 'tmp', data: { day, cat: same } });
    const r = await K.cloud.add('aynigok', { day, cat: same });
    rows = rows.filter((x) => x.id !== 'tmp');
    r && rows.push(r);
  }
  K.on('built', () => setTimeout(refresh, 900));
  if (K.$('#hero')) setTimeout(refresh, 900);
  setInterval(() => document.visibilityState === 'visible' && refresh(), 20 * 60e3);
  K.on('cloud', async (ok) => {
    if (!ok) return;
    rows = await K.cloud.list('aynigok', 400);
    loaded = true;
    K.cloud.on('aynigok', (r) => rows.some((x) => x.id === r.id) || rows.push(r));
    if (same) note();
  });
  K.specialHooks = (K.specialHooks || []).concat(() => {
    if (!same || K.store.get('aynigokSeen') === T.todayKey() + same) return [];
    const line = (AG().lines || {})[same] || '';
    return [{ icon: 'sky', title: `${EMO[same]} Aynı gökyüzü`, text: line, run: () => (K.store.set('aynigokSeen', T.todayKey() + same), K.fx.rain({ count: 30, shapes: same === 'kar' ? ['circle'] : ['heart'], colors: same === 'kar' ? ['#fff', '#DCEBFF'] : undefined }), K.renderSpecials()), cta: 'Birlikte bak' }];
  });
  K.gercekhava = { cat, now: () => w, same: () => same, count: () => rows.length };
})();
