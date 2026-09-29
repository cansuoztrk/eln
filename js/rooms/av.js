/* Oda: Kale Hazine Avı — kalenin odalarına saklanmış dokuz altın anahtar. Her ipucu bir odayı tarif eder;
   o odaya girince anahtar bir köşede parlar. Dokuzu bulunca en derindeki sandık açılır (ve bana haber gelir). */
(function () {
  'use strict';
  const K = window.K;
  const A = K.art;
  const D = window.ELN;
  const C = D.config;
  const T = K.time;

  let root;
  const H = () => D.hazine || { intro: [], clues: [], prize: [] };
  const st = () => K.store.get('hunt', { started: false, step: 0, found: [] });
  const save = (s) => K.store.set('hunt', s);
  const done = () => st().step >= H().clues.length;

  const keySvg = `<svg viewBox="0 0 64 64" aria-hidden="true"><circle cx="20" cy="32" r="13" fill="#FFD34E" stroke="#8A5A00" stroke-width="4"/><circle cx="20" cy="32" r="5" fill="#FFF4C7" stroke="#8A5A00" stroke-width="3"/><path d="M33 32 H58 M50 32 V42 M42 32 V39" stroke="#8A5A00" stroke-width="5" stroke-linecap="round"/><path d="M33 32 H58" stroke="#FFD34E" stroke-width="2" stroke-linecap="round"/></svg>`;

  // Anahtarı o odanın rastgele bir köşesine koy
  K.on('room', ({ id, el }) => {
    if (!D.hazine || id === 'av') return;
    const s = st();
    if (!s.started || done()) return;
    const clue = H().clues[s.step];
    if (!clue || clue.room !== id || K.$('.hv-key', el)) return;
    const r = K.rng(T.dayNumber(T.now()) * 31 + s.step * 7);
    const b = K.el(`<button class="hv-key no-burst" aria-label="Altın anahtar" style="top:${(18 + r() * 60).toFixed(1)}%;${r() > 0.5 ? 'left' : 'right'}:${(4 + r() * 14).toFixed(1)}%">${keySvg}</button>`);
    el.appendChild(b);
    b.addEventListener('click', (e) => {
      e.stopPropagation();
      const s2 = st();
      s2.found.push(T.todayKey());
      s2.step++;
      save(s2);
      b.classList.add('got');
      setTimeout(() => b.remove(), 700);
      K.audio.sfx.success();
      K.fx.burst(e.clientX, e.clientY, { count: 14, shapes: ['star', 'spark'], colors: ['#FFD34E', '#FFF4C7', '#FF8FB8'] });
      const next = H().clues[s2.step];
      K.fx.toast(next ? `<b>${s2.step}. anahtar bulundu!</b> Sıradaki ipucu: "${K.esc(next.text)}"` : '<b>Dokuzuncu anahtar!</b> Hazine Avı odasına dön: sandık seni bekliyor.', { icon: keySvg, duration: 9000 });
      if (!next && !K.isOwner()) K.notify(`${C.herName} dokuz anahtarı da buldu`, 'Hazine sandığı açılmak üzere. Sandıktaki söz: ona gerçek dünyada bir hediye borçlusun.', ['key'], { priority: 5 });
    });
  });

  function render() {
    if (!root) return;
    const s = st();
    const clues = H().clues;
    K.$('#hvKeys', root).innerHTML = clues.map((_, i) => `<span class="hv-k ${i < s.step ? 'on' : ''}">${keySvg}</span>`).join('');
    const box = K.$('#hvNow', root);
    if (!s.started) {
      box.innerHTML = `<div class="actions" style="justify-content:center"><button class="btn red big" id="hvStart">${keySvg} Avı başlat</button></div>`;
      return;
    }
    if (done()) {
      box.innerHTML = `<div class="hv-chest ${s.opened ? 'open' : ''}" id="hvChest"><svg viewBox="0 0 200 150" aria-hidden="true">
          <rect x="20" y="70" width="160" height="70" rx="10" fill="#B9783E" stroke="#5A3A18" stroke-width="5"/>
          <path class="hv-lid" d="M20 72 C20 30 180 30 180 72 Z" fill="#D59A64" stroke="#5A3A18" stroke-width="5"/>
          <rect x="88" y="62" width="24" height="30" rx="4" fill="#FFD34E" stroke="#5A3A18" stroke-width="4"/>
          <path d="M20 100 H180" stroke="#5A3A18" stroke-width="4"/>
          <g class="hv-shine" fill="#FFF4C7">${[40, 70, 100, 130, 160].map((x, i) => `<circle cx="${x}" cy="${40 - (i % 2) * 14}" r="3"/>`).join('')}</g>
        </svg></div>
        ${s.opened ? `<article class="hv-prize">${K.paras(H().prize)}<p class="hv-sign">— ${K.esc(C.myPet)}</p></article>` : `<div class="actions" style="justify-content:center"><button class="btn red big" id="hvOpen">${keySvg} Sandığı aç</button></div>`}`;
      return;
    }
    const c = clues[s.step];
    box.innerHTML = `<article class="hv-clue"><p class="card-eyebrow">${s.step + 1}. ipucu</p><p class="hand">${K.esc(K.fill(c.text))}</p><p class="muted small">Doğru odaya girince anahtar bir köşede parlayacak. Gözünü dört aç.</p></article>`;
  }

  K.room({
    id: 'av',
    wing: 'hazine',
    title: 'Hazine Avı',
    sub: 'Dokuz altın anahtar, bir sandık',
    icon: 'key',
    color: '#FFF1C9',
    hidden: () => !D.hazine,
    badge: () => {
      if (!D.hazine) return '';
      const s = st();
      return !s.started ? 'Yeni' : done() ? (s.opened ? '' : 'Sandık!') : `${s.step}/${H().clues.length}`;
    },
    init(el) {
      root = el;
      el.innerHTML = `
        <div class="hv-map" aria-hidden="true">${A.kitty({ crown: true, eyes: 'happy' })}</div>
        <div class="room-intro">${K.paras(H().intro)}</div>
        <div class="hv-keys" id="hvKeys"></div>
        <div id="hvNow"></div>`;
      el.addEventListener('click', (e) => {
        if (e.target.closest('#hvStart')) {
          const s = st();
          s.started = true;
          save(s);
          K.audio.sfx.chime();
          render();
        }
        if (e.target.closest('#hvOpen')) {
          const s = st();
          s.opened = T.todayKey();
          save(s);
          K.stickers.award('hazine');
          K.fx.confetti({ count: 200, shapes: ['star', 'heart'], colors: ['#FFD34E', '#FFF4C7', '#FF8FB8', '#E3174D'] });
          K.audio.sfx.success();
          render();
        }
      });
    },
    enter() {
      render();
    },
  });
})();
