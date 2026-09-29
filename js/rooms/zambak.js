/* Oda: Zambak Bahçesi — onun çiçeği. Her gün bir kez sulanan saksı büyür; her yedi sulamada bir zambak açar ve bahçeye dikilir.
   Açan her zambağın yaprağında bir not var. Kale sahibi panelden (bulutla) zambak buketi gönderebilir; buketler vazoda durur.
   Ana salondaki "Zambağın" kartı da buradan. */
(function () {
  'use strict';
  const K = window.K;
  const A = K.art;
  const D = window.ELN;
  const C = D.config;
  const T = K.time;

  const COLORS = [
    ['#FF8FB8', '#FFD0E1', '#C7386F'],
    ['#FFF4F8', '#FFE1EC', '#E3174D'],
    ['#FFB38A', '#FFE2CF', '#C9573A'],
    ['#E3174D', '#FF8FB8', '#8C1033'],
    ['#FFD0E1', '#FFFFFF', '#F0578F'],
  ];
  let root, bouquets = [], reals = [];
  const Z = () => D.zambak || { notes: [] };
  const st = () => K.store.get('lily', { water: [], blooms: [] });
  const save = (s) => K.store.set('lily', s);
  const stage = (s) => s.water.length % 7; // 0: toprak, 1–2: filiz, 3–4: yapraklar, 5–6: tomurcuk

  /* ---------- Çizimler ---------- */
  function flower(c, x, y, sc = 1, open = 1) {
    const [p, p2, dot] = c;
    const petal = (rot, len, fill) => `<path transform="rotate(${rot})" d="M0 0 C${-7 * open} ${-len * 0.4} ${-6 * open} ${-len * 0.85} 0 ${-len} C${6 * open} ${-len * 0.85} ${7 * open} ${-len * 0.4} 0 0 Z" fill="${fill}" stroke="#4A2138" stroke-width="1.6"/>`;
    return `<g transform="translate(${x} ${y}) scale(${sc})">
      ${[-150, 150, 180].map((r) => petal(r, 20, p2)).join('')}
      ${[-60, 60, 0].map((r) => petal(r, 24, p)).join('')}
      <g fill="${dot}">${[-60, 60, 0].map((r) => `<g transform="rotate(${r})"><circle cy="-9" r="1.1"/><circle cx="2" cy="-13" r=".9"/><circle cx="-2" cy="-15" r=".9"/></g>`).join('')}</g>
      <g stroke="#9A6A20" stroke-width="1.1">${[-30, 0, 30].map((r) => `<path transform="rotate(${r})" d="M0 0 V-14"/>`).join('')}</g>
      <g fill="#C98A12">${[-30, 0, 30].map((r) => `<circle transform="rotate(${r})" cy="-15" r="1.8"/>`).join('')}</g>
    </g>`;
  }
  function plant(s, c) {
    const h = [6, 22, 34, 46, 56, 64, 70][s];
    const leaves = s >= 1 ? `<path d="M60 ${108 - h * 0.35} C46 ${100 - h * 0.35} 40 ${92 - h * 0.35} 42 ${84 - h * 0.35} C52 ${90 - h * 0.35} 58 ${98 - h * 0.35} 60 ${108 - h * 0.35} Z" fill="#7ED6A5" stroke="#2F6B4E" stroke-width="1.6"/>` : '';
    const leaves2 = s >= 3 ? `<path d="M60 ${108 - h * 0.6} C74 ${100 - h * 0.6} 80 ${92 - h * 0.6} 78 ${84 - h * 0.6} C68 ${90 - h * 0.6} 62 ${98 - h * 0.6} 60 ${108 - h * 0.6} Z" fill="#7ED6A5" stroke="#2F6B4E" stroke-width="1.6"/>` : '';
    const bud = s >= 5 ? `<path d="M60 ${108 - h - 2} C54 ${108 - h - 12} 56 ${108 - h - 24} 60 ${108 - h - 30} C64 ${108 - h - 24} 66 ${108 - h - 12} 60 ${108 - h - 2} Z" fill="${s === 6 ? c[0] : '#B8E6C9'}" stroke="#4A2138" stroke-width="1.6"/>` : '';
    return `${s >= 1 ? `<path d="M60 108 C60 ${108 - h * 0.5} 59 ${108 - h * 0.8} 60 ${108 - h}" fill="none" stroke="#3FA37A" stroke-width="3.2" stroke-linecap="round"/>` : `<circle cx="60" cy="104" r="3" fill="#8B5E3C"/>`}${leaves}${leaves2}${bud}`;
  }
  // Saksı: evre 0–6
  function pot(s, c = COLORS[0], cls = '') {
    return `<svg class="lily-pot ${cls}" viewBox="0 0 120 160" aria-hidden="true">
      ${s < 6 ? `<g class="lp-ghost" opacity=".13">${plant(6, c)}${flower(c, 60, 34, 1, 1)}</g>` : ''}
      <g class="lp-plant">${plant(s, c)}</g>
      <path d="M26 108 H94 L86 150 C85 154 82 156 78 156 H42 C38 156 35 154 34 150 Z" fill="#FF8FB8" stroke="#4A2138" stroke-width="3"/>
      <rect x="22" y="100" width="76" height="14" rx="5" fill="#FFB3CE" stroke="#4A2138" stroke-width="3"/>
      <ellipse cx="60" cy="102" rx="32" ry="4" fill="#6E4A34"/>
      <g transform="translate(60 132) scale(.22)">${A.bowShape('#E3174D', '#4A2138')}</g>
    </svg>`;
  }
  K.lilyPot = pot;
  function vase(n) {
    const k = Math.min(n, 9);
    const heads = Array.from({ length: k }, (_, i) => {
      const a = ((i - (k - 1) / 2) / Math.max(1, k - 1)) * 1.1;
      const x = 80 + Math.sin(a) * 52, y = 70 - Math.cos(a) * 36 + (i % 2) * 10;
      return `<path d="M80 128 Q${(80 + x) / 2} ${(128 + y) / 2 + 8} ${x} ${y}" fill="none" stroke="#3FA37A" stroke-width="2.4"/>${flower(COLORS[i % COLORS.length], x, y, 0.9)}`;
    }).join('');
    return `<svg class="lily-vase" viewBox="0 0 160 200" aria-hidden="true">${heads}
      <path d="M56 120 H104 C104 140 112 150 112 168 C112 186 98 194 80 194 C62 194 48 186 48 168 C48 150 56 140 56 120 Z" fill="#DDF3FF" stroke="#4A2138" stroke-width="3" opacity=".95"/>
      <path d="M58 150 C70 146 90 154 102 150" fill="none" stroke="#8FD3FF" stroke-width="3"/>
      <rect x="52" y="114" width="56" height="10" rx="4" fill="#FFE1EC" stroke="#4A2138" stroke-width="3"/>
    </svg>`;
  }

  /* ---------- Sulama ---------- */
  function water(fromHome) {
    const s = st();
    const today = T.todayKey();
    if (s.water.includes(today)) {
      K.fx.toast('Bugün zaten suladın. Zambaklar fazla suyu sevmez; yarın yine gel.', { icon: A.icon('lily') });
      return false;
    }
    s.water.push(today);
    K.audio.sfx.sparkle();
    K.vibrate(30);
    let bloomed = null;
    if (s.water.length % 7 === 0) {
      const i = s.blooms.length;
      bloomed = { day: today, c: i % COLORS.length, note: i % Math.max(1, Z().notes.length) };
      s.blooms.push(bloomed);
    }
    save(s);
    if (bloomed) {
      K.fx.rain({ count: 50, shapes: ['heart'], colors: ['#FF8FB8', '#FFD0E1', '#FFFFFF'] });
      K.audio.sfx.chime();
      K.stickers.award('zambak');
      const n = s.blooms.length;
      const f = C.florist;
      const every = (f && f.every) || 12;
      if (K.cloud && K.cloud.enabled) K.cloud.add('bloom', { n });
      // Her 12 zambakta bir: gerçek buket zamanı (ona sadece bir ipucu, sana çiçekçinin bilgileri)
      if (f && n % every === 0) {
        K.notify(`${C.herName}'un bahçesinde ${n}. zambak açtı`, `Söz verdiğin gerçek buketin zamanı: ${f.name} · ${f.hours} · ${f.phone}`, ['bouquet'], { click: f.url, priority: 5 });
        setTimeout(
          () =>
            K.ui.modal({
              label: 'On iki zambak',
              html: `<div class="lily-note"><svg viewBox="-40 -40 80 80" class="lily-big">${flower(COLORS[3], -12, 16, 1)}${flower(COLORS[0], 12, 12, 1.1)}${flower(COLORS[1], 0, 22, 1.2)}</svg><p class="card-eyebrow">${K.num(n)} zambak</p><p class="hand">Bahçen doldu. Bu bahçe sana bir şey hazırlıyor... Önümüzdeki günlerde kapına bir göz at.</p></div>`,
            }),
          fromHome ? 400 : 1200
        );
      } else K.notify(`${C.herName}'un zambağı açtı`, `Kaledeki ${n}. zambak açtı. Yedi gün boyunca sulayıp büyüttü.`, ['tulip']);
      setTimeout(() => showNote(bloomed, n), fromHome ? 200 : 900);
    } else {
      const left = 7 - stage(s);
      K.fx.toast(`Suladın. ${left === 1 ? 'Yarın açıyor!' : `Açmasına ${left} sulama kaldı.`}`, { icon: A.icon('lily') });
    }
    K.emit('lily');
    return true;
  }
  function showNote(b, n) {
    const note = Z().notes[b.note] || '';
    K.ui.modal({
      label: 'Açan zambak',
      html: `<div class="lily-note"><svg viewBox="-40 -40 80 80" class="lily-big">${flower(COLORS[b.c], 0, 14, 1.4)}</svg><p class="card-eyebrow">${K.num(n)}. zambak · ${T.fmt(b.day)}</p><p class="hand">${K.esc(K.fill(note))}</p></div>`,
    });
  }

  /* ---------- Ana salon kartı ---------- */
  function homeCard() {
    const card = K.$('#lilyCard');
    if (!card || !D.zambak) return;
    const s = st();
    const done = s.water.includes(T.todayKey());
    card.hidden = false;
    card.innerHTML = `${pot(stage(s), COLORS[s.blooms.length % COLORS.length], 'mini')}
      <div><p class="card-eyebrow">Zambağın</p>
      <p class="lily-line">${s.water.length ? (done ? 'Bugün suladın. Yarın yine seni bekliyor.' : 'Bugün su bekliyor.') : 'Saksıda senin için bir zambak soğanı var.'}</p>
      <p class="muted small">${s.blooms.length ? `Bahçende ${K.num(s.blooms.length)} zambak açtı` : 'Yedi sulamada ilk çiçek açar'}${bouquets.length ? ` · vazoda ${K.num(bouquets.reduce((a, b) => a + (b.count || 1), 0))} zambak` : ''}</p>
      <div class="actions">${done ? '' : `<button class="btn small" id="lilyWater">${A.icon('lily')} Sula</button>`}<a class="btn ghost small" href="#zambak">Bahçeye git</a></div></div>`;
    const b = K.$('#lilyWater', card);
    b && b.addEventListener('click', () => water(true) && homeCard());
  }
  K.on('built', homeCard);
  K.on('lily', () => (K.activeRoom === 'zambak' ? render() : homeCard()));

  /* ---------- Buketler (bulut) ---------- */
  function arrived(r, fresh) {
    if (bouquets.some((b) => b.id === r.id)) return;
    bouquets.push({ id: r.id, at: r.at, count: r.data.count || 7, note: r.data.note || '', who: r.who });
    if (fresh && r.who === 'me' && !K.isOwner()) {
      K.fx.rain({ count: 70, shapes: ['heart'], colors: ['#FF8FB8', '#FFD0E1', '#FFFFFF', '#E3174D'] });
      K.audio.sfx.chime();
      K.fx.toast(`<b>Çiçek geldi!</b> ${K.esc(C.myPet)} sana ${K.num(r.data.count || 7)} zambak gönderdi.`, { icon: A.icon('lily'), duration: 6000 });
    }
    K.emit('lily');
  }
  // Gerçek buket teslim edilince bahçeye altın bir zambak
  function real(r, fresh) {
    if (r.data.status !== 'teslim' || reals.some((x) => x.id === r.id)) return;
    reals.push({ id: r.id, at: r.at, note: r.data.note || '' });
    if (fresh && !K.isOwner()) {
      K.fx.rain({ count: 90, shapes: ['heart', 'star'], colors: ['#FFD34E', '#FF8FB8', '#FFFFFF'] });
      K.audio.sfx.success();
      K.fx.toast(`<b>Bu zambaklar gerçek.</b> Bahçene altın bir zambak dikildi.`, { icon: A.icon('lily'), duration: 7000 });
    }
    K.emit('lily');
  }
  K.on('cloud', async (on) => {
    if (!on) return;
    (await K.cloud.list('realbouquet')).forEach((r) => real(r));
    K.cloud.on('realbouquet', (r) => real(r, true));
    (await K.cloud.list('bouquet')).forEach((r) => arrived(r));
    K.cloud.on('bouquet', (r) => arrived(r, true));
    K.cloud.on('deleted', ({ id }) => {
      bouquets = bouquets.filter((b) => b.id !== id);
      K.emit('lily');
    });
  });
  K.sendBouquet = (count, note) => K.cloud.add('bouquet', { count, note: note || K.fill(Z().bouquetDefault || '') });

  /* ---------- Oda ---------- */
  function render() {
    if (!root) return;
    const s = st();
    const sg = stage(s);
    const done = s.water.includes(T.todayKey());
    K.$('#lyPot', root).innerHTML = pot(sg, COLORS[s.blooms.length % COLORS.length], done ? 'wet' : '');
    K.$('#lyState', root).innerHTML = `<b>${['Toprakta bir soğan', 'Minicik bir filiz', 'Filiz uzuyor', 'İlk yapraklar', 'Yapraklar çoğaldı', 'Tomurcuk!', 'Tomurcuk renklendi'][sg]}</b><small>${K.num(s.water.length)} kez suladın · açmasına ${7 - sg} sulama</small>`;
    K.$('#lyWater', root).disabled = done;
    K.$('#lyWater', root).innerHTML = done ? `${A.ui('check')} Bugün sulandı` : `${A.icon('lily')} Sula`;
    K.$('#lyBed', root).innerHTML = s.blooms.length
      ? s.blooms.map((b, i) => `<button class="ly-fl" data-b="${i}" style="--i:${i}" aria-label="${K.num(i + 1)}. zambak"><svg viewBox="-30 -40 60 110"><path d="M0 70 C0 40 -2 20 0 0" stroke="#3FA37A" stroke-width="3" fill="none"/><path d="M0 50 C-12 44 -16 36 -14 30 C-6 34 -2 42 0 50 Z" fill="#7ED6A5" stroke="#2F6B4E" stroke-width="1.4"/>${flower(COLORS[b.c], 0, 4, 1)}</svg><small>${T.fmtShort(b.day)}</small></button>`).join('')
      : `<p class="muted">Bahçe henüz boş. İlk zambak yedinci sulamada açacak.</p>`;
    K.$('#lyReal', root).innerHTML = reals.length
      ? `<h3 class="ly-h">Gerçek zambaklar</h3><div class="ly-real">${reals.map((r) => `<div class="ly-gold"><svg viewBox="-30 -40 60 70">${flower(['#FFE08A', '#FFF4C7', '#C98A12'], 0, 4, 1)}</svg><div><p class="card-eyebrow">${T.fmt(new Date(r.at))}</p><p class="hand">${K.esc(r.note || 'Bu zambaklar gerçek.')}</p></div></div>`).join('')}</div>`
      : '';
    const total = bouquets.reduce((a, b) => a + (b.count || 1), 0);
    K.$('#lyVase', root).innerHTML = bouquets.length
      ? `${vase(total)}<ul class="ly-bq">${bouquets.slice().reverse().map((b) => `<li><b>${K.num(b.count)} zambak</b> · ${T.fmt(new Date(b.at))}<p class="hand">${K.esc(b.note)}</p></li>`).join('')}</ul>`
      : `<p class="muted small">${K.isOwner() ? 'Kale Paneli\'nden ona zambak gönderebilirsin; buraya, vazoya düşer.' : `${K.esc(C.myPet)}'un gönderdiği zambaklar bu vazoda duracak.`}</p>`;
  }

  K.room({
    id: 'zambak',
    wing: 'kalp',
    title: 'Zambak Bahçesi',
    sub: 'Senin çiçeğin: sula, büyüt, notunu oku',
    icon: 'lily',
    color: '#FFE6F0',
    hidden: () => !D.zambak,
    badge: () => (D.zambak && !st().water.includes(T.todayKey()) ? 'Su bekliyor' : ''),
    init(el) {
      root = el;
      el.innerHTML = `
        <p class="room-intro">${K.esc(K.fill(Z().intro || ''))}</p>
        <section class="ly-main card">
          <div class="ly-pot" id="lyPot"></div>
          <div class="ly-side">
            <p class="ly-state" id="lyState"></p>
            <button class="btn red" id="lyWater"></button>
            <p class="muted small">Bir gün unutursan zambak kurumaz; seni bekler.</p>
          </div>
        </section>
        <h3 class="ly-h">Bahçen</h3>
        <div class="ly-bed" id="lyBed"></div>
        <div id="lyReal"></div>
        <h3 class="ly-h">Vazo</h3>
        <div class="ly-vase" id="lyVase"></div>`;
      K.$('#lyWater', el).addEventListener('click', () => {
        const pot = K.$('#lyPot', el);
        pot.classList.add('pour');
        setTimeout(() => pot.classList.remove('pour'), 1200);
        if (water()) setTimeout(render, 500);
      });
      el.addEventListener('click', (e) => {
        const b = e.target.closest('[data-b]');
        if (b) showNote(st().blooms[+b.dataset.b], +b.dataset.b + 1);
      });
    },
    enter() {
      render();
    },
  });
})();
