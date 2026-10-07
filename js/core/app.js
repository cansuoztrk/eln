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
    { id: 'sahip', title: 'Kale Sahibi', sub: 'Bunu sadece sen görüyorsun: canlı posta, cevaplar, fotoğraflar ve ayarlar', color: '#4A2138', icon: 'key' },
    { id: 'mevsim', title: 'Bu Günlere Özel', sub: 'Sadece bu günlerde açık olan odalar. Kaçırma!', color: '#8F73E6', icon: 'star' },
    { id: 'zaman', title: 'Zaman Kanadı', sub: 'Kilerdeki kapı, yedi günlük bir zaman yolculuğu ve 22 saatte uçan güvercinler', color: '#B07A4F', icon: 'hourglass' },
    { id: 'anilar', title: 'Anılar Kanadı', sub: 'Masalımız, sohbetlerimiz, Bakü\'deki izlerin, portrelerin, o gecenin gökyüzü ve bizim şarkımız', color: '#F0578F', icon: 'book' },
    { id: 'kalp', title: 'Kalp Kanadı', sub: 'Mektuplar, sesim, telsizimiz, sebepler, zaman kapsülü ve henüz yaşanmamış o ilk sarılma', color: '#E3174D', icon: 'heart' },
    { id: 'oyun', title: 'Oyun Kanadı', sub: 'gartic, Angela, Bakü\'ye uçuş, film gecesi, gökyüzü ve müzik kutusu', color: '#3FA37A', icon: 'palette' },
    { id: 'hazine', title: 'Hazine Kanadı', sub: 'Gazete, günün sorusu, özetimiz, mesafe, sınıf, hayaller, kuponlar, özel günler ve çıkartmalar', color: '#C98A12', icon: 'crown' },
  ];

  /* ---------------- Üst çubuk + ana salon + oda kabuğu ---------------- */
  function renderShell() {
    const app = document.getElementById('app');
    app.innerHTML = `
      <header class="topbar">
        <button class="brand" id="brand" aria-label="Ana salona dön">${A.kitty({ cls: 'brand-kitty', label: 'Kitty' })}<span class="brand-name">${K.esc(C.herName)}'in Krallığı</span>${K.isOwner() ? '<span class="owner-badge">Kale sahibi</span>' : ''}</button>
        <div class="top-actions">
          <a class="icon-btn mail-btn" href="#mektuplar" id="mailBtn" hidden aria-label="Yeni mektup var">${A.icon('letter')}<span class="count" id="mailCount">1</span></a>
          <a class="icon-btn" href="#album" aria-label="Pul Albümü">${A.icon('sticker')}<span class="count" id="topStickers">0</span></a>
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
          <div class="season" id="season"></div>
          <div class="rising">${Array.from({ length: 9 }, (_, i) => `<i style="left:${8 + i * 10.5}%;--d:${(i * 1.7) % 9}s;--x:${(i % 3) - 1}"></i>`).join('')}</div>
        </div>
        <div class="wrap hero-text">
          <p class="hero-clock"><span>${K.esc(C.herCity)} <b id="hBaku">--:--</b></span><span aria-hidden="true">·</span><span>${K.esc(C.myCity)} <b id="hIst">--:--</b></span></p>
          <h1 class="hero-greet"><span class="greet-word" id="greetWord">Merhaba</span><span class="greet-name">Prenses ${K.esc(C.herPet || C.herName)}</span></h1>
          <p class="hero-sub" id="greetSub"></p>
          <a class="news-chip" id="newsChip" href="#gazete" hidden>${A.icon('news')}<span>Kitty Gazetesi kapına geldi</span></a>
          <a class="here-chip" id="hereChip" href="#birlikte" hidden><i></i><span></span></a>
          <a class="where-chip" id="whereChip" href="#takvim" hidden>${A.icon('week')}<span></span></a>
        </div>
        <div class="hero-scene">
          <div class="scene-tower">${A.kizKulesi()}<span class="city-tag">${K.esc(C.myCity)} · <i>${K.esc(C.myPet || C.myNick)}</i></span></div>
          <div class="scene-center">
            ${A.garland()}
            <button class="hero-kitty" id="heroKitty" aria-label="Kitty'ye dokun">${A.kitty({ crown: true, cls: 'hk' })}</button>
            <div class="kitty-say" id="kittySay" hidden></div>
            <div class="kitty-ear" id="kittyEar" hidden></div>
          </div>
          <div class="scene-tower">${A.qizQalasi()}<span class="city-tag">${K.esc(C.herCity)} · <i>${K.esc(C.herPet || C.herNick)}</i></span></div>
          <div class="scene-sea" aria-hidden="true"></div>
        </div>
      </section>
      <section class="wrap stories" id="stories" hidden></section>
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
          <article class="card lily-card" id="lilyCard" hidden></article>
          <article class="card q-card" id="qCard" hidden>
            <p class="card-eyebrow">Günün sorusu</p>
            <p class="q-text" id="qText"></p>
            <form class="q-form" id="qForm" autocomplete="off">
              <textarea class="textarea" id="qAns" name="qAns" rows="2" maxlength="400" placeholder="Cevabın bana gelecek..."></textarea>
              <button class="btn small" type="submit">${A.ui('send')} Gönder</button>
            </form>
            <div class="q-done" id="qDone" hidden></div>
            <a class="q-more" href="#sorular">Bütün sorular ve cevapların</a>
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
      <section class="wrap install" id="install" hidden></section>
      <section class="wrap sec castle">
        <h2 class="sec-title">Kalenin <span class="script">kanatları</span></h2>
        <p class="sec-sub" id="castleSub">Bazı kapılar sadece özel günlerde, bazıları sadece gece açılıyor, biri de iyi saklanmış. Acele etme; bu kale her gün biraz değişiyor.</p>
        <div class="kmap-wrap" id="castleMap"></div>
        <div class="shelf-quick" id="shelfQuick"></div>
        <div id="wings"></div>
      </section>
      <footer class="foot">
        <div class="foot-tags"><span class="gtag">${K.esc(C.herPet || C.herNick)}</span><span class="foot-heart" aria-hidden="true">♥</span><span class="gtag">${K.esc(C.myPet || C.myNick)}</span></div>
        <p>Bu masal ${T.fmt(C.metDate)}'te bir Instagram grubunda başladı.<br>Devamını her gün birlikte yazıyoruz.</p>
        <div class="foot-theme" id="footTheme"></div>
        <p class="foot-small">Bu kaleye <b id="visitCount">1</b>. gelişin · <a href="#album">Çıkartmalar <b id="footStickers">0</b>/${K.stickers.total}</a></p>
        <button class="paw-secret no-burst" id="pawSecret" aria-label="Minicik bir pati izi">${A.icon('paw')}</button>
        <button class="foot-lock no-burst" type="button" id="footLock">Bu cihazda kapıyı kilitle</button>
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
  // Kanatların kısa adları (haritadaki kuleler için)
  const SHORT = { sahip: 'Sahip', mevsim: 'Özel Günler', zaman: 'Zaman', anilar: 'Anılar', kalp: 'Kalp', oyun: 'Oyun', hazine: 'Hazine' };
  const wingRooms = (w) => K.rooms.filter((r) => (r.wing || 'hazine') === w.id && visible(r));
  K.WINGS = WINGS;
  K.wingRooms = (id) => wingRooms(WINGS.find((w) => w.id === id) || { id });
  function shelfDoors(rooms, visited) {
    // Hareket olan (rozetli) kapılar öne
    const hot = rooms.filter((r) => !r.secret && visited[r.id] && r.badge && r.badge());
    return hot.concat(rooms.filter((r) => !hot.includes(r)));
  }
  function renderDoors() {
    const visited = K.store.get('visited', {});
    const open = K.store.get('shelfOpen', {});
    const wings = WINGS.filter((w) => wingRooms(w).length);
    K.$('#wings').innerHTML = wings
      .map((w) => {
        const rooms = wingRooms(w);
        const fresh = rooms.filter((r) => !visited[r.id]).length;
        const isOpen = open[w.id] || rooms.length <= 2;
        return `<section class="wing shelf ${isOpen ? 'open' : ''}" id="wing-${w.id}" style="--wing:${w.color}">
        <div class="wing-head">
          <h3 class="wing-ribbon"><span class="wing-ic">${A.icon(w.icon)}</span><span>${K.esc(w.title)}</span></h3>
          <p class="wing-sub">${K.esc(w.sub)}</p>
        </div>
        <div class="shelf-top"><span class="shelf-n">${rooms.length} oda${fresh ? ` · <b>${fresh} yeni</b>` : ''}</span>${rooms.length > 2 ? `<button type="button" class="shelf-all" data-shelf="${w.id}" aria-expanded="${isOpen}">${isOpen ? 'Sıraya diz' : 'Hepsini göster'}</button>` : ''}</div>
        <nav class="doors ${isOpen ? '' : 'row'}" aria-label="${K.esc(w.title)}">${shelfDoors(rooms, visited).map((r) => doorHTML(r, visited)).join('')}</nav>
      </section>`;
      })
      .join('');
    // Hızlı raflar: son girdiklerin ve henüz girmediklerin
    const last = K.store.get('lastVisit', {});
    const all = K.rooms.filter((r) => visible(r) && !r.secret);
    const recent = all.filter((r) => last[r.id]).sort((a, b) => last[b.id] - last[a.id]).slice(0, 10);
    const unseen = all.filter((r) => !visited[r.id] && r.id !== 'panel');
    const q = [];
    if (recent.length >= 3) q.push(['Son girdiklerin', recent, 'recent']);
    if (unseen.length && unseen.length < all.length) q.push([`Henüz girmediklerin · ${unseen.length}`, unseen.slice(0, 14), 'unseen']);
    K.$('#shelfQuick').innerHTML = q.map(([t, rooms, cls]) => `<section class="qshelf ${cls}"><p class="qshelf-t">${K.esc(t)}</p><nav class="doors row mini">${rooms.map((r) => doorHTML(r, visited)).join('')}</nav></section>`).join('');
    const n = all.length;
    K.$('#castleSub').textContent = `${wings.length} kanat, ${n} oda. Haritada bir kuleye dokun ya da aşağıdaki raflarda gez. Bazı kapılar sadece özel günlerde, bazıları sadece gece açılıyor, biri de iyi saklanmış.`;
    castleMap(wings, visited);
    initTilt();
  }
  /* ---------------- Kale haritası: her kanat bir kule; gökyüzü Bakü saatine göre ---------------- */
  function castleMap(wings, visited) {
    const box = K.$('#castleMap');
    if (!box) return;
    const h = T.baku().h;
    const phase = h >= 20 || h < 6 ? 'night' : h < 8 ? 'dawn' : h >= 17 ? 'dusk' : 'day';
    const W = 1200, base = 392, n = wings.length;
    const gap = (W - 120) / Math.max(1, n);
    const mid = (n - 1) / 2;
    const L = '#4A2138';
    const towers = wings.map((w, i) => {
      const rooms = wingRooms(w);
      const fresh = rooms.filter((r) => !visited[r.id]).length;
      const hot = rooms.filter((r) => visited[r.id] && r.badge && r.badge()).length;
      const x = 60 + gap * (i + 0.5);
      const tw = Math.min(118, gap * 0.78);
      const th = 150 + (mid - Math.abs(i - mid)) * 26 + (w.id === 'kalp' ? 30 : 0);
      const top = base - th;
      const cols = 2, nw = Math.min(8, rooms.length);
      const wins = Array.from({ length: nw }, (_, k) => {
        const cx = x + (k % cols ? tw * 0.2 : -tw * 0.2);
        const cy = top + 78 + Math.floor(k / cols) * 30;
        if (cy > base - 52) return '';
        const lit = k < fresh ? 'new' : phase === 'night' || phase === 'dusk' ? 'lit' : '';
        return `<path class="km-win ${lit}" d="M${cx - 7} ${cy + 10} V${cy} A7 7 0 0 1 ${cx + 7} ${cy} V${cy + 10} Z"/>`;
      }).join('');
      const merl = Array.from({ length: 5 }, (_, k) => `<rect x="${x - tw / 2 + k * (tw / 4.5) - 1}" y="${top - 12}" width="${tw / 7}" height="14" rx="2" fill="#FFF7FA" stroke="${L}" stroke-width="3"/>`).join('');
      const badge = fresh + hot;
      return `<g class="km-t" data-wing="${w.id}" tabindex="0" role="button" aria-label="${K.esc(w.title)}: ${rooms.length} oda${fresh ? `, ${fresh} yeni` : ''}" style="--wing:${w.color}">
        <path class="km-flag" d="M${x} ${top - 118} L${x + 30} ${top - 110} L${x} ${top - 100} Z" fill="${w.color}" stroke="${L}" stroke-width="2.5" stroke-linejoin="round"/>
        <path d="M${x} ${top - 84} V${top - 120}" stroke="${L}" stroke-width="3" stroke-linecap="round"/>
        <path d="M${x - tw / 2 - 10} ${top - 10} L${x} ${top - 86} L${x + tw / 2 + 10} ${top - 10} Z" fill="${w.color}" stroke="${L}" stroke-width="3" stroke-linejoin="round"/>
        <path d="M${x - tw / 4} ${top - 34} L${x} ${top - 72}" stroke="rgba(255,255,255,.45)" stroke-width="5" stroke-linecap="round"/>
        ${merl}
        <rect class="km-body" x="${x - tw / 2}" y="${top}" width="${tw}" height="${th}" fill="#FFF7FA" stroke="${L}" stroke-width="3"/>
        <rect x="${x - tw / 2}" y="${top}" width="${tw}" height="${th}" fill="${w.color}" opacity=".16"/>
        <circle cx="${x}" cy="${top + 36}" r="24" fill="#fff" stroke="${L}" stroke-width="3"/>
        <svg x="${x - 17}" y="${top + 19}" width="34" height="34" viewBox="0 0 64 64">${A.ICONS[w.icon] || ''}</svg>
        ${wins}
        <path d="M${x - 15} ${base} V${base - 26} A15 15 0 0 1 ${x + 15} ${base - 26} V${base} Z" fill="${L}"/>
        ${badge ? `<g class="km-badge"><circle cx="${x + tw / 2 - 4}" cy="${top - 4}" r="15" fill="#E3174D" stroke="#fff" stroke-width="3"/><text x="${x + tw / 2 - 4}" y="${top + 1}" text-anchor="middle">${badge}</text></g>` : ''}
        <g class="km-lbl"><rect x="${x - 58}" y="${base + 14}" width="116" height="30" rx="15" fill="#fff" stroke="${w.color}" stroke-width="3"/><text x="${x}" y="${base + 34}" text-anchor="middle">${K.esc(SHORT[w.id] || w.title)}</text></g>
      </g>`;
    });
    const stars = phase === 'night' ? Array.from({ length: 40 }, (_, i) => `<circle class="km-star" cx="${(i * 131) % W}" cy="${(i * 47) % 200 + 10}" r="${1 + (i % 3) * 0.6}" style="--d:${(i % 7) * 0.4}s"/>`).join('') : '';
    const moon = A.moonPhase ? A.moonPhase(T.now()) : null;
    const orb = phase === 'night' ? `<circle cx="1060" cy="80" r="34" fill="#FFF2B8"/><circle cx="${1060 + 26 * (1 - (moon ? moon.illum : 0.5))}" cy="72" r="32" fill="#2A2266" opacity="${moon && moon.illum > 0.95 ? 0 : 0.9}"/>` : `<circle class="km-sun" cx="1060" cy="${phase === 'day' ? 76 : 150}" r="40" fill="${phase === 'day' ? '#FFD34E' : '#FFB36B'}"/>`;
    box.innerHTML = `<div class="kmap-scroll"><svg class="kmap ${phase}" viewBox="0 0 ${W} 460" role="group" aria-label="Kalenin haritası">
      <defs><linearGradient id="kmSky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" class="s1"/><stop offset="1" class="s2"/></linearGradient></defs>
      <rect width="${W}" height="460" fill="url(#kmSky)"/>${stars}${orb}
      <g class="km-clouds"><path d="M120 110 q20 -30 50 -10 q30 -26 56 4 q30 0 26 22 h-150 q-10 -14 18 -16 Z" /><path d="M620 70 q18 -26 44 -8 q26 -22 48 4 q26 0 22 18 h-128 q-8 -12 14 -14 Z" /><path d="M860 150 q16 -22 38 -6 q22 -20 42 4 q22 0 18 16 h-110 q-8 -12 12 -14 Z" /></g>
      <path d="M0 330 C180 280 330 300 480 318 C660 340 820 280 1000 300 C1100 312 1160 320 1200 314 V460 H0 Z" class="km-hill1"/>
      <rect x="40" y="${base - 46}" width="${W - 80}" height="46" fill="#FFF1F6" stroke="${L}" stroke-width="3"/>
      ${Array.from({ length: 36 }, (_, k) => `<rect x="${44 + k * 31.6}" y="${base - 58}" width="18" height="14" rx="2" fill="#FFF1F6" stroke="${L}" stroke-width="2.5"/>`).join('')}
      <path d="M0 ${base + 4} C300 ${base - 6} 900 ${base + 14} 1200 ${base} V460 H0 Z" class="km-ground"/>
      ${towers.join('')}
    </svg></div>`;
    const sc = K.$('.kmap-scroll', box);
    const wide = sc.scrollWidth > sc.clientWidth + 4;
    box.classList.toggle('scrollable', wide);
    if (wide) {
      sc.scrollLeft = (sc.scrollWidth - sc.clientWidth) / 2;
      box.insertAdjacentHTML('beforeend', '<p class="kmap-hint">‹ Kaydır · bir kuleye dokun ›</p>');
      setTimeout(() => sc.addEventListener('scroll', () => box.classList.add('moved'), { once: true, passive: true }), 400);
    }
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
    K.$('#noteText').textContent = K.fill((K.noteOverride || {})[T.todayKey()] || K.daily(D.notes));
    dayPhoto();
    dayQuestion();
    kittyEar();
    newsChip();
    mailbox();
    seasons();
    updateCounts();
  }

  /* ---------------- Günün sorusu (cevap onun telefonuna gider) ---------------- */
  function dayQuestion() {
    const card = K.$('#qCard');
    if (!K.questions || !D.questions.length) return;
    const q = K.questions.today();
    card.hidden = false;
    K.$('#qText').textContent = q.text;
    const a = K.questions.answer(q.i);
    K.$('#qForm').hidden = Boolean(a);
    const done = K.$('#qDone');
    done.hidden = !a;
    const other = a && K.questions.other ? K.questions.other(q.i) : '';
    if (a) done.innerHTML = `<p class="hand">"${K.esc(a.a)}"</p>${other ? `<p class="q-other"><b>${K.esc(K.otherName())}:</b> <span class="hand">"${K.esc(other)}"</span></p>` : `<p class="muted small">Cevabın ${K.esc(K.otherName())}'a gitti. Yarın yeni bir soru.</p>`}`;
  }
  function initQuestion() {
    K.$('#qForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const ta = K.$('#qAns');
      const text = ta.value.trim();
      if (!text) return ta.focus();
      const q = K.questions.today();
      await K.questions.save(q.i, text);
      ta.value = '';
      K.audio.sfx.success();
      const r = K.$('#qCard').getBoundingClientRect();
      K.fx.burst(r.left + r.width / 2, r.top + 40, { count: 12, power: 5 });
      dayQuestion();
    });
  }

  /* ---------------- Kitty'nin kulağındaki ses ---------------- */
  function kittyEar() {
    const ear = K.$('#kittyEar');
    if (!K.voice || !K.voice.any()) return (ear.hidden = true);
    const h = T.baku().h;
    const heard = K.voice.heard();
    const today = T.todayKey();
    let id = null;
    if (K.voice.has('ilk-ses') && !heard['ilk-ses']) id = 'ilk-ses';
    else if (h >= 5 && h < 11 && K.voice.has('gunaydin') && heard.gunaydin !== today) id = 'gunaydin';
    else if ((h >= 21 || h < 5) && K.voice.has('iyi-geceler') && heard['iyi-geceler'] !== today) id = 'iyi-geceler';
    else {
      const special = D.voices.find((v) => v.lock && K.voice.has(v.id) && !heard[v.id]);
      if (special) id = special.id;
    }
    ear.hidden = !id;
    if (id) ear.innerHTML = `<button class="ear-chip no-burst" data-voice="${id}"><span class="vb-wave" aria-hidden="true"><i></i><i></i><i></i><i></i></span>Kitty'nin kulağında bir ses var</button>`;
  }
  K.on('voice-heard', () => kittyEar());
  K.on('answered', () => K.$('#qCard') && dayQuestion());

  /* ---------------- Sabah gazetesi ---------------- */
  function newsChip() {
    const h = T.baku().h;
    K.$('#newsChip').hidden = !(D.gazette.headlines.length && h >= 5 && h < 13 && K.store.get('newsRead') !== T.todayKey());
  }

  /* ---------------- Posta kutusu: sonradan eklenen mektuplar ---------------- */
  function mailbox(quiet) {
    if (K.isOwner()) {
      // Kale sahibi bütün mektupları zaten biliyor
      K.newLetters = [];
      K.$('#mailBtn').hidden = true;
      return;
    }
    const ids = D.letters.map((l) => l.id);
    let known = K.store.get('lettersKnown');
    if (!known) {
      known = ids;
      K.store.set('lettersKnown', known);
    }
    const fresh = ids.filter((id) => !known.includes(id));
    K.newLetters = fresh;
    const b = K.$('#mailBtn');
    b.hidden = !fresh.length;
    K.$('#mailCount').textContent = fresh.length;
    const sig = fresh.join(',');
    if (fresh.length && K.store.get('mailToast') !== sig) {
      K.store.set('mailToast', sig);
      if (quiet) return;
      setTimeout(() => K.fx.toast(`<b>Posta var!</b> Kaleye ${fresh.length} yeni mektup geldi.`, { icon: A.icon('letter'), duration: 5200 }), 3200);
    }
  }
  K.markLettersKnown = () => {
    K.store.set('lettersKnown', D.letters.map((l) => l.id));
    mailbox();
  };

  /* ---------------- Mevsimler: kahraman bölümde yağan şeyler ---------------- */
  function seasonName() {
    const p = T.baku();
    const md = `${K.pad(p.mo)}-${K.pad(p.d)}`;
    if (md === C.herBirthday) return 'party';
    if (p.mo === 12 || p.mo <= 2) return 'winter';
    if (p.mo <= 5) return 'spring';
    if (p.mo <= 8) return 'summer';
    return 'autumn';
  }
  function seasons() {
    const box = K.$('#season');
    const name = seasonName();
    if (box.dataset.s === name) return;
    box.dataset.s = name;
    const r = K.rng(K.hash(name));
    const n = name === 'party' ? 10 : 16;
    box.className = 'season s-' + name;
    box.innerHTML = Array.from({ length: n }, (_, i) => `<i style="left:${(r() * 100).toFixed(1)}%;--d:${(-r() * 14).toFixed(1)}s;--t:${(9 + r() * 9).toFixed(1)}s;--s:${(0.6 + r() * 0.8).toFixed(2)};--x:${Math.round(r() * 80 - 40)}px;--c:${['#FF8FB8', '#FFD34E', '#8FD3FF', '#C9B6FF', '#7ED6A5'][i % 5]}"></i>`).join('');
    document.body.classList.toggle('winter', name === 'winter');
    document.body.classList.toggle('party', name === 'party');
    const moon = A.moonPhase(T.now());
    document.body.classList.toggle('fullmoon', moon.illum > 0.97);
  }

  /* ---------------- Telefona kurulum ---------------- */
  let installEvt = null;
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    installEvt = e;
    installCard();
  });
  function installCard() {
    const box = K.$('#install');
    if (!box) return;
    const standalone = window.matchMedia('(display-mode: standalone)').matches || navigator.standalone;
    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent) && !window.MSStream;
    if (standalone || K.store.get('installHidden') || !(installEvt || ios)) return (box.hidden = true);
    box.hidden = false;
    box.innerHTML = `<div class="install-card">
      <img src="assets/icons/icon-192.png" alt="" width="56" height="56">
      <div><h3>Kaleyi telefonuna ekle</h3>
      <p>${installEvt ? 'Ana ekranında Kitty simgesiyle dursun; tek dokunuşla, tam ekran açılsın.' : 'Safari\'de alttaki <b>Paylaş</b> düğmesine, sonra <b>Ana Ekrana Ekle</b>\'ye dokun. Kitty simgesiyle ana ekranında durur.'}</p></div>
      <div class="install-actions">${installEvt ? '<button class="btn small" id="installGo">Ekle</button>' : ''}<button class="btn ghost small" id="installNo">Sonra</button></div>
    </div>`;
    const go = K.$('#installGo');
    go &&
      go.addEventListener('click', async () => {
        installEvt.prompt();
        const r = await installEvt.userChoice.catch(() => null);
        installEvt = null;
        if (r && r.outcome === 'accepted') K.fx.confetti({ count: 80 });
        box.hidden = true;
      });
    K.$('#installNo').addEventListener('click', () => {
      K.store.set('installHidden', true);
      box.hidden = true;
    });
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
              ${m.voice && K.voice ? K.voice.btn(m.voice, `${C.myPet}'un sesini dinle`) : ''}
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
    const door = K.rooms.find((r) => r.id === id && r.unlockByLink);
    if (door && !visible(door)) {
      door.unlockByLink();
      renderDoors();
    }
    const room = K.rooms.find((r) => r.id === id && visible(r));
    // Kale 4.0: destekleyen tarayıcıda kart ikonundan oda başlığına akış (View Transitions)
    const sw = () => (room ? openRoom(room) : closeRoom());
    if (K.gecis && (room ? K.activeRoom !== room.id : Boolean(K.activeRoom))) K.gecis(sw);
    else sw();
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
    K.emit('room', { id: room.id, el });
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
    // Odadayken gelen bulut kayıtları ana salon kartlarını değiştirmiş olabilir
    renderSpecials();
    window.scrollTo(0, homeScroll);
    // Geçiş animasyonu açıksa oda hemen gizlenir (geçişin "sonra" görüntüsü salon olsun)
    if (document.body.classList.contains('vt')) view.hidden = true;
    else
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
    const castle = K.$('.castle');
    const toWing = (id) => {
      const el = K.$('#wing-' + id);
      if (!el) return;
      K.audio.sfx.whoosh();
      el.scrollIntoView({ behavior: K.reduced ? 'auto' : 'smooth', block: 'start' });
      el.classList.remove('flash');
      void el.offsetWidth;
      el.classList.add('flash');
    };
    castle.addEventListener('keydown', (e) => {
      const t = e.target.closest('.km-t');
      if (t && (e.key === 'Enter' || e.key === ' ')) {
        e.preventDefault();
        K.kesit ? K.kesit.open(t.dataset.wing) : toWing(t.dataset.wing);
      }
    });
    K.toWing = toWing;
    castle.addEventListener('click', (e) => {
      const t = e.target.closest('.km-t');
      if (t) return K.kesit ? K.kesit.open(t.dataset.wing) : toWing(t.dataset.wing);
      const sh = e.target.closest('[data-shelf]');
      if (sh) {
        const open = K.store.get('shelfOpen', {});
        open[sh.dataset.shelf] = !open[sh.dataset.shelf];
        K.store.set('shelfOpen', open);
        K.audio.sfx.tap();
        renderDoors();
        if (!open[sh.dataset.shelf]) K.$('#wing-' + sh.dataset.shelf).scrollIntoView({ block: 'start' });
        return;
      }
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
    // Bu cihazda kapıyı kilitle: kayıtlı anahtar silinir, kapı yeniden cevap sorar (başka biri bu telefonla girdiyse)
    K.$('#footLock').addEventListener('click', (e) => {
      const b = e.currentTarget;
      if (b.dataset.armed !== '1') {
        b.dataset.armed = '1';
        b.textContent = 'Emin misin? Kapı yeniden cevap soracak. Bir daha dokun';
        return;
      }
      K.store.del('vault');
      location.hash = '';
      location.reload();
    });
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
      out.push({ icon: 'cake', title: `İyi ki doğdun, Prenses ${C.herPet}!`, text: 'Bugün senin günün. Doğum Günü Sarayı açıldı: 23 hediye kutusu, mumlarını bekleyen bir pasta ve açılmayı bekleyen bir mektup.', room: 'saray', big: true });
    if (md === C.togetherDate.slice(5) && years > 0)
      out.push({ icon: 'heart', title: `Mutlu ${years}. yıldönümümüz!`, text: `Tam ${years} yıl önce bugün masalımızın adı kondu. Mektuplar odasında yıldönümü mektubun açıldı.`, room: 'mektuplar', big: true });
    else if (p.d === +C.togetherDate.slice(8) && T.monthsTogether() > 0 && !K.yirmibir)
      out.push({ icon: 'story', title: `Bugün ${T.monthsTogether()}. ayımız!`, text: 'Her ayın 21\'i bizim küçük bayramımız. Bu ayın özeti hazır; bir hikâye gibi izle.', room: 'ozet' });
    if (C.notesDate && md === C.notesDate.slice(5) && p.y > +C.notesDate.slice(0, 4))
      out.push({ icon: 'note', title: 'Not duvarının yıldönümü', text: `${p.y - +C.notesDate.slice(0, 4)} yıl önce bugün ${C.herCity}'de bir duvara ikimizin adını yazdın. Daha sevgili bile değildik.`, room: 'izler', big: true });
    if (md === C.myBirthday)
      out.push({ icon: 'party', title: `Bugün ${C.myName}'nın doğum günü!`, text: 'Ters Kale açık: Ona kendi kartını hazırla ve gönder. Mektuplar odasında da senin için bir mektup açıldı.', room: 'ters', big: true });
    else if (T.nextAnnual(C.myBirthday).days <= 7)
      out.push({ icon: 'party', title: `${T.nextAnnual(C.myBirthday).days} gün sonra ${C.myName}'nın doğum günü`, text: 'Kale bu hafta ters döndü: Bu sefer sürprizi sen hazırlıyorsun. Ters Kale\'ye gir, ona bir kart tasarla.', room: 'ters' });
    if (md === C.metDate.slice(5) && p.y > +C.metDate.slice(0, 4))
      out.push({ icon: 'letter', title: 'Tanışma yıldönümümüz!', text: `${p.y - +C.metDate.slice(0, 4)} yıl önce bugün aynı gruba eklendik. Kış Takvimi\'nin ilk kapısı ve bir mektup seni bekliyor.`, room: 'kis', big: true });
    else if (p.mo === 12 && p.d > 6) out.push({ icon: 'snow', title: 'Kış Takvimi\'nde bugünün kapısı açıldı', text: 'Her gün bir kapı, yılın son gününe kadar.', room: 'kis' });
    const moon = A.moonPhase(T.now());
    if (moon.illum > 0.97)
      out.push({ icon: 'moon', title: 'Bu gece dolunay', text: 'Başını kaldır ve aya bak. Aynı ay İstanbul\'dan da görünüyor. Mektuplar odasında dolunay mektubun açıldı.', room: 'mektuplar', action: 'moon' });
    if (md === '02-14') out.push({ icon: 'heart', title: 'Sevgililer Günü', text: 'Bugün sevgililer günüymüş. Bizim için her gün öyle ama yine de kutlu olsun.', room: 'son' });
    if (md === '01-01') out.push({ icon: 'star', title: 'Mutlu yıllar!', text: 'Yeni yılın ilk mesajı senin olsun. Bu yıl ilk sarılmamızın yılı olsun.', room: 'ilk-sarilma' });
    if (md === '11-01') out.push({ icon: 'bow', title: 'Bugün Hello Kitty\'nin doğum günü!', text: 'Kitty White bugün bir yaş daha büyüdü. Puantiyeli fiyonkunu ona ithaf et.', room: 'album' });
    // Odaların eklediği günlük kartlar (sınav günü gibi; bulut verisi gelince yeniden çizilir)
    const extra = [];
    (K.specialHooks || []).forEach((fn) => {
      try {
        extra.push(...(fn() || []));
      } catch (e) {}
    });
    out.unshift(...extra);
    return out;
  }
  K.renderSpecials = () => K.$('#special') && renderSpecials();
  function renderSpecials() {
    const list = specials();
    const box = K.$('#special');
    if (!list.length) {
      box.hidden = true;
      return;
    }
    box.hidden = false;
    // Akıllı Ana Salon: kartlar günün saatine ve dokunma alışkanlığına göre dizilir, geridekiler küçülür
    if (K.akilli) {
      const r = K.akilli.rank(list);
      list.length = 0;
      list.push(...r);
    }
    box.innerHTML = list
      .map(
        (s, i) => `<div class="special-card ${s.mini ? 'mini' : ''}" data-sk="${K.esc(s.key || '')}">${A.icon(s.icon)}<div><h3>${K.esc(s.title)}</h3><p>${K.esc(s.text)}</p>
          <div class="special-actions">${s.run ? `<button type="button" class="btn small" data-sp-run="${i}">${K.esc(s.cta || 'Hemen')}</button>` : `<a class="btn small" href="#${s.room}">${K.esc(s.cta || 'Hemen git')}</a>`}${s.action === 'moon' ? `<button class="btn soft small" data-moon>${A.ui('heart')} Şu an aya bakıyorum</button>` : ''}</div></div></div>`
      )
      .join('');
    K.$$('[data-sp-run]', box).forEach((b) => b.addEventListener('click', () => list[+b.dataset.spRun].run()));
    const mb = K.$('[data-moon]', box);
    mb &&
      mb.addEventListener('click', async () => {
        K.stickers.award('aykardesi');
        K.fx.rain({ count: 40, shapes: ['star', 'heart'], colors: ['#FFF4C7', '#FFFFFF', '#C9B6FF'] });
        const ok = await K.notify(`${C.herName} şu an aya bakıyor`, 'Sen de başını kaldır. Aynı ay, iki pencere.', ['crescent_moon']);
        K.fx.toast(ok ? `${K.ek(C.myName, 'e')} haber verildi. O da şimdi aya bakıyor.` : 'Ay ikinizi de görüyor.', { icon: A.icon('moon') });
      });
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
    initQuestion();
    installCard();
    K.fx.ambient();
    renderSpecials();
    if ('serviceWorker' in navigator && location.protocol === 'https:' && !K.previewDate) navigator.serviceWorker.register('sw.js').catch(() => {});
    K.emit('built');
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
  K.on('unlocked', async (data) => {
    if (K.odalar) await K.odalar;
    const { config, ...rest } = data || {};
    Object.assign(C, config || {});
    Object.assign(D, rest);
    if (K.isOwner()) {
      // Kale sahibi kendi telefonuna bildirim göndermesin
      K.notify = async () => false;
      document.body.classList.add('owner');
    }
    buildApp();
  });

  /* ---------------- Bulut: canlı posta, fotoğraflar, ayarlar, varlık ---------------- */
  D.cloudPhotos = [];
  K.noteOverride = {};
  function addLetter(r, fresh) {
    const id = 'c-' + r.id;
    if (D.letters.some((l) => l.id === id)) return;
    const d = r.data;
    D.letters.push({ id, title: d.title, body: d.body || [], sign: d.sign, color: d.color || '#FFE9B8', lock: d.open && T.daysUntil(d.open) > 0 ? { date: d.open } : undefined, live: true, cloudId: r.id });
    if (fresh && !K.isOwner()) {
      K.audio.sfx.chime();
      K.fx.toast(`<b>Posta var!</b> ${K.esc(C.myPet)} az önce bir mektup gönderdi: "${K.esc(d.title)}"`, { icon: A.icon('letter'), duration: 6000 });
    }
  }
  function applyConfig(rows) {
    rows.forEach((r) => {
      if ('firstMeetDate' in r.data) C.firstMeetDate = r.data.firstMeetDate || '';
    });
  }
  K.on('cloud', async (on) => {
    if (!on) return;
    const [letters, photos, cfg, notes] = await Promise.all(['letter', 'photo', 'config', 'note'].map((k) => K.cloud.list(k)));
    letters.forEach((r) => addLetter(r));
    D.cloudPhotos = photos.map((r) => Object.assign({ cloudId: r.id }, r.data));
    applyConfig(cfg);
    notes.forEach((r) => (K.noteOverride[r.data.date] = r.data.text));
    K.cloud.on('letter', (r) => {
      addLetter(r, true);
      mailbox(true);
    });
    K.cloud.on('photo', (r) => D.cloudPhotos.push(Object.assign({ cloudId: r.id }, r.data)));
    K.cloud.on('config', (r) => applyConfig([r]));
    K.cloud.on('note', (r) => (K.noteOverride[r.data.date] = r.data.text));
    K.cloud.on('deleted', ({ id }) => {
      D.letters = D.letters.filter((l) => l.cloudId !== id);
      D.cloudPhotos = D.cloudPhotos.filter((p) => p.cloudId !== id);
    });
    if (!K.activeRoom) renderDoors();
    dailyBits();
  });
  // Panelden yeni bir ses yüklenince Sesim odası ve ses düğmeleri görünür olsun
  K.on('cloud-voice', () => {
    if (K.activeRoom) return;
    renderDoors();
    dailyBits();
  });
  K.on('presence', (here) => {
    const chip = K.$('#hereChip');
    if (!chip) return;
    chip.hidden = !here;
    K.$('span', chip).textContent = K.isOwner() ? `${C.herPet} şu an kalede` : `${C.myPet} şu an kalede`;
    if (here) {
      K.audio.sfx.sparkle();
      K.fx.toast(`<b>${K.esc(K.isOwner() ? C.herPet : C.myPet)} şu an kalede!</b> Birlikte odasında el ele verebilirsiniz.`, { icon: A.icon('hugs'), duration: 5000 });
    }
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
          <button type="button" class="btn soft small gate-faceid" id="gateFaceId" hidden>🔐 Face ID ile aç</button>
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
      if (await restoreP) {
        // "Her açılışta Face ID sorsun" açıksa kapı ancak yüzünü tanıyınca açılır
        if (K.faceid && K.faceid.locked() && !(await K.faceid.verify())) {
          K.$('#gateHint', g).innerHTML = 'Face ID doğrulanamadı. Tekrar denemek için <b>fiyonka</b> dokun.';
          return;
        }
        return open();
      }
      if (!(await K.vault.available())) {
        K.$('#gateHint', g).innerHTML = 'Kale bu şekilde açılamıyor. Siteyi kendi bağlantısından (https ile) aç.';
        return;
      }
      ask();
    });
    // Face ID: tarayıcı verileri silinmiş olsa bile passkey'deki anahtarla aç
    const fb = K.$('#gateFaceId', g);
    if (K.faceid && window.PublicKeyCredential) K.faceid.supported().then((ok) => (fb.hidden = !ok));
    fb.addEventListener('click', async () => {
      const msg = K.$('#gateMsg', g);
      msg.classList.remove('err');
      msg.textContent = 'Kitty yüzüne bakıyor...';
      let ok = false;
      try {
        ok = await K.faceid.unlock();
      } catch (err) {}
      if (ok) {
        msg.textContent = 'Kitty seni tanıdı! Kapı açılıyor...';
        return open();
      }
      msg.classList.add('err');
      msg.textContent = 'Face ID ile açılamadı. Notu yazarak açabilirsin.';
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
