/* Oda: Fotoğraf Kabini — iki şehir, bir şerit. İkisi aynı anda kabindeyken "Birlikte çek": aynı geri sayım,
   aynı pozlar; son kare hep "yarım kalp" (İstanbul sol yarısını, Bakü sağ yarısını yapar, şeritte birleşir).
   Öbürü yoksa yarım şerit bırakılır; o kendi yarısını çekene kadar senin yarın ona gizli kalır.
   Kabindeyken ikiniz birbirinizi küçük bir pencereden (saniyede bir kare) görürsünüz.
   Kayıtlar: pb {sid, seed, theme, filter, day, thumb, shot} (hafif) + pbshot {frames:[4 jpeg]} (ağır, açılınca). */
(function () {
  'use strict';
  const K = window.K;
  const A = K.art;
  const D = window.ELN;
  const C = D.config;
  const T = K.time;

  const PB = () => D.kabin || { intro: [], poses: [], heart: {} };
  const mine = () => (K.isOwner() ? 'me' : 'her');
  const other = () => (K.isOwner() ? 'her' : 'me');
  const nameOf = (w) => (w === 'me' ? C.myPet : C.herPet);
  const THEMES = [
    ['pembe', 'Pembe', { bg: '#FFD0E1', bg2: '#FFE7F0', ink: '#E3174D', soft: '#C7386F' }],
    ['gece', '21:21', { bg: '#241A4A', bg2: '#3A2B6E', ink: '#FFE08A', soft: '#CDB8FF' }],
    ['zambak', 'Zambak', { bg: '#E4F6EC', bg2: '#F5FBF7', ink: '#2F8A63', soft: '#E3174D' }],
    ['kuleler', 'İki Kule', { bg: '#CFEBFF', bg2: '#EEF8FF', ink: '#4A2138', soft: '#1E5AA8' }],
  ];
  const FILTERS = [
    ['dogal', 'Doğal'],
    ['pembe', 'Pembe'],
    ['sb', 'Siyah beyaz'],
  ];
  const FW = 480, FH = 360, FRAME_MS = 4800;
  const DEF_POSES = [
    ['Gülümse', 'Kameraya değil, ona gülümse.'],
    ['Öpücük', 'Ekrana bir öpücük at.'],
    ['Komik surat', 'En komik suratın.'],
    ['El salla', 'Bir şehirden öbürüne el salla.'],
  ];

  let root, rows = [], stream = null, video = null, sess = null, invite = null, incoming = null;
  let theme = K.store.get('pbTheme', 'pembe'), filter = K.store.get('pbFilter', 'dogal');
  let peekT = null, peekSeen = 0, busy = false;

  /* ---------- Şeritler ---------- */
  const strips = () => {
    const by = {};
    rows.forEach((r) => {
      const s = (by[r.data.sid] = by[r.data.sid] || { sid: r.data.sid, at: r.at, seed: r.data.seed, theme: r.data.theme, filter: r.data.filter, day: r.data.day });
      if (!s[r.who]) s[r.who] = r;
      s.at = Math.max(s.at, r.at);
    });
    return Object.values(by).sort((a, b) => b.at - a.at);
  };
  const full = (s) => Boolean(s.me && s.her);
  const waitingForMe = () => strips().filter((s) => !full(s) && s[other()] && !s[mine()]);
  const themeOf = (id) => (THEMES.find((t) => t[0] === id) || THEMES[0])[2];

  function posesFor(seed) {
    const list = PB().poses && PB().poses.length ? PB().poses : DEF_POSES;
    const r = K.rng(seed);
    const p = K.shuffle(list.slice(), r).slice(0, 3);
    const h = PB().heart || {};
    p.push(['Yarım kalp', (mine() === 'me' ? h.me : h.her) || 'Ellerinle kalbin yarısını yap.', true]);
    return p;
  }

  /* ---------- Kamera ---------- */
  async function camOn() {
    if (stream) return true;
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) return false;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: { ideal: 960 }, height: { ideal: 720 } }, audio: false });
    } catch (e) {
      stream = null;
      return false;
    }
    video.srcObject = stream;
    await video.play().catch(() => {});
    startPeek();
    return true;
  }
  function camOff() {
    if (stream) stream.getTracks().forEach((t) => t.stop());
    stream = null;
    if (video) video.srcObject = null;
    clearInterval(peekT);
    peekT = null;
  }
  // Videodan 4:3 kare (önizlemedeki gibi aynalı)
  function grab(w = FW, h = FH, q = 0.74, raw) {
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    const x = c.getContext('2d');
    const vw = video.videoWidth || 640, vh = video.videoHeight || 480;
    const k = Math.max(w / vw, h / vh);
    const sw = w / k, sh = h / k;
    x.translate(w, 0);
    x.scale(-1, 1);
    x.drawImage(video, (vw - sw) / 2, (vh - sh) / 2, sw, sh, 0, 0, w, h);
    x.setTransform(1, 0, 0, 1, 0, 0);
    if (!raw) tint(x, w, h, sess ? sess.filter : filter);
    return c.toDataURL('image/jpeg', q);
  }
  function tint(x, w, h, f) {
    if (f === 'dogal') return;
    const img = x.getImageData(0, 0, w, h);
    const d = img.data;
    for (let i = 0; i < d.length; i += 4) {
      const r = d[i], g = d[i + 1], b = d[i + 2];
      if (f === 'sb') {
        const y = 0.3 * r + 0.59 * g + 0.11 * b;
        const v = K.clamp((y - 128) * 1.18 + 132, 0, 255);
        d[i] = d[i + 1] = d[i + 2] = v;
      } else {
        d[i] = K.clamp(r * 1.04 + 18, 0, 255);
        d[i + 1] = K.clamp(g * 0.95 + 6, 0, 255);
        d[i + 2] = K.clamp(b * 1.0 + 16, 0, 255);
      }
    }
    x.putImageData(img, 0, 0);
  }
  // Galeriden seçilen fotoğrafı 4:3 kareye kırp (kamera yoksa)
  function fileFrame(file) {
    return new Promise((res) => {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        const c = document.createElement('canvas');
        c.width = FW;
        c.height = FH;
        const x = c.getContext('2d');
        const k = Math.max(FW / img.width, FH / img.height);
        const sw = FW / k, sh = FH / k;
        x.drawImage(img, (img.width - sw) / 2, (img.height - sh) / 2, sw, sh, 0, 0, FW, FH);
        tint(x, FW, FH, sess ? sess.filter : filter);
        URL.revokeObjectURL(url);
        res(c.toDataURL('image/jpeg', 0.74));
      };
      img.onerror = () => res(null);
      img.src = url;
    });
  }
  // Dört kareden küçük dikey şerit (galeri için)
  function miniStrip(frames) {
    return new Promise((res) => {
      const c = document.createElement('canvas');
      c.width = 96;
      c.height = 4 * 72 + 3 * 4;
      const x = c.getContext('2d');
      x.fillStyle = '#fff';
      x.fillRect(0, 0, c.width, c.height);
      let n = 0;
      frames.forEach((f, i) => {
        const im = new Image();
        im.onload = im.onerror = () => {
          try {
            x.drawImage(im, 0, i * 76, 96, 72);
          } catch (e) {}
          if (++n === frames.length) res(c.toDataURL('image/jpeg', 0.66));
        };
        im.src = f;
      });
    });
  }

  /* ---------- Canlı: davet, hazır, başla, göz atma ---------- */
  const send = (m) => K.cloud.send('pb', m);
  function startPeek() {
    clearInterval(peekT);
    peekT = setInterval(() => {
      if (!stream || !video || !video.videoWidth || document.hidden || K.activeRoom !== 'kabin') return;
      if (!K.cloud.otherHere()) return;
      send({ t: 'peek', img: grab(120, 90, 0.5, true) });
    }, 1200);
  }
  function onMsg(m) {
    if (!m || m.who === mine()) return;
    if (m.t === 'peek') {
      if (K.activeRoom !== 'kabin' || !root) return;
      peekSeen = Date.now();
      const g = K.$('#pbGhost', root);
      if (g) {
        K.$('img', g).src = m.img;
        g.hidden = false;
      }
      return;
    }
    if (m.t === 'invite') {
      // İkimiz aynı anda davet ettiysek: küçük kimlikli davet kazanır
      if (invite && invite.sid < m.sid) return;
      invite = null;
      incoming = { sid: m.sid, theme: m.theme, filter: m.filter, at: Date.now() };
      if (K.activeRoom === 'kabin') {
        K.audio.sfx.chime();
        controls();
      } else {
        K.fx.toast(`<b>${K.esc(nameOf(m.who))} seni Fotoğraf Kabini'ne çağırıyor.</b> <a href="#kabin">Kabine gir</a>`, { icon: A.icon('camera'), duration: 12000 });
      }
      return;
    }
    if (m.t === 'ready' && invite && invite.sid === m.sid) {
      const cfg = { sid: invite.sid, seed: invite.seed, theme: invite.theme, filter: invite.filter, together: true };
      invite = null;
      send({ t: 'go', sid: cfg.sid, seed: cfg.seed, theme: cfg.theme, filter: cfg.filter, delay: 2600 });
      shoot(cfg, 2600);
      return;
    }
    if (m.t === 'go' && incoming && incoming.sid === m.sid) {
      incoming = null;
      shoot({ sid: m.sid, seed: m.seed, theme: m.theme, filter: m.filter, together: true }, Math.max(600, m.delay - 250));
      return;
    }
    if (m.t === 'cancel') {
      if (incoming && incoming.sid === m.sid) incoming = null;
      if (sess && sess.sid === m.sid && sess.together && sess.phase === 'shoot') {
        K.fx.toast(`${K.esc(nameOf(m.who))} kabinden çıktı. Yarın yarım şerit olarak kaldı.`);
      }
      controls();
    }
  }

  /* ---------- Çekim ---------- */
  async function startTogether() {
    if (!(await camOn())) return noCam();
    const sid = 's' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
    invite = { sid, seed: Math.floor(Math.random() * 1e9), theme, filter, at: Date.now() };
    send({ t: 'invite', sid, theme, filter });
    K.audio.sfx.tap();
    controls();
    setTimeout(() => {
      if (invite && invite.sid === sid) {
        invite = null;
        send({ t: 'cancel', sid });
        K.fx.toast(`${K.esc(nameOf(other()))} cevap vermedi. Yarım şerit bırakabilirsin.`);
        controls();
      }
    }, 60000);
  }
  async function acceptInvite() {
    if (!incoming) return;
    if (!(await camOn())) return noCam();
    send({ t: 'ready', sid: incoming.sid });
    K.$('#pbCtl', root).innerHTML = `<p class="pb-status">Hazırsın. ${K.esc(nameOf(other()))} başlatıyor...</p>`;
  }
  async function startSolo(from) {
    const cfg = from
      ? { sid: from.sid, seed: from.seed, theme: from.theme, filter: from.filter, together: false }
      : { sid: 's' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5), seed: Math.floor(Math.random() * 1e9), theme, filter, together: false };
    if (await camOn()) return shoot(cfg, 1500);
    // Kamera yok: dört fotoğraf seç
    sess = Object.assign({}, cfg, { frames: [], poses: posesFor(cfg.seed), phase: 'pick', timers: [] });
    controls();
  }
  function noCam() {
    K.fx.toast('Kamera açılamadı. Tarayıcı ayarlarından kameraya izin ver; ya da yarım şeridi fotoğraflardan seç.', { duration: 7000 });
    controls();
  }
  function shoot(cfg, delay) {
    if (sess && sess.timers) sess.timers.forEach(clearTimeout);
    sess = Object.assign({}, cfg, { frames: [], poses: posesFor(cfg.seed), phase: 'shoot', timers: [] });
    K.$('#pbStage', root).className = `pb-stage f-${sess.filter}${stream ? ' live' : ''}`;
    film();
    controls();
    const t0 = performance.now() + delay;
    const at = (ms, fn) => sess.timers.push(setTimeout(fn, Math.max(0, t0 + ms - performance.now())));
    overlay('Hazır ol', sess.together ? `${nameOf(other())} da kabinde. Dört kare, aynı anda.` : 'Dört kare. Her karenin bir pozu var.');
    for (let i = 0; i < 4; i++) {
      const b = i * FRAME_MS;
      at(b, () => overlay(`${i + 1}/4 · ${sess.poses[i][0]}`, sess.poses[i][1], sess.poses[i][2]));
      [3, 2, 1].forEach((n, j) => at(b + 1800 + j * 800, () => count(n)));
      at(b + 4200, () => snap(i));
    }
    at(4 * FRAME_MS, finish);
  }
  function overlay(title, text, heart) {
    const o = K.$('#pbOver', root);
    if (!o) return;
    o.innerHTML = `<div class="pb-pose"><b>${K.esc(title)}</b><span>${K.esc(text)}</span></div>${heart ? `<svg class="pb-guide ${mine()}" viewBox="0 0 100 100" aria-hidden="true"><path d="${mine() === 'me' ? 'M100 95 C70 75 8 55 8 32 C8 12 26 4 44 4 C66 4 88 12 100 28' : 'M0 95 C30 75 92 55 92 32 C92 12 74 4 56 4 C34 4 12 12 0 28'}"/></svg>` : ''}`;
    o.hidden = false;
  }
  function count(n) {
    const c = K.$('#pbCount', root);
    if (!c) return;
    c.textContent = n;
    c.classList.remove('go');
    void c.offsetWidth;
    c.classList.add('go');
    K.audio.sfx.tick && K.audio.sfx.tick();
  }
  function snap(i) {
    if (!sess || sess.phase !== 'shoot' || !video) return;
    const fl = K.$('#pbFlash', root);
    fl.classList.remove('go');
    void fl.offsetWidth;
    fl.classList.add('go');
    K.$('#pbCount', root).textContent = '';
    K.audio.sfx.pop();
    K.vibrate(30);
    sess.frames[i] = grab();
    film();
  }
  function film() {
    const f = K.$('#pbFilm', root);
    if (!f) return;
    const fr = sess ? sess.frames : [];
    f.innerHTML = [0, 1, 2, 3].map((i) => (fr[i] ? `<img src="${fr[i]}" alt="${i + 1}. kare">` : `<span>${i + 1}</span>`)).join('');
  }
  async function finish() {
    if (!sess || sess.frames.filter(Boolean).length < 4) return;
    sess.phase = 'upload';
    const o = K.$('#pbOver', root);
    if (o) o.hidden = true;
    controls();
    const s = sess;
    const heavy = await K.cloud.add('pbshot', { frames: s.frames });
    const thumb = await miniStrip(s.frames);
    const row = heavy && (await K.cloud.add('pb', { sid: s.sid, seed: s.seed, theme: s.theme, filter: s.filter, day: T.todayKey(), thumb, shot: heavy.id }));
    if (!row) {
      s.phase = 'failed';
      K.fx.toast('Şerit kaydedilemedi. İnterneti kontrol edip tekrar dene.');
      controls();
      return;
    }
    K.stickers.award('kabin');
    const st = strips().find((x) => x.sid === s.sid);
    K.ping(`${K.meName()} kabinde dört kare çekti`, st && full(st) ? 'Şeridiniz tamamlandı. Fotoğraf Kabini\'nde.' : 'Sana yarım bir şerit bıraktı. Kendi yarını çekince açılacak.', ['camera']);
    sess = null;
    film();
    controls();
    gallery();
    if (st && full(st)) view(st.sid, true);
    else if (s.together) K.fx.toast(`${K.esc(K.ek(nameOf(other()), 'in'))} yarısı geliyor...`, { icon: A.icon('camera') });
    else K.fx.toast(`Yarım şerit bırakıldı. ${K.esc(nameOf(other()))} kendi yarısını çekince açılacak.`, { icon: A.icon('camera'), duration: 6000 });
  }
  async function pickFiles(files) {
    if (!sess || sess.phase !== 'pick') return;
    const list = Array.from(files).slice(0, 4);
    for (const f of list) {
      const fr = await fileFrame(f);
      if (fr && sess.frames.length < 4) sess.frames.push(fr);
    }
    film();
    if (sess.frames.length === 4) finish();
    else controls();
  }

  /* ---------- Şeridi çizme ---------- */
  const loadImg = (src) =>
    new Promise((res) => {
      if (!src) return res(null);
      const im = new Image();
      im.onload = () => res(im);
      im.onerror = () => res(null);
      im.src = src;
    });
  function heartAt(x, cx, cy, s, fill) {
    x.save();
    x.translate(cx, cy);
    x.scale(s / 24, s / 24);
    x.beginPath();
    x.moveTo(0, 7);
    x.bezierCurveTo(-11, -1, -11, -12, -4.5, -12);
    x.bezierCurveTo(-1.5, -12, 0, -9.5, 0, -8);
    x.bezierCurveTo(0, -9.5, 1.5, -12, 4.5, -12);
    x.bezierCurveTo(11, -12, 11, -1, 0, 7);
    x.closePath();
    x.fillStyle = fill;
    x.fill();
    x.restore();
  }
  function bowAt(x, cx, cy, s, fill) {
    x.save();
    x.translate(cx, cy);
    x.scale(s / 40, s / 40);
    x.fillStyle = fill;
    x.strokeStyle = '#2B2024';
    x.lineWidth = 2.4;
    [-1, 1].forEach((d) => {
      x.beginPath();
      x.moveTo(0, 0);
      x.bezierCurveTo(d * 8, -16, d * 26, -16, d * 24, -2);
      x.bezierCurveTo(d * 24, 12, d * 8, 12, 0, 0);
      x.fill();
      x.stroke();
    });
    x.beginPath();
    x.ellipse(0, 0, 6, 5.5, 0, 0, Math.PI * 2);
    x.fill();
    x.stroke();
    x.restore();
  }
  function starAt(x, cx, cy, r, fill) {
    x.beginPath();
    for (let i = 0; i < 10; i++) {
      const a = -Math.PI / 2 + (i * Math.PI) / 5;
      const rr = i % 2 ? r * 0.45 : r;
      x.lineTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr);
    }
    x.closePath();
    x.fillStyle = fill;
    x.fill();
  }
  function lilyAt(x, cx, cy, r, fill) {
    x.save();
    x.translate(cx, cy);
    x.fillStyle = fill;
    for (let i = 0; i < 6; i++) {
      x.rotate(Math.PI / 3);
      x.beginPath();
      x.ellipse(0, -r * 0.55, r * 0.22, r * 0.55, 0, 0, Math.PI * 2);
      x.fill();
    }
    x.beginPath();
    x.arc(0, 0, r * 0.16, 0, Math.PI * 2);
    x.fillStyle = '#FFD34E';
    x.fill();
    x.restore();
  }
  function towers(x, W, y, col) {
    x.save();
    x.fillStyle = col;
    // Kız Kulesi (solda): kaya, gövde, külah
    x.beginPath();
    x.ellipse(150, y, 110, 16, 0, Math.PI, 0);
    x.fill();
    x.fillRect(128, y - 90, 44, 90);
    x.fillRect(116, y - 40, 20, 40);
    x.beginPath();
    x.moveTo(122, y - 90);
    x.lineTo(150, y - 142);
    x.lineTo(178, y - 90);
    x.fill();
    x.fillRect(148, y - 160, 4, 20);
    // Qız Qalası (sağda): silindir ve yan payanda
    x.fillRect(W - 210, y - 150, 80, 150);
    x.beginPath();
    x.moveTo(W - 130, y - 110);
    x.lineTo(W - 100, y - 104);
    x.lineTo(W - 100, y);
    x.lineTo(W - 130, y);
    x.fill();
    for (let i = 0; i < 5; i++) x.fillRect(W - 210 + i * 17, y - 162, 10, 14);
    x.restore();
  }
  async function compose(s, fMe, fHer) {
    await Promise.all(['700 40px Fredoka', '400 88px "Great Vibes"', '700 36px Caveat'].map((f) => (document.fonts ? document.fonts.load(f).catch(() => {}) : null)));
    const th = themeOf(s.theme);
    const W = 1080, PAD = 48, GUT = 24, CW = (W - PAD * 2 - GUT) / 2, CH = CW * 0.75, HEAD = 250, GAP = 22, FOOT = 220;
    const H = HEAD + 4 * CH + 3 * GAP + FOOT;
    const c = document.createElement('canvas');
    c.width = W;
    c.height = H;
    const x = c.getContext('2d');
    const g = x.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, th.bg);
    g.addColorStop(1, th.bg2);
    x.fillStyle = g;
    x.fillRect(0, 0, W, H);
    // Süsler
    const r = K.rng(K.hash(s.sid));
    if (s.theme === 'gece') for (let i = 0; i < 70; i++) starAt(x, r() * W, r() * H, 3 + r() * 7, `rgba(255,236,170,${0.35 + r() * 0.6})`);
    if (s.theme === 'pembe') for (let i = 0; i < 26; i++) heartAt(x, r() * W, r() * H, 14 + r() * 18, 'rgba(255,255,255,0.55)');
    if (s.theme === 'zambak') for (let i = 0; i < 16; i++) lilyAt(x, r() * W, r() * H, 18 + r() * 16, 'rgba(255,255,255,0.8)');
    if (s.theme === 'kuleler') for (let i = 0; i < 20; i++) {
      x.fillStyle = 'rgba(255,255,255,0.7)';
      x.beginPath();
      x.arc(r() * W, r() * HEAD * 0.9, 10 + r() * 16, 0, Math.PI * 2);
      x.fill();
    }
    // Başlık
    x.textAlign = 'center';
    x.fillStyle = th.ink;
    x.font = '400 88px "Great Vibes", cursive';
    x.fillText('Boğaz\'dan Hazar\'a', W / 2, 118);
    if (s.theme === 'pembe') bowAt(x, W / 2, 40, 64, '#E3174D');
    x.font = '700 30px Fredoka, sans-serif';
    x.fillStyle = th.soft;
    const labY = HEAD - 26;
    x.fillText(C.myCity.toLocaleUpperCase('tr-TR'), PAD + CW / 2, labY);
    x.fillText(C.herCity.toLocaleUpperCase('tr-TR'), PAD + CW + GUT + CW / 2, labY);
    // Kareler
    const ims = await Promise.all([].concat(fMe || [null, null, null, null], fHer || [null, null, null, null]).map(loadImg));
    for (let i = 0; i < 4; i++) {
      const y = HEAD + i * (CH + GAP);
      [0, 1].forEach((col) => {
        const px = PAD + col * (CW + GUT);
        x.fillStyle = '#fff';
        x.beginPath();
        x.roundRect ? x.roundRect(px - 8, y - 8, CW + 16, CH + 16, 12) : x.rect(px - 8, y - 8, CW + 16, CH + 16);
        x.fill();
        const im = ims[col * 4 + i];
        if (im) x.drawImage(im, px, y, CW, CH);
        else {
          x.fillStyle = '#F4E8EE';
          x.fillRect(px, y, CW, CH);
          x.fillStyle = '#B58BA1';
          x.font = '700 90px Fredoka, sans-serif';
          x.fillText('?', px + CW / 2, y + CH / 2 + 30);
        }
      });
      // Ortada, kareler arasında küçük kalp (son karede kalp zaten ellerde)
      if (i < 3) heartAt(x, W / 2, HEAD + i * (CH + GAP) + CH + GAP / 2 - 2, 20, th.ink);
    }
    // Alt kısım
    const fy = HEAD + 4 * CH + 3 * GAP;
    if (s.theme === 'kuleler') towers(x, W, H - 20, 'rgba(74,33,56,0.16)');
    x.fillStyle = th.ink;
    x.font = '700 50px Fredoka, sans-serif';
    x.fillText(`${C.myPet}  ♡  ${C.herPet}`, W / 2, fy + 104);
    x.font = '700 38px Caveat, cursive';
    x.fillStyle = th.soft;
    x.fillText(`${T.fmt(s.day || T.todayKey())} · ${K.num(C.distanceKm)} km arayla`, W / 2, fy + 158);
    return c;
  }
  async function framesOf(row) {
    if (!row) return null;
    const cache = (framesOf.c = framesOf.c || {});
    if (cache[row.data.shot]) return cache[row.data.shot];
    const h = await K.cloud.get(row.data.shot);
    const f = h && h.data && h.data.frames;
    if (f) cache[row.data.shot] = f;
    return f || null;
  }

  /* ---------- Görüntüle / kaydet ---------- */
  async function view(sid, fresh) {
    const s = strips().find((x) => x.sid === sid);
    if (!s) return;
    const md = K.ui.modal({
      label: 'Fotoğraf şeridi',
      cls: 'pb-modal',
      html: `<div class="pb-view"><p class="muted small" id="pbLoad">Şerit hazırlanıyor...</p></div>
        <div class="pb-acts" hidden><button type="button" class="btn red" data-pb-save>${A.ui('download')} Kaydet ya da paylaş</button>
        <button type="button" class="btn ghost small" data-pb-del>${A.ui('trash')} Bu şeridi sil</button></div>`,
    });
    const [a, b] = await Promise.all([framesOf(s.me), framesOf(s.her)]);
    const cv = await compose(s, a, b);
    const url = cv.toDataURL('image/jpeg', 0.9);
    K.$('.pb-view', md.body).innerHTML = `<img src="${url}" alt="İki şehirden dört karelik fotoğraf şeridi">`;
    K.$('.pb-acts', md.body).hidden = false;
    if (fresh) {
      K.fx.confetti({ count: 90, shapes: ['heart', 'star'] });
      K.audio.sfx.success();
    }
    md.body.addEventListener('click', async (e) => {
      if (e.target.closest('[data-pb-save]')) return save(cv, s);
      const d = e.target.closest('[data-pb-del]');
      if (!d) return;
      if (d.dataset.armed !== '1') {
        d.dataset.armed = '1';
        d.textContent = 'Emin misin? İki yarısı da silinir; bir daha dokun';
        return;
      }
      const ids = [s.me, s.her].filter(Boolean).flatMap((r) => [r.id, r.data.shot]);
      for (const id of ids) await K.cloud.remove(id);
      rows = rows.filter((r) => r.data.sid !== s.sid);
      md.close();
      gallery();
    });
  }
  async function save(cv, s) {
    const blob = await new Promise((r) => cv.toBlob(r, 'image/jpeg', 0.92));
    if (!blob) return K.fx.toast('Görsel hazırlanamadı.');
    const name = `kabin-${s.day || T.todayKey()}.jpg`;
    const file = new File([blob], name, { type: 'image/jpeg' });
    try {
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title: 'Boğaz\'dan Hazar\'a' });
        return;
      }
    } catch (e) {
      if (e && e.name === 'AbortError') return;
    }
    const url = URL.createObjectURL(blob);
    const a = K.el(`<a href="${url}" download="${name}"></a>`);
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
    K.fx.toast('Şerit indirildi.', { icon: A.icon('camera') });
  }

  /* ---------- Arayüz ---------- */
  function controls() {
    const el = root && K.$('#pbCtl', root);
    if (!el) return;
    const here = K.cloud.otherHere();
    const on = Boolean(stream);
    const o = nameOf(other());
    const chips = (list, cur, key) => list.map(([id, n]) => `<button type="button" class="chip ${cur === id ? 'on' : ''}" data-${key}="${id}" aria-pressed="${cur === id}">${K.esc(n)}</button>`).join('');
    if (sess && sess.phase === 'shoot') {
      el.innerHTML = `<p class="pb-status">${sess.together ? `${K.esc(o)} ile birlikte çekiyorsunuz.` : 'Çekiliyor...'}</p><button type="button" class="btn ghost small" data-pb-stop>Durdur</button>`;
      return;
    }
    if (sess && sess.phase === 'upload') {
      el.innerHTML = '<p class="pb-status">Şerit kaydediliyor...</p>';
      return;
    }
    if (sess && sess.phase === 'pick') {
      el.innerHTML = `<p class="pb-status">Kamera yok; dört fotoğraf seç (${sess.frames.length}/4). Pozlar: ${sess.poses.map((p) => K.esc(p[0])).join(', ')}.</p>
        <label class="btn red">${A.ui('image')} Fotoğraf seç<input type="file" accept="image/*" multiple hidden data-pb-files></label>
        <button type="button" class="btn ghost small" data-pb-stop>Vazgeç</button>`;
      return;
    }
    if (incoming) {
      el.innerHTML = `<div class="pb-invite"><p><b>${K.esc(o)} seni kabine çağırıyor.</b> Hazır olunca bas; geri sayım ikinizde aynı anda başlar.</p><button type="button" class="btn red" data-pb-accept>${A.ui('camera')} Hazırım</button></div>`;
      return;
    }
    if (invite) {
      el.innerHTML = `<p class="pb-status">${K.esc(o)} bekleniyor... Kabinde "Hazırım"a basınca başlayacak.</p><button type="button" class="btn ghost small" data-pb-uninvite>Vazgeç</button>`;
      return;
    }
    const wait = waitingForMe();
    el.innerHTML = `<div class="pb-opts"><div class="pb-row" role="group" aria-label="Çerçeve">${chips(THEMES, theme, 'theme')}</div><div class="pb-row" role="group" aria-label="Filtre">${chips(FILTERS, filter, 'filter')}</div></div>
      <p class="pb-status">${here ? `<span class="dot on"></span>${K.esc(o)} şu an kalede. Birlikte çekin!` : `<span class="dot"></span>${K.esc(o)} şu an kalede değil. Yarım şerit bırak; kendi yarısını çekince birleşir.`}</p>
      <div class="pb-btns">${!on ? `<button type="button" class="btn red" data-pb-cam>${A.ui('camera')} Kamerayı aç</button>` : ''}
        ${here ? `<button type="button" class="btn ${on ? 'red' : 'ghost'}" data-pb-together>${A.ui('heart')} Birlikte çek</button>` : ''}
        ${wait.length ? `<button type="button" class="btn red" data-pb-finish="${wait[0].sid}">${A.ui('camera')} ${K.esc(K.ek(o, 'in'))} şeridini tamamla</button>` : `<button type="button" class="btn ${here ? 'ghost' : on ? 'red' : 'ghost'} small" data-pb-solo>Yarım şerit bırak</button>`}</div>`;
  }
  function gallery() {
    const el = root && K.$('#pbGal', root);
    if (!el) return;
    const list = strips();
    if (!list.length) {
      el.innerHTML = '<p class="muted small">Henüz şerit yok. İlk dört kare sizi bekliyor.</p>';
      return;
    }
    el.innerHTML = list
      .map((s) => {
        const col = (w) => {
          const r = s[w];
          if (!r) return `<span class="pb-q">?</span>`;
          if (!full(s) && w !== mine()) return `<span class="pb-q lock">${A.ui('lock')}</span>`;
          return `<img src="${r.data.thumb}" alt="">`;
        };
        const label = full(s) ? T.fmtShort(s.day || T.todayKey()) : s[mine()] ? `${nameOf(other())} bekleniyor` : 'Senin yarın eksik';
        return `<button type="button" class="pb-tile ${full(s) ? '' : 'half'}" data-${full(s) ? 'pb-view' : s[mine()] ? 'pb-view' : 'pb-finish'}="${s.sid}" style="--bg:${themeOf(s.theme).bg}">
          <span class="pb-mini">${col('me')}${col('her')}</span><small>${K.esc(label)}</small></button>`;
      })
      .join('');
  }
  function stop() {
    if (sess) {
      (sess.timers || []).forEach(clearTimeout);
      if (sess.together && sess.phase === 'shoot') send({ t: 'cancel', sid: sess.sid });
    }
    sess = null;
    const o = root && K.$('#pbOver', root);
    if (o) o.hidden = true;
    film();
    controls();
  }

  /* ---------- Ana salon kartı ---------- */
  K.specialHooks = (K.specialHooks || []).concat(() => {
    const w = waitingForMe();
    if (!w.length) return [];
    return [{ icon: 'camera', title: `${nameOf(other())} sana yarım bir şerit bıraktı`, text: 'Dört kare çektin mi, iki yarı birleşir. O ana kadar onun yarısı gizli.', room: 'kabin' }];
  });

  // Açılışta sadece son şeritler (ana salon kartı için); hepsi kabine girilince
  let loading = null;
  function loadAll() {
    if (!K.cloud.enabled) return Promise.resolve();
    return (loading = loading || (async () => {
      const all = await K.cloud.list('pb', 400);
      const ids = new Set(rows.map((r) => r.id));
      all.forEach((r) => ids.has(r.id) || rows.push(r));
      if (K.activeRoom === 'kabin') {
        gallery();
        if (!sess) controls();
      }
    })());
  }
  K.on('cloud', async (on) => {
    if (!on) return;
    rows = await K.cloud.list('pb', 24);
    K.cloud.onLive('pb', onMsg);
    K.cloud.on('pb', (r) => {
      if (rows.some((x) => x.id === r.id)) return;
      rows.push(r);
      const s = strips().find((x) => x.sid === r.data.sid);
      if (r.who !== mine()) {
        if (s && full(s)) {
          if (K.activeRoom === 'kabin' && !sess) view(s.sid, true);
          else K.fx.toast(`<b>Şeridiniz tamamlandı!</b> <a href="#kabin">Fotoğraf Kabini</a>`, { icon: A.icon('camera'), duration: 8000 });
        } else if (K.activeRoom !== 'kabin') K.fx.toast(`<b>${K.esc(nameOf(r.who))} sana yarım bir şerit bıraktı.</b> <a href="#kabin">Kendi yarını çek</a>`, { icon: A.icon('camera'), duration: 8000 });
      }
      if (K.activeRoom === 'kabin') {
        gallery();
        controls();
      } else if (K.renderSpecials) K.renderSpecials();
    });
    K.cloud.on('deleted', ({ id }) => {
      if (!rows.some((r) => r.id === id)) return;
      rows = rows.filter((r) => r.id !== id);
      if (K.activeRoom === 'kabin') gallery();
    });
    K.renderSpecials && !K.activeRoom && K.renderSpecials();
  });
  K.on('presence', () => {
    if (K.activeRoom !== 'kabin') return;
    if (!K.cloud.otherHere()) {
      const g = root && K.$('#pbGhost', root);
      if (g) g.hidden = true;
      if (incoming) incoming = null;
    }
    if (!sess) controls();
  });
  K.kabin = { count: () => strips().filter(full).length, strips, load: loadAll };

  K.room({
    id: 'kabin',
    wing: 'anilar',
    title: 'Fotoğraf Kabini',
    sub: 'İki şehir, bir şerit: dört kare',
    icon: 'camera',
    color: '#FFE0EC',
    hidden: () => !D.kabin || !K.cloud || !K.cloud.enabled,
    badge: () => (waitingForMe().length ? 'Yarım şerit' : K.cloud && K.cloud.otherHere() ? 'İkiniz de burada' : ''),
    init(el) {
      root = el;
      el.innerHTML = `<div class="room-intro">${K.paras(PB().intro)}</div>
        <div class="pb-booth">
          <div class="pb-stage f-${filter}" id="pbStage">
            <video id="pbVideo" playsinline muted autoplay></video>
            <div class="pb-curtain">${A.icon('camera')}<span>Kamera kapalı</span></div>
            <div class="pb-over" id="pbOver" hidden></div>
            <div class="pb-count" id="pbCount" aria-live="assertive"></div>
            <div class="pb-flash" id="pbFlash"></div>
            <figure class="pb-ghost" id="pbGhost" hidden><img alt=""><figcaption>${K.esc(nameOf(other()))}</figcaption></figure>
          </div>
          <div class="pb-film" id="pbFilm"></div>
        </div>
        <div class="pb-ctl" id="pbCtl"></div>
        <h3 class="pb-h">Şeritlerimiz</h3>
        <div class="pb-gal" id="pbGal"></div>`;
      video = K.$('#pbVideo', el);
      video.addEventListener('playing', () => K.$('#pbStage', el).classList.add('live'));
      el.addEventListener('change', (e) => {
        if (e.target.matches('[data-pb-files]')) pickFiles(e.target.files);
      });
      el.addEventListener('click', async (e) => {
        const t = e.target.closest('[data-theme]');
        if (t) {
          theme = t.dataset.theme;
          K.store.set('pbTheme', theme);
          return controls();
        }
        const f = e.target.closest('[data-filter]');
        if (f) {
          filter = f.dataset.filter;
          K.store.set('pbFilter', filter);
          K.$('#pbStage', el).className = `pb-stage f-${filter}${stream ? ' live' : ''}`;
          return controls();
        }
        if (e.target.closest('[data-pb-cam]')) {
          if (!(await camOn())) return noCam();
          return controls();
        }
        if (e.target.closest('[data-pb-together]')) return startTogether();
        if (e.target.closest('[data-pb-accept]')) return acceptInvite();
        if (e.target.closest('[data-pb-solo]')) return startSolo();
        if (e.target.closest('[data-pb-stop]')) return stop();
        if (e.target.closest('[data-pb-uninvite]')) {
          if (invite) send({ t: 'cancel', sid: invite.sid });
          invite = null;
          return controls();
        }
        const fin = e.target.closest('[data-pb-finish]');
        if (fin) {
          const s = strips().find((x) => x.sid === fin.dataset.pbFinish);
          if (s && s[other()]) return startSolo(s[other()].data);
          return;
        }
        const v = e.target.closest('[data-pb-view]');
        if (v) return view(v.dataset.pbView);
      });
    },
    enter() {
      film();
      controls();
      gallery();
      loadAll();
    },
    leave() {
      if (sess && sess.phase !== 'upload') stop();
      if (invite) send({ t: 'cancel', sid: invite.sid });
      invite = null;
      camOff();
      const s = root && K.$('#pbStage', root);
      if (s) s.classList.remove('live');
      const g = root && K.$('#pbGhost', root);
      if (g) g.hidden = true;
    },
  });
})();
