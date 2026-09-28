/* Eln'in Krallığı — uygulama kabuğu: kapı, ana salon, yönlendirici, özel günler, gizli sürprizler */
(function () {
  'use strict';
  const K = window.K;
  const D = window.ELN;
  const C = D.config;
  const T = K.time;
  const A = K.art;

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
    return `
      <section class="hero" id="hero">
        <div class="hero-sky" aria-hidden="true">
          <div class="stars"></div>
          <div class="hero-moon" id="heroMoon"></div>
          <div class="cloud c1"></div><div class="cloud c2"></div><div class="cloud c3"></div>
        </div>
        <div class="wrap hero-text">
          <p class="hero-clock"><span>${K.esc(C.herCity)} <b id="hBaku">--:--</b></span><span aria-hidden="true">·</span><span>${K.esc(C.myCity)} <b id="hIst">--:--</b></span></p>
          <h1 class="hero-greet"><span class="greet-word" id="greetWord">Merhaba</span><span class="greet-name">Prenses ${K.esc(C.herName)}</span></h1>
          <p class="hero-sub" id="greetSub"></p>
        </div>
        <div class="hero-scene">
          <div class="scene-tower">${A.kizKulesi()}<span class="city-tag">${K.esc(C.myCity)} · <i>${K.esc(C.myNick)}</i></span></div>
          <div class="scene-center">
            ${A.garland()}
            <button class="hero-kitty" id="heroKitty" aria-label="Kitty'ye dokun">${A.kitty({ crown: true, cls: 'hk' })}</button>
            <div class="kitty-say" id="kittySay" hidden></div>
          </div>
          <div class="scene-tower">${A.qizQalasi()}<span class="city-tag">${K.esc(C.herCity)} · <i>${K.esc(C.herNick)}</i></span></div>
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
            </ul>
          </div>
        </div>
      </section>
      <section class="wrap special" id="special" hidden></section>
      <section class="wrap sec">
        <h2 class="sec-title">Bugün <span class="script">senin için</span></h2>
        <div class="today-grid">
          <article class="card note-card">
            <p class="card-eyebrow" id="noteDate">Günün notu</p>
            <p class="note-text" id="noteText"></p>
            <p class="note-sign">— ${K.esc(C.myName)}</p>
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
      <section class="wrap sec">
        <h2 class="sec-title">Kalenin <span class="script">odaları</span></h2>
        <p class="sec-sub">Her kapının ardında sana ait bir şey var. Bazı kapılar sadece özel günlerde, bazıları sadece gece açılıyor. Acele etme; bu kale her gün biraz değişiyor.</p>
        <nav class="doors" id="doors" aria-label="Odalar"></nav>
      </section>
      <footer class="foot">
        <div class="foot-tags"><span class="gtag">${K.esc(C.herNick)}</span><span class="foot-heart" aria-hidden="true">♥</span><span class="gtag">${K.esc(C.myNick)}</span></div>
        <p>Bu masal ${T.fmt(C.metDate)}'te bir Instagram grubunda başladı.<br>Peri ${K.esc(C.friendName)}'e sonsuz teşekkürlerle.</p>
        <p class="foot-small">Bu kaleye <b id="visitCount">1</b>. gelişin · <a href="#album">Çıkartmalar <b id="footStickers">0</b>/${K.stickers.total}</a></p>
      </footer>`;
  }

  function cookieSvg() {
    return `<svg viewBox="0 0 160 100" aria-hidden="true">
      <g class="ck-l"><path d="M80 22 C50 10 14 30 16 62 C18 82 46 88 80 70 Z" fill="#F7C47E" stroke="#B9783E" stroke-width="4" stroke-linejoin="round"/><path d="M58 32 C42 38 32 50 34 64" fill="none" stroke="#E6A45A" stroke-width="4" stroke-linecap="round"/></g>
      <g class="ck-r"><path d="M80 22 C110 10 146 30 144 62 C142 82 114 88 80 70 Z" fill="#F7C47E" stroke="#B9783E" stroke-width="4" stroke-linejoin="round"/><path d="M102 32 C118 38 128 50 126 64" fill="none" stroke="#E6A45A" stroke-width="4" stroke-linecap="round"/><g transform="translate(112 40) scale(.2)">${A.bowShape('#E3174D', '#B9783E')}</g></g>
      <g class="ck-paper"><rect x="70" y="50" width="62" height="12" rx="2" fill="#fff" stroke="#F0A8C0" stroke-width="2" transform="rotate(-10 70 50)"/><path d="M84 54 h30" stroke="#F0A8C0" stroke-width="2" stroke-dasharray="3 3" transform="rotate(-10 70 50)"/></g>
    </svg>`;
  }

  /* ---------------- Kapılar ---------------- */
  function renderDoors() {
    const visited = K.store.get('visited', {});
    K.$('#doors').innerHTML = K.rooms
      .filter((r) => !r.hidden)
      .map((r) => {
        const badge = r.badge ? r.badge() : '';
        const tag = !visited[r.id] ? '<span class="door-new">Yeni</span>' : badge ? `<span class="door-badge">${badge}</span>` : '';
        return `<a class="door" href="#${r.id}" data-room="${r.id}" style="--door:${r.color}">
          <span class="door-arch">${A.icon(r.icon)}</span>
          <span class="door-name">${K.esc(r.title)}</span>
          <span class="door-sub">${K.esc(r.sub)}</span>${tag}
        </a>`;
      })
      .join('');
  }

  /* ---------------- Saat, sayaçlar, selamlama ---------------- */
  const GREET = [
    { from: 5, to: 11, word: 'Günaydın', subs: ['Sabahın xeyir! {herCity}\'de güneş doğdu, {myCity}\'da biri seni düşünerek uyandı.', 'Bugün de dünyanın en güzel sabahı, çünkü sen uyandın.', 'Kahvaltını yap, suyunu iç, sonra bir kapı seç.'] },
    { from: 11, to: 17, word: 'İyi günler', subs: ['Ders arası mı? Kitty senin için bir şey hazırladı.', 'Günün yarısı geçti, seni sevmemin yarısı bile geçmedi.', '{myCity}\'da şu an saat {istTime}. Ve biri seni düşünüyor.'] },
    { from: 17, to: 21, word: 'İyi akşamlar', subs: ['Akşam oldu. Gartic vakti yaklaşıyor olabilir mi?', 'Günün nasıl geçti? Mutlu, yorgun, özlemli... Aşağıda Kitty\'ye söyleyebilirsin.', 'Hazar\'da güneş batarken seni düşünen biri var.'] },
    { from: 21, to: 29, word: 'İyi geceler', subs: ['Uyumadan önce bir mektup okumak ister misin?', 'Gecən xeyrə qalsın, gözəlim. Ama önce bir kapı seç.', 'Ay ikimize de aynı yerden bakıyor.'] },
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
      const since = now - T.at(C.togetherDate);
      const s = T.split(since);
      K.$('#tDays').textContent = K.num(s.d);
      K.$('#tTick').textContent = `${K.pad(s.h)} saat · ${K.pad(s.m)} dakika · ${K.pad(s.s)} saniye`;
    }
    K.emit('tick', now);
  }
  function dailyBits() {
    K.$('#tMet').textContent = K.num(T.daysSince(C.metDate));
    K.$('#tMonths').textContent = Math.max(1, T.monthsTogether());
    const ann = T.daysUntil(C.firstAnniversary);
    if (ann > 0) K.$('#tAnn').textContent = K.num(ann);
    else {
      const next = T.nextAnnual(C.togetherDate.slice(5));
      K.$('#tAnnWrap').innerHTML = next.days === 0 ? '<b>Bugün yıldönümümüz!</b>' : `Yıldönümüne <b>${K.num(next.days)}</b> gün`;
    }
    const p = T.baku();
    K.$('#noteDate').textContent = `Günün notu · ${p.d} ${K.MONTHS[p.mo - 1]}, ${T.dayName(p)}`;
    K.$('#noteText').textContent = K.fill(K.daily(D.notes));
    updateCounts();
  }
  function updateCounts() {
    const n = Object.keys(K.stickers.got()).length;
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
              ${room ? `<button class="btn soft" data-room="${room.id}">${K.esc(room.title)}'na git</button>` : ''}
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
      rounds = 0,
      alive = true;
    const run = () => {
      if (!alive || !document.body.contains(c)) return;
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
    'Fiyonkuma dokunma, gıdıklanıyorum!',
    'Bugün çok güzelsin, prenses.',
    '{myName} sana selam söyledi.',
    'Angela beni kıskanıyor, ona söyleme.',
    'Hazar\'dan selam, Boğaz\'dan selam!',
    'Bir kapı seç, seni gezdireyim.',
    'Ağzım yok ama kalbim çok konuşkan.',
    'Bugün hangi mektubu açacaksın?',
    'Biliyor muydun? Ben Londralıyım. İngilizce konuşabilirim, öğretmenim.',
    'Birlikte {together} gün oldu. Sayıyorum!',
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
      }, 3200);
    });
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
    const room = K.rooms.find((r) => r.id === id);
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
    K.$('#roomTitle').textContent = room.title;
    K.$('#roomSub').textContent = room.sub;
    K.$('#roomIcon').innerHTML = A.icon(room.icon);
    document.title = `${room.title} · ${C.herName}'in Krallığı`;
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
    K.$('#doors').addEventListener('click', (e) => {
      const d = e.target.closest('.door');
      if (!d) return;
      e.preventDefault();
      K.audio.sfx.whoosh();
      d.classList.add('opening');
      setTimeout(() => {
        d.classList.remove('opening');
        go(d.dataset.room);
      }, K.reduced ? 0 : 220);
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
  }

  /* ---------------- Özel günler ---------------- */
  function specials() {
    const p = T.baku();
    const md = `${K.pad(p.mo)}-${K.pad(p.d)}`;
    const out = [];
    const years = p.y - +C.togetherDate.slice(0, 4);
    if (md === C.herBirthday)
      out.push({ icon: 'cake', title: `İyi ki doğdun, Prenses ${C.herName}!`, text: 'Bugün 23 Nisan. Özel Günler odasında mumları seni bekleyen bir pasta, Mektuplar odasında da açılmayı bekleyen bir mektup var.', room: 'ozel', big: true });
    if (md === C.togetherDate.slice(5) && years > 0)
      out.push({ icon: 'heart', title: `Mutlu ${years}. yıldönümümüz!`, text: `Tam ${years} yıl önce bugün sevgili olduk. Mektuplar odasında sana yazdığım yıldönümü mektubu açıldı.`, room: 'mektuplar', big: true });
    else if (p.d === +C.togetherDate.slice(8) && T.monthsTogether() > 0)
      out.push({ icon: 'calendar', title: `Bugün ${T.monthsTogether()}. ayımız!`, text: 'Her ayın 21\'i bizim küçük bayramımız. Kutlu olsun, sevgilim.', room: 'ozel' });
    if (md === C.myBirthday)
      out.push({ icon: 'cake', title: `Bugün ${C.myName}'in doğum günü!`, text: 'Mektuplar odasında senin için bir mektup açıldı. Bir de bana "iyi ki doğdun" yazmayı unutma.', room: 'mektuplar', big: true });
    if (md === C.metDate.slice(5) && p.y > +C.metDate.slice(0, 4))
      out.push({ icon: 'letter', title: 'Tanışma yıldönümümüz!', text: `${p.y - +C.metDate.slice(0, 4)} yıl önce bugün Nehir bizi aynı gruba ekledi.`, room: 'mektuplar', big: true });
    if (md === '02-14') out.push({ icon: 'heart', title: 'Sevgililer Günü', text: 'Bugün sevgililer günüymüş. Bizim için her gün öyle ama yine de kutlu olsun.', room: 'son' });
    if (md === '01-01') out.push({ icon: 'star', title: 'Mutlu yıllar!', text: 'Yeni yılın ilk mesajı senin olsun. Bu yıl aynı şehirde daha çok gün diliyorum.', room: 'gokyuzu' });
    if (md === '11-01') out.push({ icon: 'bow', title: 'Bugün Hello Kitty\'nin doğum günü!', text: 'Kitty White bugün bir yaş daha büyüdü. Ona kalenin kapısından bir kutlama gönder.', room: 'album' });
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
  function secretSeven() {
    K.stickers.award('gizli');
    K.audio.sfx.sparkle();
    K.fx.confetti({ count: 70, shapes: ['star', 'heart'] });
    K.ui.modal({
      label: 'Gizli kapı',
      html: `<div style="text-align:center;display:grid;gap:12px;justify-items:center">
        <div style="width:140px">${A.kitty({ cls: 'is-wink', crown: true })}</div>
        <h3 style="padding:0">7 kere dokundun...</h3>
        <p style="font-size:17px">Yedi, benim doğum günüm: 7 Kasım. Bu sırrı bulduğuna göre bir anlaşma yapalım: O gün bana ilk mesajı sen atacaksın. Saat 00:00'da, Bakü saatiyle. (Yani ben o sırada 23:00'te bekliyor olacağım.)</p>
        <p class="hand" style="font-size:24px;color:var(--rose-deep)">— ${K.esc(C.myName)}</p></div>`,
    });
  }
  function initKeys() {
    let buf = '';
    const eggs = {
      [K.norm(C.herName)]: () => {
        K.fx.rain({ count: 90 });
        K.fx.toast(`<b>Gizli kapı!</b> Adını yazınca kale kalplerle doluyor.`, { icon: A.icon('heart') });
      },
      [K.norm(C.myNick)]: () => {
        K.audio.sfx.success();
        K.fx.toast(`<b>${K.esc(C.myNick)}:</b> seni seviyorum <span style="color:var(--mint-deep);font-weight:700">(+155)</span>`, { icon: A.icon('pencil') });
      },
      [K.norm(C.friendName)]: () => {
        K.audio.sfx.sparkle();
        K.fx.confetti({ count: 60, shapes: ['star', 'spark'], colors: ['#8FD3FF', '#C9B6FF', '#FFFFFF', '#FFD34E'] });
        K.fx.toast(`<b>Peri ${K.esc(C.friendName)}'e selam!</b> O olmasa bu kale olmazdı.`, { icon: A.icon('star') });
      },
      kitty: () => {
        peekKitty();
      },
      angela: () => {
        K.audio.sfx.meow(1.2);
        K.fx.toast('<b>Angela:</b> Beni mi çağırdın? Odamda seni bekliyorum.', { icon: A.icon('angela') });
      },
    };
    document.addEventListener('keydown', (e) => {
      if (e.target.closest('input, textarea, [contenteditable]') || e.key.length !== 1) return;
      buf = (buf + e.key.toLocaleLowerCase('tr')).slice(-12);
      const n = K.norm(buf).replace(/ /g, '');
      for (const word in eggs) {
        if (n.endsWith(word)) {
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

  /* ---------------- Kapı (giriş) ---------------- */
  function gate(done) {
    const first = !K.store.get('gatePassed', false);
    const g = K.el(`<div class="gate" id="gate">
      <div class="gate-curtain l"></div><div class="gate-curtain r"></div><div class="gate-valance"></div>
      <div class="gate-stage">
        <p class="gate-eyebrow">Boğaz'dan Hazar'a bir Hello Kitty masalı</p>
        <h1 class="gate-title">${first ? `Prenses ${K.esc(C.herName)}'e` : 'Hoş geldin'}</h1>
        <div class="gate-kitty">${A.kitty({ crown: true, cls: 'gate-kitty-svg', label: 'Kapıdaki Hello Kitty' })}
          <button class="gate-bow no-burst" id="gateBow" aria-label="Kitty'nin fiyonkuna dokun"><span class="pulse"></span></button>
        </div>
        <p class="gate-hint" id="gateHint">${first ? 'Kalenin anahtarı Kitty\'nin <b>fiyonkunda</b>. Fiyonka dokun.' : `Kitty seni tanıdı, prenses. Kapıyı açmak için <b>fiyonkuna</b> dokun.`}</p>
        <form class="gate-quiz" id="gateQuiz" hidden autocomplete="off">
          <label for="gateAnswer">${K.esc(C.gateQuestion)}</label>
          <div class="row"><input class="input" id="gateAnswer" name="gateAnswer" type="text" placeholder="Cevabını yaz" autocapitalize="off" spellcheck="false"><button class="btn red" type="submit">Aç</button></div>
          <p class="gate-msg" id="gateMsg" aria-live="polite">Kale kapısı sadece gerçek prensese açılır.</p>
        </form>
      </div>
    </div>`);
    document.body.appendChild(g);
    document.body.classList.add('gate-open');
    const kit = K.$('.gate-kitty-svg', g);
    let tries = 0;
    let opened = false;

    const open = () => {
      if (opened) return;
      opened = true;
      K.store.set('gatePassed', true);
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
    K.$('#gateBow', g).addEventListener('click', () => {
      K.audio.ensure();
      if (K.audio.music.wanted()) K.audio.music.start();
      K.audio.sfx.sparkle();
      kit.classList.remove('wiggle');
      requestAnimationFrame(() => kit.classList.add('wiggle'));
      const r = K.$('#gateBow', g).getBoundingClientRect();
      K.fx.burst(r.left + r.width / 2, r.top + r.height / 2, { count: 16, power: 6 });
      if (!first || g.classList.contains('asked')) {
        if (!first) open();
        return;
      }
      g.classList.add('asked');
      K.$('#gateHint', g).hidden = true;
      const q = K.$('#gateQuiz', g);
      q.hidden = false;
      setTimeout(() => K.$('#gateAnswer', g).focus(), 100);
    });
    K.$('#gateQuiz', g).addEventListener('submit', (e) => {
      e.preventDefault();
      const v = K.norm(K.$('#gateAnswer', g).value);
      const ok = C.gateAnswers.some((a) => v.includes(K.norm(a))) || v.replace(/ /g, '') === K.norm(C.myNick);
      const msg = K.$('#gateMsg', g);
      if (ok) {
        msg.classList.remove('err');
        msg.textContent = 'Kitty seni tanıdı! Kapı açılıyor...';
        open();
        return;
      }
      tries++;
      K.audio.sfx.fail();
      g.classList.remove('shake');
      void g.offsetWidth;
      g.classList.add('shake');
      msg.classList.add('err');
      msg.textContent =
        tries === 1
          ? 'Hmm, Kitty emin olamadı. Bir daha dene.'
          : tries === 2
          ? 'İpucu: Hem gartic.io\'da hem Instagram\'da... bir peri.'
          : `Son ipucu: ${C.gateAnswers[0].charAt(0).toLocaleUpperCase('tr')}${' _'.repeat(C.gateAnswers[0].length - 1)} (Türkçede "ırmak" demek)`;
    });
  }

  /* ---------------- Başlat ---------------- */
  function boot() {
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
    const dayCount = visits();
    setInterval(tick, 1000);
    setInterval(() => {
      greeting();
      dailyBits();
    }, 60000);
    // Sekme ya da uygulama geri açılınca müzik/tarih tazelensin
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
    gate(() => {
      K.stickers.award('ilk-adim');
      timeStickers(dayCount);
      route();
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
