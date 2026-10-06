/* Oda: Ortak Boyama — Kitty'nin, iki kulenin, kedimizin, zambakların ve kalp kalesinin çizgi resimleri. İkiniz aynı
   sayfayı aynı anda boyarsınız: bir bölgeye dokunup renk seçince öbürünün ekranında da o renge boyanır. Biten sayfalar
   boyama kitabımızda birikir. Kayıtlar: boya {page, r, c} (bir bölgenin son rengi geçerli) */
(function () {
  'use strict';
  const K = window.K;
  const A = K.art;
  const D = window.ELN;
  const C = D.config;

  const mine = () => (K.isOwner() ? 'me' : 'her');
  const nameOf = (w) => (w === 'me' ? C.myPet : C.herPet);
  const RENK = ['#FF8FB8', '#E3174D', '#FFD6E5', '#CDB8FF', '#8F73E6', '#BFE6FF', '#5BB8F0', '#C8F2E1', '#3FA37A', '#FFCF3F', '#FF9F1A', '#A9714F', '#FFFFFF', '#4A2138'];
  // Sayfalar: [kimlik, ad, bölgeler: [id, svg şekli]]
  const p = (id, d) => [id, `<path d="${d}"/>`];
  const c = (id, cx, cy, r) => [id, `<circle cx="${cx}" cy="${cy}" r="${r}"/>`];
  const e = (id, cx, cy, rx, ry, rot = 0) => [id, `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" transform="rotate(${rot} ${cx} ${cy})"/>`];
  const PAGES = [
    ['kitty', 'Kitty ve fiyonk', [
      p('fon', 'M0 0 H300 V300 H0 Z'),
      e('kulakS', 92, 92, 34, 40, -25), e('kulakD', 208, 92, 34, 40, 25),
      e('bas', 150, 170, 112, 92),
      e('fiyonkS', 212, 84, 34, 24, -20), e('fiyonkD', 268, 104, 28, 22, 30), c('dugum', 240, 96, 14),
      e('gozS', 108, 172, 9, 13), e('gozD', 192, 172, 9, 13), e('burun', 150, 196, 11, 8),
      e('yanakS', 84, 206, 18, 11), e('yanakD', 216, 206, 18, 11),
    ]],
    ['kuleler', 'İki kule', [
      p('gok', 'M0 0 H300 V190 H0 Z'), c('gunes', 150, 60, 28),
      p('deniz', 'M0 190 H300 V300 H0 Z'), p('dalga', 'M0 230 Q37 214 75 230 T150 230 T225 230 T300 230 V250 Q262 236 225 250 T150 250 T75 250 T0 250 Z'),
      p('kizK', 'M52 196 V110 H96 V196 Z'), p('kizCati', 'M46 110 L74 64 L102 110 Z'), p('kizPen', 'M66 130 h16 v22 h-16 Z'),
      p('qizK', 'M200 196 V84 C200 70 252 70 252 84 V196 Z'), p('qizUst', 'M196 84 h60 v14 h-60 Z'), p('qizPen', 'M218 120 h16 v24 h-16 Z'),
      p('kopru', 'M96 140 Q150 100 200 140 L200 148 Q150 110 96 148 Z'),
    ]],
    ['pamuk', 'Kedimiz', [
      p('fon', 'M0 0 H300 V300 H0 Z'),
      p('govde', 'M70 270 C50 190 90 150 150 150 C210 150 250 190 230 270 Z'),
      c('kafa', 150, 120, 62), p('kulakS', 'M104 82 L96 30 L140 62 Z'), p('kulakD', 'M196 82 L204 30 L160 62 Z'),
      p('ickulakS', 'M108 70 L104 46 L128 62 Z'), p('ickulakD', 'M192 70 L196 46 L172 62 Z'),
      p('kuyruk', 'M228 250 C280 240 290 190 262 170 C276 196 262 226 222 232 Z'),
      c('yumak', 64, 250, 30), p('ip', 'M90 256 C120 270 140 260 160 276 L156 282 C136 268 116 276 86 262 Z'),
      e('gozS', 128, 116, 8, 11), e('gozD', 172, 116, 8, 11), p('burun', 'M142 136 h16 l-8 9 Z'),
    ]],
    ['zambak', 'Zambak bahçesi', [
      p('gok', 'M0 0 H300 V220 H0 Z'), c('gunes', 250, 52, 30),
      p('toprak', 'M0 220 H300 V300 H0 Z'),
      p('saksi', 'M104 300 L96 236 H204 L196 300 Z'), p('sap', 'M146 236 V140 H154 V236 Z'),
      p('yaprakS', 'M146 200 C110 196 98 172 104 160 C120 170 140 180 146 196 Z'), p('yaprakD', 'M154 186 C190 182 202 158 196 146 C180 156 160 166 154 182 Z'),
      e('t1', 150, 96, 14, 40, 0), e('t2', 120, 112, 14, 38, -50), e('t3', 180, 112, 14, 38, 50), e('t4', 128, 136, 12, 30, -110), e('t5', 172, 136, 12, 30, 110), c('gobek', 150, 124, 10),
    ]],
    ['kalpkale', 'Kalp kalesi', [
      p('gok', 'M0 0 H300 V300 H0 Z'),
      p('sur', 'M40 280 V170 H260 V280 Z'), p('kuleS', 'M30 280 V120 H80 V280 Z'), p('kuleD', 'M220 280 V120 H270 V280 Z'),
      p('catiS', 'M24 120 L55 70 L86 120 Z'), p('catiD', 'M214 120 L245 70 L276 120 Z'),
      p('bayrakS', 'M55 70 V40 L80 48 L55 56 Z'), p('bayrakD', 'M245 70 V40 L270 48 L245 56 Z'),
      p('kapi', 'M126 280 V226 C126 200 174 200 174 226 V280 Z'),
      p('kalp', 'M150 200 C118 176 116 150 134 146 C142 144 150 152 150 158 C150 152 158 144 166 146 C184 150 182 176 150 200 Z'),
      p('penS', 'M46 150 h18 v22 h-18 Z'), p('penD', 'M236 150 h18 v22 h-18 Z'),
    ]],
  ];
  let rows = [], loaded = false, root = null, page = 'kitty', color = RENK[0];
  const fillOf = (pg) => {
    const m = {};
    rows.filter((r) => r.data.page === pg).sort((a, b) => a.at - b.at).forEach((r) => (m[r.data.r] = r.data.c));
    return m;
  };
  const pageDef = (id) => PAGES.find((x) => x[0] === id) || PAGES[0];
  const done = (id) => {
    const f = fillOf(id);
    return pageDef(id)[2].every(([r]) => f[r] && f[r] !== '#FFFFFF');
  };
  function art(id, cls = '') {
    const f = fillOf(id);
    return `<svg class="by-svg ${cls}" viewBox="0 0 300 300" role="img" aria-label="${K.esc(pageDef(id)[1])}">${pageDef(id)[2].map(([r, shape]) => shape.replace(/^<(\w+)/, `<$1 data-by="${r}" fill="${f[r] || '#FFFFFF'}"`)).join('')}</svg>`;
  }
  function render() {
    if (!root || K.activeRoom !== 'boyama') return;
    K.$('#bySayfalar', root).innerHTML = PAGES.map(([id, n]) => `<button type="button" class="by-sekme ${id === page ? 'on' : ''}" data-by-sayfa="${id}">${art(id, 'mini')}<small>${K.esc(n)}${done(id) ? ' ✓' : ''}</small></button>`).join('');
    K.$('#byTuval', root).innerHTML = art(page);
    K.$('#byRenk', root).innerHTML = RENK.map((r) => `<button type="button" class="by-renk ${r === color ? 'on' : ''}" data-by-renk="${r}" style="--c:${r}" aria-label="Renk ${r}"></button>`).join('');
    const together = K.yan && K.yan.same && K.yan.same();
    K.$('#byDurum', root).textContent = done(page) ? '🎉 Bu sayfa bitti; boyama kitabımızda.' : together ? `🖍️ ${nameOf(mine() === 'me' ? 'her' : 'me')} da burada; birlikte boyuyorsunuz.` : 'Bir bölgeye dokun, seçili renge boyansın.';
    K.$('#byKitap', root).innerHTML = PAGES.filter(([id]) => done(id)).map(([id, n]) => `<figure>${art(id, 'mini')}<figcaption>${K.esc(n)}</figcaption></figure>`).join('') || '<p class="muted small">Biten sayfalar burada birikecek.</p>';
  }
  async function paint(r) {
    const before = done(page);
    const row = await K.cloud.add('boya', { page, r, c: color });
    if (row) rows.push(row);
    K.audio.sfx.tap();
    render();
    if (!before && done(page)) {
      K.fx.confetti({ count: 80 });
      K.stickers.award('boyama');
    }
  }
  K.on('cloud', async (ok) => {
    if (!ok) return;
    rows = await K.cloud.list('boya', 4000);
    loaded = true;
    K.cloud.on('boya', (r) => {
      if (rows.some((x) => x.id === r.id)) return;
      rows.push(r);
      if (K.activeRoom === 'boyama' && r.data.page === page) {
        const el = K.$(`#byTuval [data-by="${r.data.r}"]`, root);
        el && el.setAttribute('fill', r.data.c);
        el && el.classList.add('by-yeni');
      }
      render();
    });
  });
  K.room({
    id: 'boyama',
    wing: 'oyun',
    title: 'Ortak Boyama',
    sub: 'Aynı sayfa, iki fırça',
    icon: 'palette',
    color: '#FFF0F6',
    hidden: () => !K.cloud || !K.cloud.enabled,
    init(el) {
      root = el;
      el.innerHTML = `<div class="room-intro"><p>Kitty, iki kule, kedimiz, zambaklar ve kalp kalesi. İkimiz aynı sayfayı aynı anda boyuyoruz: bir bölgeye dokununca öbürünün ekranında da o renge boyanıyor.</p></div>
        <div class="by-sayfalar" id="bySayfalar"></div>
        <section class="card by-kart"><div class="by-tuval" id="byTuval"></div><div class="by-renkler" id="byRenk"></div><p class="muted small center" id="byDurum"></p></section>
        <section class="card"><p class="card-eyebrow">Boyama kitabımız</p><div class="by-kitap" id="byKitap"></div></section>`;
      el.addEventListener('click', (e) => {
        const s = e.target.closest('[data-by-sayfa]');
        if (s) return (page = s.dataset.bySayfa), render();
        const r = e.target.closest('[data-by-renk]');
        if (r) return (color = r.dataset.byRenk), render();
        const b = e.target.closest('#byTuval [data-by]');
        b && paint(b.dataset.by);
      });
    },
    enter() {
      render();
    },
  });
})();
