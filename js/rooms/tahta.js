/* Oda: Ortak Tahta — ikisi aynı tahtaya canlı çizer; istenirse gartic gibi tur: biri çizer, öteki tahmin eder */
(function () {
  'use strict';
  const K = window.K;
  const A = K.art;
  const D = window.ELN;
  const C = D.config;

  const W = 800, H = 600;
  const WORDS = ['kalp', 'fiyonk', 'kedi', 'köpek', 'ay', 'yıldız', 'uçak', 'kule', 'çiçek', 'pasta', 'mektup', 'taç', 'bulut', 'güneş', 'deniz', 'ev', 'balık', 'kelebek', 'dondurma', 'şemsiye', 'gözlük', 'kitap', 'telefon', 'gitar', 'hediye', 'simit', 'çay', 'martı', 'yüzük', 'balon', 'kurabiye', 'tren', 'gökkuşağı', 'kardan adam', 'prenses'];
  const COLORS = ['#2B2024', '#E3174D', '#FF8FB8', '#FFB547', '#FFD34E', '#3FA37A', '#4FA3E3', '#8F73E6', '#8B5E3C', '#FFFFFF'];
  let root, cv, cx;
  let color = COLORS[1], size = 8, eraser = false;
  let drawing = null, buf = [], flushT = null;
  const remote = {};
  let otherSeen = 0, hereT = null;
  let round = null, timerT = null;
  const mine = () => (K.isOwner() ? 'me' : 'her');
  const nameOf = (w) => (w === 'me' ? C.myPet : C.herPet);

  function line(a, b, c, w, er) {
    cx.save();
    cx.globalCompositeOperation = er ? 'destination-out' : 'source-over';
    cx.strokeStyle = c;
    cx.lineWidth = w;
    cx.lineCap = 'round';
    cx.lineJoin = 'round';
    cx.beginPath();
    cx.moveTo(a[0] * W, a[1] * H);
    cx.lineTo(b[0] * W, b[1] * H);
    cx.stroke();
    cx.restore();
  }
  function clear() {
    cx.clearRect(0, 0, W, H);
  }
  function pos(e) {
    const r = cv.getBoundingClientRect();
    return [K.clamp((e.clientX - r.left) / r.width, 0, 1), K.clamp((e.clientY - r.top) / r.height, 0, 1)];
  }
  function flush() {
    if (!buf.length || !drawing) return;
    K.cloud.send('draw', { s: drawing.id, c: drawing.c, w: drawing.w, er: drawing.er, p: buf.map((q) => [+q[0].toFixed(4), +q[1].toFixed(4)]) });
    buf = [drawing.last];
  }
  function initCanvas() {
    cv.width = W;
    cv.height = H;
    cx = cv.getContext('2d');
    cv.addEventListener('pointerdown', (e) => {
      if (round && round.drawer !== mine() && !round.over) return K.fx.toast('Bu turda sen tahmin ediyorsun; çizim onun.', { icon: A.icon('pencil') });
      e.preventDefault();
      cv.setPointerCapture(e.pointerId);
      const p = pos(e);
      drawing = { id: mine() + Date.now(), c: color, w: size, er: eraser, last: p };
      buf = [p];
      line(p, p, color, size, eraser);
      flushT = setInterval(flush, 60);
    });
    cv.addEventListener('pointermove', (e) => {
      if (!drawing) return;
      const p = pos(e);
      line(drawing.last, p, drawing.c, drawing.w, drawing.er);
      drawing.last = p;
      buf.push(p);
    });
    const end = () => {
      if (!drawing) return;
      flush();
      clearInterval(flushT);
      drawing = null;
      buf = [];
    };
    cv.addEventListener('pointerup', end);
    cv.addEventListener('pointercancel', end);
  }

  /* Canlı mesajlar */
  K.on('cloud', (on) => {
    if (!on) return;
    K.cloud.onLive('draw', (m) => {
      if (!cx) return;
      const prev = remote[m.s];
      let pts = m.p;
      if (prev) pts = [prev].concat(pts);
      if (pts.length === 1) line(pts[0], pts[0], m.c, m.w, m.er);
      for (let i = 1; i < pts.length; i++) line(pts[i - 1], pts[i], m.c, m.w, m.er);
      remote[m.s] = pts[pts.length - 1];
      otherSeen = Date.now();
    });
    K.cloud.onLive('clear', () => cx && clear());
    K.cloud.onLive('bhere', (m) => {
      const fresh = Date.now() - otherSeen > 6000;
      otherSeen = Date.now();
      if (m.hello && cx) K.cloud.send('snap', { img: snapshot() });
      if (fresh) presence();
    });
    K.cloud.onLive('snap', (m) => {
      if (!cx || !m.img) return;
      const img = new Image();
      img.onload = () => cx.drawImage(img, 0, 0, W, H);
      img.src = m.img;
    });
    K.cloud.on('round', () => score());
    K.cloud.onLive('round', (m) => startRound(m, false));
    K.cloud.onLive('guess', (m) => onGuess(m));
    K.cloud.onLive('win', (m) => endRound(m, false));
    K.cloud.onLive('end', (m) => endRound(m, false));
  });
  // Sonradan gelen için tahtanın o anki hâli (canlı mesaj sınırına sığacak kadar küçük)
  function snapshot() {
    const webp = cv.toDataURL('image/webp', 0.5);
    if (webp.startsWith('data:image/webp') && webp.length < 150000) return webp;
    const c2 = document.createElement('canvas');
    c2.width = W / 2;
    c2.height = H / 2;
    const x2 = c2.getContext('2d');
    x2.fillStyle = '#fff';
    x2.fillRect(0, 0, c2.width, c2.height);
    x2.drawImage(cv, 0, 0, c2.width, c2.height);
    return c2.toDataURL('image/jpeg', 0.6);
  }
  function presence() {
    const el = root && K.$('#thHere', root);
    if (!el) return;
    const here = Date.now() - otherSeen < 7000;
    el.classList.toggle('on', here);
    el.textContent = here ? `${nameOf(K.cloud.other())} tahtada` : `${nameOf(K.cloud.other())} tahtada değil`;
  }

  /* Tur */
  // Tahmin edenin gördüğü: _ _ A _ (çizen taraf zamanla harf açar)
  const blanks = () =>
    Array.from({ length: round.len }, (_, i) => {
      const h = round.shown.find((s) => s.i === i);
      return h ? (h.ch === ' ' ? '·' : h.ch.toLocaleUpperCase('tr')) : '_';
    }).join(' ');
  function pickWord() {
    const opts = K.shuffle(WORDS).slice(0, 3);
    const m = K.ui.modal({
      label: 'Kelime seç',
      html: `<h3>Ne çizeceksin?</h3><p class="muted">Sadece sen görüyorsun. ${K.esc(nameOf(K.cloud.other()))} tahmin edecek.</p><div class="actions">${opts.map((w) => `<button class="btn soft" data-w="${K.esc(w)}">${K.esc(w)}</button>`).join('')}</div>`,
    });
    m.el.addEventListener('click', (e) => {
      const b = e.target.closest('[data-w]');
      if (!b) return;
      m.close();
      const word = b.dataset.w;
      const r = { id: 'r' + Date.now(), drawer: mine(), len: word.length, until: Date.now() + 90e3 };
      clear();
      K.cloud.send('clear', {});
      startRound(Object.assign({ word }, r), true);
      K.cloud.send('round', r);
    });
  }
  function startRound(m, isDrawer) {
    clearInterval(timerT);
    round = { id: m.id, drawer: m.drawer, len: m.len, until: m.until, word: isDrawer ? m.word : null, shown: [], over: false };
    const box = K.$('#thGame', root);
    if (!box) return;
    K.audio.sfx.chime();
    renderGame();
    timerT = setInterval(() => {
      if (!round || round.over) return clearInterval(timerT);
      const left = Math.max(0, Math.ceil((round.until - Date.now()) / 1000));
      const t = K.$('#thTimer', root);
      if (t) t.textContent = left;
      if (round.word && left > 0 && left % 25 === 0 && round.shown.length < Math.floor(round.word.length / 2)) {
        const cand = round.word.split('').map((c, i) => i).filter((i) => !round.shown.includes(i) && round.word[i] !== ' ');
        const i = K.pick(cand);
        round.shown.push(i);
        K.cloud.send('guess', { hint: { i, ch: round.word[i] }, id: round.id });
      }
      if (left <= 0 && round.word) {
        K.cloud.send('end', { id: round.id, word: round.word });
        endRound({ id: round.id, word: round.word }, true);
      }
    }, 1000);
  }
  function renderGame() {
    const box = K.$('#thGame', root);
    if (!box) return;
    if (!round || round.over) {
      box.innerHTML = `<button class="btn red" id="thStart" type="button">${A.icon('pencil')} Tur başlat: ben çizeyim</button>${round && round.over ? `<p class="th-result hand">${K.esc(round.result || '')}</p>` : ''}`;
      K.$('#thStart', root).addEventListener('click', pickWord);
      return;
    }
    const drawer = round.drawer === mine();
    box.innerHTML = `<div class="th-round"><span class="th-timer tnum" id="thTimer">90</span>
      ${drawer ? `<p>Sen çiziyorsun: <b class="th-word">${K.esc(round.word)}</b></p>` : `<p class="muted small">${K.esc(nameOf(round.drawer))} çiziyor, sen tahmin et. Harfler zamanla açılır.</p><p class="th-blanks tnum" id="thBlanks">${K.esc(blanks())}</p>`}
      ${drawer ? '' : `<form class="row" id="thGuess" autocomplete="off"><input class="input" id="thGuessIn" name="thGuessIn" maxlength="30" placeholder="Tahminin"><button class="btn small" type="submit">Tahmin</button></form>`}
      <ul class="th-log" id="thLog"></ul></div>`;
    const f = K.$('#thGuess', root);
    f &&
      f.addEventListener('submit', (e) => {
        e.preventDefault();
        const v = K.$('#thGuessIn', root).value.trim();
        if (!v) return;
        K.$('#thGuessIn', root).value = '';
        log(`Sen: ${v}`);
        K.cloud.send('guess', { text: v, id: round.id });
      });
  }
  function log(t, cls = '') {
    const l = K.$('#thLog', root);
    if (!l) return;
    l.insertAdjacentHTML('afterbegin', `<li class="${cls}">${K.esc(t)}</li>`);
  }
  function onGuess(m) {
    if (!round || m.id !== round.id) return;
    if (m.hint && round.drawer !== mine()) {
      round.shown.push(m.hint);
      const b = K.$('#thBlanks', root);
      if (b) b.textContent = blanks();
      return;
    }
    if (round.drawer !== mine() || !m.text) return;
    log(`${nameOf(m.who)}: ${m.text}`);
    const g = K.norm(m.text).replace(/ /g, '');
    const w = K.norm(round.word).replace(/ /g, '');
    if (g === w || (w.length > 5 && K.lev(g, w) <= 1)) {
      const res = { id: round.id, word: round.word, guesser: m.who };
      K.cloud.send('win', res);
      endRound(res, true);
    }
  }
  function endRound(m, local) {
    if (!round || m.id !== round.id || round.over) return;
    round.over = true;
    clearInterval(timerT);
    const won = Boolean(m.guesser);
    round.result = won ? `${nameOf(m.guesser)} bildi: "${m.word}"!` : `Süre bitti. Kelime: "${m.word}"`;
    if (won) {
      K.fx.confetti({ count: 120 });
      K.audio.sfx.success();
    } else K.audio.sfx.fail();
    if (local) K.cloud.add('round', { drawer: round.drawer, word: m.word, win: won, guesser: m.guesser || '' });
    renderGame();
    score();
  }
  async function score() {
    const rows = await K.cloud.list('round');
    const wins = { her: 0, me: 0 };
    rows.forEach((r) => {
      if (r.data.win && r.data.guesser) wins[r.data.guesser] = (wins[r.data.guesser] || 0) + 1;
    });
    const el = root && K.$('#thScore', root);
    if (el) el.innerHTML = `<span class="gtag">${K.esc(C.herPet)} ${wins.her}</span><span class="gtag">${K.esc(C.myPet)} ${wins.me}</span>`;
  }

  K.room({
    id: 'tahta',
    wing: 'oyun',
    title: 'Ortak Tahta',
    sub: 'Aynı tahta, iki kalem, canlı',
    icon: 'palette',
    color: '#D8F5E8',
    hidden: () => !K.cloud || !K.cloud.enabled,
    init(el) {
      root = el;
      el.innerHTML = `
        <p class="room-intro">Tanıştığınız oyunun ikinize özel hâli. Aynı tahtaya aynı anda çizin; ya da bir tur başlatın: biri çizer, öteki tahmin eder. Skor kalede saklanıyor.</p>
        <div class="th-top"><span class="th-here" id="thHere"></span><span class="th-score" id="thScore"></span></div>
        <div class="th-board"><canvas id="thCanvas" aria-label="Ortak çizim tahtası"></canvas></div>
        <div class="th-tools">
          <div class="th-colors">${COLORS.map((c, i) => `<button type="button" class="nw-sw ${i === 1 ? 'on' : ''}" data-c="${c}" style="--c:${c}" aria-label="Renk"></button>`).join('')}</div>
          <div class="kc-presets">${[4, 8, 16].map((s) => `<button type="button" class="chip" data-s="${s}" aria-pressed="${s === 8}">${s === 4 ? 'İnce' : s === 8 ? 'Orta' : 'Kalın'}</button>`).join('')}<button type="button" class="chip" id="thEraser" aria-pressed="false">Silgi</button></div>
          <div class="actions"><button class="btn ghost small" id="thClear" type="button">${A.ui('trash')} Temizle</button><button class="btn soft small" id="thSave" type="button">${A.ui('image')} Anı Duvarı'na as</button></div>
        </div>
        <div class="card th-game" id="thGame"></div>`;
      cv = K.$('#thCanvas', el);
      initCanvas();
      el.addEventListener('click', async (e) => {
        const c = e.target.closest('[data-c]');
        const s = e.target.closest('[data-s]');
        if (c) {
          color = c.dataset.c;
          eraser = false;
          K.$('#thEraser', el).setAttribute('aria-pressed', 'false');
          K.$$('.th-colors .nw-sw', el).forEach((x) => x.classList.toggle('on', x === c));
        }
        if (s) {
          size = +s.dataset.s;
          K.$$('[data-s]', el).forEach((x) => x.setAttribute('aria-pressed', String(x === s)));
        }
        if (e.target.closest('#thEraser')) {
          eraser = !eraser;
          K.$('#thEraser', el).setAttribute('aria-pressed', String(eraser));
        }
        if (e.target.closest('#thClear')) {
          clear();
          K.cloud.send('clear', {});
        }
        if (e.target.closest('#thSave')) {
          const c2 = document.createElement('canvas');
          c2.width = W;
          c2.height = H;
          const x2 = c2.getContext('2d');
          x2.fillStyle = '#fff';
          x2.fillRect(0, 0, W, H);
          x2.drawImage(cv, 0, 0);
          await K.cloud.add('photo', { img: c2.toDataURL('image/jpeg', 0.85), caption: 'Ortak tahtadan', date: K.time.todayKey() });
          K.fx.toast('Çizim Anı Duvarı\'na asıldı.', { icon: A.icon('camera') });
        }
      });
    },
    enter() {
      renderGame();
      score();
      presence();
      K.cloud.send('bhere', { hello: true });
      clearInterval(hereT);
      hereT = setInterval(() => {
        K.cloud.send('bhere', {});
        presence();
      }, 2500);
    },
    leave() {
      clearInterval(hereT);
    },
  });
})();
