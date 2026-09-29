/* Oda: Kilitli Kule — iki kişilik kaçış odası. İkisi aynı anda kalede olmalı (telefonda konuşarak oynanır).
   Her kilitte ipucunun yarısı bir tarafta, kilit öbür tarafta:
   1) Fiyonk kilidi: Bakü tarafı renklerin Azerbaycanca adlarını görür, İstanbul tarafı renkli kilidi çevirir.
   2) Saat kulesi: İstanbul tarafı İstanbul saatini görür, Bakü tarafı kilide Bakü saatini (bir saat ileri) yazar.
   3) Harita şifresi: Bakü tarafı haritadaki sembolleri görür, İstanbul tarafı sembol tablosuyla kodu girer.
   4) Aynı anda: ikisi de kalbe üç saniye birlikte basar; sandık açılır.
   Her oyun yeni bir tohumla (seed) karışır; iki taraf aynı tohumu canlı mesajla paylaşır. */
(function () {
  'use strict';
  const K = window.K;
  const A = K.art;
  const D = window.ELN;
  const C = D.config;

  const KC = () => D.kacis || {};
  const mine = () => (K.isOwner() ? 'me' : 'her');
  const side = () => (mine() === 'her' ? 'baku' : 'ist');
  const nameOf = (w) => (w === 'me' ? C.myPet : C.herPet);
  const COLS = [
    ['qırmızı', 'Kırmızı', '#E3174D'],
    ['çəhrayı', 'Pembe', '#FF8FB8'],
    ['sarı', 'Sarı', '#FFD34E'],
    ['mavi', 'Mavi', '#4FA3E3'],
    ['yaşıl', 'Yeşil', '#3FA37A'],
    ['bənövşəyi', 'Mor', '#8F73E6'],
  ];
  const SYMS = [
    ['heart', 'kalp'],
    ['star', 'yıldız'],
    ['moon', 'ay'],
    ['bow', 'fiyonk'],
    ['lily', 'zambak'],
    ['key', 'anahtar'],
  ];
  const PLACES = ['Qız Qalası', 'Dənizkənarı Bulvar', 'Alov Qüllələri', 'Fəvvarələr meydanı', 'Nizami küçəsi', 'Heydər Əliyev Mərkəzi'];
  const LEVELS = ['Fiyonk Kilidi', 'Saat Kulesi', 'Harita Şifresi', 'Aynı Anda'];

  let root, g = null, dials = [0, 0, 0, 0], typed = '', hold = { me: false, other: false, since: 0, t: null }, tick = null, best = [];

  /* ---------- Oyun kurulumu (tohumdan) ---------- */
  function build(seed) {
    const r = K.rng(seed);
    const int = (n) => Math.floor(r() * n);
    const shuffle = (a) => {
      const b = a.slice();
      for (let i = b.length - 1; i > 0; i--) {
        const j = int(i + 1);
        [b[i], b[j]] = [b[j], b[i]];
      }
      return b;
    };
    const c1 = Array.from({ length: 4 }, () => int(COLS.length));
    const ih = 8 + int(15), im = int(60);
    const c2 = `${String((ih + 1) % 24).padStart(2, '0')}${String(im).padStart(2, '0')}`;
    const digits = shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9]).slice(0, SYMS.length);
    const table = SYMS.map((s, i) => [s[0], digits[i]]);
    const path = shuffle(SYMS.map((s) => s[0])).slice(0, 3);
    const stops = shuffle(PLACES).slice(0, 3);
    const c3 = path.map((s) => table.find((t) => t[0] === s)[1]).join('');
    return { c1, ih, im, c2, table: shuffle(table), path, stops, c3 };
  }

  /* ---------- Canlı mesajlar ---------- */
  const send = (m) => K.cloud.send('kc', m);
  function start(seed, at, lvl) {
    g = Object.assign(build(seed), { seed, at, lvl: lvl || 0, wrong: 0, done: false });
    dials = [0, 0, 0, 0];
    typed = '';
    hold = { me: false, other: false, since: 0, t: null };
    clearInterval(tick);
    tick = setInterval(() => {
      const t = root && K.$('#kcTime', root);
      if (t && g && !g.done) t.textContent = clock(Date.now() - g.at);
    }, 500);
    render();
  }
  function advance(n) {
    if (!g || n < g.lvl) return;
    g.lvl = n + 1;
    typed = '';
    K.audio.sfx.success();
    K.fx.confetti({ count: 70, shapes: ['star', 'heart'] });
    render();
  }
  async function win(sec) {
    if (!g || g.done) return;
    g.done = true;
    g.sec = sec;
    clearInterval(tick);
    K.audio.sfx.success();
    K.fx.confetti({ count: 220, shapes: ['heart', 'star', 'bow'] });
    K.stickers.award('kacis');
    if (mine() === 'me') await K.cloud.add('kacisbest', { sec });
    render();
  }
  function onMsg(m) {
    if (!m || m.who === mine()) return;
    if (m.t === 'start') {
      start(m.seed, m.at, 0);
      K.fx.toast(`<b>${K.esc(nameOf(m.who))} Kilitli Kule'yi başlattı!</b>`, { icon: A.icon('key') });
      if (K.activeRoom !== 'kacis') location.hash = 'kacis';
    }
    if (m.t === 'sync?' && g && !g.done) send({ t: 'sync', seed: g.seed, at: g.at, lvl: g.lvl });
    if (m.t === 'sync' && (!g || g.seed !== m.seed)) start(m.seed, m.at, m.lvl);
    if (m.t === 'lvl') advance(m.n);
    if (m.t === 'wrong') {
      K.fx.toast(`${K.esc(nameOf(m.who))} yanlış denedi. Bir daha anlatır mısın?`, { duration: 2500 });
    }
    if (m.t === 'hold') {
      hold.other = m.on;
      holdCheck();
      paintHold();
    }
    if (m.t === 'win') win(m.sec);
    if (m.t === 'quit') {
      g = null;
      clearInterval(tick);
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
    const box = K.$('.kc-lock', root);
    if (box) {
      box.classList.remove('shake');
      void box.offsetWidth;
      box.classList.add('shake');
    }
    K.vibrate([60, 40, 60]);
  }
  // Son kilit: ikisi de 3 saniye birlikte basılı tutar
  function holdCheck() {
    if (!g || g.lvl !== 3 || g.done) return;
    if (hold.me && hold.other) {
      if (!hold.since) hold.since = Date.now();
      clearTimeout(hold.t);
      hold.t = setTimeout(() => {
        if (hold.me && hold.other && g && !g.done) {
          const sec = Math.round((Date.now() - g.at) / 1000);
          send({ t: 'win', sec });
          win(sec);
        }
      }, 3000);
    } else {
      hold.since = 0;
      clearTimeout(hold.t);
    }
  }
  function paintHold() {
    const h = root && K.$('#kcHold', root);
    if (!h) return;
    h.classList.toggle('me', hold.me);
    h.classList.toggle('other', hold.other);
    h.classList.toggle('both', hold.me && hold.other);
    const s = K.$('#kcHoldTxt', root);
    if (s) s.textContent = hold.me && hold.other ? 'İkiniz de basıyorsunuz... bırakmayın!' : hold.me ? `${nameOf(mine() === 'me' ? 'her' : 'me')} de basmalı` : hold.other ? `${nameOf(mine() === 'me' ? 'her' : 'me')} basıyor, sen de bas!` : 'İkiniz aynı anda basılı tutun';
  }

  /* ---------- Çizim ---------- */
  const clock = (ms) => {
    const s = Math.max(0, Math.floor(ms / 1000));
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
  };
  const fiyonk = (color, label) => `<div class="kc-bow"><svg viewBox="-62 -42 124 84" aria-hidden="true">${A.bowShape(color, '#4A2138')}</svg>${label ? `<b>${K.esc(label)}</b>` : ''}</div>`;
  function levelHtml() {
    const s = side();
    const L = g.lvl;
    const hint = (KC().hints || [])[L] || '';
    const other = nameOf(mine() === 'me' ? 'her' : 'me');
    if (L === 0) {
      return s === 'baku'
        ? `<p class="kc-role">Sen <b>ipucu</b> tarafısın. Kilit ${K.esc(K.ek(other, 'de'))}.</p>
          <div class="kc-bows">${g.c1.map((c) => fiyonk('#E7DCE2', COLS[c][0])).join('')}</div>
          <p class="muted small">Fiyonklar boyasız; sadece Azerbaycanca adları yazıyor. Soldan sağa oku.</p>`
        : `<p class="kc-role">Kilit sende. İpucu ${K.esc(K.ek(other, 'de'))}: ona sor.</p>
          <div class="kc-lock"><div class="kc-bows">${dials.map((d, i) => `<button type="button" class="kc-dial" data-dial="${i}" aria-label="${i + 1}. fiyonk: ${COLS[d][1]}">${fiyonk(COLS[d][2], COLS[d][1])}</button>`).join('')}</div>
          <button type="button" class="btn red" data-kc="c1">${A.icon('key')} Kilidi aç</button></div>
          <p class="muted small">Fiyonklara dokunarak renk değiştir.</p>`;
    }
    if (L === 1) {
      return s === 'ist'
        ? `<p class="kc-role">Sen <b>ipucu</b> tarafısın. Kilit ${K.esc(K.ek(other, 'de'))}.</p>
          <div class="kc-clock"><small>Kız Kulesi saati · İstanbul</small><b>${String(g.ih).padStart(2, '0')}:${String(g.im).padStart(2, '0')}</b></div>
          <p class="muted small">Kapının üstünde yazıyor: "Kapı, Bakü saatinin rakamlarıyla açılır."</p>`
        : `<p class="kc-role">Kilit sende. İpucu ${K.esc(K.ek(other, 'de'))}.</p>
          <div class="kc-lock"><div class="kc-pin">${[0, 1, 2, 3].map((i) => `<span>${typed[i] || ''}</span>`).join('')}</div>
          <div class="kc-pad">${[1, 2, 3, 4, 5, 6, 7, 8, 9, 'sil', 0, 'aç'].map((k) => `<button type="button" data-key="${k}" class="${k === 'aç' ? 'go' : ''}">${k === 'sil' ? '⌫' : k === 'aç' ? A.icon('key') : k}</button>`).join('')}</div></div>
          <p class="muted small">Qız Qalası'nın kilidi dört rakam ister.</p>`;
    }
    if (L === 2) {
      return s === 'baku'
        ? `<p class="kc-role">Sen <b>ipucu</b> tarafısın. Kilit ${K.esc(K.ek(other, 'de'))}.</p>
          <div class="kc-map">${g.path.map((sym, i) => `<div class="kc-stop"><span class="kc-n">${i + 1}</span><span class="kc-sym">${A.icon(sym)}</span><small>${K.esc(g.stops[i])}</small></div>`).join('<span class="kc-arrow">→</span>')}</div>
          <p class="muted small">Yol, bu sırayla üç duraktan geçiyor. Her durakta bir işaret var.</p>`
        : `<p class="kc-role">Kilit sende. İpucu ${K.esc(K.ek(other, 'de'))}.</p>
          <div class="kc-table">${g.table.map(([sym, d]) => `<div><span class="kc-sym">${A.icon(sym)}</span><b>${d}</b></div>`).join('')}</div>
          <div class="kc-lock"><div class="kc-pin three">${[0, 1, 2].map((i) => `<span>${typed[i] || ''}</span>`).join('')}</div>
          <div class="kc-pad">${[1, 2, 3, 4, 5, 6, 7, 8, 9, 'sil', 0, 'aç'].map((k) => `<button type="button" data-key="${k}" class="${k === 'aç' ? 'go' : ''}">${k === 'sil' ? '⌫' : k === 'aç' ? A.icon('key') : k}</button>`).join('')}</div></div>
          <p class="muted small">Eski bir şifre tablosu: her işaretin bir rakamı var.</p>`;
    }
    return `<p class="kc-role">Son kapı ikinizi birden ister.</p>
      <button type="button" class="kc-hold no-burst" id="kcHold" aria-label="Kalbi basılı tut">${A.ui('heart')}</button>
      <p class="kc-holdtxt" id="kcHoldTxt">İkiniz aynı anda basılı tutun</p>`;
  }
  function render() {
    if (!root) return;
    const here = K.cloud && K.cloud.otherHere();
    const other = nameOf(mine() === 'me' ? 'her' : 'me');
    const body = K.$('#kcBody', root);
    if (!g) {
      body.innerHTML = `<div class="kc-start card">
          <div class="kc-tower" aria-hidden="true">${A.qizQalasi()}${A.kizKulesi()}</div>
          <p class="kc-status ${here ? 'on' : ''}">${here ? `<b>${K.esc(other)} şu an kalede.</b> Başlayabilirsiniz.` : `${K.esc(other)} şu an kalede değil. Birlikte, aynı anda oynanır; telefonda konuşurken en güzeli.`}</p>
          <div class="actions"><button type="button" class="btn red big" data-kc="start" ${here ? '' : 'disabled'}>${A.icon('key')} Oyunu başlat</button>${here ? `<button type="button" class="btn soft" data-kc="join">Süren oyuna katıl</button>` : ''}</div>
          ${best.length ? `<p class="muted small">En iyi süreniz: <b>${clock(Math.min(...best) * 1000)}</b> · ${best.length} kez kaçtınız</p>` : ''}
        </div>`;
      return;
    }
    if (g.done) {
      body.innerHTML = `<div class="kc-win card"><div class="kc-chest open" aria-hidden="true">${A.icon('gift')}</div>
        <p class="card-eyebrow">Kule açıldı · ${clock(g.sec * 1000)}</p>
        ${(KC().win || []).map((l) => `<p class="hand">${K.esc(K.fill(l))}</p>`).join('')}
        <button type="button" class="btn soft" data-kc="again">Yeni oyun</button></div>`;
      return;
    }
    body.innerHTML = `<div class="kc-bar"><ol class="kc-steps">${LEVELS.map((t, i) => `<li class="${i < g.lvl ? 'ok' : i === g.lvl ? 'cur' : ''}">${i < g.lvl ? A.ui('check') : i + 1}<span>${K.esc(t)}</span></li>`).join('')}</ol><span class="kc-time" id="kcTime">${clock(Date.now() - g.at)}</span></div>
      <section class="card kc-level"><p class="card-eyebrow">${g.lvl + 1}. kilit · ${K.esc(LEVELS[g.lvl])}</p>${levelHtml()}
      ${(KC().hints || [])[g.lvl] ? `<details class="kc-hint"><summary>İpucu</summary><p>${K.esc(K.fill(KC().hints[g.lvl]))}</p></details>` : ''}</section>
      <div class="actions"><button type="button" class="btn ghost small" data-kc="quit">Oyundan çık</button>${here ? '' : `<span class="muted small">${K.esc(other)} bağlantısı koptu; geri gelince "Süren oyuna katıl" desin.</span>`}</div>`;
    if (g.lvl === 3) paintHold();
  }

  /* ---------- Etkileşim ---------- */
  function key(k) {
    const len = g.lvl === 1 ? 4 : 3;
    if (k === 'sil') typed = typed.slice(0, -1);
    else if (k === 'aç') {
      const ok = g.lvl === 1 ? typed === g.c2 : typed === g.c3;
      if (ok) return solved(g.lvl);
      typed = '';
      render();
      return wrong();
    } else if (typed.length < len) typed += k;
    K.audio.sfx.pop();
    K.$$('.kc-pin span', root).forEach((s, i) => (s.textContent = typed[i] || ''));
  }
  function setHold(on) {
    if (!g || g.lvl !== 3 || hold.me === on) return;
    hold.me = on;
    send({ t: 'hold', on });
    if (on) K.vibrate(30);
    holdCheck();
    paintHold();
  }

  K.on('cloud', (on) => {
    if (!on) return;
    K.cloud.onLive('kc', onMsg);
    K.cloud.list('kacisbest').then((rows) => {
      best = rows.map((r) => r.data.sec).filter((x) => x > 0);
    });
    K.cloud.on('kacisbest', (r) => best.push(r.data.sec));
  });
  K.on('presence', () => K.activeRoom === 'kacis' && render());

  K.room({
    id: 'kacis',
    wing: 'oyun',
    title: 'Kilitli Kule',
    sub: 'İki kişilik kaçış odası',
    icon: 'key',
    color: '#E6E0FF',
    hidden: () => !D.kacis || !K.cloud || !K.cloud.enabled,
    badge: () => (g && !g.done ? 'Oyun sürüyor' : K.cloud && K.cloud.otherHere() ? 'İkiniz de burada' : ''),
    init(el) {
      root = el;
      el.innerHTML = `<div class="room-intro">${K.paras(KC().intro || [])}</div><div id="kcBody"></div>`;
      el.addEventListener('click', (e) => {
        const b = e.target.closest('[data-kc]');
        if (b) {
          const a = b.dataset.kc;
          if (a === 'start' || a === 'again') {
            const seed = Math.floor(Math.random() * 1e9);
            const at = Date.now();
            send({ t: 'start', seed, at });
            start(seed, at, 0);
          }
          if (a === 'join') {
            send({ t: 'sync?' });
            K.fx.toast('Oyun aranıyor...', { duration: 1500 });
          }
          if (a === 'quit') {
            send({ t: 'quit' });
            g = null;
            clearInterval(tick);
            render();
          }
          if (a === 'c1') {
            if (dials.every((d, i) => d === g.c1[i])) return solved(0);
            wrong();
          }
          return;
        }
        const d = e.target.closest('[data-dial]');
        if (d) {
          const i = +d.dataset.dial;
          dials[i] = (dials[i] + 1) % COLS.length;
          K.audio.sfx.pop();
          return render();
        }
        const k = e.target.closest('[data-key]');
        if (k && g) return key(k.dataset.key === 'sil' || k.dataset.key === 'aç' ? k.dataset.key : +k.dataset.key);
      });
      const down = (e) => {
        if (!e.target.closest('#kcHold')) return;
        e.preventDefault();
        setHold(true);
      };
      const up = () => hold.me && setHold(false);
      el.addEventListener('pointerdown', down);
      window.addEventListener('pointerup', up);
      window.addEventListener('pointercancel', up);
    },
    enter() {
      render();
      if (!g && K.cloud.otherHere()) send({ t: 'sync?' });
    },
    leave() {
      if (hold.me) setHold(false);
    },
  });
})();
