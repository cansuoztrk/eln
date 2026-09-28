/* Eln'in Krallığı — uygulama kabuğu: kapı ve kasa, açılış filmi, kanatlı ana salon, yönlendirici, özel günler, gizli sürprizler */
(function () {
  'use strict';
  const K = window.K;
  const D = window.ELN;
  const C = D.config;
  const T = K.time;
  const A = K.art;

  // Kalenin kanatları: her oda kendi kanadını "wing" ile seçer
  const WINGS = [
    { id: 'anilar', title: 'Anılar Kanadı', sub: 'Masalımız, sohbetlerimiz, Bakü\'deki izlerin, portrelerin ve bizim şarkımız', color: '#F0578F', icon: 'book' },
    { id: 'kalp', title: 'Kalp Kanadı', sub: 'Mektuplar, sebepler ve henüz yaşanmamış o ilk sarılma', color: '#E3174D', icon: 'heart' },
    { id: 'oyun', title: 'Oyun Kanadı', sub: 'gartic, Angela, Bakü\'ye uçuş, gökyüzü ve müzik kutusu', color: '#3FA37A', icon: 'palette' },
    { id: 'hazine', title: 'Hazine Kanadı', sub: 'Mesafe, sınıf, hayaller, kuponlar, özel günler ve çıkartmalar', color: '#C98A12', icon: 'crown' },
  ];

  /* ---------------- Üst çubuk + ana salon + oda kabuğu ---------------- */
  function renderShell() {
    const app = document.getElementById('app');
    app.innerHTML = `
      <header class="topbar">
        <button class="brand" id="brand" aria-label="Ana salona dön">${A.kitty({ cls: 'brand-kitty', label: 'Kitty' })}<span class="brand-name">${K.esc(C.herName)}'in Krallığı</span></button>
        <div class="top-actions">
          <a class="icon-btn" href="#album" aria-label="Çıkartma albümü">${A.icon('sticker')}<span class="count" id="topStickers">0</span></a>
          <button class="icon-btn" id="musicBtn" aria-pressed="false" aria-label="Müzik kutusunu aç ya da kapat">${A.ui('music')}</button>
        </div>
      </header>
      <main class="home" id="home">${homeHTML()}</main>
      <section class="room-view" id="roomView" hidden>
        <header class="room-head">
          <a class="room-back" href="#" id="roomBack">${A.ui('back')}<span>Kale</span></a>
          <div class="room-titles"><h2 class="room-title" id="roomTitle"></h2><p class="room-sub" id="roomSub"></p></div>
          <span id="roomIcon"></span>
        </header>
        <div class="room-stage" id="roomStage"></div>
      </section>`;
  }

  function homeHTML() {
    const moods = D.moods
      .map((m) => `<button class="mood" data-mood="${m.id}">${A.kitty({ cls: 'is-' + m.face, blush: true, label: m.label })}<span>${K.esc(m.label)}</span></button>`)
      .join('');
    const decor = (n, seed) => {
      const r = K.rng(seed);
      const kinds = ['bow', 'heart', 'star', 'spark'];
      return `<div class="decor" aria-hidden="true">${Array.from({ length: n }, (_, i) => {
        const k = kinds[i % kinds.length];
        const svg =
          k === 'bow'
            ? A.bow(['#E3174D', '#FF6FA3', '#C9B6FF'][i % 3])
            : k === 'heart'
            ? `<svg viewBox="-12 -13 24 21"><path d="M0 7 C-11 -1 -11 -12 -4.5 -12 C-1.5 -12 0 -9.5 0 -8 C0 -9.5 1.5 -12 4.5 -12 C11 -12 11 -1 0 7 Z" fill="#FF8FB8"/></svg>`
            : k === 'star'
            ? `<svg viewBox="0 0 64 64">${A.ICONS.star}</svg>`
            : `<svg viewBox="-10 -10 20 20"><path d="M0 -9 Q0 0 9 0 Q0 0 0 9 Q0 0 -9 0 Q0 0 0 -9 Z" fill="#FFD34E"/></svg>`;
        return `<span class="dc dc-${k}" style="left:${(r() * 94).toFixed(1)}%;top:${(r() * 90).toFixed(1)}%;--s:${(0.6 + r() * 0.7).toFixed(2)};--d:${(r() * -8).toFixed(1)}s;--r:${Math.round(r() * 60 - 30)}deg">${svg}</span>`;
      }).join('')}</div>`;
    };
    return `
      <section class="hero" id="hero">
        <div class="hero-sky" aria-hidden="true">
          <div class="stars"></div>
          <div class="hero-moon" id="heroMoon"></div>
          <div class="cloud c1"></div><div class="cloud c2"></div><div class="cloud c3"></div>
          <div class="islands">${A.island('is1')}${A.island('is2')}${A.island('is3')}</div>
          <div class="rising">${Array.from({ length: 9 }, (_, i) => `<i style="left:${8 + i * 10.5}%;--d:${(i * 1.7) % 9}s;--x:${(i % 3) - 1}"></i>`).join('')}</div>
        </div>
        <div class="wrap hero-text">
          <p class="hero-clock"><span>${K.esc(C.herCity)} <b id="hBaku">--:--</b></span><span aria-hidden="true">·</span><span>${K.esc(C.myCity)} <b id="hIst">--:--</b></span></p>
          <h1 class="hero-greet"><span class="greet-word" id="greetWord">Merhaba</span><span class="greet-name">Prenses ${K.esc(C.herPet || C.herName)}</span></h1>
          <p class="hero-sub" id="greetSub"></p>
        </div>
        <div class="hero-scene">
          <div class="scene-tower">${A.kizKulesi()}<span class="city-tag">${K.esc(C.myCity)} · <i>${K.esc(C.myPet || C.myNick)}</i></span></div>
          <div class="scene-center">
            ${A.garland()}
            <button class="hero-kitty" id="heroKitty" aria-label="Kitty'ye dokun">${A.kitty({ crown: true, cls: 'hk' })}</button>
            <div class="kitty-say" id="kittySay" hidden></div>
          </div>
          <div class="scene-tower">${A.qizQalasi()}<span class="city-tag">${K.esc(C.herCity)} · <i>${K.esc(C.herPet || C.herNick)}</i></span></div>
          <div class="scene-sea" aria-hidden="true"></div>
        </div>
      </section>
      <section class="together">
        <div class="wrap">
          <div class="together-card">
            <p class="tc-label">Birlikte</p>
            <p class="tc-num"><span id="tDays">0</span><span class="tc-unit">gün</span></p>
            <p class="tc-tick" id="tTick"></p>
            <ul class="tc-chips">
              <li>Tanışalı <b id="tMet">0</b> gün</li>
              <li><b id="tMonths">0</b>. ayımız</li>
              <li id="tAnnWrap">Yıldönümüne <b id="tAnn">0</b> gün</li>
              <li><a href="#ilk-sarilma">Sarılma borcum: <b id="tHugs">0</b></a></li>
            </ul>
          </div>
        </div>
      </section>
      <section class="wrap special" id="special" hidden></section>
      <section class="wrap sec today">
        ${decor(10, 7)}
        <h2 class="sec-title">Bugün <span class="script">senin için</span></h2>
        <div class="today-grid">
          <article class="card photo-card" id="photoCard">
            <p class="card-eyebrow">Günün fotoğrafı</p>
            <button class="polaroid-day" id="dayPhoto" aria-label="Portreler odasına git">
              <span class="pd-tape"></span>
              <span class="pd-media"><img data-vault="" data-thumb alt=""></span>
              <span class="pd-cap hand" id="dayPhotoCap"></span>
            </button>
          </article>
          <article class="card note-card">
            <p class="card-eyebrow" id="noteDate">Günün notu</p>
            <p class="note-text" id="noteText"></p>
            <p class="note-sign">— ${K.esc(C.myPet || C.myName || '')}</p>
          </article>
          <article class="card fortune-card">
            <p class="card-eyebrow">Kitty şans kurabiyesi</p>
            <button class="cookie" id="cookie" aria-label="Şans kurabiyesini kır">${cookieSvg()}</button>
            <p class="fortune-text" id="fortuneText" hidden></p>
            <p class="fortune-hint" id="fortuneHint">Kırmak için kurabiyeye dokun. Her gün yeni bir tane pişiyor.</p>
          </article>
          <article class="card mood-card">
            <p class="card-eyebrow">Bugün nasılsın?</p>
            <div class="moods">${moods}</div>
          </article>
        </div>
      </section>
      <section class="wrap sec castle">
        <h2 class="sec-title">Kalenin <span class="script">kanatları</span></h2>
        <p class="sec-sub">Dört kanat, yirmiden fazla oda. Bazı kapılar sadece özel günlerde, bazıları sadece gece açılıyor, biri de iyi saklanmış. Acele etme; bu kale her gün biraz değişiyor.</p>
        <div id="wings"></div>
      </section>
      <footer class="foot">
        <div class="foot-tags"><span class="gtag">${K.esc(C.herPet || C.herNick)}</span><span class="foot-heart" aria-hidden="true">♥</span><span class="gtag">${K.esc(C.myPet || C.myNick)}</span></div>
        <p>Bu masal ${T.fmt(C.metDate)}'te bir Instagram grubunda başladı.<br>Peri ${K.esc(C.friendName)}'e sonsuz teşekkürlerle.</p>
        <p class="foot-small">Bu kaleye <b id="visitCount">1</b>. gelişin · <a href="#album">Çıkartmalar <b id="footStickers">0</b>/${K.stickers.total}</a></p>
        <button class="paw-secret no-burst" id="pawSecret" aria-label="Minicik bir pati izi">${A.icon('paw')}</button>
      </footer>`;
  }

  function cookieSvg() {
    return `<svg viewBox="0 0 160 100" aria-hidden="true">
      <g class="ck-l"><path d="M80 22 C50 10 14 30 16 62 C18 82 46 88 80 70 Z" fill="#F7C47E" stroke="#B9783E" stroke-width="4" stroke-linejoin="round"/><path d="M58 32 C42 38 32 50 34 64" fill="none" stroke="#E6A45A" stroke-width="4" stroke-linecap="round"/></g>
      <g class="ck-r"><path d="M80 22 C110 10 146 30 144 62 C142 82 114 88 80 70 Z" fill="#F7C47E" stroke="#B9783E" stroke-width="4" stroke-linejoin="round"/><path d="M102 32 C118 38 128 50 126 64" fill="none" stroke="#E6A45A" stroke-width="4" stroke-linecap="round"/><g transform="translate(112 40) scale(.2)">${A.bowShape('#E3174D', '#B9783E')}</g></g>
      <g class="ck-paper"><rect x="70" y="50" width="62" height="12" rx="2" fill="#fff" stroke="#F0A8C0" stroke-width="2" transform="rotate(-10 70 50)"/><path d="M84 54 h30" stroke="#F0A8C0" stroke-width="2" stroke-dasharray="3 3" transform="rotate(-10 70 50)"/></g>
    </svg>`;
  }

  /* ---------------- Kanatlar ve kapılar ---------------- */
  const visible = (r) => !(typeof r.hidden === 'function' ? r.hidden() : r.hidden);
  function doorHTML(r, visited) {
    const badge = r.badge ? r.badge() : '';
    const tag = r.secret ? '<span class="door-new secret">Gizli</span>' : !visited[r.id] ? '<span class="door-new">Yeni</span>' : badge ? `<span class="door-badge">${badge}</span>` : '';
    return `<a class="door" href="#${r.id}" data-room="${r.id}" style="--door:${r.color}">
      <span class="door-arch">${A.icon(r.icon)}</span>
      <span class="door-name">${K.esc(K.val(r.title))}</span>
      <span class="door-sub">${K.esc(K.fill(K.val(r.sub)))}</span>${tag}
    </a>`;
  }
  function renderDoors() {
    const visited = K.store.get('visited', {});
    K.$('#wings').innerHTML = WINGS.map((w) => {
      const rooms = K.rooms.filter((r) => (r.wing || 'hazine') === w.id && visible(r));
      if (!rooms.length) return '';
      return `<section class="wing" style="--wing:${w.color}">
        <div class="wing-head">
          <h3 class="wing-ribbon"><span class="wing-ic">${A.icon(w.icon)}</span><span>${K.esc(w.title)}</span></h3>
          <p class="wing-sub">${K.esc(w.sub)}</p>
        </div>
        <nav class="doors" aria-label="${K.esc(w.title)}">${rooms.map((r) => doorHTML(r, visited)).join('')}</nav>
      </section>`;
    }).join('');
    initTilt();
  }
  // Masaüstünde kapılar imlece doğru hafifçe eğilir
  function initTilt() {
    if (K.touch || K.reduced) return;
    K.$$('.door').forEach((d) => {
      const arch = d.querySelector('.door-arch');
      d.addEventListener('pointermove', (e) => {
        const r = arch.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - 0.5;
        const y = (e.clientY - r.top) / r.height - 0.5;
        arch.style.setProperty('--rx', (-y * 10).toFixed(2) + 'deg');
        arch.style.setProperty('--ry', (x * 12).toFixed(2) + 'deg');
      });
      d.addEventListener('pointerleave', () => {
        arch.style.setProperty('--rx', '0deg');
        arch.style.setProperty('--ry', '0deg');
      });
    });
  }

  /* ---------------- Saat, sayaçlar, selamlama ---------------- */
  const GREET = [
    { from: 5, to: 11, word: 'Günaydın', subs: ['Sabahın xeyir! {herCity}\'de güneş doğdu, {myCity}\'da biri seni düşünerek uyandı.', 'Bugün de dünyanın en güzel sabahı, çünkü sen uyandın.', 'günnnnnaaaaydddınnnnn şirinim. Kahvaltını yap, suyunu iç, sonra bir kapı seç.'] },
    { from: 11, to: 17, word: 'İyi günler', subs: ['Ders arası mı? Kitty senin için bir şey hazırladı.', 'Günün yarısı geçti, seni sevmemin yarısı bile geçmedi.', '{myCity}\'da şu an saat {istTime}. Ve biri seni düşünüyor.'] },
    { from: 17, to: 21, word: 'İyi akşamlar', subs: ['Akşam oldu. Gartic vakti yaklaşıyor olabilir mi?', 'Günün nasıl geçti? Mutlu, yorgun, özlemli... Aşağıda Kitty\'ye söyleyebilirsin.', 'Hazar\'da güneş batarken seni düşünen biri var.'] },
    { from: 21, to: 29, word: 'İyi geceler', subs: ['Uyumadan önce bir mektup okumak ister misin?', 'Gecən xeyrə qalsın, gözəlim. Ama önce bir kapı seç.', 'Akşam yıldızına bak. Ben yolumu ona bakarak buluyorum.'] },
  ];
  function greeting() {
    const h = T.baku().h;
    const hh = h < 5 ? h + 24 : h;
    const g = GREET.find((x) => hh >= x.from && hh < x.to) || GREET[0];
    K.$('#greetWord').textContent = g.word + ',';
    K.$('#greetSub').textContent = K.fill(K.pick(g.subs));
    const night = h >= 21 || h < 6;
    document.body.classList.toggle('night', night);
    if (night) K.$('#heroMoon').innerHTML = A.moonSvg(A.moonPhase(T.now()).p, 44);
  }
  function tick() {
    const now = T.now();
    const bh = K.$('#hBaku');
    if (bh) {
      bh.textContent = T.hm(C.tzBaku);
      K.$('#hIst').textContent = T.hm(C.tzIstanbul);
      const s = T.split(now - T.at(C.togetherDate));
      K.$('#tDays').textContent = K.num(s.d);
      K.$('#tTick').textContent = `${K.pad(s.h)} saat · ${K.pad(s.m)} dakika · ${K.pad(s.s)} saniye`;
    }
    K.emit('tick', now);
  }
  function dailyBits() {
    K.$('#tMet').textContent = K.num(T.daysSince(C.metDate));
    K.$('#tMonths').textContent = Math.max(1, T.monthsTogether());
    K.$('#tHugs').textContent = K.num(K.hugDebt());
    const ann = T.daysUntil(C.firstAnniversary);
    if (ann > 0) K.$('#tAnn').textContent = K.num(ann);
    else {
      const next = T.nextAnnual(C.togetherDate.slice(5));
      K.$('#tAnnWrap').innerHTML = next.days === 0 ? '<b>Bugün yıldönümümüz!</b>' : `Yıldönümüne <b>${K.num(next.days)}</b> gün`;
    }
    const p = T.baku();
    K.$('#noteDate').textContent = `Günün notu · ${p.d} ${K.MONTHS[p.mo - 1]}, ${T.dayName(p)}`;
    K.$('#noteText').textContent = K.fill(K.daily(D.notes));
    dayPhoto();
    updateCounts();
  }
  function dayPhoto() {
    const card = K.$('#photoCard');
    if (!D.portraits.length) {
      card.hidden = true;
      return;
    }
    const ph = K.daily(D.portraits, 2);
    const img = K.$('#dayPhoto img');
    if (img.dataset.vault !== ph.id) {
      img.dataset.vault = ph.id;
      img.removeAttribute('data-filled');
      img.alt = ph.title;
      K.$('#dayPhotoCap').textContent = ph.title;
      K.vault.fill(card);
    }
  }
  function updateCounts() {
    const n = K.stickers.done();
    K.$('#topStickers').textContent = n;
    K.$('#footStickers').textContent = n;
  }

  /* ---------------- Şans kurabiyesi ---------------- */
  function initCookie() {
    const btn = K.$('#cookie');
    const today = T.todayKey();
    const text = K.fill(D.fortunes[K.hash(today + 'kurabiye') % D.fortunes.length]);
    const show = (anim) => {
      btn.classList.add('cracked');
      const t = K.$('#fortuneText');
      t.textContent = text;
      t.hidden = false;
      K.$('#fortuneHint').textContent = 'Yarın fırında yeni bir kurabiye olacak.';
      if (anim) {
        K.audio.sfx.pop();
        const r = btn.getBoundingClientRect();
        K.fx.burst(r.left + r.width / 2, r.top + r.height / 2, { count: 14, power: 5, shapes: ['star', 'spark', 'heart'] });
      }
    };
    if (K.store.get('cookieDay') === today) show(false);
    btn.addEventListener('click', () => {
      if (btn.classList.contains('cracked')) {
        btn.classList.remove('cracked');
        setTimeout(() => show(true), 250);
        return;
      }
      K.store.set('cookieDay', today);
      show(true);
    });
  }

  /* ---------------- Ruh hâli ---------------- */
  function initMoods() {
    K.$$('.mood').forEach((b) =>
      b.addEventListener('click', () => {
        const m = D.moods.find((x) => x.id === b.dataset.mood);
        K.audio.sfx.pop();
        const letter = m.letter && D.letters.find((l) => l.id === m.letter);
        const room = m.room && K.rooms.find((r) => r.id === m.room);
        const md = K.ui.modal({
          label: m.label,
          cls: 'mood-modal',
          html: `<div style="display:grid;justify-items:center;text-align:center;gap:12px">
            <div style="width:150px">${A.kitty({ cls: 'is-' + m.face, crown: m.id === 'mutlu' })}</div>
            <h3 style="padding:0">${K.esc(m.label)}</h3>
            <p style="font-size:17px">${K.esc(K.fill(m.text))}</p>
            ${m.breathe ? '<div class="breathe"><div class="breathe-circle"></div><span class="breathe-label">Hazır mısın?</span></div>' : ''}
            <div class="actions" style="justify-content:center">
              ${letter ? `<button class="btn" data-letter="${letter.id}">${A.ui('heart')} "${K.esc(letter.title)}"</button>` : ''}
              ${room ? `<button class="btn soft" data-room="${room.id}">${K.esc(K.val(room.title))} odasına git</button>` : ''}
            </div></div>`,
        });
        if (m.breathe) breathe(md);
        md.el.addEventListener('click', (e) => {
          const l = e.target.closest('[data-letter]');
          const r = e.target.closest('[data-room]');
          if (l) {
            K.pendingLetter = l.dataset.letter;
            md.close();
            go('mektuplar');
          } else if (r) {
            md.close();
            go(r.dataset.room);
          }
        });
      })
    );
  }
  function breathe(md) {
    const c = md.el.querySelector('.breathe-circle');
    const l = md.el.querySelector('.breathe-label');
    const steps = [
      ['Nefes al', 4000, 1],
      ['Tut', 4000, 1],
      ['Yavaşça ver', 6000, 0.55],
    ];
    let i = 0,
      rounds = 0;
    const run = () => {
      if (!document.body.contains(c)) return;
      const [txt, ms, sc] = steps[i];
      l.textContent = txt;
      c.style.transitionDuration = ms + 'ms';
      c.style.transform = `scale(${sc})`;
      i = (i + 1) % steps.length;
      if (i === 0) rounds++;
      if (rounds >= 4) {
        setTimeout(() => (l.textContent = 'Aferin sana'), ms);
        return;
      }
      setTimeout(run, ms);
    };
    setTimeout(run, 800);
  }

  /* ---------------- Hero Kitty ---------------- */
  const KITTY_LINES = [
    'Fiyonkuma dokunma, gıdıklanıyorum! Bu arada puantiyelerim senin tokandan.',
    'Bugün çok güzelsin, {herPet}.',
    '{myName} sana selam söyledi. Bir de "Mən səni sevirəm" dedi.',
    'Angela beni kıskanıyor, ona söyleme.',
    'Hazar\'dan selam, Boğaz\'dan selam!',
    'Bir kanat seç, seni gezdireyim.',
    'Ağzım yok ama kalbim çok konuşkan.',
    'Bugün hangi mektubu açacaksın?',
    'Biliyor muydun? Ben Londralıyım. İngilizce konuşabilirim, öğretmenim.',
    'Birlikte {together} gün oldu. Sayıyorum!',
    'Kalede bir pati izi gördüm. Kime ait acaba? Arıyorum...',
    'Sana {hugs} sarılma borçlu biri var. Ben şahidim.',
  ];
  function initHeroKitty() {
    const btn = K.$('#heroKitty');
    const say = K.$('#kittySay');
    const svg = btn.querySelector('.kitty');
    let t;
    btn.addEventListener('click', () => {
      K.audio.sfx.pop();
      svg.classList.remove('wiggle');
      requestAnimationFrame(() => svg.classList.add('wiggle'));
      svg.classList.add('is-happy');
      say.textContent = K.fill(K.pick(KITTY_LINES));
      say.hidden = false;
      clearTimeout(t);
      t = setTimeout(() => {
        say.hidden = true;
        svg.classList.remove('is-happy', 'wiggle');
      }, 3400);
    });
    K.$('#dayPhoto').addEventListener('click', () => go('portreler'));
  }

  /* ---------------- Yönlendirici ---------------- */
  const inited = {};
  let homeScroll = 0;
  function go(id) {
    if (location.hash.slice(1) === id) route();
    else location.hash = id;
  }
  K.go = go;
  function route() {
    const id = decodeURIComponent(location.hash.slice(1));
    const room = K.rooms.find((r) => r.id === id && visible(r));
    if (room) openRoom(room);
    else closeRoom();
  }
  function openRoom(room) {
    const view = K.$('#roomView');
    const stage = K.$('#roomStage');
    if (K.activeRoom === room.id) return;
    if (K.activeRoom) {
      const prev = K.rooms.find((r) => r.id === K.activeRoom);
      prev && prev.leave && prev.leave();
    } else {
      homeScroll = window.scrollY;
    }
    K.activeRoom = room.id;
    K.$$('.room', stage).forEach((el) => (el.hidden = true));
    let el = K.$(`.room[data-room="${room.id}"]`, stage);
    if (!el) {
      el = K.el(`<div class="room room-${room.id}" data-room="${room.id}"></div>`);
      stage.appendChild(el);
    }
    el.hidden = false;
    view.style.setProperty('--room-c', room.color);
    K.$('#roomTitle').textContent = K.val(room.title);
    K.$('#roomSub').textContent = K.fill(K.val(room.sub));
    K.$('#roomIcon').innerHTML = A.icon(room.icon);
    document.title = `${K.val(room.title)} · ${C.herName}'in Krallığı`;
    view.hidden = false;
    document.body.classList.add('in-room');
    requestAnimationFrame(() => view.classList.add('open'));
    view.scrollTop = 0;
    if (!inited[room.id]) {
      inited[room.id] = true;
      try {
        room.init(el);
      } catch (err) {
        console.error(err);
        el.innerHTML = '<p class="room-intro">Bu oda şu an açılamadı. Sayfayı yenilemeyi dene.</p>';
      }
    }
    room.enter && room.enter(el);
    K.vault.fill(el);
    const visited = K.store.get('visited', {});
    if (!visited[room.id]) {
      visited[room.id] = T.todayKey();
      K.store.set('visited', visited);
    }
    setTimeout(() => K.$('#roomBack').focus({ preventScroll: true }), 80);
  }
  function closeRoom() {
    if (!K.activeRoom) return;
    const view = K.$('#roomView');
    const prev = K.rooms.find((r) => r.id === K.activeRoom);
    prev && prev.leave && prev.leave();
    const lastId = K.activeRoom;
    K.activeRoom = null;
    view.classList.remove('open');
    document.body.classList.remove('in-room');
    document.title = `${C.herName}'in Krallığı`;
    renderDoors();
    dailyBits();
    window.scrollTo(0, homeScroll);
    setTimeout(() => {
      if (!K.activeRoom) view.hidden = true;
    }, 450);
    const door = K.$(`.door[data-room="${lastId}"]`);
    door && door.focus({ preventScroll: true });
  }
  function initNav() {
    window.addEventListener('hashchange', route);
    K.$('#roomBack').addEventListener('click', (e) => {
      e.preventDefault();
      history.pushState(null, '', location.pathname + location.search);
      closeRoom();
    });
    K.$('#wings').addEventListener('click', (e) => {
      const d = e.target.closest('.door');
      if (!d) return;
      e.preventDefault();
      K.audio.sfx.whoosh();
      d.classList.add('opening');
      setTimeout(() => {
        d.classList.remove('opening');
        go(d.dataset.room);
      }, K.reduced ? 0 : 260);
    });
    // Logo: odadaysan ana salona döner; 7 kez hızlıca dokununca gizli bir şey olur (7 Kasım)
    let taps = [];
    K.$('#brand').addEventListener('click', () => {
      if (K.activeRoom) {
        history.pushState(null, '', location.pathname + location.search);
        closeRoom();
      } else window.scrollTo({ top: 0, behavior: K.reduced ? 'auto' : 'smooth' });
      const now = Date.now();
      taps = taps.filter((t) => now - t < 4000);
      taps.push(now);
      if (taps.length >= 7) {
        taps = [];
        secretSeven();
      }
    });
    const mb = K.$('#musicBtn');
    mb.addEventListener('click', () => K.audio.music.toggle());
    K.on('music', (on) => {
      mb.setAttribute('aria-pressed', on ? 'true' : 'false');
      mb.innerHTML = A.ui(on ? 'music' : 'musicOff');
    });
    K.on('sticker', () => {
      updateCounts();
      if (!K.activeRoom) renderDoors();
    });
    K.$('#pawSecret').addEventListener('click', findKopus);
  }

  /* ---------------- Özel günler ---------------- */
  function specials() {
    const p = T.baku();
    const md = `${K.pad(p.mo)}-${K.pad(p.d)}`;
    const out = [];
    const years = p.y - +C.togetherDate.slice(0, 4);
    if (C.firstMeetDate && T.todayKey() === C.firstMeetDate)
      out.push({ icon: 'hugs', title: 'Bugün o gün!', text: 'Aylarca ekranlardan sevdiğin kişi bugün karşında olacak. İlk Sarılma odasındaki mühürlü mektubun şifresini ondan iste.', room: 'ilk-sarilma', big: true });
    if (md === C.herBirthday)
      out.push({ icon: 'cake', title: `İyi ki doğdun, Prenses ${C.herPet}!`, text: 'Bugün 23 Nisan. Özel Günler odasında mumlarını bekleyen bir pasta, Mektuplar odasında açılmayı bekleyen bir mektup var.', room: 'ozel', big: true });
    if (md === C.togetherDate.slice(5) && years > 0)
      out.push({ icon: 'heart', title: `Mutlu ${years}. yıldönümümüz!`, text: `Tam ${years} yıl önce bugün masalımızın adı kondu. Mektuplar odasında yıldönümü mektubun açıldı.`, room: 'mektuplar', big: true });
    else if (p.d === +C.togetherDate.slice(8) && T.monthsTogether() > 0)
      out.push({ icon: 'calendar', title: `Bugün ${T.monthsTogether()}. ayımız!`, text: 'Her ayın 21\'i bizim küçük bayramımız. Kutlu olsun, şirinim.', room: 'ozel' });
    if (C.notesDate && md === C.notesDate.slice(5) && p.y > +C.notesDate.slice(0, 4))
      out.push({ icon: 'note', title: 'Not duvarının yıldönümü', text: `${p.y - +C.notesDate.slice(0, 4)} yıl önce bugün ${C.herCity}'de bir duvara ikimizin adını yazdın. Daha sevgili bile değildik.`, room: 'izler', big: true });
    if (md === C.myBirthday)
      out.push({ icon: 'cake', title: `Bugün ${C.myName}'nın doğum günü!`, text: 'Mektuplar odasında senin için bir mektup açıldı. Bir de ona "iyi ki doğdun" yazmayı unutma; ilk mesajı sen atacaktın, anlaşmıştık.', room: 'mektuplar', big: true });
    if (md === C.metDate.slice(5) && p.y > +C.metDate.slice(0, 4))
      out.push({ icon: 'letter', title: 'Tanışma yıldönümümüz!', text: `${p.y - +C.metDate.slice(0, 4)} yıl önce bugün ${C.friendName} bizi aynı gruba ekledi.`, room: 'mektuplar', big: true });
    if (md === '02-14') out.push({ icon: 'heart', title: 'Sevgililer Günü', text: 'Bugün sevgililer günüymüş. Bizim için her gün öyle ama yine de kutlu olsun.', room: 'son' });
    if (md === '01-01') out.push({ icon: 'star', title: 'Mutlu yıllar!', text: 'Yeni yılın ilk mesajı senin olsun. Bu yıl ilk sarılmamızın yılı olsun.', room: 'ilk-sarilma' });
    if (md === '11-01') out.push({ icon: 'bow', title: 'Bugün Hello Kitty\'nin doğum günü!', text: 'Kitty White bugün bir yaş daha büyüdü. Puantiyeli fiyonkunu ona ithaf et.', room: 'album' });
    return out;
  }
  function renderSpecials() {
    const list = specials();
    const box = K.$('#special');
    if (!list.length) {
      box.hidden = true;
      return;
    }
    box.hidden = false;
    box.innerHTML = list
      .map(
        (s) => `<div class="special-card">${A.icon(s.icon)}<div><h3>${K.esc(s.title)}</h3><p>${K.esc(s.text)}</p>
          <a class="btn small" href="#${s.room}">Hemen git</a></div></div>`
      )
      .join('');
    const key = 'special-' + T.todayKey();
    if (!K.store.get(key)) {
      K.store.set(key, true);
      setTimeout(() => (list.some((s) => s.big) ? K.fx.confetti({ count: 140 }) : K.fx.rain({ count: 50 })), 900);
    }
  }

  /* ---------------- Ziyaret ve zamana bağlı çıkartmalar ---------------- */
  function visits() {
    const days = K.store.get('visits', []);
    const today = T.todayKey();
    if (!days.includes(today)) {
      days.push(today);
      K.store.set('visits', days);
    }
    K.$('#visitCount').textContent = K.num(days.length);
    return days.length;
  }
  function timeStickers(dayCount) {
    const p = T.baku();
    const later = [];
    if (p.h < 5) later.push('gece');
    if (p.h >= 5 && p.h < 8) later.push('sabah');
    if (p.d === 21) later.push('yirmibir');
    if (dayCount >= 7) later.push('sadik');
    later.forEach((id, i) => setTimeout(() => K.stickers.award(id), 2600 + i * 1800));
  }

  /* ---------------- Gizli sürprizler ---------------- */
  function findKopus() {
    const first = !K.store.get('kopusFound');
    K.store.set('kopusFound', true);
    K.stickers.award('kopus');
    K.stickers.award('gizli');
    K.audio.sfx.sparkle();
    if (first) {
      K.fx.rain({ count: 40, shapes: ['heart', 'star'] });
      K.fx.toast(`<b>Gizli kulübeyi buldun!</b> ${K.esc(C.herDog)} seni bekliyordu.`, { icon: A.icon('paw') });
    }
    if (!K.activeRoom) renderDoors();
    setTimeout(() => go('kopus'), first ? 700 : 0);
  }
  K.findKopus = findKopus;
  function secretSeven() {
    K.stickers.award('gizli');
    K.audio.sfx.sparkle();
    K.fx.confetti({ count: 70, shapes: ['star', 'heart'] });
    K.ui.modal({
      label: 'Gizli kapı',
      html: `<div style="text-align:center;display:grid;gap:12px;justify-items:center">
        <div style="width:140px">${A.kitty({ cls: 'is-wink', crown: true })}</div>
        <h3 style="padding:0">7 kere dokundun...</h3>
        <p style="font-size:17px">Yedi, benim doğum günüm: ${+C.myBirthday.slice(3)} ${K.MONTHS[+C.myBirthday.slice(0, 2) - 1]}. Bu sırrı bulduğuna göre bir anlaşma yapalım: O gün bana ilk mesajı sen atacaksın. Saat 00:00'da, Bakü saatiyle. (Yani ben o sırada 23:00'te telefonun başında bekliyor olacağım.)</p>
        <p class="hand" style="font-size:24px;color:var(--rose-deep)">— ${K.esc(C.myPet)}</p></div>`,
    });
  }
  function initKeys() {
    let buf = '';
    const eggs = {
      [K.norm(C.herName)]: () => {
        K.fx.rain({ count: 90 });
        K.fx.toast(`<b>Gizli kapı!</b> Adını yazınca kale kalplerle doluyor.`, { icon: A.icon('heart') });
      },
      [K.norm(C.herPet)]: () => {
        K.fx.rain({ count: 90, shapes: ['heart', 'bow'] });
        K.fx.toast(`<b>${K.esc(C.herPet)} ♡ ${K.esc(C.myPet)}</b> — ${K.esc(C.herCity)}'deki duvardan buraya.`, { icon: A.icon('note') });
      },
      [K.norm(C.myNick)]: () => {
        K.audio.sfx.success();
        K.fx.toast(`<b>${K.esc(C.myNick)}:</b> MEN SENİ SEVİREEEM <span style="color:var(--mint-deep);font-weight:700">(+155)</span>`, { icon: A.icon('pencil') });
      },
      [K.norm(C.friendName)]: () => {
        K.audio.sfx.sparkle();
        K.fx.confetti({ count: 60, shapes: ['star', 'spark'], colors: ['#8FD3FF', '#C9B6FF', '#FFFFFF', '#FFD34E'] });
        K.fx.toast(`<b>Peri ${K.esc(C.friendName)}'e selam!</b> O olmasa bu kale olmazdı.`, { icon: A.icon('star') });
      },
      kitty: () => peekKitty(),
      angela: () => {
        K.audio.sfx.meow(1.2);
        K.fx.toast('<b>Angela:</b> Beni mi çağırdın? Odamda seni bekliyorum.', { icon: A.icon('angela') });
      },
      [K.norm(C.herDog)]: () => findKopus(),
    };
    document.addEventListener('keydown', (e) => {
      if (e.target.closest('input, textarea, [contenteditable]') || e.key.length !== 1) return;
      buf = (buf + e.key.toLocaleLowerCase('tr')).slice(-12);
      const n = K.norm(buf).replace(/ /g, '');
      for (const word in eggs) {
        if (word && n.endsWith(word)) {
          buf = '';
          eggs[word]();
          K.stickers.award('gizli');
          break;
        }
      }
    });
  }
  function peekKitty() {
    const el = K.el(`<div class="peek" aria-hidden="true">${A.kitty({ cls: 'is-wink' })}</div>`);
    document.body.appendChild(el);
    K.audio.sfx.pop();
    setTimeout(() => el.remove(), 2600);
  }

  /* ---------------- Uygulamayı kur (kasa açıldıktan sonra) ---------------- */
  let built = false;
  let dayCount = 1;
  function buildApp() {
    if (built) return;
    built = true;
    renderShell();
    renderDoors();
    greeting();
    dailyBits();
    tick();
    initCookie();
    initMoods();
    initHeroKitty();
    initNav();
    initKeys();
    K.fx.ambient();
    renderSpecials();
    dayCount = visits();
    setInterval(tick, 1000);
    setInterval(() => {
      greeting();
      dailyBits();
    }, 60000);
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        if (K.audio.music.on) {
          K.audio.music.stop(false);
          K.resumeMusic = true;
        }
      } else {
        dailyBits();
        if (K.resumeMusic) {
          K.resumeMusic = false;
          K.audio.music.start();
        }
      }
    });
  }
  K.on('unlocked', (data) => {
    const { config, ...rest } = data || {};
    Object.assign(C, config || {});
    Object.assign(D, rest);
    buildApp();
  });

  /* ---------------- Kapı ---------------- */
  function gate(done) {
    const returning = Boolean(K.store.get('vault'));
    const restoreP = K.vault.restore();
    const g = K.el(`<div class="gate" id="gate">
      <div class="gate-curtain l"></div><div class="gate-curtain r"></div><div class="gate-valance"></div>
      <div class="gate-stage">
        <p class="gate-eyebrow">Boğaz'dan Hazar'a bir Hello Kitty masalı</p>
        <h1 class="gate-title">${returning ? 'Hoş geldin' : `Prenses ${K.esc(C.herName)}'e`}</h1>
        <div class="gate-kitty">${A.kitty({ crown: true, cls: 'gate-kitty-svg', label: 'Kapıdaki Hello Kitty' })}
          <button class="gate-bow no-burst" id="gateBow" aria-label="Kitty'nin fiyonkuna dokun"><span class="pulse"></span></button>
        </div>
        <p class="gate-hint" id="gateHint">${returning ? 'Kitty seni tanıdı. Kapıyı açmak için <b>fiyonkuna</b> dokun.' : 'Kalenin anahtarı Kitty\'nin <b>fiyonkunda</b>. Puantiyelerini tanıdın mı? Fiyonka dokun.'}</p>
        <form class="gate-quiz" id="gateQuiz" hidden autocomplete="off">
          <label for="gateAnswer">${K.esc(C.gateQuestion)}</label>
          <div class="row"><input class="input" id="gateAnswer" name="gateAnswer" type="text" placeholder="Nota ne yazmıştın?" autocapitalize="off" spellcheck="false"><button class="btn red" type="submit" id="gateSubmit">Aç</button></div>
          <p class="gate-msg" id="gateMsg" aria-live="polite">Bu kapı sadece o notu yazan prensese açılır.</p>
        </form>
      </div>
    </div>`);
    document.body.appendChild(g);
    document.body.classList.add('gate-open');
    const kit = K.$('.gate-kitty-svg', g);
    let tries = 0,
      opened = false,
      busy = false;

    const open = () => {
      if (opened) return;
      opened = true;
      kit.classList.add('is-heart');
      K.audio.sfx.chime();
      K.fx.confetti({ count: 120, y: window.innerHeight * 0.4 });
      setTimeout(() => {
        g.classList.add('opening');
        K.audio.sfx.whoosh();
      }, 900);
      setTimeout(() => {
        g.remove();
        document.body.classList.remove('gate-open');
        done();
      }, 2300);
    };
    const ask = () => {
      g.classList.add('asked');
      K.$('#gateHint', g).hidden = true;
      K.$('#gateQuiz', g).hidden = false;
      setTimeout(() => K.$('#gateAnswer', g).focus(), 100);
    };
    K.$('#gateBow', g).addEventListener('click', async () => {
      K.audio.ensure();
      if (K.audio.music.wanted()) K.audio.music.start();
      K.audio.sfx.sparkle();
      kit.classList.remove('wiggle');
      requestAnimationFrame(() => kit.classList.add('wiggle'));
      const r = K.$('#gateBow', g).getBoundingClientRect();
      K.fx.burst(r.left + r.width / 2, r.top + r.height / 2, { count: 16, power: 6 });
      if (g.classList.contains('asked')) return;
      if (await restoreP) return open();
      if (!(await K.vault.available())) {
        K.$('#gateHint', g).innerHTML = 'Kale bu şekilde açılamıyor. Siteyi kendi bağlantısından (https ile) aç.';
        return;
      }
      ask();
    });
    K.$('#gateQuiz', g).addEventListener('submit', async (e) => {
      e.preventDefault();
      if (busy) return;
      const v = K.$('#gateAnswer', g).value;
      if (!v.trim()) return;
      const msg = K.$('#gateMsg', g);
      busy = true;
      K.$('#gateSubmit', g).disabled = true;
      msg.classList.remove('err');
      msg.textContent = 'Kitty notu hatırlamaya çalışıyor...';
      g.classList.add('thinking');
      const ok = await K.vault.unlock(v);
      g.classList.remove('thinking');
      busy = false;
      K.$('#gateSubmit', g).disabled = false;
      if (ok) {
        msg.textContent = 'Kitty seni tanıdı! Kapı açılıyor...';
        open();
        return;
      }
      K.audio.sfx.fail();
      g.classList.remove('shake');
      void g.offsetWidth;
      g.classList.add('shake');
      msg.classList.add('err');
      msg.textContent = C.gateHints[Math.min(tries, C.gateHints.length - 1)];
      tries++;
    });
  }

  /* ---------------- Başlat ---------------- */
  function boot() {
    gate(() => {
      const after = () => {
        K.stickers.award('ilk-adim');
        timeStickers(dayCount);
        route();
      };
      if (!K.store.get('prologueSeen') && D.prologue.length && K.prologue) {
        K.store.set('prologueSeen', true);
        K.prologue.play(D.prologue, after);
      } else after();
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
