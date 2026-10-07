/* Oda: Kilitli Kule 2 — Hazar'ın Sırrı. İki kişilik yeni kaçış odası; ikimiz aynı anda kalede ve telefonda olmalıyız.
   İpuçlarının yarısı Bakü tarafında, yarısı İstanbul tarafında; yalnızca konuşarak açılır:
   1) Fener: Bakü tarafı fenerin Mors ışığını görür ("kısa, uzun..."), İstanbul tarafı Mors tablosuyla kelimeyi yazar.
   2) Rota: Bakü tarafı gemiyi yönetir ama kayaları göremez; İstanbul tarafı haritada kayaları ve hazineyi görür.
   3) Deniz kabukları: İstanbul tarafı melodiyi dinler (mırıldanarak anlatır), Bakü tarafı beş kabukla çalar.
   4) Yırtık mektup: kelimenin üst yarısı Bakü'de, alt yarısı İstanbul'da; ikisi de doğru yazınca sandık açılır.
   Her oyun bir tohumla karışır; iki taraf aynı tohumu canlı mesajla paylaşır. Kayıtlar: kule2bitti {sec} */
(function () {
  'use strict';
  const K = window.K;
  const A = K.art;
  const D = window.ELN;
  const C = D.config;

  const mine = () => (K.isOwner() ? 'me' : 'her');
  const side = () => (mine() === 'her' ? 'baku' : 'ist');
  const nameOf = (w) => (w === 'me' ? C.myPet : C.herPet);
  const otherName = () => nameOf(mine() === 'me' ? 'her' : 'me');
  const MORS = { A: '.-', B: '-...', C: '-.-.', D: '-..', E: '.', F: '..-.', G: '--.', H: '....', I: '..', J: '.---', K: '-.-', L: '.-..', M: '--', N: '-.', O: '---', P: '.--.', R: '.-.', S: '...', T: '-', U: '..-', V: '...-', Y: '-.--', Z: '--..' };
  const WORDS1 = ['HAZAR', 'KALP', 'DENIZ', 'FENER', 'MARTI', 'SAHIL', 'DALGA', 'YILDIZ'];
  const WORDS4 = ['SONSUZ', 'KAVUŞMA', 'SARILMA', 'BİRLİKTE', 'ÖZLEDİM', 'GÜLÜMSE'];
  const SHELLS = [['#FF8FB8', 60], ['#FFD34E', 62], ['#7ED6A5', 64], ['#8FD3FF', 67], ['#C9B6FF', 69]];
  const N = 7;
  // Klavye farkı sorun olmasın: "ozledim" de "ÖZLEDİM" de kabul
  const norm = (v) => String(v).trim().toLocaleUpperCase('tr').replace(/[İI]/g, 'I').replace(/Ş/g, 'S').replace(/Ğ/g, 'G').replace(/Ü/g, 'U').replace(/Ö/g, 'O').replace(/Ç/g, 'C').replace(/Ə/g, 'E').replace(/[^A-Z]/g, '');
  let root = null, g = null, tick = 0, blink = 0, seq = [], finalOk = { me: false, other: false }, best = [];

  function build(seed) {
    const r = K.rng(seed);
    const int = (n) => Math.floor(r() * n);
    const w1 = WORDS1[int(WORDS1.length)];
    const goal = [1 + int(N - 2), int(2)];
    let rocks;
    for (let tries = 0; tries < 50; tries++) {
      rocks = new Set();
      while (rocks.size < 11) {
        const x = int(N), y = int(N);
        if ((x === 0 && y === N - 1) || (x === goal[0] && y === goal[1])) continue;
        rocks.add(`${x},${y}`);
      }
      if (reachable(rocks, goal)) break;
    }
    const mel = Array.from({ length: 5 }, () => int(SHELLS.length));
    const w4 = WORDS4[int(WORDS4.length)];
    return { w1, goal, rocks: [...rocks], mel, w4 };
  }
  function reachable(rocks, goal) {
    const seen = new Set(['0,' + (N - 1)]);
    const q = [[0, N - 1]];
    while (q.length) {
      const [x, y] = q.shift();
      if (x === goal[0] && y === goal[1]) return true;
      [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([dx, dy]) => {
        const nx = x + dx, ny = y + dy, k = `${nx},${ny}`;
        if (nx >= 0 && ny >= 0 && nx < N && ny < N && !rocks.has(k) && !seen.has(k)) seen.add(k), q.push([nx, ny]);
      });
    }
    return false;
  }

  /* ---------- Canlı ---------- */
  const send = (m) => K.cloud.send('k2', m);
  function start(seed, at, lvl, ship) {
    g = Object.assign(build(seed), { seed, at, lvl: lvl || 0, ship: ship || [0, N - 1], done: false, wrong: 0 });
    seq = [];
    finalOk = { me: false, other: false };
    clearInterval(tick);
    tick = setInterval(() => {
      const t = root && K.$('#k2Saat', root);
      if (t && g && !g.done) t.textContent = clock(Date.now() - g.at);
    }, 500);
    render();
  }
  const clock = (ms) => {
    const s = Math.floor(ms / 1000);
    return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
  };
  function advance(n) {
    if (!g || n < g.lvl) return;
    g.lvl = n + 1;
    seq = [];
    K.audio.sfx.success();
    K.fx.confetti({ count: 70, shapes: ['star', 'heart'] });
    render();
  }
  async function win(sec) {
    if (!g || g.done) return;
    g.done = true;
    g.sec = sec;
    clearInterval(tick);
    clearInterval(blink);
    K.audio.sfx.success();
    K.fx.confetti({ count: 240, shapes: ['heart', 'star', 'bow'] });
    K.stickers.award('kule2');
    if (mine() === 'me') {
      const r = await K.cloud.add('kule2bitti', { sec });
      r && !best.some((x) => x.id === r.id) && best.push(r);
    }
    render();
  }
  function onMsg(m) {
    if (!m || m.who === mine()) return;
    if (m.t === 'start') {
      start(m.seed, m.at, 0);
      K.fx.toast(`<b>${K.esc(nameOf(m.who))} Kilitli Kule 2'yi başlattı!</b>`, { icon: A.icon('key') });
      if (K.activeRoom !== 'kule2') location.hash = 'kule2';
    }
    if (m.t === 'sync?' && g && !g.done) send({ t: 'sync', seed: g.seed, at: g.at, lvl: g.lvl, ship: g.ship });
    if (m.t === 'sync' && (!g || g.seed !== m.seed)) start(m.seed, m.at, m.lvl, m.ship);
    if (m.t === 'lvl') advance(m.n);
    if (m.t === 'ship' && g) {
      g.ship = m.p;
      m.hit && K.fx.toast(`💥 Gemi kayaya çarptı! Başa döndü.`, { duration: 2200 });
      render();
    }
    if (m.t === 'wrong') K.fx.toast(`${K.esc(nameOf(m.who))} yanlış denedi. Bir daha anlatır mısın?`, { duration: 2500 });
    if (m.t === 'final' && g) {
      finalOk.other = true;
      if (finalOk.me) send({ t: 'win', sec: Math.round((Date.now() - g.at) / 1000) }), win(Math.round((Date.now() - g.at) / 1000));
      else render();
    }
    if (m.t === 'win') win(m.sec);
    if (m.t === 'quit') {
      g = null;
      clearInterval(tick);
      clearInterval(blink);
      K.fx.toast(`${K.esc(nameOf(m.who))} oyundan çıktı.`);
      render();
    }
  }
  function solved(n) {
    send({ t: 'lvl', n });
    advance(n);
  }
  function wrong() {
    g.wrong++;
    send({ t: 'wrong' });
    const box = K.$('.k2-kilit', root);
    if (box) {
      box.classList.remove('shake');
      void box.offsetWidth;
      box.classList.add('shake');
    }
    K.vibrate([60, 40, 60]);
  }

  /* ---------- Kilitler ---------- */
  function lighthouse() {
    return `<svg class="k2-fener" viewBox="0 0 160 220" aria-label="Fener"><rect width="160" height="220" fill="#1b2a4a"/><circle cx="130" cy="30" r="12" fill="#f6efc9"/>
      <path d="M0 190 Q40 176 80 190 T160 190 V220 H0Z" fill="#2f5d8a"/><path d="M58 190 L66 92 H94 L102 190Z" fill="#fff" stroke="#4A2138" stroke-width="3"/><path d="M61 150 H99 M63 120 H97" stroke="#E3174D" stroke-width="10"/>
      <rect x="62" y="70" width="36" height="24" rx="4" fill="#4A2138"/><circle id="k2Isik" cx="80" cy="82" r="10" fill="#333"/><path d="M58 70 L80 54 L102 70Z" fill="#E3174D" stroke="#4A2138" stroke-width="3"/>
      <path id="k2Huzme" d="M90 82 L160 60 L160 104Z" fill="rgba(255,236,150,.0)"/></svg>`;
  }
  function playMorse() {
    clearInterval(blink);
    const steps = [];
    [...g.w1].forEach((ch, i) => {
      if (i) steps.push([0, 3]);
      [...MORS[ch]].forEach((s, j) => {
        if (j) steps.push([0, 1]);
        steps.push([1, s === '.' ? 1 : 3]);
      });
    });
    steps.push([0, 8]);
    const flat = [];
    steps.forEach(([on, n]) => {
      for (let i = 0; i < n; i++) flat.push(on);
    });
    let i = 0;
    blink = setInterval(() => {
      const l = root && K.$('#k2Isik', root), h = root && K.$('#k2Huzme', root);
      if (!l || !g || g.lvl !== 0) return clearInterval(blink);
      const on = flat[i++ % flat.length];
      l.setAttribute('fill', on ? '#FFE680' : '#333');
      h.setAttribute('fill', on ? 'rgba(255,236,150,.55)' : 'rgba(255,236,150,0)');
    }, 260);
  }
  function grid(showAll) {
    const rocks = new Set(g.rocks);
    let cells = '';
    for (let y = 0; y < N; y++)
      for (let x = 0; x < N; x++) {
        const ship = g.ship[0] === x && g.ship[1] === y;
        const rock = showAll && rocks.has(`${x},${y}`);
        const goal = showAll && g.goal[0] === x && g.goal[1] === y;
        cells += `<span class="k2-hucre ${rock ? 'kaya' : ''} ${goal ? 'hazine' : ''}">${ship ? '⛵' : rock ? '🪨' : goal ? '✖' : ''}</span>`;
      }
    return `<div class="k2-harita" style="--n:${N}">${cells}</div>`;
  }
  function move(dx, dy) {
    const [x, y] = g.ship;
    const nx = K.clamp(x + dx, 0, N - 1), ny = K.clamp(y + dy, 0, N - 1);
    if (g.rocks.includes(`${nx},${ny}`)) {
      g.ship = [0, N - 1];
      send({ t: 'ship', p: g.ship, hit: true });
      K.vibrate([80, 40, 80]);
      K.fx.toast('💥 Görünmeyen bir kayaya çarptın! Gemi başa döndü.', { duration: 2400 });
      return render();
    }
    g.ship = [nx, ny];
    send({ t: 'ship', p: g.ship });
    if (nx === g.goal[0] && ny === g.goal[1]) return solved(1);
    render();
  }
  function shellNote(i, quiet) {
    K.audio.ensure && K.audio.ensure();
    const c = K.audio.ctx;
    if (!c) return;
    const t = c.currentTime, o = c.createOscillator(), o2 = c.createOscillator(), gn = c.createGain();
    o.type = 'sine';
    o2.type = 'triangle';
    o.frequency.value = 440 * Math.pow(2, (SHELLS[i][1] - 69) / 12);
    o2.frequency.value = o.frequency.value * 2;
    gn.gain.setValueAtTime(0.0001, t);
    gn.gain.exponentialRampToValueAtTime(quiet ? 0.12 : 0.2, t + 0.02);
    gn.gain.exponentialRampToValueAtTime(0.0001, t + 1.1);
    o.connect(gn);
    o2.connect(gn);
    gn.connect(c.destination);
    o.start(t);
    o2.start(t);
    o.stop(t + 1.2);
    o2.stop(t + 1.2);
  }
  function torn(word, half) {
    return `<svg class="k2-mektup" viewBox="0 0 320 120" aria-label="Yırtık mektubun ${half === 'ust' ? 'üst' : 'alt'} yarısı"><defs><clipPath id="k2c${half}"><path d="${half === 'ust' ? 'M0 0 H320 V58 L300 66 L280 54 L260 64 L240 55 L220 66 L200 56 L180 64 L160 54 L140 65 L120 55 L100 64 L80 56 L60 66 L40 55 L20 63 L0 57Z' : 'M0 57 L20 63 L40 55 L60 66 L80 56 L100 64 L120 55 L140 65 L160 54 L180 64 L200 56 L220 66 L240 55 L260 64 L280 54 L300 66 L320 58 V120 H0Z'}"/></clipPath></defs>
      <g clip-path="url(#k2c${half})"><rect width="320" height="120" fill="#FFF6E5"/><text x="160" y="80" text-anchor="middle" font-family="Fredoka, sans-serif" font-weight="700" font-size="${word.length > 7 ? 46 : 54}" fill="#4A2138">${K.esc(word)}</text></g></svg>`;
  }
  function lockHtml() {
    const s = side();
    const who = otherName();
    if (g.lvl === 0)
      return s === 'baku'
        ? `<p class="card-eyebrow">1. Kilit · Fener</p><h3>Fenerin ışığını ${K.esc(who)}'a anlat</h3><p>Kısa yanıyorsa "kısa", uzun yanıyorsa "uzun" de; harfler arasında ışık biraz daha uzun söner.</p>${lighthouse()}<div class="row center"><button type="button" class="btn soft small" data-k2-mors>↺ Baştan yak</button></div>`
        : `<p class="card-eyebrow">1. Kilit · Fener</p><h3>${K.esc(who)} feneri görüyor; sen tabloyu</h3><div class="k2-mors">${Object.entries(MORS).map(([k, v]) => `<span><b>${k}</b>${v.replace(/\./g, '•').replace(/-/g, '—')}</span>`).join('')}</div><div class="row k2-kilit"><input class="input" id="k2W1" maxlength="8" autocapitalize="characters" placeholder="Kelime"><button type="button" class="btn red" data-k2-w1>Aç</button></div>`;
    if (g.lvl === 1)
      return s === 'baku'
        ? `<p class="card-eyebrow">2. Kilit · Rota</p><h3>Gemiyi hazineye götür</h3><p>Kayaları göremiyorsun; ${K.esc(who)} görüyor. Onu dinle.</p>${grid(false)}<div class="k2-oklar k2-kilit"><button type="button" data-k2-m="0,-1" aria-label="Yukarı">↑</button><button type="button" data-k2-m="-1,0" aria-label="Sola">←</button><button type="button" data-k2-m="1,0" aria-label="Sağa">→</button><button type="button" data-k2-m="0,1" aria-label="Aşağı">↓</button></div>`
        : `<p class="card-eyebrow">2. Kilit · Rota</p><h3>Haritada kayalar ve hazine sende</h3><p>Gemiyi ${K.esc(who)} yönetiyor ama kayaları göremiyor. "Bir yukarı, iki sağa..." diye yol tarif et.</p>${grid(true)}`;
    if (g.lvl === 2)
      return s === 'ist'
        ? `<p class="card-eyebrow">3. Kilit · Deniz kabukları</p><h3>Melodiyi dinle, ${K.esc(who)}'a mırıldan</h3><p>Beş nota var. ${K.esc(who)}'ın elinde beş kabuk: en kalından en inceye pembe, sarı, yeşil, mavi, mor.</p><div class="row center"><button type="button" class="btn red" data-k2-dinle>🐚 Melodiyi dinle</button></div>`
        : `<p class="card-eyebrow">3. Kilit · Deniz kabukları</p><h3>${K.esc(who)}'ın mırıldandığını çal</h3><p>En kalından en inceye: pembe, sarı, yeşil, mavi, mor. Beş nota.</p><div class="k2-kabuklar k2-kilit">${SHELLS.map(([c], i) => `<button type="button" data-k2-k="${i}" style="--c:${c}" aria-label="${i + 1}. kabuk">🐚</button>`).join('')}</div><p class="center k2-dizi">${seq.map((i) => `<i style="background:${SHELLS[i][0]}"></i>`).join('') || '<small class="muted">Kabuklara dokun</small>'}</p><div class="row center"><button type="button" class="btn soft small" data-k2-sil>Sil</button></div>`;
    return `<p class="card-eyebrow">4. Kilit · Yırtık mektup</p><h3>Mektubun ${s === 'baku' ? 'üst' : 'alt'} yarısı sende</h3><p>Kelimenin öbür yarısı ${K.esc(who)}'da. Birlikte ne yazdığını bulun; ikiniz de doğru yazınca sandık açılır.</p>${torn(g.w4, s === 'baku' ? 'ust' : 'alt')}
      <div class="row k2-kilit"><input class="input" id="k2W4" maxlength="10" placeholder="Kelime"><button type="button" class="btn red" data-k2-w4 ${finalOk.me ? 'disabled' : ''}>${finalOk.me ? '✓ Sen yazdın' : 'Yaz'}</button></div><p class="muted small center">${finalOk.me ? `${K.esc(who)} bekleniyor...` : finalOk.other ? `${K.esc(who)} doğru yazdı; sıra sende.` : ''}</p>`;
  }
  function render() {
    if (!root || K.activeRoom !== 'kule2') return;
    const box = K.$('#k2Oyun', root);
    const here = K.cloud && K.cloud.otherHere && K.cloud.otherHere();
    if (!g) {
      const b = best.map((r) => r.data.sec).sort((a, b2) => a - b2)[0];
      box.innerHTML = `<div class="k2-giris">${A.kitty({ crown: true, eyes: 'wink', cls: 'k2-kitty' })}<h3>Hazar'ın Sırrı</h3><p>Dört kilit, ikiye bölünmüş ipuçları. Telefonda konuşarak oynanır; ikiniz de bu odada olmalısınız.</p>
        <p class="k2-durum ${here ? 'on' : ''}">${here ? `🟢 ${K.esc(otherName())} kalede` : `⚪ ${K.esc(otherName())} kalede değil`}</p>
        <button type="button" class="btn red big" data-k2-basla ${here ? '' : 'disabled'}>🗝 Kuleyi aç</button>${b ? `<p class="muted small">En iyi süreniz: ${clock(b * 1000)}</p>` : ''}</div>`;
      return;
    }
    if (g.done) {
      const sir = (D.kule2 && D.kule2.sir) || 'Hazar\'ın sırrı şuymuş: iki kıyı arasındaki su bizi ayırmıyor; her dalga öbür kıyıya bir şey taşıyor. Senin sesini bana, benim sesimi sana.';
      box.innerHTML = `<div class="k2-son"><svg class="k2-sandik" viewBox="0 0 200 150" aria-hidden="true"><rect x="30" y="70" width="140" height="70" rx="8" fill="#B07A45" stroke="#4A2138" stroke-width="4"/><path class="k2-kapak" d="M30 72 Q100 10 170 72Z" fill="#C98E52" stroke="#4A2138" stroke-width="4"/><rect x="90" y="80" width="20" height="24" rx="3" fill="#FFD34E" stroke="#4A2138" stroke-width="3"/><g class="k2-isilti">${[0, 1, 2, 3, 4].map((i) => `<path d="M100 60 L${40 + i * 30} 0" stroke="#FFE680" stroke-width="5" stroke-linecap="round"/>`).join('')}</g></svg>
        <p class="card-eyebrow">${clock(g.sec * 1000)} · ${g.wrong} yanlış</p><h3>Sandık açıldı</h3><p class="k2-sir">${K.esc(sir)}</p><button type="button" class="btn soft" data-k2-yeni>Yeniden oyna</button></div>`;
      return;
    }
    box.innerHTML = `<div class="k2-ust"><div class="k2-kilitler">${[0, 1, 2, 3].map((i) => `<span class="${i < g.lvl ? 'acik' : i === g.lvl ? 'simdi' : ''}">${i < g.lvl ? '🔓' : '🔒'}</span>`).join('')}</div><b id="k2Saat">${clock(Date.now() - g.at)}</b><button type="button" class="btn ghost small" data-k2-cik>Çık</button></div>
      <section class="k2-kart">${lockHtml()}</section><p class="muted small center">Sen ${side() === 'baku' ? 'Bakü' : 'İstanbul'} tarafısın.</p>`;
    if (g.lvl === 0 && side() === 'baku') playMorse();
  }
  K.on('cloud', async (ok) => {
    if (!ok) return;
    best = await K.cloud.list('kule2bitti', 50);
    K.cloud.onLive('k2', onMsg);
  });
  K.room({
    id: 'kule2',
    wing: 'oyun',
    title: 'Kilitli Kule 2',
    sub: "Hazar'ın Sırrı · iki kişilik kaçış",
    icon: 'key',
    color: '#DDEBFF',
    hidden: () => !K.cloud || !K.cloud.enabled,
    badge: () => (g && !g.done ? 'Oyun sürüyor' : K.cloud && K.cloud.otherHere && K.cloud.otherHere() ? 'İkiniz de burada' : ''),
    init(el) {
      root = el;
      el.innerHTML = `<div class="room-intro"><p>Yeni bir iki kişilik kaçış odası. İpuçlarının yarısı sende, yarısı onda: fenerin ışığı, görünmeyen kayalar, deniz kabuklarının şarkısı ve yırtık bir mektup. Yalnızca konuşarak açılır.</p></div><div id="k2Oyun"></div>`;
      el.addEventListener('click', (e) => {
        if (e.target.closest('[data-k2-basla]') || e.target.closest('[data-k2-yeni]')) {
          const seed = (Math.random() * 1e9) | 0, at = Date.now();
          start(seed, at, 0);
          send({ t: 'start', seed, at });
          K.ping(`🗝 ${K.meName()} Kilitli Kule 2'yi açtı`, 'Hazar\'ın Sırrı seni bekliyor. Telefonu aç, birlikte çözelim.', ['key'], { click: K.roomUrl('kule2') });
          return;
        }
        if (e.target.closest('[data-k2-cik]')) {
          send({ t: 'quit' });
          g = null;
          clearInterval(tick);
          clearInterval(blink);
          return render();
        }
        if (!g) return;
        if (e.target.closest('[data-k2-mors]')) return playMorse();
        if (e.target.closest('[data-k2-w1]')) {
          return norm(K.$('#k2W1', root).value) === norm(g.w1) ? solved(0) : wrong();
        }
        const m = e.target.closest('[data-k2-m]');
        if (m) {
          const [dx, dy] = m.dataset.k2M.split(',').map(Number);
          return move(dx, dy);
        }
        if (e.target.closest('[data-k2-dinle]')) {
          g.mel.forEach((i, j) => setTimeout(() => shellNote(i), j * 620));
          return;
        }
        const sh = e.target.closest('[data-k2-k]');
        if (sh) {
          const i = +sh.dataset.k2K;
          shellNote(i, true);
          seq = seq.concat(i).slice(-5);
          if (seq.length === 5 && seq.every((x, j) => x === g.mel[j])) return solved(2);
          if (seq.length === 5) {
            wrong();
            seq = [];
          }
          return render();
        }
        if (e.target.closest('[data-k2-sil]')) return (seq = []), render();
        if (e.target.closest('[data-k2-w4]')) {
          if (norm(K.$('#k2W4', root).value) !== norm(g.w4)) return wrong();
          finalOk.me = true;
          send({ t: 'final' });
          if (finalOk.other) {
            const sec = Math.round((Date.now() - g.at) / 1000);
            send({ t: 'win', sec });
            return win(sec);
          }
          return render();
        }
      });
    },
    enter() {
      render();
      if (!g && K.cloud && K.cloud.enabled) send({ t: 'sync?' });
    },
    leave() {
      clearInterval(blink);
    },
  });
  K.kule2 = { build, reachable, game: () => g };
})();
