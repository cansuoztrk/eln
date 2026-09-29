/* Oda: Kalp Labirenti — onun şarkısına kurulmuş bir labirent. Kalp şeklinde, her gün yeniden çizilen bir labirent.
   Sırrı: Çıkmaz sokak yok. Hangi yoldan gidilirse gidilsin sonunda ortaya, ona çıkılıyor. */
(function () {
  'use strict';
  const K = window.K;
  const A = K.art;
  const D = window.ELN;
  const C = D.config;
  const T = K.time;

  const W = 15, H = 14, S = 22; // hücre sayısı ve boyu
  const DIRS = [[0, -1, 'u'], [1, 0, 'r'], [0, 1, 'd'], [-1, 0, 'l']];
  let root, maze = null, pos = null, trail = [], won = false, moving = false;

  /* ---------- Kalp maskesi ve labirent ---------- */
  function inHeart(c, r) {
    const x = ((c + 0.5) / W - 0.5) * 2.6;
    const y = (0.5 - (r + 0.5) / H) * 2.5 + 0.25;
    return Math.pow(x * x + y * y - 1, 3) - x * x * y * y * y <= 0;
  }
  function build(seed) {
    const rnd = K.rng(seed);
    const cells = new Map();
    for (let r = 0; r < H; r++) for (let c = 0; c < W; c++) if (inHeart(c, r)) cells.set(`${c},${r}`, { c, r, open: {} });
    const get = (c, r) => cells.get(`${c},${r}`);
    const nbs = (cell) => DIRS.map(([dx, dy, d]) => [get(cell.c + dx, cell.r + dy), d]).filter(([n]) => n);
    // Tek komşulu kenar hücreleri at: kalbin alt ucu dışında çıkmaz sokak kalmasın
    for (let pass = 0; pass < 4; pass++)
      [...cells.values()].forEach((cell) => {
        const bottom = ![...cells.values()].some((x) => x.r > cell.r);
        if (!bottom && nbs(cell).length < 2) cells.delete(`${cell.c},${cell.r}`);
      });
    const opp = { u: 'd', d: 'u', l: 'r', r: 'l' };
    const link = (a, b, d) => {
      a.open[d] = true;
      b.open[opp[d]] = true;
    };
    // Kalbin ortası (hedef) ve alttaki ucu (başlangıç)
    const all = [...cells.values()];
    const goal = all.reduce((best, x) => (Math.hypot(x.c - (W - 1) / 2, x.r - H * 0.42) < Math.hypot(best.c - (W - 1) / 2, best.r - H * 0.42) ? x : best));
    const startCell = all.reduce((best, x) => (x.r > best.r || (x.r === best.r && Math.abs(x.c - (W - 1) / 2) < Math.abs(best.c - (W - 1) / 2)) ? x : best));
    // Rastgele derinlik öncelikli arama: yayılan ağaç
    const seen = new Set([goal]);
    const stack = [goal];
    while (stack.length) {
      const cur = stack[stack.length - 1];
      const opts = nbs(cur).filter(([n]) => !seen.has(n));
      if (!opts.length) {
        stack.pop();
        continue;
      }
      const [n, d] = opts[Math.floor(rnd() * opts.length)];
      link(cur, n, d);
      seen.add(n);
      stack.push(n);
    }
    // Örgüleme: bütün çıkmaz sokakları bir komşuya bağla (başlangıç dışında)
    for (let pass = 0; pass < 3; pass++)
      all.forEach((cell) => {
        if (cell === startCell || Object.keys(cell.open).length !== 1) return;
        const opts = nbs(cell).filter(([, d]) => !cell.open[d]);
        if (!opts.length) return;
        opts.sort((a, b) => Object.keys(a[0].open).length - Object.keys(b[0].open).length);
        const pickFrom = opts.filter((o) => Object.keys(o[0].open).length === Object.keys(opts[0][0].open).length);
        const [n, d] = pickFrom[Math.floor(rnd() * pickFrom.length)];
        link(cell, n, d);
      });
    return { cells, get, goal, start: startCell };
  }

  /* ---------- Çizim ---------- */
  function svg() {
    const walls = [];
    maze.cells.forEach((cell) => {
      const x = cell.c * S, y = cell.r * S;
      if (!cell.open.u) walls.push(`M${x} ${y}h${S}`);
      if (!cell.open.l) walls.push(`M${x} ${y}v${S}`);
      if (!cell.open.d) walls.push(`M${x} ${y + S}h${S}`);
      if (!cell.open.r) walls.push(`M${x + S} ${y}v${S}`);
    });
    const floor = [...maze.cells.values()].map((cell) => `<rect x="${cell.c * S}" y="${cell.r * S}" width="${S}" height="${S}"/>`).join('');
    const g = maze.goal;
    return `<svg class="lb-svg" viewBox="-6 -6 ${W * S + 12} ${H * S + 12}" role="img" aria-label="Kalp labirenti">
      <g class="lb-floor">${floor}</g>
      <polyline class="lb-trail" id="lbTrail" points=""/>
      <g transform="translate(${g.c * S + S / 2} ${g.r * S + S / 2 + 2})"><path class="lb-goal" d="M0 7 C-11 -1 -11 -12 -4.5 -12 C-1.5 -12 0 -9.5 0 -8 C0 -9.5 1.5 -12 4.5 -12 C11 -12 11 -1 0 7 Z" transform="scale(.8)"/></g>
      <path class="lb-walls" d="${walls.join('')}"/>
      <g class="lb-me" id="lbMe">${A.kitty({ crown: true }).replace('<svg ', `<svg x="-11" y="-11" width="22" height="22" `)}</g>
    </svg>`;
  }
  function place() {
    const me = K.$('#lbMe', root);
    me.setAttribute('transform', `translate(${pos.c * S + S / 2} ${pos.r * S + S / 2})`);
    K.$('#lbTrail', root).setAttribute('points', trail.map((t) => `${t.c * S + S / 2},${t.r * S + S / 2}`).join(' '));
  }

  /* ---------- Hareket: kavşağa kadar kay ---------- */
  function move(d) {
    if (won || moving || !pos.open[d]) {
      if (!won && !moving) K.vibrate(15);
      return;
    }
    moving = true;
    const [dx, dy] = DIRS.find((x) => x[2] === d);
    const step = (dir, ddx, ddy) => {
      pos = maze.get(pos.c + ddx, pos.r + ddy);
      trail.push(pos);
      if (trail.length > 400) trail.shift();
      place();
      if (pos === maze.goal) return finish();
      const exits = Object.keys(pos.open).filter((k) => pos.open[k] && k !== { u: 'd', d: 'u', l: 'r', r: 'l' }[dir]);
      if (exits.length === 1) {
        const nd = exits[0];
        const [nx, ny] = DIRS.find((x) => x[2] === nd);
        return setTimeout(() => step(nd, nx, ny), 55);
      }
      moving = false;
    };
    step(d, dx, dy);
  }
  function finish() {
    won = true;
    moving = false;
    K.$('.lb-svg', root).classList.add('won');
    K.audio.sfx.success();
    K.fx.confetti({ count: 120, shapes: ['heart'] });
    const days = K.store.get('mazeDays', []);
    if (!days.includes(T.todayKey())) K.store.set('mazeDays', days.concat(T.todayKey()));
    K.stickers.award('labirent');
    const s = C.song2 || {};
    setTimeout(() => {
      // Şarkı pencerenin içinde çalar (YouTube'a gitmez); pencere kapanınca durur
      const md = K.ui.modal({
        label: 'Kalbin ortası',
        html: `<div class="lb-win"><p class="script lb-win-t">${K.esc((D.labirent && D.labirent.title) || '')}</p>${K.paras((D.labirent && D.labirent.win) || [])}
            ${s.title ? `<p class="muted small">${K.esc(s.artist)} · ${K.esc(s.title)}</p><div class="actions" style="justify-content:center"><button type="button" class="btn red small" data-lb-song>${A.ui('play')} Şarkısını burada çal</button></div><div class="lb-song"></div>` : ''}
            <p class="muted small">Yarın labirent yeniden çizilecek. ${K.num(K.store.get('mazeDays', []).length)} kez ortaya vardın.</p></div>`,
      });
      md.body.addEventListener('click', (e) => {
        const b = e.target.closest('[data-lb-song]');
        if (!b) return;
        b.remove();
        K.pikap.mount(K.$('.lb-song', md.body), s);
      });
    }, 900);
  }
  function reset() {
    maze = build(T.dayNumber(T.now()) * 7919 + 55);
    pos = maze.start;
    trail = [pos];
    won = false;
    moving = false;
    K.$('#lbBoard', root).innerHTML = svg();
    place();
  }

  // Klavye
  document.addEventListener('keydown', (e) => {
    if (K.activeRoom !== 'labirent') return;
    const d = { ArrowUp: 'u', ArrowDown: 'd', ArrowLeft: 'l', ArrowRight: 'r' }[e.key];
    if (d) {
      e.preventDefault();
      move(d);
    }
  });

  K.room({
    id: 'labirent',
    wing: 'oyun',
    title: 'Kalp Labirenti',
    sub: () => (D.labirent && D.labirent.sub) || 'Her yol ortaya çıkar',
    icon: 'maze',
    color: '#FFE0EC',
    hidden: () => !D.labirent,
    badge: () => (D.labirent && !K.store.get('mazeDays', []).includes(T.todayKey()) ? 'Bugünün labirenti' : ''),
    init(el) {
      root = el;
      el.innerHTML = `
        <div class="room-intro">${K.paras((D.labirent && D.labirent.intro) || [])}</div>
        <div class="lb-board" id="lbBoard"></div>
        <div class="lb-pad" aria-label="Yön tuşları">
          <button class="icon-btn" data-d="u" aria-label="Yukarı">${A.ui('back')}</button>
          <button class="icon-btn" data-d="l" aria-label="Sola">${A.ui('back')}</button>
          <button class="icon-btn" data-d="r" aria-label="Sağa">${A.ui('back')}</button>
          <button class="icon-btn" data-d="d" aria-label="Aşağı">${A.ui('back')}</button>
        </div>
        <p class="muted small" style="text-align:center">Kaydır, ok tuşlarını ya da düğmeleri kullan. Kitty bir sonraki kavşağa kadar kendiliğinden yürür.</p>
        <div class="actions" style="justify-content:center"><button class="btn ghost small" id="lbReset">${A.ui('refresh')} Baştan başla</button></div>`;
      el.addEventListener('click', (e) => {
        const b = e.target.closest('[data-d]');
        if (b) move(b.dataset.d);
        if (e.target.closest('#lbReset')) reset();
      });
      // Kaydırma
      let t0 = null;
      const board = K.$('#lbBoard', el);
      board.addEventListener('pointerdown', (e) => (t0 = [e.clientX, e.clientY]));
      board.addEventListener('pointerup', (e) => {
        if (!t0) return;
        const dx = e.clientX - t0[0], dy = e.clientY - t0[1];
        t0 = null;
        if (Math.max(Math.abs(dx), Math.abs(dy)) < 18) return;
        move(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'r' : 'l') : dy > 0 ? 'd' : 'u');
      });
      board.addEventListener('touchmove', (e) => e.preventDefault(), { passive: false });
    },
    enter() {
      if (!maze || maze.day !== T.todayKey()) {
        reset();
        maze.day = T.todayKey();
      }
    },
  });
})();
