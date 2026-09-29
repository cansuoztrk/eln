/* Oda: 21:21 — her akşam Bakü saatiyle 21:21'de (İstanbul 20:21) iki dakikalık bir pencere açılır.
   İkisi de o pencerede kalbe basarsa gökyüzüne bir yıldız eklenir; yıldızlar birikip takımyıldızlara dönüşür (her 7 yıldız bir takımyıldız).
   Pencere açıkken kalenin her yerinde alttan bir kalp çıkar. Bulutla. */
(function () {
  'use strict';
  const K = window.K;
  const A = K.art;
  const D = window.ELN;
  const C = D.config;
  const T = K.time;

  let root, rows = [], tick = null;
  const DK = () => D.dakika || { intro: [], names: [] };
  const mine = () => (K.isOwner() ? 'me' : 'her');
  // Pencere: Bakü 21:21:00 – 21:22:59
  const inWindow = () => {
    const p = T.baku();
    return p.h === 21 && (p.mi === 21 || p.mi === 22);
  };
  const minsTo = () => {
    const p = T.baku();
    let m = 21 * 60 + 21 - (p.h * 60 + p.mi);
    if (m < 0) m += 1440;
    return m;
  };
  // Gün, basıldığı anda Bakü takvimine göre yazılır (eski kayıtlarda zamandan hesaplanır)
  const dayOf = (r) => (r.data && r.data.day) || T.key(T.baku(new Date(r.at)));
  const pressedBy = (day, who) => rows.some((r) => dayOf(r) === day && r.who === who);
  const stars = () => Array.from(new Set(rows.map(dayOf))).filter((d) => pressedBy(d, 'her') && pressedBy(d, 'me')).sort();
  const halves = () => Array.from(new Set(rows.map(dayOf))).filter((d) => !(pressedBy(d, 'her') && pressedBy(d, 'me'))).length;

  /* ---------- Gökyüzü ---------- */
  function sky() {
    const st = stars();
    const names = DK().names || [];
    const groups = [];
    for (let i = 0; i < st.length; i += 7) groups.push(st.slice(i, i + 7));
    const W = 320, H = 200;
    const pts = [];
    groups.forEach((g, gi) => {
      const rnd = K.rng(gi * 97 + 13);
      const cx = 50 + ((gi * 83) % 220), cy = 45 + ((gi * 57) % 110);
      let x = cx, y = cy;
      g.forEach((d, k) => {
        x = K.clamp(x + (rnd() * 36 - 18), 12, W - 12);
        y = K.clamp(y + (rnd() * 30 - 15), 12, H - 12);
        pts.push({ x, y, g: gi, k, d });
      });
    });
    const lines = pts.filter((p) => p.k > 0).map((p) => {
      const prev = pts.find((q) => q.g === p.g && q.k === p.k - 1);
      return `<line x1="${prev.x.toFixed(1)}" y1="${prev.y.toFixed(1)}" x2="${p.x.toFixed(1)}" y2="${p.y.toFixed(1)}"/>`;
    });
    const labels = groups.map((g, gi) => {
      const first = pts.find((p) => p.g === gi && p.k === 0);
      return g.length === 7 && first ? `<text x="${first.x.toFixed(1)}" y="${(first.y - 9).toFixed(1)}" class="dk-name">${K.esc(names[gi % names.length] || '')}</text>` : '';
    });
    return `<svg class="dk-sky" viewBox="0 0 ${W} ${H}" role="img" aria-label="${st.length} yıldızlı gökyüzü">
      <rect width="${W}" height="${H}" rx="16" fill="#171133"/>
      ${Array.from({ length: 60 }, (_, i) => `<circle cx="${(i * 97) % W}" cy="${(i * 53) % H}" r="${0.4 + (i % 3) * 0.3}" fill="#fff" opacity=".35"/>`).join('')}
      <g class="dk-lines">${lines.join('')}</g>
      ${pts.map((p) => `<g transform="translate(${p.x.toFixed(1)} ${p.y.toFixed(1)})"><circle r="6" fill="#FFF4C7" opacity=".15"/><path d="M0 -4.5 L1.3 -1.3 L4.5 0 L1.3 1.3 L0 4.5 L-1.3 1.3 L-4.5 0 L-1.3 -1.3 Z" fill="#FFF4C7"><title>${T.fmt(p.d)}</title></path></g>`).join('')}
      ${labels.join('')}
      ${st.length ? '' : `<text x="${W / 2}" y="${H / 2}" text-anchor="middle" class="dk-empty">Gökyüzü henüz boş. İlk yıldız 21:21'de.</text>`}
    </svg>`;
  }

  function render() {
    if (!root) return;
    const today = T.todayKey();
    const me = pressedBy(today, mine());
    const other = pressedBy(today, mine() === 'me' ? 'her' : 'me');
    const open = inWindow();
    K.$('#dkSky', root).innerHTML = sky();
    const m = minsTo();
    K.$('#dkNow', root).innerHTML = open
      ? me
        ? `<b>${other ? K.esc(DK().both || '') : K.esc(DK().alone || '')}</b>`
        : `<b>Pencere açık!</b> Şimdi bas.`
      : me && other
      ? `<b>Bugünün yıldızı yandı.</b> Yarın 21:21'de yine.`
      : `Sıradaki pencere: Bakü 21:21 · İstanbul 20:21 · <b>${m >= 60 ? `${Math.floor(m / 60)} sa ${m % 60} dk` : `${m} dk`}</b> sonra`;
    const btn = K.$('#dkBtn', root);
    btn.disabled = !open || me;
    btn.classList.toggle('live', open && !me);
    K.$('#dkStats', root).textContent = `${stars().length} yıldız · ${halves()} yarım yıldız`;
  }

  async function press() {
    if (!inWindow() || pressedBy(T.todayKey(), mine())) return;
    const r = await K.cloud.add('dakika', { day: T.todayKey() });
    if (!r) return K.fx.toast('Gönderilemedi. İnterneti kontrol et.');
    K.audio.sfx.chime();
    K.vibrate([40, 60, 40]);
    K.cloud.send('dakika', {});
    const bothNow = pressedBy(T.todayKey(), 'her') && pressedBy(T.todayKey(), 'me');
    if (bothNow) {
      K.fx.confetti({ count: 120, shapes: ['star'], colors: ['#FFF4C7', '#FFD34E', '#FF8FB8'] });
      K.stickers.award('dakika');
    }
    render();
    floater();
  }

  // Pencere açıkken kalenin her yerinde alttan çıkan kalp
  let fl = null;
  function floater() {
    const want = K.cloud && K.cloud.enabled && D.dakika && inWindow() && !pressedBy(T.todayKey(), mine()) && K.activeRoom !== 'dakika';
    if (want && !fl) {
      fl = K.el(`<button class="dk-float no-burst" aria-label="21:21 kalbine bas">${A.ui('heart')}<span>21:21</span></button>`);
      fl.addEventListener('click', press);
      document.body.appendChild(fl);
    } else if (!want && fl) {
      fl.remove();
      fl = null;
    }
  }

  K.on('cloud', async (on) => {
    if (!on) return;
    rows = await K.cloud.list('dakika', 1000);
    K.cloud.on('dakika', (r) => {
      if (rows.some((x) => x.id === r.id)) return;
      rows.push(r);
      if (r.who !== mine()) {
        const both = pressedBy(T.todayKey(), 'her') && pressedBy(T.todayKey(), 'me');
        K.fx.toast(both ? `<b>Aynı dakikada!</b> Gökyüzüne bir yıldız eklendi.` : `<b>${K.esc(K.otherName())} 21:21'de kalbe bastı.</b> Senin kalbin bekleniyor.`, { icon: A.icon('star'), duration: 6000 });
        if (both) K.fx.confetti({ count: 80, shapes: ['star'] });
      }
      if (K.activeRoom === 'dakika') render();
    });
    clearInterval(tick);
    tick = setInterval(() => {
      floater();
      if (K.activeRoom === 'dakika') render();
    }, 5000);
    floater();
  });

  K.room({
    id: 'dakika',
    wing: 'kalp',
    title: '21:21',
    sub: 'Her akşam aynı dakikada bir kalp',
    icon: 'star',
    color: '#E0DBFF',
    hidden: () => !D.dakika || !K.cloud || !K.cloud.enabled,
    badge: () => (inWindow() ? 'Şimdi!' : `${stars().length} yıldız`),
    init(el) {
      root = el;
      el.innerHTML = `
        <div class="room-intro">${K.paras(DK().intro)}</div>
        <div id="dkSky"></div>
        <div class="dk-box">
          <button class="dk-btn no-burst" id="dkBtn" type="button" aria-label="Kalbe bas">${A.ui('heart')}<span>21:21</span></button>
          <p class="dk-now" id="dkNow"></p>
          <p class="muted small" id="dkStats"></p>
        </div>`;
      K.$('#dkBtn', el).addEventListener('click', press);
    },
    enter() {
      render();
      floater();
    },
    leave() {
      setTimeout(floater, 0);
    },
  });
})();
