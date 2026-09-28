/* Oda: Gartic Odası — User155 çizer, Eln tahmin eder; Eln çizer, kaydeder, gönderir */
(function () {
  'use strict';
  const K = window.K;
  const A = K.art;
  const C = window.ELN.config;

  /* ---------------- Çizim yardımcıları (0–100 koordinat) ---------------- */
  const G = {
    arc(cx, cy, rx, ry, a0 = 0, a1 = Math.PI * 2, n = 48) {
      const pts = [];
      for (let i = 0; i <= n; i++) {
        const a = a0 + ((a1 - a0) * i) / n;
        pts.push([cx + Math.cos(a) * rx, cy + Math.sin(a) * ry]);
      }
      return pts;
    },
    circle(cx, cy, r, n = 36) {
      return G.arc(cx, cy, r, r, 0, Math.PI * 2, n);
    },
    bez(p0, p1, p2, p3, n = 22) {
      const pts = [];
      for (let i = 0; i <= n; i++) {
        const t = i / n,
          u = 1 - t;
        pts.push([u * u * u * p0[0] + 3 * u * u * t * p1[0] + 3 * u * t * t * p2[0] + t * t * t * p3[0], u * u * u * p0[1] + 3 * u * u * t * p1[1] + 3 * u * t * t * p2[1] + t * t * t * p3[1]]);
      }
      return pts;
    },
    heart(cx, cy, s, n = 64) {
      const pts = [];
      for (let i = 0; i <= n; i++) {
        const t = (i / n) * Math.PI * 2;
        pts.push([cx + 16 * Math.pow(Math.sin(t), 3) * s, cy - (13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)) * s]);
      }
      return pts;
    },
    star(cx, cy, R, r, k = 5) {
      const pts = [];
      for (let i = 0; i <= k * 2; i++) {
        const rr = i % 2 ? r : R;
        const a = (i * Math.PI) / k - Math.PI / 2;
        pts.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr]);
      }
      return pts;
    },
    mirror: (pts) => pts.map(([x, y]) => [100 - x, y]),
    cat: (...arrs) => [].concat(...arrs),
  };
  const RED = '#FF0013',
    PINK = '#FF8FB8',
    INK = '#1C1C1C',
    GOLD = '#FFC126',
    BLUE = '#26C9FF',
    GREEN = '#11B03C',
    BROWN = '#964112';

  const loopL = G.cat(G.bez([50, 50], [36, 20], [6, 24], [12, 48]), G.bez([12, 48], [16, 72], [40, 64], [50, 50]));
  const crescentOuter = G.arc(48, 52, 30, 30, Math.PI / 3, (Math.PI * 5) / 3, 40);
  const crescentInner = G.arc(80, 52, 31.06, 31.06, (236.8 * Math.PI) / 180, (123.2 * Math.PI) / 180, 30);
  const petals = [0, 1, 2, 3, 4, 5].map((i) => {
    const a = (i * Math.PI) / 3;
    return G.circle(50 + Math.cos(a) * 12, 34 + Math.sin(a) * 12, 8, 24);
  });
  const leafL = G.cat(G.bez([50, 72], [44, 60], [34, 60], [26, 64]), G.bez([26, 64], [34, 72], [44, 74], [50, 72]));
  const leafR = G.cat(G.bez([51, 80], [58, 68], [68, 68], [75, 72]), G.bez([75, 72], [67, 80], [58, 82], [51, 80]));
  const drip = Array.from({ length: 31 }, (_, i) => [20 + i * 2, 62 + (1 + Math.sin(i * 0.9)) * 2.6]);
  const flame = (x, y) => G.cat(G.bez([x, y], [x - 4, y - 4], [x - 2, y - 9], [x, y - 11]), G.bez([x, y - 11], [x + 2, y - 9], [x + 4, y - 4], [x, y]));

  const WORDS = [
    {
      w: 'kalp',
      ok: ['kalp', 'kalb', 'yurek', 'heart', 'urek', 'sevgi', 'love', 'ask'],
      hint: 'Bende senin için atan bir şey.',
      msg: 'Bu kalbi {km} km öteden çizdim. Sahibi belli: Sen.',
      draw: [
        { c: RED, w: 6, p: G.heart(50, 46, 2.4) },
        { c: RED, fill: 0.35, p: G.heart(50, 46, 2.4) },
        { c: PINK, w: 5, p: G.heart(50, 44, 1) },
        { c: RED, w: 4, p: [[80, 16], [87, 9]] },
        { c: RED, w: 4, p: [[84, 24], [93, 22]] },
        { c: RED, w: 4, p: [[74, 12], [75, 3]] },
      ],
    },
    {
      w: 'fiyonk',
      ok: ['fiyonk', 'kurdele', 'bow', 'bant', 'fiyonka', 'papyon', 'lent', 'ribbon'],
      hint: 'Kitty\'nin kafasında hep var.',
      msg: 'Kitty\'nin fiyonku ne kadar tatlıysa, sen ondan da tatlısın.',
      draw: [
        { c: RED, w: 6, p: loopL },
        { c: RED, w: 6, p: G.mirror(loopL) },
        { c: RED, fill: 0.85, p: loopL },
        { c: RED, fill: 0.85, p: G.mirror(loopL) },
        { c: RED, w: 6, p: G.bez([45, 55], [40, 68], [34, 78], [28, 90]) },
        { c: RED, w: 6, p: G.bez([55, 55], [60, 68], [66, 78], [72, 90]) },
        { c: INK, w: 5, p: G.circle(50, 50, 7) },
        { c: RED, fill: 1, p: G.circle(50, 50, 7) },
        { c: INK, w: 3, p: G.bez([42, 46], [34, 40], [26, 38], [20, 42]) },
        { c: INK, w: 3, p: G.mirror(G.bez([42, 46], [34, 40], [26, 38], [20, 42])) },
      ],
    },
    {
      w: 'kedi',
      ok: ['kedi', 'hello kitty', 'hellokitty', 'kitty', 'pisik', 'cat', 'pisi', 'kedicik', 'pisicik'],
      hint: 'Senin en sevdiğin karakter.',
      msg: 'Hello Kitty\'yi çizdim ama itiraf edeyim, aklımdaki en tatlı şey sendin.',
      draw: [
        { c: INK, w: 5, p: G.arc(50, 60, 38, 26) },
        { c: INK, w: 5, p: [[18, 50], [16, 22], [42, 36]] },
        { c: INK, w: 5, p: [[82, 50], [84, 22], [58, 36]] },
        { c: INK, fill: 1, p: G.arc(35, 60, 2.8, 4) },
        { c: INK, fill: 1, p: G.arc(65, 60, 2.8, 4) },
        { c: GOLD, fill: 1, p: G.arc(50, 67, 3.6, 2.4) },
        { c: INK, w: 3, p: [[2, 56], [18, 58]] },
        { c: INK, w: 3, p: [[1, 64], [17, 64]] },
        { c: INK, w: 3, p: [[3, 72], [18, 69]] },
        { c: INK, w: 3, p: [[98, 56], [82, 58]] },
        { c: INK, w: 3, p: [[99, 64], [83, 64]] },
        { c: INK, w: 3, p: [[97, 72], [82, 69]] },
        { c: RED, w: 5, p: G.cat(G.bez([76, 32], [70, 20], [58, 20], [62, 32]), G.bez([62, 32], [66, 40], [74, 38], [76, 32])) },
        { c: RED, w: 5, p: G.cat(G.bez([76, 32], [82, 20], [94, 24], [90, 34]), G.bez([90, 34], [86, 42], [78, 38], [76, 32])) },
        { c: RED, fill: 1, p: G.cat(G.bez([76, 32], [70, 20], [58, 20], [62, 32]), G.bez([62, 32], [66, 40], [74, 38], [76, 32])) },
        { c: RED, fill: 1, p: G.cat(G.bez([76, 32], [82, 20], [94, 24], [90, 34]), G.bez([90, 34], [86, 42], [78, 38], [76, 32])) },
      ],
    },
    {
      w: 'ay',
      ok: ['ay', 'hilal', 'moon', 'aypara', 'dolunay'],
      hint: 'İkimiz de aynı anda buna bakıyoruz.',
      msg: '{myCity}\'dan da {herCity}\'den de aynı ay görünüyor. Bu gece ona bakınca beni hatırla.',
      draw: [
        { c: GOLD, w: 6, p: crescentOuter },
        { c: GOLD, w: 6, p: crescentInner },
        { c: GOLD, fill: 0.9, p: G.cat(crescentOuter, crescentInner) },
        { c: GOLD, w: 3, p: G.star(84, 20, 7, 3) },
        { c: GOLD, w: 3, p: G.star(88, 74, 4.5, 2) },
        { c: GOLD, w: 3, p: G.star(12, 16, 4, 1.8) },
      ],
    },
    {
      w: 'uçak',
      ok: ['ucak', 'tayyare', 'teyyare', 'plane', 'airplane', 'aeroplane', 'ucag'],
      hint: 'Beni sana getirecek şey.',
      msg: 'Bir gün bu uçak beni sana getirecek. İnan bana, çizdiğimden daha hızlı.',
      draw: [
        { c: BLUE, w: 5, p: G.arc(54, 50, 34, 8) },
        { c: BLUE, w: 5, p: [[24, 46], [14, 26], [24, 26], [36, 43]] },
        { c: BLUE, w: 5, p: [[48, 54], [36, 78], [46, 78], [64, 55]] },
        { c: BLUE, w: 5, p: [[50, 44], [44, 30], [52, 30], [62, 43]] },
        { c: BLUE, fill: 0.3, p: G.arc(54, 50, 34, 8) },
        { c: INK, fill: 1, p: G.circle(42, 49, 1.8, 12) },
        { c: INK, fill: 1, p: G.circle(50, 49, 1.8, 12) },
        { c: INK, fill: 1, p: G.circle(58, 49, 1.8, 12) },
        { c: INK, fill: 1, p: G.circle(66, 49, 1.8, 12) },
        { c: PINK, w: 3, p: G.heart(10, 64, 0.3) },
        { c: PINK, w: 3, p: G.heart(4, 74, 0.2) },
      ],
    },
    {
      w: 'kule',
      ok: ['kule', 'kiz kulesi', 'qiz qalasi', 'qala', 'tower', 'kale', 'kiz kalesi', 'kizkulesi', 'qizqalasi'],
      hint: 'Hem {myCity}\'da hem {herCity}\'de var.',
      msg: '{myCity}\'un Kız Kulesi, {herCity}\'nün Qız Qalası... İki kule, tek prenses: Sen.',
      draw: [
        { c: BROWN, w: 5, p: [[36, 92], [40, 26]] },
        { c: BROWN, w: 5, p: [[64, 92], [60, 26]] },
        { c: BROWN, w: 5, p: [[40, 26], [40, 20], [44, 20], [44, 24], [48, 24], [48, 20], [52, 20], [52, 24], [56, 24], [56, 20], [60, 20], [60, 26], [40, 26]] },
        { c: BROWN, w: 4, p: [[63, 92], [66, 42], [72, 46], [72, 92]] },
        { c: BROWN, w: 3, p: G.bez([38.8, 46], [45, 49], [55, 49], [61.2, 46]) },
        { c: BROWN, w: 3, p: G.bez([37.9, 64], [45, 67], [55, 67], [62.1, 64]) },
        { c: BROWN, w: 3, p: G.bez([37, 80], [45, 83], [55, 83], [63, 80]) },
        { c: INK, fill: 1, p: G.cat([[46, 40], [46, 34]], G.arc(48, 34, 2, 2, Math.PI, Math.PI * 2, 8), [[50, 40]]) },
        { c: INK, fill: 1, p: G.cat([[52, 60], [52, 54]], G.arc(54, 54, 2, 2, Math.PI, Math.PI * 2, 8), [[56, 60]]) },
        { c: INK, w: 3, p: [[50, 20], [50, 6]] },
        { c: PINK, fill: 1, p: [[50, 6], [62, 9], [50, 12]] },
        { c: BLUE, w: 4, p: Array.from({ length: 26 }, (_, i) => [i * 4, 96 + Math.sin(i) * 1.6]) },
      ],
    },
    {
      w: 'taç',
      ok: ['tac', 'crown', 'tacim', 'kron'],
      hint: 'Prenseslerin başında olur.',
      msg: 'Taç senin, krallık senin, kalbim de senin.',
      draw: [
        { c: GOLD, w: 6, p: [[22, 72], [18, 36], [34, 52], [50, 24], [66, 52], [82, 36], [78, 72], [22, 72]] },
        { c: GOLD, w: 6, p: [[22, 72], [78, 72], [78, 82], [22, 82], [22, 72]] },
        { c: GOLD, fill: 0.85, p: [[22, 72], [18, 36], [34, 52], [50, 24], [66, 52], [82, 36], [78, 72], [78, 82], [22, 82]] },
        { c: '#FF008F', fill: 1, p: G.circle(50, 60, 4.5) },
        { c: BLUE, fill: 1, p: G.circle(34, 64, 3.2) },
        { c: BLUE, fill: 1, p: G.circle(66, 64, 3.2) },
        { c: GOLD, fill: 1, p: G.circle(18, 32, 3.2) },
        { c: GOLD, fill: 1, p: G.circle(50, 20, 3.8) },
        { c: GOLD, fill: 1, p: G.circle(82, 32, 3.2) },
      ],
    },
    {
      w: 'çiçek',
      ok: ['cicek', 'gul', 'flower', 'papatya', 'lale', 'rose'],
      hint: 'Sana her gün göndermek istediğim şey.',
      msg: 'Sana gerçek çiçek gönderemediğim her gün için bir tane çizdim.',
      draw: G.cat(
        petals.map((p) => ({ c: '#FF008F', w: 4, p })),
        petals.map((p) => ({ c: PINK, fill: 0.8, p })),
        [
          { c: GOLD, fill: 1, p: G.circle(50, 34, 6.5) },
          { c: GREEN, w: 5, p: G.bez([50, 42], [46, 60], [54, 74], [50, 96]) },
          { c: GREEN, w: 4, p: leafL },
          { c: GREEN, fill: 0.7, p: leafL },
          { c: GREEN, w: 4, p: leafR },
          { c: GREEN, fill: 0.7, p: leafR },
        ]
      ),
    },
    {
      w: 'pasta',
      ok: ['pasta', 'kek', 'tort', 'cake', 'dogum gunu pastasi', 'birthday cake'],
      hint: '23 Nisan\'da lazım olacak.',
      msg: '23 Nisan\'da bunun gerçeğini, mumlarıyla birlikte hak ediyorsun.',
      draw: [
        { c: INK, w: 3, p: G.arc(50, 88, 38, 5) },
        { c: '#FF008F', w: 5, p: [[20, 62], [80, 62], [80, 86], [20, 86], [20, 62]] },
        { c: PINK, fill: 0.7, p: [[20, 62], [80, 62], [80, 86], [20, 86]] },
        { c: '#FF008F', w: 5, p: [[30, 44], [70, 44], [70, 62], [30, 62], [30, 44]] },
        { c: '#FEAFA8', fill: 0.8, p: [[30, 44], [70, 44], [70, 62], [30, 62]] },
        { c: '#FFFFFF', w: 4, p: drip },
        { c: BLUE, w: 4, p: [[40, 44], [40, 32]] },
        { c: BLUE, w: 4, p: [[50, 44], [50, 30]] },
        { c: BLUE, w: 4, p: [[60, 44], [60, 32]] },
        { c: '#FF7829', fill: 1, p: flame(40, 31) },
        { c: '#FF7829', fill: 1, p: flame(50, 29) },
        { c: '#FF7829', fill: 1, p: flame(60, 31) },
      ],
    },
    {
      w: 'mektup',
      ok: ['mektup', 'zarf', 'mektub', 'letter', 'envelope', 'name', 'ask mektubu'],
      hint: 'Kalede kendine ait bir odası var.',
      msg: 'Mektuplar odasına bak; sana yazdıklarım orada seni bekliyor.',
      draw: [
        { c: '#0050CD', w: 5, p: [[16, 30], [84, 30], [84, 74], [16, 74], [16, 30]] },
        { c: '#0050CD', w: 5, p: [[16, 30], [50, 56], [84, 30]] },
        { c: '#0050CD', w: 4, p: [[16, 74], [42, 52]] },
        { c: '#0050CD', w: 4, p: [[84, 74], [58, 52]] },
        { c: RED, fill: 1, p: G.heart(50, 56, 0.5) },
      ],
    },
  ];

  // Noktaları sıklaştır + hafif el titremesi
  function densify(pts, step = 1.1, seed = 1) {
    const r = K.rng(seed);
    const out = [];
    for (let i = 0; i < pts.length - 1; i++) {
      const [x1, y1] = pts[i],
        [x2, y2] = pts[i + 1];
      const n = Math.max(1, Math.ceil(Math.hypot(x2 - x1, y2 - y1) / step));
      for (let j = 0; j < n; j++) out.push([x1 + ((x2 - x1) * j) / n + (r() - 0.5) * 0.35, y1 + ((y2 - y1) * j) / n + (r() - 0.5) * 0.35]);
    }
    out.push(pts[pts.length - 1]);
    return out;
  }

  const NEHIR_GUESSES = ['patates', 'bulut', 'uzaylı', 'dinozor', 'brokoli', 'ördek', 'pizza', 'tost', 'ayakkabı', 'balina', 'şemsiye', 'kaktüs', 'kurbağa', 'makarna', 'ahtapot'];
  const PROMPTS = ['İlk tanıştığımız gün', 'Hello Kitty prenses', 'Beni nasıl hayal ediyorsun?', 'Bakü\'den bir manzara', 'Şu anki ruh hâlin', 'Bizim geleceğimiz', 'Angela için yeni bir kıyafet', '{myName}\'in portresi (acımadan)', 'En sevdiğin yemek', 'Birlikte gitmek istediğin yer', 'Qız Qalası', 'Bir sonraki buluşmamız', 'Kalbin şu an', 'Nehir peri kılığında'];
  const PALETTE = ['#000000', '#666666', '#AAAAAA', '#FFFFFF', '#0050CD', '#26C9FF', '#017420', '#11B03C', '#990000', '#FF0013', '#FF7829', '#FFC126', '#964112', '#B0701C', '#99004E', '#FF008F', '#FF8FB8', '#FEAFA8', '#C9B6FF', '#E3174D'];

  let root;
  const W = 800,
    H = 600;

  /* ================= TAHMİN MODU ================= */
  const game = { round: 0, rounds: 5, order: [], scores: {}, timer: null, raf: null, active: false };
  let gcv, gcx;

  function gToCanvas([x, y]) {
    return [100 + x * 6, y * 6];
  }
  function playerRow(nick, score, cls, bow) {
    return `<li class="g-player ${cls}"><span class="g-av">${A.kitty({ bow, blush: false })}</span><span class="g-nick">${K.esc(nick)}</span><span class="g-pts tnum">${score} puan</span></li>`;
  }
  function renderPlayers() {
    const s = game.scores;
    K.$('#gPlayers', root).innerHTML =
      playerRow(C.herNick, s.eln, 'you', '#E3174D') + playerRow(C.myNick, s.me, 'drawer', '#26C9FF') + playerRow(C.friendName, s.nehir, '', '#C9B6FF');
  }
  function log(html, type = '') {
    const box = K.$('#gLog', root);
    box.insertAdjacentHTML('beforeend', `<p class="g-msg ${type}">${html}</p>`);
    box.scrollTop = box.scrollHeight;
  }
  function wordMask(word, revealed) {
    return [...word]
      .map((ch, i) => (ch === ' ' ? '&nbsp;&nbsp;' : revealed.has(i) ? `<b>${K.esc(ch.toLocaleUpperCase('tr'))}</b>` : '_'))
      .join(' ');
  }

  function newGame() {
    game.order = K.shuffle(WORDS).slice(0, game.rounds);
    game.round = 0;
    game.scores = { eln: 0, me: 0, nehir: 0 };
    K.$('#gLog', root).innerHTML = '';
    log(`<i>${K.esc(C.herNick)}</i> odaya katıldı.`, 'sys');
    log(`<b>${K.esc(C.myNick)}:</b> hoş geldin prenses, bu oda senin için açıldı`, '');
    renderPlayers();
    startRound();
  }

  function startRound() {
    clearTimers();
    const wd = game.order[game.round];
    game.word = wd;
    game.revealed = new Set();
    game.found = false;
    game.t0 = performance.now();
    game.time = 80;
    game.active = true;
    K.$('#gRound', root).textContent = `Tur ${game.round + 1}/${game.rounds}`;
    K.$('#gWord', root).innerHTML = wordMask(wd.w, game.revealed);
    K.$('#gOverlay', root).hidden = true;
    K.$('#gInput', root).disabled = false;
    gcx.fillStyle = '#fff';
    gcx.fillRect(0, 0, W, H);
    log(`<b>${K.esc(C.myNick)}</b> çiziyor...`, 'sys');
    // Çizimi hazırla
    let seed = K.hash(wd.w);
    const steps = wd.draw.map((s) => (s.fill ? { ...s, pts: s.p } : { ...s, pts: densify(s.p, 1.1, seed++) }));
    const total = steps.reduce((a, s) => a + (s.fill ? 30 : s.pts.length), 0);
    const perFrame = Math.max(1, total / (15 * 60));
    let si = 0,
      pi = 0,
      acc = 0,
      pause = 0,
      fillA = 0;
    const done = [];
    const strokeAll = (s) => {
      gcx.strokeStyle = s.c;
      gcx.lineWidth = s.w * 1.4;
      gcx.lineCap = gcx.lineJoin = 'round';
      gcx.beginPath();
      s.pts.forEach((p, i) => {
        const [x, y] = gToCanvas(p);
        i ? gcx.lineTo(x, y) : gcx.moveTo(x, y);
      });
      gcx.stroke();
    };
    const frame = () => {
      if (!game.active) return;
      if (si < steps.length) {
        if (pause > 0) pause--;
        else {
          const s = steps[si];
          if (s.fill) {
            fillA++;
            gcx.save();
            gcx.globalAlpha = (s.fill / 6) * 1.2;
            gcx.fillStyle = s.c;
            gcx.beginPath();
            s.pts.forEach((p, i) => {
              const [x, y] = gToCanvas(p);
              i ? gcx.lineTo(x, y) : gcx.moveTo(x, y);
            });
            gcx.closePath();
            gcx.fill();
            gcx.restore();
            if (fillA >= 6) {
              fillA = 0;
              done.forEach(strokeAll);
              si++;
              pause = 12;
            }
          } else {
            acc += perFrame;
            gcx.strokeStyle = s.c;
            gcx.lineWidth = s.w * 1.4;
            gcx.lineCap = gcx.lineJoin = 'round';
            while (acc >= 1 && pi < s.pts.length - 1) {
              const [x1, y1] = gToCanvas(s.pts[pi]);
              const [x2, y2] = gToCanvas(s.pts[pi + 1]);
              gcx.beginPath();
              gcx.moveTo(x1, y1);
              gcx.lineTo(x2, y2);
              gcx.stroke();
              pi++;
              acc--;
            }
            if (pi >= s.pts.length - 1) {
              done.push(s);
              si++;
              pi = 0;
              pause = 8 + Math.floor(Math.random() * 10);
            }
          }
        }
      }
      game.raf = requestAnimationFrame(frame);
    };
    game.raf = requestAnimationFrame(frame);

    // Sayaç, ipuçları ve Nehir'in komik tahminleri
    const nehirTimes = [9 + Math.random() * 6, 22 + Math.random() * 10, 44 + Math.random() * 10];
    const nehirWrong = K.shuffle(NEHIR_GUESSES);
    let ni = 0,
      hintSaid = false;
    game.timer = setInterval(() => {
      const el = (performance.now() - game.t0) / 1000;
      const left = Math.max(0, Math.ceil(game.time - el));
      K.$('#gTime', root).textContent = left;
      K.$('#gRing', root).style.strokeDashoffset = 126 * (1 - left / game.time);
      if (game.found) return;
      if (ni < nehirTimes.length && el > nehirTimes[ni]) log(`<b>${K.esc(C.friendName)}:</b> ${K.esc(nehirWrong[ni++])}`);
      if (!hintSaid && el > 30) {
        hintSaid = true;
        log(`<b>${K.esc(C.myNick)}:</b> ipucu: ${K.esc(K.fill(game.word.hint))}`, 'hint');
      }
      if (el > 38 && game.revealed.size === 0) reveal();
      if (el > 58 && game.revealed.size === 1 && game.word.w.length > 3) reveal();
      if (left <= 0) endRound(false);
    }, 250);
  }
  function reveal() {
    const w = game.word.w;
    const idx = [...w].map((c, i) => i).filter((i) => w[i] !== ' ' && !game.revealed.has(i));
    if (!idx.length) return;
    game.revealed.add(K.pick(idx));
    K.$('#gWord', root).innerHTML = wordMask(w, game.revealed);
    K.audio.sfx.tick();
  }
  function clearTimers() {
    clearInterval(game.timer);
    cancelAnimationFrame(game.raf);
  }
  function guess(text) {
    if (!game.active || game.found) return;
    const g = K.norm(text);
    if (!g) return;
    log(`<b>${K.esc(C.herNick)}:</b> ${K.esc(text)}`, 'you');
    const wd = game.word;
    const ok = wd.ok.some((a) => K.norm(a) === g || g.replace(/ /g, '') === K.norm(a).replace(/ /g, ''));
    if (ok) {
      const el = (performance.now() - game.t0) / 1000;
      const pts = 10 + Math.max(0, Math.round((game.time - el) / 6));
      game.scores.eln += pts;
      game.scores.me += 5;
      log(`<b>${K.esc(C.herNick)}</b> kelimeyi buldu! <span class="tnum">(+${pts})</span>`, 'ok');
      if (Math.random() < 0.6) setTimeout(() => log(`<b>${K.esc(C.friendName)}:</b> ya ben de tam onu yazacaktım`), 700);
      K.stickers.bump('garticCorrect', 5, 'gartic');
      K.audio.sfx.success();
      endRound(true);
      return;
    }
    const close = wd.ok.some((a) => {
      const n = K.norm(a);
      return n.length >= 3 && K.lev(g, n) <= (n.length >= 6 ? 2 : 1);
    });
    if (close) log(`<i>"${K.esc(text)}" çok yakın!</i>`, 'close');
  }
  function endRound(found) {
    game.found = true;
    game.active = false;
    clearTimers();
    K.$('#gInput', root).disabled = true;
    const wd = game.word;
    if (!found) {
      const nehirGets = Math.random() < 0.5;
      if (nehirGets) {
        game.scores.nehir += 8;
        game.scores.me += 5;
        log(`<b>${K.esc(C.friendName)}</b> kelimeyi buldu! (+8)`, 'ok');
      } else log('Süre doldu!', 'sys');
    } else {
      game.scores.nehir += Math.random() < 0.4 ? 4 : 0;
    }
    renderPlayers();
    K.$('#gWord', root).innerHTML = [...wd.w].map((c) => `<b>${K.esc(c.toLocaleUpperCase('tr'))}</b>`).join(' ');
    const last = game.round >= game.rounds - 1;
    const ov = K.$('#gOverlay', root);
    ov.innerHTML = `<div class="g-reveal">
      <p class="g-rv-eyebrow">${found ? 'Doğru bildin!' : 'Kelime'}</p>
      <p class="g-rv-word">${K.esc(wd.w.toLocaleUpperCase('tr'))}</p>
      <p class="g-rv-msg">${K.esc(K.fill(wd.msg))}</p>
      <button class="btn" id="gNext">${last ? 'Sonuçları gör' : 'Sonraki tur'} ${A.ui('next')}</button></div>`;
    ov.hidden = false;
    if (found) {
      const r = K.$('#gCanvas', root).getBoundingClientRect();
      K.fx.confetti({ x: r.left + r.width / 2, y: r.top + r.height / 2, count: 60 });
    }
    K.$('#gNext', root).addEventListener('click', () => {
      if (last) return podium();
      game.round++;
      startRound();
    });
  }
  function podium() {
    const s = game.scores;
    const list = [
      [C.herNick, s.eln, '#E3174D'],
      [C.myNick, s.me, '#26C9FF'],
      [C.friendName, s.nehir, '#C9B6FF'],
    ].sort((a, b) => b[1] - a[1]);
    const won = list[0][0] === C.herNick;
    const ov = K.$('#gOverlay', root);
    ov.innerHTML = `<div class="g-reveal">
      <p class="g-rv-eyebrow">Oyun bitti</p>
      <div class="podium">${[list[1], list[0], list[2]]
        .map((p, i) => `<div class="pod pod-${i}"><span class="g-av">${A.kitty({ bow: p[2], blush: false, cls: i === 1 ? 'is-happy' : '' })}</span><b>${K.esc(p[0])}</b><span class="tnum">${p[1]}</span><div class="pod-bar">${i === 1 ? 1 : i === 0 ? 2 : 3}</div></div>`)
        .join('')}</div>
      <p class="g-rv-msg">${won ? 'Kazanan sensin! (Zaten hep sen kazanıyorsun.)' : 'Bu sefer olmadı ama benim kalbimde birincilik hep senin.'}</p>
      <button class="btn" id="gAgain">${A.ui('refresh')} Yeni oyun</button></div>`;
    if (won) K.fx.confetti({ count: 120 });
    K.$('#gAgain', root).addEventListener('click', newGame);
  }

  /* ================= ÇİZİM MODU ================= */
  const pen = { color: '#E3174D', size: 8, tool: 'brush' };
  let dcv, dcx, drawing = false, last = null, lastMid = null;
  const undo = [];
  function snapshot() {
    try {
      undo.push(dcx.getImageData(0, 0, W, H));
      if (undo.length > 12) undo.shift();
    } catch (e) {}
  }
  function pos(e) {
    const r = dcv.getBoundingClientRect();
    return [((e.clientX - r.left) / r.width) * W, ((e.clientY - r.top) / r.height) * H];
  }
  function initDraw() {
    dcv = K.$('#dCanvas', root);
    dcx = dcv.getContext('2d', { willReadFrequently: true });
    dcx.fillStyle = '#fff';
    dcx.fillRect(0, 0, W, H);
    const pal = K.$('#dPalette', root);
    pal.innerHTML = PALETTE.map((c) => `<button class="sw" style="--c:${c}" data-c="${c}" aria-label="Renk ${c}" aria-pressed="${c === pen.color}"></button>`).join('');
    pal.addEventListener('click', (e) => {
      const b = e.target.closest('.sw');
      if (!b) return;
      pen.color = b.dataset.c;
      if (pen.tool === 'eraser') setTool('brush');
      K.$$('.sw', pal).forEach((x) => x.setAttribute('aria-pressed', x === b ? 'true' : 'false'));
    });
    K.$$('[data-size]', root).forEach((b) =>
      b.addEventListener('click', () => {
        pen.size = +b.dataset.size;
        K.$$('[data-size]', root).forEach((x) => x.setAttribute('aria-pressed', x === b ? 'true' : 'false'));
      })
    );
    K.$$('[data-tool]', root).forEach((b) => b.addEventListener('click', () => setTool(b.dataset.tool)));
    K.$('#dUndo', root).addEventListener('click', () => {
      const s = undo.pop();
      if (s) dcx.putImageData(s, 0, 0);
    });
    K.$('#dClear', root).addEventListener('click', () => {
      snapshot();
      dcx.fillStyle = '#fff';
      dcx.fillRect(0, 0, W, H);
    });
    K.$('#dPrompt', root).addEventListener('click', newPrompt);
    newPrompt();

    dcv.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      dcv.setPointerCapture(e.pointerId);
      const p = pos(e);
      if (pen.tool === 'bucket') {
        snapshot();
        flood(Math.round(p[0]), Math.round(p[1]), pen.color);
        return;
      }
      snapshot();
      drawing = true;
      last = p;
      lastMid = p;
      dot(p);
    });
    dcv.addEventListener('pointermove', (e) => {
      if (!drawing) return;
      const evs = e.getCoalescedEvents ? e.getCoalescedEvents() : [e];
      evs.forEach((ev) => {
        const p = pos(ev);
        const mid = [(last[0] + p[0]) / 2, (last[1] + p[1]) / 2];
        dcx.strokeStyle = pen.tool === 'eraser' ? '#fff' : pen.color;
        dcx.lineWidth = pen.size * (pen.tool === 'eraser' ? 2.2 : 1);
        dcx.lineCap = dcx.lineJoin = 'round';
        dcx.beginPath();
        dcx.moveTo(lastMid[0], lastMid[1]);
        dcx.quadraticCurveTo(last[0], last[1], mid[0], mid[1]);
        dcx.stroke();
        last = p;
        lastMid = mid;
      });
    });
    const end = () => (drawing = false);
    dcv.addEventListener('pointerup', end);
    dcv.addEventListener('pointercancel', end);

    K.$('#dSave', root).addEventListener('click', save);
    K.$('#dDownload', root).addEventListener('click', () => K.download(dcv.toDataURL('image/png'), `eln-cizim-${K.time.todayKey()}.png`));
    K.$('#dShare', root).addEventListener('click', async () => {
      const file = await K.dataUrlToFile(dcv.toDataURL('image/png'), 'eln-cizim.png');
      const r = await K.share({ title: 'Sana bir çizim', text: `${C.herName}'den ${C.myName}'e bir çizim`, file });
      if (r === 'failed' || r === 'copied') K.fx.toast('Bu cihaz doğrudan paylaşamıyor. "İndir" ile kaydedip gönderebilirsin.', { icon: A.icon('palette') });
    });
  }
  function setTool(t) {
    pen.tool = t;
    K.$$('[data-tool]', root).forEach((x) => x.setAttribute('aria-pressed', x.dataset.tool === t ? 'true' : 'false'));
  }
  function dot(p) {
    dcx.fillStyle = pen.tool === 'eraser' ? '#fff' : pen.color;
    dcx.beginPath();
    dcx.arc(p[0], p[1], (pen.size * (pen.tool === 'eraser' ? 2.2 : 1)) / 2, 0, Math.PI * 2);
    dcx.fill();
  }
  function newPrompt() {
    const t = K.fill(K.pick(PROMPTS));
    K.$('#dPromptText', root).textContent = t;
    pen.prompt = t;
  }
  // Kova ile boyama (tarama çizgili doldurma)
  function flood(x, y, hex) {
    const img = dcx.getImageData(0, 0, W, H);
    const d = img.data;
    const i0 = (y * W + x) * 4;
    const t = [d[i0], d[i0 + 1], d[i0 + 2]];
    const c = [parseInt(hex.slice(1, 3), 16), parseInt(hex.slice(3, 5), 16), parseInt(hex.slice(5, 7), 16)];
    if (Math.abs(t[0] - c[0]) + Math.abs(t[1] - c[1]) + Math.abs(t[2] - c[2]) < 10) return;
    const match = (i) => Math.abs(d[i] - t[0]) + Math.abs(d[i + 1] - t[1]) + Math.abs(d[i + 2] - t[2]) < 90;
    const stack = [[x, y]];
    while (stack.length) {
      let [cx, cy] = stack.pop();
      let i = (cy * W + cx) * 4;
      while (cy >= 0 && match(i)) {
        cy--;
        i -= W * 4;
      }
      cy++;
      i += W * 4;
      let left = false,
        right = false;
      while (cy < H && match(i)) {
        d[i] = c[0];
        d[i + 1] = c[1];
        d[i + 2] = c[2];
        d[i + 3] = 255;
        if (cx > 0) {
          if (match(i - 4)) {
            if (!left) {
              stack.push([cx - 1, cy]);
              left = true;
            }
          } else left = false;
        }
        if (cx < W - 1) {
          if (match(i + 4)) {
            if (!right) {
              stack.push([cx + 1, cy]);
              right = true;
            }
          } else right = false;
        }
        cy++;
        i += W * 4;
      }
    }
    dcx.putImageData(img, 0, 0);
  }
  function save() {
    const small = document.createElement('canvas');
    small.width = 480;
    small.height = 360;
    small.getContext('2d').drawImage(dcv, 0, 0, 480, 360);
    const img = small.toDataURL('image/jpeg', 0.82);
    const list = K.store.get('drawings', []);
    list.unshift({ id: Date.now(), img, prompt: pen.prompt, date: K.time.todayKey() });
    while (list.length > 30) list.pop();
    let ok = K.store.set('drawings', list);
    while (!ok && list.length > 1) {
      list.pop();
      ok = K.store.set('drawings', list);
    }
    if (!ok) {
      K.fx.toast('Kaydedilemedi: tarayıcının hafızası dolu. "İndir" ile cihazına kaydedebilirsin.');
      return;
    }
    K.audio.sfx.success();
    K.fx.toast('Çizimin <b>Çizimlerim</b> ve <b>Anı Duvarı</b>\'na asıldı.', { icon: A.icon('palette') });
    K.stickers.award('ressam');
    renderMine();
  }

  /* ================= ÇİZİMLERİM ================= */
  function renderMine() {
    const list = K.store.get('drawings', []);
    const box = K.$('#dMine', root);
    if (!list.length) {
      box.innerHTML = '<p class="muted">Henüz kayıtlı çizim yok. "Sen Çiz" sekmesinde ilk eserini yap; o da buraya asılsın.</p>';
      return;
    }
    box.innerHTML = list
      .map((d) => `<button class="mine-item" data-id="${d.id}"><img src="${d.img}" alt="${K.esc(d.prompt || 'Çizim')}"><span>${K.esc(d.prompt || '')}</span><small>${K.time.fmtShort(d.date)}</small></button>`)
      .join('');
  }
  function openMine(id) {
    const list = K.store.get('drawings', []);
    const d = list.find((x) => String(x.id) === String(id));
    if (!d) return;
    const m = K.ui.modal({
      label: 'Çizim',
      html: `<h3>${K.esc(d.prompt || 'Çizimim')}</h3><p class="muted">${K.time.fmt(d.date)}</p>
        <img src="${d.img}" alt="" style="border-radius:16px;border:2px solid var(--line);margin-top:12px;width:100%">
        <div class="actions"><button class="btn" data-a="dl">${A.ui('download')} İndir</button><button class="btn soft" data-a="share">${A.ui('share')} Gönder</button><button class="btn ghost" data-a="del">${A.ui('trash')} Sil</button></div>
        <p class="muted small" data-confirm hidden style="margin-top:10px">Silmek için bir kez daha bas.</p>`,
    });
    let armed = false;
    m.el.addEventListener('click', async (e) => {
      const a = e.target.closest('[data-a]');
      if (!a) return;
      if (a.dataset.a === 'dl') K.download(d.img, `eln-cizim-${d.date}.jpg`);
      if (a.dataset.a === 'share') {
        const file = await K.dataUrlToFile(d.img, 'eln-cizim.jpg');
        const r = await K.share({ title: 'Sana bir çizim', text: d.prompt || '', file });
        if (r === 'failed' || r === 'copied') K.fx.toast('Bu cihaz doğrudan paylaşamıyor. "İndir" ile kaydedip gönderebilirsin.');
      }
      if (a.dataset.a === 'del') {
        if (!armed) {
          armed = true;
          K.$('[data-confirm]', m.el).hidden = false;
          a.classList.add('red');
          return;
        }
        K.store.set('drawings', list.filter((x) => x.id !== d.id));
        renderMine();
        m.close();
      }
    });
  }

  function showTab(t) {
    K.$$('[data-tab]', root).forEach((s) => (s.hidden = s.dataset.tab !== t));
    K.$$('.tabs .chip', root).forEach((c) => c.setAttribute('aria-selected', c.dataset.t === t ? 'true' : 'false'));
    if (t !== 'guess') {
      game.active = false;
      clearTimers();
    } else if (game.word && !game.found && !game.active) {
      // Sekmeye dönünce turu yeniden başlat
      startRound();
    }
    if (t === 'mine') renderMine();
  }

  K.room({
    id: 'gartic',
    title: 'Gartic Odası',
    sub: `${C.myNick} çiziyor, ${C.herNick} tahmin ediyor`,
    icon: 'palette',
    color: '#D8F5E8',
    badge: () => {
      const n = K.stickers.count('garticCorrect');
      return n ? `${n} kelime` : '';
    },
    init(el) {
      root = el;
      el.innerHTML = `
        <p class="room-intro">Her şey bir çizim oyununda başladı. Bu oda sadece ikimize ait: Ben çiziyorum, sen tahmin ediyorsun. Azerbaycanca ve İngilizce cevaplar da geçerli; öğretmenim ne de olsa.</p>
        <div class="tabs" role="tablist">
          <button class="chip" role="tab" data-t="guess" aria-selected="true">Tahmin et</button>
          <button class="chip" role="tab" data-t="draw" aria-selected="false">Sen çiz</button>
          <button class="chip" role="tab" data-t="mine" aria-selected="false">Çizimlerim</button>
        </div>
        <section data-tab="guess">
          <div class="gartic">
            <div class="g-top">
              <span class="g-round" id="gRound"></span>
              <div class="g-word" id="gWord" aria-live="polite"></div>
              <div class="g-timer"><svg viewBox="0 0 44 44"><circle cx="22" cy="22" r="20" fill="#fff" stroke="#E7F7EF" stroke-width="4"/><circle id="gRing" cx="22" cy="22" r="20" fill="none" stroke="#11B03C" stroke-width="4" stroke-dasharray="126" transform="rotate(-90 22 22)"/></svg><span id="gTime" class="tnum">80</span></div>
            </div>
            <div class="g-main">
              <ul class="g-players" id="gPlayers"></ul>
              <div class="g-canvas-wrap">
                <canvas id="gCanvas" width="${W}" height="${H}" aria-label="${C.myNick}'in çizimi"></canvas>
                <div class="g-overlay" id="gOverlay" hidden></div>
              </div>
              <div class="g-chat">
                <div class="g-log" id="gLog" aria-live="polite"></div>
                <form class="g-form" id="gForm" autocomplete="off">
                  <input class="input" id="gInput" name="gInput" placeholder="Tahminini yaz..." maxlength="40" autocapitalize="off">
                  <button class="btn small" type="submit" aria-label="Gönder">${A.ui('send')}</button>
                </form>
              </div>
            </div>
            <div class="g-actions"><button class="btn ghost small" id="gHintBtn">${A.ui('sparkle')} Harf aç</button><button class="btn ghost small" id="gSkip">Pas geç</button></div>
          </div>
        </section>
        <section data-tab="draw" hidden>
          <div class="draw">
            <div class="d-prompt card"><div><p class="card-eyebrow">Bugün bana bunu çiz</p><p class="d-prompt-text" id="dPromptText"></p></div><button class="btn soft small" id="dPrompt">${A.ui('shuffle')} Başka</button></div>
            <div class="d-board"><canvas id="dCanvas" width="${W}" height="${H}" aria-label="Çizim tahtası"></canvas></div>
            <div class="d-tools">
              <div class="d-palette" id="dPalette"></div>
              <div class="d-row">
                <div class="seg" aria-label="Fırça boyutu">${[4, 8, 16, 30].map((s) => `<button data-size="${s}" aria-pressed="${s === 8}" aria-label="Boyut ${s}"><i style="width:${Math.min(22, s * 0.8 + 3)}px;height:${Math.min(22, s * 0.8 + 3)}px"></i></button>`).join('')}</div>
                <div class="seg">
                  <button data-tool="brush" aria-pressed="true" aria-label="Kalem">${A.ui('brush')}</button>
                  <button data-tool="eraser" aria-pressed="false" aria-label="Silgi">${A.ui('eraser')}</button>
                  <button data-tool="bucket" aria-pressed="false" aria-label="Boya kovası">${A.ui('bucket')}</button>
                  <button id="dUndo" aria-label="Geri al">${A.ui('undo')}</button>
                  <button id="dClear" aria-label="Temizle">${A.ui('trash')}</button>
                </div>
              </div>
              <div class="d-row">
                <button class="btn" id="dSave">${A.ui('heart')} Duvara as</button>
                <button class="btn soft" id="dShare">${A.ui('share')} ${K.esc(C.myName)}'e gönder</button>
                <button class="btn ghost" id="dDownload">${A.ui('download')} İndir</button>
              </div>
            </div>
          </div>
        </section>
        <section data-tab="mine" hidden><div class="mine" id="dMine"></div></section>`;
      gcv = K.$('#gCanvas', el);
      gcx = gcv.getContext('2d');
      K.$$('.tabs .chip', el).forEach((c) => c.addEventListener('click', () => showTab(c.dataset.t)));
      K.$('#gForm', el).addEventListener('submit', (e) => {
        e.preventDefault();
        const inp = K.$('#gInput', el);
        guess(inp.value);
        inp.value = '';
      });
      K.$('#gHintBtn', el).addEventListener('click', () => game.active && reveal());
      K.$('#gSkip', el).addEventListener('click', () => game.active && endRound(false));
      K.$('#dMine', el).addEventListener('click', (e) => {
        const b = e.target.closest('.mine-item');
        if (b) openMine(b.dataset.id);
      });
      initDraw();
      newGame();
    },
    enter() {
      if (game.word && !game.found && !game.active && !K.$('[data-tab="guess"]', root).hidden) startRound();
    },
    leave() {
      game.active = false;
      clearTimers();
    },
  });
})();
