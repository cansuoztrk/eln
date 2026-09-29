/* Oda: Kilit Ekranı — telefon için bizim duvar kâğıdımız (1170×2532).
   Dört tema (Gece, Pembe, 21:21, Zambak), isteğe bağlı geri sayım (Biniş Kartı, hedef tarih, yıldönümü, doğum günü)
   ve bir satır yazı. Üst kısım saat için boş bırakılır. Tuvalde çizilir; paylaş ya da indir. Bulut gerekmez. */
(function () {
  'use strict';
  const K = window.K;
  const A = K.art;
  const D = window.ELN;
  const C = D.config;
  const T = K.time;

  const W = 1170, H = 2532;
  let root, cv, busy = null;
  const DW = () => D.duvar || { intro: [], lines: [] };
  const opt = K.store.get('duvar', { theme: 'gece', count: 'auto', line: 0, custom: '' });
  const THEMES = [
    ['gece', 'Gece'],
    ['pembe', 'Pembe'],
    ['2121', '21:21'],
    ['zambak', 'Zambak'],
  ];

  /* ---------- Geri sayım kaynakları ---------- */
  function counts() {
    const out = [];
    const f = K.bilet && K.bilet.get();
    if (f && T.daysUntil(f.date) >= 0) out.push(['bilet', 'Biniş Kartı', T.daysUntil(f.date), 'Bakü\'de buluşmaya']);
    const tg = K.nezaman && K.nezaman.target();
    if (tg && T.daysUntil(tg.from) >= 0) out.push(['hedef', 'Hedef tarih', T.daysUntil(tg.from), 'Bakü\'ye, hedefimize']);
    if (C.firstAnniversary && T.daysUntil(C.firstAnniversary) >= 0) out.push(['yil', 'Birinci yılımız', T.daysUntil(C.firstAnniversary), 'birinci yılımıza']);
    if (C.metDate) {
      const n = T.nextAnnual(C.metDate.slice(5));
      out.push(['tanisma', 'Tanıştığımız gün', n.days, 'tanıştığımız güne']);
    }
    if (C.herBirthday) out.push(['dogum', `${C.herPet}'un doğum günü`, T.nextAnnual(C.herBirthday).days, K.isOwner() ? `${C.herPet}'un doğum gününe` : 'doğum günüme']);
    return out;
  }
  const pickCount = () => {
    const list = counts();
    if (opt.count === 'yok') return null;
    return (opt.count === 'auto' ? list[0] : list.find((c) => c[0] === opt.count)) || null;
  };
  const line = () => (opt.line === 'custom' ? opt.custom : K.fill((DW().lines || [])[opt.line] || ''));

  /* ---------- Çizim yardımcıları ---------- */
  // Görsel olarak çizilen SVG katı XML ister: tekrarlanan nitelikleri at (HTML gibi ilki kalır)
  const dedupe = (svg) =>
    svg.replace(/<([a-zA-Z][\w:-]*)((?:\s+[\w:-]+="[^"]*")*)\s*(\/?)>/g, (m, tag, attrs, sl) => {
      const seen = new Set();
      const kept = (attrs.match(/[\w:-]+="[^"]*"/g) || []).filter((a) => {
        const k = a.slice(0, a.indexOf('='));
        if (seen.has(k)) return false;
        seen.add(k);
        return true;
      });
      return `<${tag}${kept.length ? ' ' + kept.join(' ') : ''}${sl ? '/' : ''}>`;
    });
  function svgImage(svg, w, h) {
    const s = dedupe(svg)
      .replace(/var\(--[\w-]+,\s*([^)]+)\)/g, '$1')
      .replace('<svg ', `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" `);
    return new Promise((res) => {
      const img = new Image();
      img.onload = () => res(img);
      img.onerror = () => res(null);
      img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(s);
    });
  }
  const icon = (name) => `<svg viewBox="0 0 64 64">${(A.icon(name).match(/<svg[^>]*>([\s\S]*)<\/svg>/) || [])[1] || ''}</svg>`;
  function stars(ctx, n, y0, y1, seed, alpha) {
    const rnd = K.rng(seed);
    for (let i = 0; i < n; i++) {
      ctx.globalAlpha = (alpha || 0.8) * (0.3 + rnd() * 0.7);
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(rnd() * W, y0 + rnd() * (y1 - y0), 1.5 + rnd() * 3.5, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }
  function star4(ctx, x, y, r, color) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(x, y - r);
    ctx.lineTo(x + r * 0.28, y - r * 0.28);
    ctx.lineTo(x + r, y);
    ctx.lineTo(x + r * 0.28, y + r * 0.28);
    ctx.lineTo(x, y + r);
    ctx.lineTo(x - r * 0.28, y + r * 0.28);
    ctx.lineTo(x - r, y);
    ctx.lineTo(x - r * 0.28, y - r * 0.28);
    ctx.closePath();
    ctx.fill();
  }
  function heart(ctx, x, y, s, color) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(s, s);
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(0, 7);
    ctx.bezierCurveTo(-11, -1, -11, -12, -4.5, -12);
    ctx.bezierCurveTo(-1.5, -12, 0, -9.5, 0, -8);
    ctx.bezierCurveTo(0, -9.5, 1.5, -12, 4.5, -12);
    ctx.bezierCurveTo(11, -12, 11, -1, 0, 7);
    ctx.fill();
    ctx.restore();
  }
  function text(ctx, str, x, y, font, color, max) {
    ctx.font = font;
    ctx.fillStyle = color;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    let size = parseFloat(font.match(/(\d+)px/)[1]);
    while (max && ctx.measureText(str).width > max && size > 20) {
      size -= 4;
      ctx.font = font.replace(/\d+px/, size + 'px');
    }
    ctx.fillText(str, x, y);
  }

  /* ---------- Temalar ---------- */
  async function bg(ctx, theme) {
    if (theme === 'gece') {
      const g = ctx.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, '#1a1236');
      g.addColorStop(0.55, '#4b2a66');
      g.addColorStop(0.82, '#c85f95');
      g.addColorStop(1, '#ffb3cb');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);
      stars(ctx, 170, 0, H * 0.62, 11);
      // ay
      ctx.fillStyle = '#FFF4C7';
      ctx.beginPath();
      ctx.arc(W - 200, 1060, 70, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#4b2a66';
      ctx.beginPath();
      ctx.arc(W - 172, 1046, 62, 0, Math.PI * 2);
      ctx.fill();
      // iki kule ve aradaki iplik
      const [ist, bak] = await Promise.all([svgImage(A.kizKulesi(), 320, 440), svgImage(A.qizQalasi(), 320, 440)]);
      ctx.strokeStyle = 'rgba(255,208,225,.85)';
      ctx.lineWidth = 5;
      ctx.setLineDash([4, 14]);
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(250, H - 470);
      ctx.quadraticCurveTo(W / 2, H - 650, W - 250, H - 470);
      ctx.stroke();
      ctx.setLineDash([]);
      heart(ctx, W / 2, H - 545, 4.4, '#E3174D');
      if (ist) ctx.drawImage(ist, 40, H - 520, 320, 440);
      if (bak) ctx.drawImage(bak, W - 360, H - 520, 320, 440);
      ctx.fillStyle = '#9fd6ff';
      ctx.fillRect(0, H - 96, W, 96);
      return { ink: '#fff', soft: '#ffd0e1', accent: '#ffd34e', y: 1290 };
    }
    if (theme === 'pembe') {
      ctx.fillStyle = '#ffd0e1';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = 'rgba(255,255,255,.55)';
      for (let y = 40, r = 0; y < H; y += 110, r++) for (let x = r % 2 ? 55 : 0; x < W + 60; x += 110) (ctx.beginPath(), ctx.arc(x, y, 14, 0, Math.PI * 2), ctx.fill());
      const k = await svgImage(A.kitty({ crown: true, eyes: 'heart' }), 700, 584);
      if (k) ctx.drawImage(k, (W - 700) / 2, 860, 700, 584);
      return { ink: '#4a2138', soft: '#86566f', accent: '#e3174d', y: 1540 };
    }
    if (theme === '2121') {
      ctx.fillStyle = '#120d2a';
      ctx.fillRect(0, 0, W, H);
      stars(ctx, 260, 0, H, 21, 0.7);
      const n = K.dakika ? K.dakika.stars().length : 0;
      const names = K.dakika ? K.dakika.names() : [];
      const total = Math.max(n, 7);
      const rnd = K.rng(2121);
      let x = 260, y = 1180;
      const pts = [];
      for (let i = 0; i < total; i++) {
        x = K.clamp(x + 60 + rnd() * 90, 120, W - 120);
        y = K.clamp(y + (rnd() * 240 - 120), 980, 1500);
        if (i % 7 === 0 && i) (x = 180 + rnd() * 200), (y = 1000 + rnd() * 400);
        pts.push([x, y, i < n]);
      }
      ctx.strokeStyle = 'rgba(255,244,199,.45)';
      ctx.lineWidth = 3;
      for (let i = 1; i < pts.length; i++) if (i % 7 && pts[i][2]) (ctx.beginPath(), ctx.moveTo(pts[i - 1][0], pts[i - 1][1]), ctx.lineTo(pts[i][0], pts[i][1]), ctx.stroke());
      pts.forEach(([px, py, lit]) => star4(ctx, px, py, lit ? 26 : 16, lit ? '#FFF4C7' : 'rgba(255,244,199,.4)'));
      if (n >= 7 && names[0]) text(ctx, names[0], pts[0][0], pts[0][1] - 50, '600 44px Fredoka', 'rgba(255,244,199,.85)');
      text(ctx, '21:21', W / 2, 1760, '700 190px Fredoka', '#ff8fb8');
      text(ctx, n ? `${n} yıldız, aynı dakikada` : 'Her akşam, aynı dakikada', W / 2, 1840, '600 50px Fredoka', 'rgba(255,244,199,.9)');
      return { ink: '#fff', soft: '#c9b6ff', accent: '#ff8fb8', y: 2000, compact: true };
    }
    // zambak
    ctx.fillStyle = '#fff8f0';
    ctx.fillRect(0, 0, W, H);
    const lily = await svgImage(icon('lily'), 220, 220);
    const rnd = K.rng(5);
    if (lily)
      for (let i = 0, n = 0; i < 80 && n < 14; i++) {
        const s = 120 + rnd() * 140;
        const x = rnd() * (W - s), y = 900 + rnd() * (H - 1100);
        // yazıların durduğu orta şeridi boş bırak
        if (x + s > 170 && x < W - 170 && y + s > 1560 && y < 2200) continue;
        ctx.globalAlpha = 0.14 + rnd() * 0.16;
        ctx.drawImage(lily, x, y, s, s);
        n++;
      }
    ctx.globalAlpha = 1;
    const big = await svgImage(icon('lily'), 460, 460);
    if (big) ctx.drawImage(big, (W - 460) / 2, 1050, 460, 460);
    return { ink: '#4a2138', soft: '#86566f', accent: '#e3174d', y: 1600 };
  }

  async function draw() {
    if (!cv) return;
    const ctx = cv.getContext('2d');
    try {
      await Promise.all(['700 100px Fredoka', '600 50px Fredoka', '700 80px Caveat', '400 80px "Great Vibes"'].map((f) => document.fonts.load(f)));
    } catch (e) {}
    ctx.clearRect(0, 0, W, H);
    const st = await bg(ctx, opt.theme);
    const c = pickCount();
    let y = st.y;
    if (c && !st.compact) {
      // "Bakü'de buluşmaya / 68 / gün kaldı"
      text(ctx, c[3].charAt(0).toLocaleUpperCase('tr-TR') + c[3].slice(1), W / 2, y + 40, '600 58px Fredoka', st.ink, W - 160);
      text(ctx, c[2] === 0 ? 'Bugün!' : K.num(c[2]), W / 2, y + 290, '700 250px Fredoka', st.accent);
      if (c[2] !== 0) text(ctx, 'gün kaldı', W / 2, y + 370, '600 58px Fredoka', st.ink);
      y += 460;
    } else if (c) {
      text(ctx, `${c[2] === 0 ? 'Bugün' : K.num(c[2]) + ' gün'} · ${c[3]}`, W / 2, y + 30, '600 54px Fredoka', st.ink, W - 160);
      y += 120;
    }
    const l = line();
    if (l) text(ctx, l, W / 2, y + 80, '700 110px Caveat', st.ink, W - 140);
    text(ctx, `${C.herName}'in Krallığı`, W / 2, H - 150, '400 64px "Great Vibes"', st.soft);
  }

  function render() {
    if (!root) return;
    const cs = counts();
    K.$('#dwTheme', root).innerHTML = THEMES.map(([k, t]) => `<button type="button" class="chip" data-theme="${k}" aria-pressed="${opt.theme === k}">${K.esc(t)}</button>`).join('');
    K.$('#dwCount', root).innerHTML = [['auto', 'En yakını'], ...cs.map((c) => [c[0], `${c[1]} · ${c[2]} gün`]), ['yok', 'Geri sayım yok']].map(([k, t]) => `<option value="${k}" ${opt.count === k ? 'selected' : ''}>${K.esc(t)}</option>`).join('');
    K.$('#dwLine', root).innerHTML = (DW().lines || []).map((t, i) => `<option value="${i}" ${String(opt.line) === String(i) ? 'selected' : ''}>${K.esc(K.fill(t))}</option>`).join('') + `<option value="custom" ${opt.line === 'custom' ? 'selected' : ''}>Kendi yazım...</option><option value="none" ${opt.line === 'none' ? 'selected' : ''}>Yazı yok</option>`;
    K.$('#dwCustom', root).hidden = opt.line !== 'custom';
    K.$('#dwCustom', root).value = opt.custom || '';
    const p = T.baku();
    K.$('#dwClock', root).innerHTML = `<small>${K.esc(T.dayName(p))}, ${p.d} ${K.MONTHS[p.mo - 1]}</small><b>${K.pad(p.h)}:${K.pad(p.mi)}</b>`;
    redraw();
  }
  function redraw() {
    clearTimeout(busy);
    busy = setTimeout(draw, 60);
  }
  const save = () => K.store.set('duvar', opt);

  async function share() {
    await draw();
    const blob = await new Promise((r) => cv.toBlob(r, 'image/png'));
    K.stickers.award('duvar');
    if (!blob) return K.fx.toast('Görsel hazırlanamadı.');
    const name = `kilit-ekrani-${opt.theme}.png`;
    const file = new File([blob], name, { type: 'image/png' });
    try {
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title: `${C.herName}'in Krallığı` });
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
    K.fx.toast('Görsel indirildi. Fotoğraflar\'dan kilit ekranı yap.', { icon: A.icon('camera') });
  }

  K.room({
    id: 'duvar',
    wing: 'hazine',
    title: 'Kilit Ekranı',
    sub: 'Telefonun için bizim duvar kâğıdımız',
    icon: 'frame',
    color: '#E8E0FF',
    hidden: () => !D.duvar,
    init(el) {
      root = el;
      el.innerHTML = `
        <div class="room-intro">${K.paras(DW().intro)}</div>
        <div class="dw-wrap">
          <div class="dw-phone"><canvas id="dwCanvas" width="${W}" height="${H}" aria-label="Kilit ekranı önizlemesi"></canvas><div class="dw-clock" id="dwClock" aria-hidden="true"></div></div>
          <div class="dw-ctrl card">
            <p class="card-eyebrow">Tema</p><div class="dw-chips" id="dwTheme"></div>
            <label class="dw-f"><span>Geri sayım</span><select class="input" id="dwCount" name="dwCount"></select></label>
            <label class="dw-f"><span>Yazı</span><select class="input" id="dwLine" name="dwLine"></select></label>
            <input class="input" id="dwCustom" name="dwCustom" maxlength="28" placeholder="En fazla 28 harf" hidden>
            <button type="button" class="btn red" id="dwSave">${A.icon('camera')} Kaydet / paylaş</button>
            <p class="muted small">Telefonda "Paylaş" menüsünden <b>Görüntüyü Kaydet</b>'e bas, sonra Fotoğraflar'da <b>Duvar kâğıdı olarak kullan</b>. Üstteki saat sadece önizleme.</p>
          </div>
        </div>`;
      cv = K.$('#dwCanvas', el);
      el.addEventListener('click', (e) => {
        const t = e.target.closest('[data-theme]');
        if (t) {
          opt.theme = t.dataset.theme;
          save();
          return render();
        }
        if (e.target.closest('#dwSave')) share();
      });
      el.addEventListener('change', (e) => {
        if (e.target.id === 'dwCount') opt.count = e.target.value;
        if (e.target.id === 'dwLine') opt.line = e.target.value === 'custom' || e.target.value === 'none' ? e.target.value : +e.target.value;
        save();
        render();
      });
      el.addEventListener('input', (e) => {
        if (e.target.id !== 'dwCustom') return;
        opt.custom = e.target.value;
        save();
        redraw();
      });
    },
    enter() {
      render();
    },
  });
})();
