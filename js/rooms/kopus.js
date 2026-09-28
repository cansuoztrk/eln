/* Oda (gizli): Köpekçiğin Kulübesi — sadece ana salonun dibindeki pati izini bulunca açılır.
   Sev, ödül maması ver, komut ver; sahibinin notunu ve resmî sahiplenme belgesini oku. */
(function () {
  'use strict';
  const K = window.K;
  const A = K.art;
  const D = window.ELN;
  const C = D.config;
  const T = K.time;

  let root, pup, say, sayT;
  const P = () => D.kopus;

  function talk(text, face) {
    say.textContent = K.fill(text);
    say.hidden = false;
    say.classList.remove('pop');
    void say.offsetWidth;
    say.classList.add('pop');
    clearTimeout(sayT);
    sayT = setTimeout(() => (say.hidden = true), 5200);
    if (face) mood(face);
  }
  function mood(face, ms = 1800) {
    pup.classList.remove('happy', 'sit', 'paw', 'bark', 'eat', 'no');
    void pup.offsetWidth;
    pup.classList.add(face);
    clearTimeout(pup._t);
    pup._t = setTimeout(() => pup.classList.remove(face), ms);
  }

  /* Sevme: köpekçiğin üstünde parmağını/fareni gezdir */
  function initPet() {
    let dist = 0,
      last = null;
    const wrap = K.$('.kp-stage', root);
    wrap.addEventListener('pointermove', (e) => {
      if (!e.target.closest('.kp-pet-zone')) return;
      if (last) dist += Math.hypot(e.clientX - last.x, e.clientY - last.y);
      last = { x: e.clientX, y: e.clientY };
      if (dist > 260) {
        dist = 0;
        pup.classList.add('happy', 'wag');
        clearTimeout(pup._w);
        pup._w = setTimeout(() => pup.classList.remove('happy', 'wag'), 1400);
        K.audio.sfx.giggle();
        K.fx.burst(e.clientX, e.clientY, { count: 6, power: 3, shapes: ['heart'] });
        const n = K.store.get('kopusPets', 0) + 1;
        K.store.set('kopusPets', n);
        K.$('#kpPets', root).textContent = K.num(n);
        if (n === 1 || n % 15 === 0) talk(K.pick(['Kuyruğu durmuyor!', 'Biraz daha sev, lütfen.', 'Sahibi gibi sevmişsin.', 'Mutluluktan eriyor...']));
      }
    });
    wrap.addEventListener('pointerleave', () => (last = null));
  }

  /* Büyüme: mama verilen her gün bir adım; art arda günler seri yapar */
  const LEVELS = [
    [0, 'Yavru'],
    [3, 'Minik'],
    [7, 'Tombik'],
    [14, 'Prenses'],
    [30, 'Kraliçe'],
  ];
  function growth() {
    const fed = Object.keys(K.store.get('kopusFed', {})).sort();
    const days = fed.length;
    let lv = 0;
    LEVELS.forEach(([n], i) => days >= n && (lv = i));
    let streak = 0;
    const set = new Set(fed);
    const d = new Date(T.at(T.todayKey()).getTime());
    if (!set.has(T.todayKey())) d.setUTCDate(d.getUTCDate() - 1);
    while (set.has(T.key(T.baku(d)))) {
      streak++;
      d.setUTCDate(d.getUTCDate() - 1);
    }
    const last = fed.length ? T.daysSince(fed[fed.length - 1]) : 99;
    const hunger = last === 0 ? 'Tok ve mutlu' : last === 1 ? 'Biraz acıktı' : last < 4 ? 'Çok acıktı, seni bekliyor' : 'Seni çok özledi';
    const next = LEVELS[lv + 1];
    return { days, lv, name: LEVELS[lv][1], streak, hunger, next, pct: next ? ((days - LEVELS[lv][0]) / (next[0] - LEVELS[lv][0])) * 100 : 100 };
  }
  function renderGrowth() {
    const g = growth();
    const box = K.$('#kpGrow', root);
    if (!box) return;
    box.innerHTML = `<div class="kp-lv"><span class="kp-lv-n">Seviye ${g.lv + 1}</span><b>${K.esc(g.name)} ${K.esc(C.herDog)}</b></div>
      <div class="kp-bar"><i style="width:${g.pct.toFixed(0)}%"></i></div>
      <p class="muted small">${g.next ? `${g.next[1]} olmak için ${g.next[0] - g.days} gün daha mama` : 'En üst seviye! Kraliçe tacı onun.'} · Seri: <b>${g.streak}</b> gün · ${K.esc(g.hunger)}</p>`;
    const st = K.$('.kp-stage', root);
    st.className = 'kp-stage lv-' + g.lv;
    if (g.lv >= 4) K.stickers.award('kralice');
  }

  /* Ödül maması: her gün yeni bir not çıkıyor */
  function feed() {
    const today = T.todayKey();
    const fed = K.store.get('kopusFed', {});
    const first = !fed[today];
    const treats = P().treats;
    const text = first ? K.daily(treats, 5) : K.pick(treats);
    if (first) {
      fed[today] = true;
      K.store.set('kopusFed', fed);
      K.store.set('kopusTreats', K.store.get('kopusTreats', 0) + 1);
    }
    const kib = K.$('.kp-kibble', root);
    kib.classList.remove('drop');
    void kib.offsetWidth;
    kib.classList.add('drop');
    K.audio.sfx.pop();
    setTimeout(() => {
      mood('eat', 1600);
      K.audio.sfx.tick();
      setTimeout(() => K.audio.sfx.tick(), 220);
      setTimeout(() => K.audio.sfx.tick(), 440);
    }, 650);
    setTimeout(() => {
      K.$('#kpTreat', root).innerHTML = `<p class="card-eyebrow">${first ? 'Bugünkü ödül maması' : 'Ekstra mama (bugünkü zaten verildi)'}</p><p class="hand">${K.esc(K.fill(text))}</p>`;
      K.$('#kpTreat', root).classList.add('in');
      K.$('#kpTreats', root).textContent = K.num(K.store.get('kopusTreats', 0));
      const before = K.$('.kp-stage', root).className;
      renderGrowth();
      if (first && K.$('.kp-stage', root).className !== before) {
        K.fx.confetti({ count: 120 });
        talk(`Büyüdü! Artık ${growth().name} ${C.herDog}.`, 'happy');
      }
      mood('happy', 1400);
      if (first) K.fx.burst(window.innerWidth / 2, window.innerHeight / 2, { count: 12, power: 5, shapes: ['heart', 'star'] });
    }, 2100);
  }

  function command(key) {
    const lines = P().commands[key] || [];
    const face = { otur: 'sit', pati: 'paw', sev: 'bark' }[key] || 'no';
    if (key === 'sev') K.audio.sfx.meow(1.6);
    else K.audio.sfx.pop();
    talk(K.pick(lines), face);
  }

  function certificate() {
    const rows = P().certificate.map(([k, v]) => `<div><dt>${K.esc(k)}</dt><dd>${K.esc(K.fill(v))}</dd></div>`).join('');
    return `<article class="cert">
      <div class="cert-in">
        <p class="cert-eyebrow">${A.bow('#E3174D')} Resmî Belge ${A.bow('#E3174D')}</p>
        <h3 class="cert-title">Sahiplenme Belgesi</h3>
        <dl class="cert-rows">${rows}</dl>
        <div class="cert-foot">
          <span class="cert-stamp">ONAYLANDI<small>${T.fmt(C.togetherDate)}</small></span>
          <span class="cert-sign hand">${K.esc(C.myName)}<small>Sahibi</small></span>
          <span class="cert-sign hand">${K.esc(C.herPet)}<small>Köpekçik (pati izi)</small></span>
        </div>
      </div>
    </article>`;
  }

  K.room({
    id: 'kopus',
    wing: 'hazine',
    secret: true,
    hidden: () => !K.store.get('kopusFound'),
    title: () => `${C.herDog}'ün Kulübesi`,
    sub: 'Gizli oda: sev, besle, komut ver',
    icon: 'paw',
    color: '#FFE0E0',
    init(el) {
      root = el;
      const n = P().note || {};
      el.innerHTML = `
        <p class="room-intro">Bu odayı buldun, demek ki pati izini gördün. Burası ${K.esc(C.herDog)}'ün kulübesi; yani senin. Onu sevmek için üstünde parmağını gezdir, ödül maması ver, komut ver.</p>
        <div class="kp">
          <div class="kp-stage">
            <div class="kp-sky" aria-hidden="true">${A.island('k1')}${A.island('k2')}</div>
            <div class="kp-house">${A.doghouse('', C.herDog)}</div>
            <div class="kp-acc acc-flowers" aria-hidden="true">${[0, 1, 2].map((i) => `<svg viewBox="0 0 30 40"><path d="M15 40 V18" stroke="#5E9B6E" stroke-width="3"/><g fill="${['#FF8FB8', '#FFD34E', '#C9B6FF'][i]}"><circle cx="15" cy="9" r="5"/><circle cx="8" cy="14" r="5"/><circle cx="22" cy="14" r="5"/><circle cx="10" cy="21" r="5"/><circle cx="20" cy="21" r="5"/></g><circle cx="15" cy="15" r="4" fill="#fff"/></svg>`).join('')}</div>
            <div class="kp-acc acc-garland" aria-hidden="true">${A.garland()}</div>
            <div class="kp-acc acc-crown" aria-hidden="true">${A.icon('crown')}</div>
            <div class="kp-acc acc-tag" aria-hidden="true">${A.icon('heart')}</div>
            <div class="kp-pup kp-pet-zone" id="kpPup">${A.kopus({ label: C.herDog })}</div>
            <div class="kp-bowl" aria-hidden="true">
              <span class="kp-kibble"><i></i><i></i><i></i></span>
              <svg viewBox="0 0 120 50"><path d="M6 12 H114 L100 46 H20 Z" fill="#FF6FA3" stroke="#5A3A48" stroke-width="5" stroke-linejoin="round"/><text x="60" y="36" text-anchor="middle" font-family="Fredoka, sans-serif" font-weight="700" font-size="14" fill="#fff">${K.esc(C.herDog.toLocaleUpperCase('tr'))}</text></svg>
            </div>
            <p class="kp-say" id="kpSay" hidden></p>
            <div class="kp-grass" aria-hidden="true"></div>
          </div>
          <div class="kp-panel">
            <div class="kp-grow card" id="kpGrow"></div>
            <div class="kp-stats">
              <span><b id="kpTreats">${K.num(K.store.get('kopusTreats', 0))}</b> ödül maması</span>
              <span><b id="kpPets">${K.num(K.store.get('kopusPets', 0))}</b> kez sevildi</span>
            </div>
            <button class="btn red big" id="kpFeed">${A.icon('paw')} Ödül maması ver</button>
            <div class="kp-cmds">${Object.keys(P().commands)
              .map((k) => `<button class="btn soft small" data-cmd="${K.esc(k)}">${K.esc((P().labels || {})[k] || k)}</button>`)
              .join('')}</div>
            <div class="kp-treat card" id="kpTreat"><p class="muted">Kap boş. Bir mama ver, bakalım bugün içinden ne çıkacak.</p></div>
          </div>
        </div>
        <div class="kp-bottom">
          <article class="kp-note">
            <span class="kp-note-pin"></span>
            ${n.top ? `<p class="kp-note-top hand">${K.esc(n.top)}</p>` : ''}
            <p class="hand">${K.esc(K.fill(n.text || ''))}</p>
            ${n.sign ? `<p class="kp-note-sign hand">${K.esc(n.sign)}</p>` : ''}
            ${K.voice ? K.voice.btn('gulumse', 'Sahibinin sesli mesajı') : ''}
          </article>
          ${certificate()}
        </div>`;
      pup = K.$('#kpPup', el);
      say = K.$('#kpSay', el);
      initPet();
      K.$('#kpFeed', el).addEventListener('click', feed);
      K.$('.kp-cmds', el).addEventListener('click', (e) => {
        const b = e.target.closest('[data-cmd]');
        if (b) command(b.dataset.cmd);
      });
      pup.addEventListener('click', () => {
        mood('happy', 1200);
        K.audio.sfx.pop();
      });
    },
    enter() {
      renderGrowth();
      setTimeout(() => talk(K.pick(['Hav! (Çeviri: Hoş geldin!)', 'Kuyruk sallanıyor, sen geldin diye.', 'Mama saati mi?'])), 600);
    },
  });
})();
