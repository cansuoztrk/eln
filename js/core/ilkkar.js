/* Kale 2.0 — İlk Kar: iki şehirden birine kışın ilk kar düştüğünde (gerçek hava, Open-Meteo) ana salonda kar başlar ve
   bir kart çıkar: "İstanbul'a ilk kar düştü". Kardan adam sahnesinde ikiniz birlikte bir kardan adam yaparsınız:
   biriniz gövdeyi ve başı, öbürünüz atkıyı, burnu ve şapkayı koyar; her parça öbürünün ekranında da belirir.
   Her kış bir kardan adam albüme girer. Kayıtlar: ilkkar {kis, city}, kardanadam {kis, part} */
(function () {
  'use strict';
  const K = window.K;
  const A = K.art;
  const D = window.ELN;
  const C = D.config;
  const T = K.time;

  const mine = () => (K.isOwner() ? 'me' : 'her');
  const nameOf = (w) => (w === 'me' ? C.myPet : C.herPet);
  // Kış: Kasım'dan Mart'a; 2026 kışı → '2026-27'
  const season = () => {
    const p = T.baku();
    if (p.mo >= 11) return `${p.y}-${String(p.y + 1).slice(2)}`;
    if (p.mo <= 3) return `${p.y - 1}-${String(p.y).slice(2)}`;
    return '';
  };
  // [parça, ad, kim koyar ('her' ya da 'me')] — Eln gövdeyi ve başı yapar, Ardoş süsler
  const PARTS = [['govde', 'Gövde', 'her'], ['bas', 'Baş', 'her'], ['gozler', 'Gözler', 'her'], ['atki', 'Atkı', 'me'], ['burun', 'Havuç burun', 'me'], ['sapka', 'Şapka', 'me'], ['dugme', 'Düğmeler', 'her'], ['kalp', 'Kalp', 'me']];
  let first = [], parts = [], loaded = false, ov = null;
  const firstOf = (s) => first.find((r) => r.data.kis === s);
  const has = (s, p) => parts.some((r) => r.data.kis === s && r.data.part === p);

  K.on('gercekhava', async (w) => {
    const s = season();
    if (!s || !loaded || firstOf(s)) return;
    const cat = K.gercekhava.cat;
    const city = cat(w.ist && w.ist.code) === 'kar' ? 'ist' : cat(w.baku && w.baku.code) === 'kar' ? 'baku' : '';
    if (!city) return;
    const r = await K.cloud.add('ilkkar', { kis: s, city });
    if (r) {
      first.push(r);
      document.body.classList.add('ilkkar');
      K.renderSpecials && !K.activeRoom && K.renderSpecials();
      K.ping(`❄️ ${K.ek(city === 'ist' ? C.myCity : C.herCity, 'e')} ilk kar düştü`, 'Kalede kardan adam sahnesi açıldı. Gel, birlikte yapalım.', ['snowflake'], { click: K.roomUrl('') });
    }
  });
  function art(s) {
    const on = (p) => has(s, p);
    return `<svg class="ka-svg" viewBox="0 0 200 240" aria-hidden="true">
      <ellipse cx="100" cy="226" rx="80" ry="10" fill="#e8f2ff"/>
      ${on('govde') ? '<circle class="ka-p" cx="100" cy="170" r="52" fill="#fff" stroke="#c9d8ee" stroke-width="3"/>' : '<circle cx="100" cy="170" r="52" fill="none" stroke="#c9d8ee" stroke-width="2" stroke-dasharray="6 6"/>'}
      ${on('bas') ? '<circle class="ka-p" cx="100" cy="92" r="36" fill="#fff" stroke="#c9d8ee" stroke-width="3"/>' : '<circle cx="100" cy="92" r="36" fill="none" stroke="#c9d8ee" stroke-width="2" stroke-dasharray="6 6"/>'}
      ${on('gozler') ? '<g class="ka-p" fill="#2b2024"><circle cx="88" cy="84" r="4.5"/><circle cx="112" cy="84" r="4.5"/></g>' : ''}
      ${on('burun') ? '<path class="ka-p" d="M100 94 L128 100 L100 102 Z" fill="#ff8a1f"/>' : ''}
      ${on('atki') ? '<g class="ka-p"><path d="M64 120 Q100 136 136 120 L136 132 Q100 148 64 132 Z" fill="#e3174d"/><path d="M118 130 L124 168 L110 166 L108 132 Z" fill="#e3174d"/><path d="M70 124 h6 M86 128 h6 M102 130 h6 M118 128 h6" stroke="#fff" stroke-width="3"/></g>' : ''}
      ${on('sapka') ? '<g class="ka-p"><rect x="70" y="52" width="60" height="8" rx="3" fill="#4a2138"/><rect x="80" y="18" width="40" height="38" rx="4" fill="#4a2138"/><rect x="80" y="44" width="40" height="7" fill="#ff8fb8"/></g>' : ''}
      ${on('dugme') ? '<g class="ka-p" fill="#4a2138"><circle cx="100" cy="148" r="4.5"/><circle cx="100" cy="168" r="4.5"/><circle cx="100" cy="188" r="4.5"/></g>' : ''}
      ${on('kalp') ? '<path class="ka-p" d="M78 160 c-6 -8 -18 -4 -14 6 c3 6 14 12 14 12 s11 -6 14 -12 c4 -10 -8 -14 -14 -6 z" fill="#ff5c8a"/>' : ''}
    </svg>`;
  }
  function scene() {
    const s = season();
    if (!s) return;
    if (ov) ov.close();
    ov = K.ui.modal({
      label: 'Kardan adam',
      cls: 'ka-sheet',
      html: `<div class="ka-kar" aria-hidden="true">${Array.from({ length: 26 }, (_, i) => `<i style="left:${(i * 37) % 100}%;--d:${(i % 9) * 0.6}s;--t:${5 + (i % 5)}s"></i>`).join('')}</div>
        <p class="card-eyebrow">❄️ ${firstOf(s) ? `${K.esc(K.ek(firstOf(s).data.city === 'ist' ? C.myCity : C.herCity, 'e'))} ilk kar düştü` : `${s} kışı`}</p><h2>Birlikte kardan adam</h2>
        <div class="ka-sahne" id="kaSahne">${art(s)}</div>
        <p class="muted small">${K.esc(C.herPet)} gövdeyi, başı, gözleri ve düğmeleri; ${K.esc(C.myPet)} atkıyı, burnu, şapkayı ve kalbi koyar.</p>
        <div class="ka-parcalar" id="kaParca"></div>`,
      onClose: () => (ov = null),
    });
    draw();
    ov.body.addEventListener('click', async (e) => {
      const b = e.target.closest('[data-ka]');
      if (!b || b.disabled) return;
      b.disabled = true;
      const r = await K.cloud.add('kardanadam', { kis: s, part: b.dataset.ka });
      if (r) parts.push(r);
      K.audio.sfx.pop();
      K.cloud.send('kardanadam', { part: b.dataset.ka });
      draw();
      if (PARTS.every(([p]) => has(s, p))) {
        K.fx.confetti({ count: 120 });
        K.audio.sfx.success();
        K.stickers.award('kardanadam');
      }
    });
  }
  function draw() {
    if (!ov) return;
    const s = season();
    K.$('#kaSahne', ov.body).innerHTML = art(s);
    K.$('#kaParca', ov.body).innerHTML = PARTS.map(([p, n, w]) => `<button type="button" class="ka-btn ${has(s, p) ? 'ok' : ''}" data-ka="${p}" ${has(s, p) || w !== mine() ? 'disabled' : ''}>${has(s, p) ? '✓ ' : ''}${n}<small>${w === mine() ? 'sen' : K.esc(nameOf(w))}</small></button>`).join('');
  }
  K.on('cloud', async (ok) => {
    if (!ok) return;
    [first, parts] = await Promise.all([K.cloud.list('ilkkar', 50), K.cloud.list('kardanadam', 200)]);
    loaded = true;
    const s = season();
    if (s && firstOf(s)) document.body.classList.add('ilkkar');
    K.cloud.on('ilkkar', (r) => first.some((x) => x.id === r.id) || (first.push(r), document.body.classList.add('ilkkar')));
    K.cloud.on('kardanadam', (r) => {
      if (parts.some((x) => x.id === r.id)) return;
      parts.push(r);
      draw();
    });
    const w = K.gercekhava && K.gercekhava.now();
    w && K.emit('gercekhava', w);
  });
  K.specialHooks = (K.specialHooks || []).concat(() => {
    const s = season();
    const f = s && firstOf(s);
    if (!f || PARTS.every(([p]) => has(s, p))) return [];
    const waiting = PARTS.filter(([p, , w]) => w === mine() && !has(s, p)).length;
    return [{ key: 'ilkkar', icon: 'snow', title: `❄️ ${K.ek(f.data.city === 'ist' ? C.myCity : C.herCity, 'e')} ilk kar düştü`, text: waiting ? `Kardan adamın ${waiting} parçası seni bekliyor.` : `Senin parçaların tamam; ${nameOf(mine() === 'me' ? 'her' : 'me')} kendi parçalarını koyunca kardan adam bitiyor.`, run: scene, cta: 'Kardan adam yap' }];
  });
  K.ilkkar = { scene, season, art };
})();
