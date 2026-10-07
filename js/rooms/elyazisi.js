/* Oda: El Yazısı — parmağınla kâğıda mektup yazarsın; kale her çizgiyi ne zaman çizdiğinle birlikte kaydeder. O açınca
   mektup sanki o an yazılıyormuş gibi senin elinden çıkar: duraksadığın yerde duraksar, karaladığın kelimeyi bile
   görür (silgi yok, yalnızca baştan başlamak var). Uzun duraksamalar en fazla iki buçuk saniyeye kısalır.
   Kayıtlar: elyazisi {s: [[renk, t0, x, y, dt, x, y, dt...], ...], dur, kagit} · elyazisiokundu {ref}
   Koordinatlar 0–1000 arası (kâğıdın genişliği), yükseklik kâğıt oranıyla 0–1400. */
(function () {
  'use strict';
  const K = window.K;
  const D = window.ELN;
  const C = D.config;
  const T = K.time;

  const mine = () => (K.isOwner() ? 'me' : 'her');
  const other = () => (K.isOwner() ? 'her' : 'me');
  const nameOf = (w) => (w === 'me' ? C.myPet : C.herPet);
  const W = 1000, H = 1400, MAXN = 60000, MAXPAUSE = 2500;
  const MUREKKEP = [['#1f3a8a', 'Mavi'], ['#2b2024', 'Siyah'], ['#c2185b', 'Pembe'], ['#b3123b', 'Kırmızı']];
  const KAGIT = [['cizgili', 'Çizgili'], ['kareli', 'Kareli'], ['duz', 'Düz']];
  let rows = [], okundu = [], root = null, mod = 'liste', kalem = MUREKKEP[0][0], kagit = 'cizgili';
  let strokes = [], t0 = 0, cur = null, n = 0, oynat = null;

  function zemin(g, w, h, tip) {
    g.fillStyle = '#fffaf2';
    g.fillRect(0, 0, w, h);
    g.strokeStyle = tip === 'kareli' ? 'rgba(80,120,200,.18)' : 'rgba(80,120,200,.28)';
    g.lineWidth = 1;
    const step = (w / W) * 70;
    if (tip !== 'duz')
      for (let y = step * 1.6; y < h; y += step) {
        g.beginPath();
        g.moveTo(0, y);
        g.lineTo(w, y);
        g.stroke();
      }
    if (tip === 'kareli')
      for (let x = step; x < w; x += step) {
        g.beginPath();
        g.moveTo(x, 0);
        g.lineTo(x, h);
        g.stroke();
      }
    if (tip === 'cizgili') {
      g.strokeStyle = 'rgba(224,79,122,.35)';
      g.beginPath();
      g.moveTo(w * 0.1, 0);
      g.lineTo(w * 0.1, h);
      g.stroke();
    }
  }
  function boyut(cv) {
    const w = cv.clientWidth || 320, h = (w * H) / W;
    const dpr = Math.min(2, devicePixelRatio || 1);
    cv.width = w * dpr;
    cv.height = h * dpr;
    cv.style.height = h + 'px';
    const g = cv.getContext('2d');
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.lineCap = g.lineJoin = 'round';
    return { g, k: w / W, w, h };
  }
  // Bir çizgiyi (ya da ilk m noktasını) çiz
  function cizgi(g, k, s, m = Infinity) {
    g.strokeStyle = s[0];
    g.lineWidth = Math.max(1.6, 5 * k);
    g.beginPath();
    let c = 0;
    for (let i = 2; i + 1 < s.length && c < m; i += 3, c++) {
      const x = s[i] * k, y = s[i + 1] * k;
      if (i === 2) g.moveTo(x, y), g.lineTo(x + 0.01, y);
      else g.lineTo(x, y);
    }
    g.stroke();
  }
  function hepsi(cv, list, tip) {
    const { g, k, w, h } = boyut(cv);
    zemin(g, w, h, tip);
    list.forEach((s) => cizgi(g, k, s));
  }
  // Zaman çizelgesi: her noktanın gerçek zamanı (uzun duraksamalar kısaltılır)
  function zaman(list) {
    const ev = [];
    let shift = 0, son = 0;
    list.forEach((s, si) => {
      let t = s[1];
      if (t - shift - son > MAXPAUSE) shift = t - son - MAXPAUSE;
      for (let i = 2, c = 0; i + 1 < s.length; i += 3, c++) {
        if (c) t += s[i - 1];
        ev.push([t - shift, si, c + 1]);
      }
      son = t - shift;
    });
    return ev;
  }
  function calistir(cv, r, hiz = 1, bar) {
    oynat && cancelAnimationFrame(oynat);
    const list = r.data.s, ev = zaman(list);
    const { g, k, w, h } = boyut(cv);
    const bitis = ev.length ? ev[ev.length - 1][0] : 0;
    const basla = performance.now();
    const done = new Array(list.length).fill(0);
    let i = 0;
    const kare = (now) => {
      const t = (now - basla) * hiz;
      while (i < ev.length && ev[i][0] <= t) (done[ev[i][1]] = ev[i][2]), i++;
      zemin(g, w, h, r.data.kagit);
      list.forEach((s, si) => done[si] && cizgi(g, k, s, done[si]));
      bar && bar.style.setProperty('--p', bitis ? Math.min(1, t / bitis) : 1);
      if (i < ev.length) oynat = requestAnimationFrame(kare);
      else oynat = null;
    };
    oynat = requestAnimationFrame(kare);
  }
  function liste() {
    const gelen = rows.filter((r) => r.who === other()).sort((a, b) => b.at - a.at);
    const giden = rows.filter((r) => r.who === mine()).sort((a, b) => b.at - a.at);
    const ok = (r) => okundu.some((x) => x.data.ref === r.id);
    return `<div class="row center"><button type="button" class="btn red" data-ey-yaz>✍️ El yazısıyla mektup yaz</button></div>
      <section class="card"><p class="card-eyebrow">${K.esc(K.ek(nameOf(other()), 'den'))} gelenler</p>${gelen.length ? `<div class="ey-zarflar">${gelen.map((r) => `<button type="button" class="ey-zarf ${ok(r) ? 'acik' : ''}" data-ey-ac="${r.id}"><span>${ok(r) ? '✉️' : '💌'}</span><b>${K.esc(T.fmt(new Date(r.at)))}</b><small>${ok(r) ? 'okundu' : 'yeni'} · ${Math.round(r.data.dur / 1000)} sn</small></button>`).join('')}</div>` : '<p class="muted small">Henüz el yazısıyla mektup gelmedi.</p>'}</section>
      ${giden.length ? `<section class="card"><p class="card-eyebrow">Gönderdiklerin</p><div class="ey-zarflar">${giden.map((r) => `<button type="button" class="ey-zarf mini" data-ey-ac="${r.id}"><span>📨</span><b>${K.esc(T.fmt(new Date(r.at)))}</b><small>${ok(r) ? 'okudu ✓' : 'henüz açmadı'}</small></button>`).join('')}</div></section>` : ''}`;
  }
  function render() {
    if (!root || K.activeRoom !== 'elyazisi') return;
    const box = K.$('#eyAna', root);
    if (mod === 'liste') return (box.innerHTML = liste());
    if (mod === 'yaz') {
      box.innerHTML = `<div class="ey-arac"><div class="ey-renk">${MUREKKEP.map(([c, l]) => `<button type="button" class="${c === kalem ? 'on' : ''}" style="--c:${c}" data-ey-renk="${c}" aria-label="${l}"></button>`).join('')}</div>
        <div class="k3-seg">${KAGIT.map(([id, l]) => `<button type="button" class="${id === kagit ? 'on' : ''}" data-ey-kagit="${id}">${l}</button>`).join('')}</div></div>
        <canvas id="eyCv" class="ey-cv" aria-label="Yazı kâğıdı"></canvas>
        <p class="muted small center" id="eyBilgi">Silgi yok: karaladığın kelimeyi o da görecek.</p>
        <div class="row center"><button type="button" class="btn ghost small" data-ey-sil>Baştan</button><button type="button" class="btn ghost small" data-ey-vazgec>Vazgeç</button><button type="button" class="btn red" data-ey-gonder>💌 Gönder</button></div>`;
      const cv = K.$('#eyCv', root);
      hepsi(cv, strokes, kagit);
      bindKalem(cv);
    }
  }
  function bindKalem(cv) {
    const pos = (e) => {
      const b = cv.getBoundingClientRect();
      return [Math.round(((e.clientX - b.left) / b.width) * W), Math.round(((e.clientY - b.top) / b.height) * H)];
    };
    let last = 0, g = null, k = 1;
    cv.addEventListener('pointerdown', (e) => {
      if (n >= MAXN) return K.fx.toast('Kâğıt doldu.');
      e.preventDefault();
      cv.setPointerCapture(e.pointerId);
      if (!t0) t0 = performance.now();
      const now = performance.now();
      const [x, y] = pos(e);
      cur = [kalem, Math.round(now - t0), x, y];
      last = now;
      strokes.push(cur);
      g = cv.getContext('2d');
      k = cv.clientWidth / W;
      cizgi(g, k, cur);
    });
    cv.addEventListener('pointermove', (e) => {
      if (!cur) return;
      const now = performance.now();
      if (now - last < 12) return;
      const [x, y] = pos(e);
      const px = cur[cur.length - 2], py = cur[cur.length - 1];
      if (Math.abs(x - px) + Math.abs(y - py) < 3) return;
      cur.push(Math.round(now - last), x, y);
      last = now;
      n += 3;
      g.strokeStyle = cur[0];
      g.lineWidth = Math.max(1.6, 5 * k);
      g.beginPath();
      g.moveTo(px * k, py * k);
      g.lineTo(x * k, y * k);
      g.stroke();
    });
    const up = () => (cur = null);
    cv.addEventListener('pointerup', up);
    cv.addEventListener('pointercancel', up);
  }
  function oku(r) {
    const benim = r.who === mine();
    const m = K.ui.modal({
      label: 'El yazısı mektup',
      cls: 'ey-modal',
      html: `<p class="card-eyebrow">${K.esc(nameOf(r.who))} · ${K.esc(T.fmt(new Date(r.at), true))}</p><canvas class="ey-cv" id="eyOku"></canvas><div class="ey-bar" id="eyBar"></div>
        <div class="row center"><button type="button" class="btn soft small" data-ey-tekrar>↺ Baştan izle</button><button type="button" class="btn ghost small" data-ey-hizli>⏩ Hızlı</button><button type="button" class="btn ghost small" data-ey-hepsi>Tamamını göster</button></div>`,
      onClose: () => oynat && cancelAnimationFrame(oynat),
    });
    const cv = K.$('#eyOku', m.el), bar = K.$('#eyBar', m.el);
    const go = (h) => calistir(cv, r, h, bar);
    requestAnimationFrame(() => go(1));
    m.el.addEventListener('click', (e) => {
      if (e.target.closest('[data-ey-tekrar]')) go(1);
      if (e.target.closest('[data-ey-hizli]')) go(4);
      if (e.target.closest('[data-ey-hepsi]')) oynat && cancelAnimationFrame(oynat), (oynat = null), hepsi(cv, r.data.s, r.data.kagit), bar.style.setProperty('--p', 1);
    });
    if (!benim && !okundu.some((x) => x.data.ref === r.id)) {
      K.cloud.add('elyazisiokundu', { ref: r.id }).then((o) => o && !okundu.some((x) => x.id === o.id) && okundu.push(o));
      K.ping(`✍️ ${K.meName()} el yazısı mektubunu açtı`, 'Satır satır, senin elinden.', ['writing_hand'], { click: K.roomUrl('elyazisi') });
      K.stickers.award('elyazisioku');
    }
  }
  K.on('cloud', async (ok) => {
    if (!ok) return;
    [rows, okundu] = await Promise.all([K.cloud.list('elyazisi', 100), K.cloud.list('elyazisiokundu', 200)]);
    K.cloud.on('elyazisi', (r) => rows.some((x) => x.id === r.id) || (rows.push(r), mod === 'liste' && render()));
    K.cloud.on('elyazisiokundu', (r) => okundu.some((x) => x.id === r.id) || (okundu.push(r), mod === 'liste' && render()));
  });
  K.room({
    id: 'elyazisi',
    wing: 'anilar',
    title: 'El Yazısı',
    sub: 'Satır satır, elinden',
    icon: 'pencil',
    color: '#FFF8EC',
    hidden: () => !K.cloud || !K.cloud.enabled,
    init(el) {
      root = el;
      el.innerHTML = `<div class="room-intro"><p>Parmağınla bir mektup yaz. O açtığında mektup sanki o an yazılıyormuş gibi, senin elinden satır satır çıkar; duraksadığın yerde duraksar.</p></div><div id="eyAna"></div>`;
      el.addEventListener('click', async (e) => {
        if (e.target.closest('[data-ey-yaz]')) return (mod = 'yaz'), (strokes = []), (t0 = 0), (n = 0), render();
        if (e.target.closest('[data-ey-vazgec]')) return (mod = 'liste'), render();
        if (e.target.closest('[data-ey-sil]')) return (strokes = []), (t0 = 0), (n = 0), render();
        const rk = e.target.closest('[data-ey-renk]');
        if (rk) {
          kalem = rk.dataset.eyRenk;
          return K.$$('[data-ey-renk]', root).forEach((b) => b.classList.toggle('on', b === rk));
        }
        const kg = e.target.closest('[data-ey-kagit]');
        if (kg) return (kagit = kg.dataset.eyKagit), render();
        const ac = e.target.closest('[data-ey-ac]');
        if (ac) return oku(rows.find((r) => r.id === ac.dataset.eyAc));
        const gd = e.target.closest('[data-ey-gonder]');
        if (gd) {
          if (strokes.length < 3) return K.fx.toast('Biraz daha yaz.');
          gd.disabled = true;
          const s = strokes;
          const son = s[s.length - 1];
          let dur = son[1];
          for (let i = 4; i < son.length; i += 3) dur += son[i];
          const r = await K.cloud.add('elyazisi', { s, dur, kagit });
          gd.disabled = false;
          if (!r) return K.fx.toast('Gönderilemedi; biraz daha kısa dene.');
          rows.some((x) => x.id === r.id) || rows.push(r);
          K.stickers.award('elyazisi');
          K.ping(`✍️ ${K.meName()} sana el yazısıyla bir mektup yazdı`, 'Aç; satır satır, onun elinden çıkacak.', ['love_letter'], { click: K.roomUrl('elyazisi') });
          K.fx.confetti({ count: 60, shapes: ['heart'] });
          mod = 'liste';
          strokes = [];
          render();
        }
      });
      addEventListener('resize', () => K.activeRoom === 'elyazisi' && mod === 'yaz' && K.$('#eyCv', root) && hepsi(K.$('#eyCv', root), strokes, kagit));
    },
    enter() {
      render();
    },
    leave() {
      oynat && cancelAnimationFrame(oynat);
    },
  });
  K.elyazisi = { zaman };
})();
