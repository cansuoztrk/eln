/* Oda: Sohbetimizden — gerçek mesajlarımız, bir telefonun içinde, bölüm bölüm yeniden yazılıyor */
(function () {
  'use strict';
  const K = window.K;
  const A = K.art;
  const D = window.ELN;
  const C = D.config;

  let root, body, run = 0, current = null;
  let fast = false;
  const seen = () => K.store.get('chatsSeen', {});

  function epList() {
    const s = seen();
    K.$('#sbEps', root).innerHTML = D.chats
      .map(
        (c, i) => `<button class="sb-ep ${s[c.id] ? 'is-seen' : ''} ${current === c.id ? 'is-on' : ''}" data-id="${c.id}">
          <span class="sb-ep-no">${K.pad(i + 1)}</span>
          <span class="sb-ep-tx"><b>${K.esc(c.title)}</b><small>${K.esc(c.sub || '')}</small></span>
          <span class="sb-ep-ic">${s[c.id] ? A.ui('check') : A.ui('play')}</span>
        </button>`
      )
      .join('');
    const n = Object.keys(s).filter((id) => D.chats.some((c) => c.id === id)).length;
    K.$('#sbCount', root).textContent = `${n} / ${D.chats.length} bölüm izlendi`;
  }

  function bubble(who, text, cont) {
    const el = K.el(`<div class="msg ${who === 'her' ? 'from-her' : 'from-me'} ${cont ? 'cont' : ''}">
      ${who === 'me' ? `<span class="msg-av" aria-hidden="true">${A.kitty({ bow: '#4FA3E3', blush: false, eyes: 'normal' })}</span>` : ''}
      <p class="msg-b"></p>
    </div>`);
    K.$('.msg-b', el).textContent = text;
    return el;
  }
  function typing(who) {
    return K.el(`<div class="msg typing ${who === 'her' ? 'from-her' : 'from-me'}">
      ${who === 'me' ? `<span class="msg-av" aria-hidden="true">${A.kitty({ bow: '#4FA3E3', blush: false, eyes: 'normal' })}</span>` : ''}
      <p class="msg-b"><i></i><i></i><i></i></p></div>`);
  }
  const scroll = () => (body.scrollTop = body.scrollHeight);

  async function play(id) {
    const c = D.chats.find((x) => x.id === id);
    if (!c) return;
    const my = ++run;
    current = id;
    epList();
    const note = K.$('#sbNote', root);
    note.hidden = true;
    note.classList.remove('in');
    K.$('#phNow', root).hidden = !c.nowPlaying;
    if (c.nowPlaying) K.$('#phNowTx', root).textContent = `${c.nowPlaying.title} · ${c.nowPlaying.artist}`;
    body.innerHTML = `<p class="ph-chapter">${K.esc(c.title)}</p>`;
    let prev = null;
    const wait = (ms) => new Promise((r) => setTimeout(r, fast ? ms * 0.35 : ms));
    await wait(500);
    for (const [who, text, time] of c.msgs) {
      if (my !== run) return;
      if (time) body.appendChild(K.el(`<p class="ph-time">${K.esc(time)}</p>`));
      const t = typing(who);
      if (prev === who) t.classList.add('cont');
      body.appendChild(t);
      scroll();
      await wait(K.clamp(420 + text.length * 22, 650, 2400));
      if (my !== run) return;
      t.remove();
      const b = bubble(who, text, prev === who);
      body.appendChild(b);
      requestAnimationFrame(() => b.classList.add('in'));
      K.audio.sfx.note(who === 'her' ? 'E6' : 'A5', 0.08);
      prev = who;
      scroll();
      await wait(who === prev ? 380 : 620);
    }
    if (my !== run) return;
    await wait(700);
    finish(c);
  }
  function finish(c) {
    const s = seen();
    s[c.id] = K.time.todayKey();
    K.store.set('chatsSeen', s);
    epList();
    body.appendChild(K.el(`<p class="ph-seen">Görüldü</p>`));
    scroll();
    const note = K.$('#sbNote', root);
    K.$('#sbNoteTx', root).textContent = K.fill(c.note || '');
    note.hidden = !c.note;
    requestAnimationFrame(() => note.classList.add('in'));
    if (c.finale) {
      K.audio.sfx.chime();
      K.fx.confetti({ count: 120 });
    } else K.audio.sfx.sparkle();
    const idx = D.chats.indexOf(c);
    const nx = K.$('#sbNext', root);
    nx.hidden = idx >= D.chats.length - 1;
    if (D.chats.every((x) => s[x.id])) K.stickers.award('arsiv');
  }
  // Instagram'daki gibi: mesaja çift dokununca kalp
  function react(b) {
    if (!b || b.classList.contains('typing')) return;
    b.classList.toggle('liked');
    if (b.classList.contains('liked')) {
      K.audio.sfx.pop();
      const r = K.$('.msg-b', b).getBoundingClientRect();
      K.fx.burst(r.left + r.width / 2, r.bottom, { count: 8, power: 3, shapes: ['heart'] });
    }
  }

  K.room({
    id: 'sohbet',
    wing: 'anilar',
    title: 'Sohbetimizden',
    sub: () => `${D.chats.length} bölümlük bir dizi, gerçek mesajlarla`,
    icon: 'chat',
    color: '#E6DCFF',
    badge: () => `${Object.keys(seen()).length}/${D.chats.length}`,
    init(el) {
      root = el;
      el.innerHTML = `
        <p class="room-intro">Bizim masalımız bir ekranda yazıldı. Bu odada o mesajlar, yazıldıkları gibi, harfi harfine yeniden yazılıyor. Bir bölüm seç; telefon eline gelsin. Beğendiğin mesaja iki kere dokun.</p>
        <div class="sb">
          <aside class="sb-side">
            <p class="card-eyebrow" id="sbCount"></p>
            <div class="sb-eps" id="sbEps"></div>
          </aside>
          <div class="sb-stage">
            <div class="phone">
              <div class="ph-island" aria-hidden="true"></div>
              <header class="ph-head">
                <span class="ph-back">${A.ui('back')}</span>
                <span class="ph-av">${A.kitty({ bow: '#4FA3E3', blush: false, eyes: 'normal' })}<i class="ph-dot"></i></span>
                <span class="ph-name"><b>${K.esc(C.chatName || C.myPet)} <span class="ph-heart">♥</span></b><small>Şu an aktif</small></span>
                <span class="ph-ic">${A.ui('heart')}</span>
              </header>
              <div class="ph-now" id="phNow" hidden><span class="ph-eq"><i></i><i></i><i></i></span><span id="phNowTx"></span></div>
              <div class="ph-body" id="phBody">
                <div class="ph-empty">${A.island('ph-isl')}<p>Soldan bir bölüm seç</p></div>
              </div>
              <footer class="ph-foot"><span class="ph-input">Mesaj...</span><span class="ph-send">${A.ui('send')}</span></footer>
              <div class="ph-bg" aria-hidden="true">${A.island('b1')}${A.island('b2')}${A.island('b3')}</div>
            </div>
            <div class="sb-note" id="sbNote" hidden>
              <span class="sb-tape"></span>
              <p class="card-eyebrow">${K.esc(C.myPet)}'un notu</p>
              <p class="hand" id="sbNoteTx"></p>
            </div>
            <div class="actions sb-actions">
              <button class="btn soft small" id="sbReplay">${A.ui('refresh')} Baştan</button>
              <button class="btn ghost small" id="sbFast" aria-pressed="false">Hızlı</button>
              <button class="btn small" id="sbNext" hidden>Sonraki bölüm ${A.ui('next')}</button>
            </div>
          </div>
        </div>`;
      body = K.$('#phBody', el);
      K.$('#sbEps', el).addEventListener('click', (e) => {
        const b = e.target.closest('.sb-ep');
        if (!b) return;
        K.audio.sfx.tap();
        play(b.dataset.id);
        if (window.innerWidth < 820) K.$('.phone', el).scrollIntoView({ behavior: K.reduced ? 'auto' : 'smooth', block: 'start' });
      });
      K.$('#sbReplay', el).addEventListener('click', () => play(current || D.chats[0].id));
      K.$('#sbNext', el).addEventListener('click', () => {
        const i = D.chats.findIndex((c) => c.id === current);
        if (i < D.chats.length - 1) play(D.chats[i + 1].id);
      });
      const fb = K.$('#sbFast', el);
      fb.addEventListener('click', () => {
        fast = !fast;
        fb.setAttribute('aria-pressed', String(fast));
        fb.classList.toggle('on', fast);
      });
      body.addEventListener('dblclick', (e) => react(e.target.closest('.msg')));
      let lastTap = 0;
      body.addEventListener('pointerup', (e) => {
        if (e.pointerType !== 'touch') return;
        const now = Date.now();
        if (now - lastTap < 320) react(e.target.closest('.msg'));
        lastTap = now;
      });
      epList();
    },
    enter() {
      epList();
      const s = seen();
      if (!current) {
        const first = D.chats.find((c) => !s[c.id]) || D.chats[0];
        if (first) setTimeout(() => play(first.id), 500);
      }
    },
    leave() {
      run++;
      current = null;
    },
  });
})();
