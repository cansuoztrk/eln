/* Kale 2.0 — Kalp Kavanozu: her "seni seviyorum" kavanoza düşen bir kalp. İstersen içine küçük bir not sığdırırsın.
   Kalpler gerçekten düşer, çarpışır, yığılır (küçük bir fizik motoru); "Salla" ile (ya da telefonu sallayınca) zıplar.
   Bir kalbe dokununca kimin, ne zaman attığı ve notu açılır; "Kavanozdan çek" onun notlarından birini rastgele çeker.
   Onun kalpleri sen odadayken canlı düşer. Kalpler hiç kaybolmaz; 50, 100, 250, 500, 1000'de kavanoz süslenir.
   Kayıt: kalpk {note, c} */
(function () {
  'use strict';
  const K = window.K;
  const A = K.art;
  const D = window.ELN;
  const C = D.config;
  const T = K.time;

  const KV = () => D.kavanoz || { intro: [], ideas: [], marks: {} };
  const mine = () => (K.isOwner() ? 'me' : 'her');
  const other = () => (K.isOwner() ? 'her' : 'me');
  const nameOf = (w) => (w === 'me' ? C.myPet : C.herPet);
  const PAL = { her: ['#FF6FA3', '#FF8FB8', '#F0578F', '#FFB3CB', '#E3174D'], me: ['#9C86F0', '#B9A6FF', '#7FB8F0', '#8F73E6', '#C9B6FF'] };
  const MAXB = 130;

  let rows = [], loaded = false, root = null, hold = new Set();
  // Ardoş'un kavanoza önceden bıraktığı kalpler: ilk 21'i baştan içeride, sonra her gün (Bakü 08:00) bir tane
  const SD = () => (KV().seed || null);
  function seeds() {
    const s = SD();
    if (!s || !s.start) return [];
    const t0 = T.at(s.start).getTime();
    const out = (s.first || []).map((n, i) => ({ id: 'seed-f' + i, kind: 'kalpk', who: 'me', at: t0 - (s.first.length - i) * 6e4, data: { note: K.fill(n), c: i % 5, seed: true } }));
    (s.daily || []).forEach((n, d) => {
      const at = t0 + d * 864e5 + 8 * 36e5;
      if (at <= Date.now()) out.push({ id: 'seed-d' + d, kind: 'kalpk', who: 'me', at, data: { note: K.fill(n), c: (d + 2) % 5, seed: true, daily: d } });
    });
    return out;
  }
  const dailyN = () => seeds().filter((r) => r.data.daily != null).length;
  const seenKey = () => 'kvSeed-' + mine();
  function mergeSeeds() {
    const have = new Set(rows.map((r) => r.id));
    seeds().forEach((r) => have.has(r.id) || rows.push(r));
    rows.sort((a, b) => a.at - b.at);
  }
  const notes = (w) => rows.filter((r) => r.who === w && r.data.note);
  const level = (n) => [50, 100, 250, 500, 1000].filter((m) => n >= m).length;

  /* ---------- Fizik ---------- */
  let cv, ctx, W = 0, H = 0, dpr = 1, bodies = [], raf = 0, still = 0, geo = null, sel = null;
  function shape() {
    // Kavanozun iç sınırları (piksel)
    const L = W * 0.14, R = W * 0.86, top = H * 0.2, B = H * 0.95, nL = W * 0.3, nR = W * 0.7, cr = W * 0.12;
    return { L, R, top, B, nL, nR, cr, neckTop: H * 0.06 };
  }
  const rad = () => Math.max(9, Math.min(15, W * 0.035));
  function body(r, drop) {
    const g = geo;
    const rr = rad() * (0.85 + ((r.id.charCodeAt(r.id.length - 1) || 0) % 5) * 0.06);
    const pal = PAL[r.who] || PAL.her;
    return {
      r: rr,
      x: drop ? (g.nL + g.nR) / 2 + (Math.random() * 2 - 1) * (g.nR - g.nL) * 0.25 : g.L + rr + Math.random() * (g.R - g.L - rr * 2),
      y: drop ? g.neckTop : g.top + Math.random() * (g.B - g.top) * 0.6,
      vx: (Math.random() - 0.5) * 1.5,
      vy: drop ? 2 : 0,
      a: Math.random() * 0.6 - 0.3,
      c: pal[(r.data.c || 0) % pal.length],
      row: r,
      note: Boolean(r.data.note),
    };
  }
  function resize() {
    if (!cv) return;
    const box = cv.parentElement.getBoundingClientRect();
    dpr = Math.min(2, window.devicePixelRatio || 1);
    const w = Math.round(box.width), h = Math.round(Math.min(box.width * 1.25, window.innerHeight * 0.62));
    if (w === W && h === H) return;
    const sx = W ? w / W : 1, sy = H ? h / H : 1;
    W = w;
    H = h;
    cv.width = W * dpr;
    cv.height = H * dpr;
    cv.style.height = H + 'px';
    geo = shape();
    bodies.forEach((b) => {
      b.x *= sx;
      b.y *= sy;
      b.r = rad();
    });
    wake();
  }
  function step() {
    const g = geo;
    const sub = 3;
    for (let s = 0; s < sub; s++) {
      for (const b of bodies) {
        b.vy += 0.32 / sub;
        b.vx *= 0.995;
        b.vy *= 0.995;
        b.x += b.vx / sub;
        b.y += b.vy / sub;
        b.a += (b.vx / sub) * 0.03;
        // Boyun ve gövde
        const inNeck = b.y < g.top;
        const lo = (inNeck ? g.nL : g.L) + b.r, hi = (inNeck ? g.nR : g.R) - b.r;
        if (b.x < lo) (b.x = lo), (b.vx = Math.abs(b.vx) * 0.3);
        if (b.x > hi) (b.x = hi), (b.vx = -Math.abs(b.vx) * 0.3);
        if (b.y > g.B - b.r) (b.y = g.B - b.r), (b.vy = -Math.abs(b.vy) * 0.25), (b.vx *= 0.9);
        // Yuvarlak alt köşeler
        [[g.L + g.cr, g.B - g.cr], [g.R - g.cr, g.B - g.cr]].forEach(([cx, cy], i) => {
          if ((i === 0 ? b.x < cx : b.x > cx) && b.y > cy) {
            const dx = b.x - cx, dy = b.y - cy, d = Math.hypot(dx, dy), max = g.cr - b.r;
            if (d > max) {
              const nx = dx / d, ny = dy / d;
              b.x = cx + nx * max;
              b.y = cy + ny * max;
              const vn = b.vx * nx + b.vy * ny;
              if (vn > 0) (b.vx -= 1.3 * vn * nx), (b.vy -= 1.3 * vn * ny);
            }
          }
        });
      }
      // Kalp kalbe
      for (let i = 0; i < bodies.length; i++) {
        const a = bodies[i];
        for (let j = i + 1; j < bodies.length; j++) {
          const b = bodies[j];
          const dx = b.x - a.x, dy = b.y - a.y, min = a.r + b.r;
          if (Math.abs(dx) > min || Math.abs(dy) > min) continue;
          const d2 = dx * dx + dy * dy;
          if (d2 >= min * min || d2 === 0) continue;
          const d = Math.sqrt(d2), nx = dx / d, ny = dy / d, o = (min - d) / 2;
          a.x -= nx * o;
          a.y -= ny * o;
          b.x += nx * o;
          b.y += ny * o;
          const rv = (b.vx - a.vx) * nx + (b.vy - a.vy) * ny;
          if (rv < 0) {
            const j2 = -(1.2 * rv) / 2;
            a.vx -= j2 * nx;
            a.vy -= j2 * ny;
            b.vx += j2 * nx;
            b.vy += j2 * ny;
          }
        }
      }
    }
  }
  function heartPath(c, x, y, r, a) {
    c.save();
    c.translate(x, y);
    c.rotate(a);
    const k = r / 11;
    c.scale(k, k);
    c.beginPath();
    c.moveTo(0, 8);
    c.bezierCurveTo(-13, -1, -12, -13, -5, -13);
    c.bezierCurveTo(-2, -13, 0, -10.5, 0, -8.5);
    c.bezierCurveTo(0, -10.5, 2, -13, 5, -13);
    c.bezierCurveTo(12, -13, 13, -1, 0, 8);
    c.closePath();
    c.restore();
  }
  // Kavanozun camı: fizik sınırlarıyla aynı çizgide
  function jar(c, g, close) {
    const sh = H * 0.035;
    c.beginPath();
    c.moveTo(g.nL - 3, g.neckTop);
    c.lineTo(g.nL - 3, g.top - sh);
    c.quadraticCurveTo(g.L - 3, g.top - sh, g.L - 3, g.top + sh * 1.6);
    c.lineTo(g.L - 3, g.B - g.cr);
    c.quadraticCurveTo(g.L - 3, g.B + 3, g.L + g.cr, g.B + 3);
    c.lineTo(g.R - g.cr, g.B + 3);
    c.quadraticCurveTo(g.R + 3, g.B + 3, g.R + 3, g.B - g.cr);
    c.lineTo(g.R + 3, g.top + sh * 1.6);
    c.quadraticCurveTo(g.R + 3, g.top - sh, g.nR + 3, g.top - sh);
    c.lineTo(g.nR + 3, g.neckTop);
    if (close) c.closePath();
  }
  function glassBack(c, g) {
    jar(c, g, true);
    const gr = c.createLinearGradient(g.L, 0, g.R, 0);
    gr.addColorStop(0, 'rgba(255,255,255,.75)');
    gr.addColorStop(0.5, 'rgba(255,240,246,.45)');
    gr.addColorStop(1, 'rgba(255,255,255,.7)');
    c.fillStyle = gr;
    c.fill();
  }
  function glassFront(c, g) {
    const lv = level(rows.length);
    c.save();
    if (lv >= 3) {
      c.shadowColor = 'rgba(255,211,78,.85)';
      c.shadowBlur = 18;
    }
    jar(c, g, false);
    c.lineWidth = 3.5;
    c.strokeStyle = '#4A2138';
    c.lineJoin = 'round';
    c.stroke();
    c.restore();
    // Parlama
    c.strokeStyle = 'rgba(255,255,255,.75)';
    c.lineCap = 'round';
    c.lineWidth = 7;
    c.beginPath();
    c.moveTo(g.L + 14, g.top + H * 0.08);
    c.lineTo(g.L + 14, g.B - g.cr - H * 0.06);
    c.stroke();
    c.lineWidth = 4;
    c.beginPath();
    c.moveTo(g.L + 28, g.top + H * 0.08);
    c.lineTo(g.L + 28, g.top + H * 0.2);
    c.stroke();
    // Kapak
    const lx = g.nL - 10, lw = g.nR - g.nL + 20, ly = g.neckTop - 16;
    c.beginPath();
    c.roundRect ? c.roundRect(lx, ly, lw, 18, 6) : c.rect(lx, ly, lw, 18);
    c.fillStyle = lv >= 4 ? '#FFD34E' : '#FF8FB8';
    c.fill();
    c.lineWidth = 3;
    c.strokeStyle = '#4A2138';
    c.stroke();
    c.fillStyle = 'rgba(255,255,255,.55)';
    c.fillRect(lx + 8, ly + 4, lw * 0.35, 3);
    // Kurdele ve fiyonk
    if (lv >= 1) {
      c.fillStyle = '#E3174D';
      c.fillRect(g.nL - 2, g.neckTop + 8, g.nR - g.nL + 4, 8);
    }
    if (lv >= 2) {
      const cx = (g.nL + g.nR) / 2, cy = g.neckTop + 12;
      c.fillStyle = '#E3174D';
      c.strokeStyle = '#4A2138';
      c.lineWidth = 2.4;
      [[-1], [1]].forEach(([d]) => {
        c.beginPath();
        c.moveTo(cx, cy);
        c.lineTo(cx + d * 20, cy - 11);
        c.lineTo(cx + d * 20, cy + 11);
        c.closePath();
        c.fill();
        c.stroke();
      });
      c.beginPath();
      c.arc(cx, cy, 5.5, 0, Math.PI * 2);
      c.fill();
      c.stroke();
    }
    if (lv >= 5) {
      c.fillStyle = '#FFE19A';
      for (let i = 0; i < 7; i++) {
        const t = (Date.now() / 900 + i) % 7;
        c.globalAlpha = 0.4 + 0.6 * Math.abs(Math.sin(t));
        c.fillRect(g.L + ((i * 53) % (g.R - g.L)), g.top + ((i * 37) % (g.B - g.top)), 3, 3);
      }
      c.globalAlpha = 1;
    }
  }
  function draw() {
    const c = ctx, g = geo;
    c.setTransform(dpr, 0, 0, dpr, 0, 0);
    c.clearRect(0, 0, W, H);
    glassBack(c, g);
    // Taşan kalpler: dipte pembe bir dolgu
    const extra = Math.max(0, rows.length - MAXB);
    if (extra) {
      const fh = Math.min((g.B - g.top) * 0.35, 6 + Math.log2(extra + 1) * 9);
      const gr = c.createLinearGradient(0, g.B - fh, 0, g.B);
      gr.addColorStop(0, 'rgba(255,143,184,.25)');
      gr.addColorStop(1, 'rgba(240,87,143,.55)');
      c.fillStyle = gr;
      c.beginPath();
      c.moveTo(g.L, g.B - fh);
      c.lineTo(g.R, g.B - fh);
      c.lineTo(g.R, g.B - g.cr);
      c.quadraticCurveTo(g.R, g.B, g.R - g.cr, g.B);
      c.lineTo(g.L + g.cr, g.B);
      c.quadraticCurveTo(g.L, g.B, g.L, g.B - g.cr);
      c.closePath();
      c.fill();
    }
    for (const b of bodies) {
      heartPath(c, b.x, b.y, b.r, b.a);
      c.fillStyle = b.c;
      c.fill();
      c.lineWidth = 1.4;
      c.strokeStyle = 'rgba(74,33,56,.55)';
      c.stroke();
      if (b.note) {
        c.fillStyle = 'rgba(255,255,255,.95)';
        c.beginPath();
        c.arc(b.x + b.r * 0.32, b.y - b.r * 0.34, b.r * 0.2, 0, Math.PI * 2);
        c.fill();
      }
      if (b === sel) {
        heartPath(c, b.x, b.y, b.r * 1.25, b.a);
        c.lineWidth = 2.4;
        c.strokeStyle = '#FFD34E';
        c.stroke();
      }
    }
    glassFront(c, g);
  }
  function loop() {
    raf = 0;
    if (!cv || K.activeRoom !== 'kavanoz') return;
    step();
    draw();
    const e = bodies.reduce((s, b) => s + b.vx * b.vx + b.vy * b.vy, 0) / Math.max(1, bodies.length);
    still = e < 0.02 ? still + 1 : 0;
    if (still < 90) raf = requestAnimationFrame(loop);
  }
  function wake() {
    still = 0;
    if (!raf && cv && K.activeRoom === 'kavanoz') raf = requestAnimationFrame(loop);
  }
  function fill() {
    if (!geo) return;
    const list = rows.slice(-MAXB);
    const have = new Set(bodies.map((b) => b.row.id));
    bodies = bodies.filter((b) => list.some((r) => r.id === b.row.id));
    list.forEach((r) => have.has(r.id) || hold.has(r.id) || bodies.push(body(r, false)));
    wake();
  }
  function drop(r) {
    if (!geo) return;
    if (bodies.some((b) => b.row.id === r.id)) return;
    bodies.push(body(r, true));
    if (bodies.length > MAXB) bodies.splice(0, bodies.length - MAXB);
    wake();
  }
  function shake(power = 9) {
    bodies.forEach((b) => {
      b.vx += (Math.random() * 2 - 1) * power;
      b.vy -= Math.random() * power * 1.2;
    });
    K.vibrate(40);
    K.audio.sfx.sparkle();
    wake();
  }

  /* ---------- Eylemler ---------- */
  let lastPing = 0;
  async function throwHeart(note) {
    if (!K.cloud || !K.cloud.enabled) return K.fx.toast('Bulut kapalı; kavanoz için bulut gerekiyor.');
    const r = await K.cloud.add('kalpk', { note: note || '', c: Math.floor(Math.random() * 5) });
    if (!r) return K.fx.toast('Kalp kavanoza ulaşamadı. İnterneti kontrol et.');
    if (!rows.some((x) => x.id === r.id)) rows.push(r);
    drop(r);
    K.audio.sfx.pop();
    K.stickers.award('kavanoz');
    count();
    milestone();
    if (note && Date.now() - lastPing > 10 * 6e4) {
      lastPing = Date.now();
      K.ping(`💗 ${K.meName()} kavanoza notlu bir kalp attı`, 'Kalp Kavanozu\'nda, onun renginde.', ['heart'], { click: K.roomUrl('kavanoz') });
    }
  }
  function compose() {
    const m = K.ui.modal({
      label: 'Notlu kalp',
      cls: 'br-sheet kv-sheet',
      html: `<p class="card-eyebrow">Kalp Kavanozu</p><h2>Kalbin içine ne yazalım?</h2>
        <textarea class="textarea" rows="2" maxlength="90" placeholder="Kısa bir cümle..."></textarea>
        <div class="br-chips one">${(KV().ideas || []).map((x) => `<button type="button" class="chip" data-kv-idea>${K.esc(x)}</button>`).join('')}</div>
        <button type="button" class="btn red" data-kv-go>${A.ui('heart')} Kavanoza at</button>`,
    });
    const ta = K.$('textarea', m.body);
    m.body.addEventListener('click', (e) => {
      if (e.target.closest('[data-kv-idea]')) {
        ta.value = e.target.closest('[data-kv-idea]').textContent;
        return ta.focus();
      }
      if (e.target.closest('[data-kv-go]')) {
        const t = ta.value.trim();
        if (!t) return ta.focus();
        m.close();
        setTimeout(() => throwHeart(t), 300);
      }
    });
  }
  function show(r) {
    K.ui.modal({
      label: 'Kalp',
      cls: 'kv-note',
      html: `<svg class="kv-heart" viewBox="-14 -15 28 25" aria-hidden="true">${A.heartPath(0, 0, 1, (PAL[r.who] || PAL.her)[(r.data.c || 0) % 5])}</svg><p class="card-eyebrow">${K.esc(nameOf(r.who))} · ${K.esc(T.fmtShort(new Date(r.at)))}</p>
        ${r.data.note ? `<p class="hand kv-text">${K.yazitipi ? K.yazitipi.html(r.data.note, r.who) : K.esc(r.data.note)}</p>` : `<p class="muted">Notsuz bir kalp. Bazen sadece "seni seviyorum" demek yeter.</p>`}`,
    });
    K.audio.sfx.chime();
  }
  function pull() {
    const list = notes(other());
    if (!list.length) return K.fx.toast(`${K.esc(nameOf(other()))} henüz notlu kalp atmadı. Belki ilk notu sen atarsın.`, { duration: 3500 });
    shake(5);
    setTimeout(() => show(K.pick(list)), 600);
  }
  function count() {
    if (!root) return;
    const n = rows.length;
    const today = rows.filter((r) => K.akis.dayOf(r.at) === T.todayKey());
    K.$('#kvCount', root).innerHTML = `<b>${K.num(n)}</b> kalp`;
    K.$('#kvStats', root).innerHTML = `<span><i style="background:${PAL.her[0]}"></i>${K.esc(nameOf('her'))} ${K.num(rows.filter((r) => r.who === 'her').length)}</span><span><i style="background:${PAL.me[0]}"></i>${K.esc(nameOf('me'))} ${K.num(rows.filter((r) => r.who === 'me').length)}</span><span>Bugün ${today.length}</span>`;
    const lv = level(n);
    const jar = K.$('.kv-jar', root);
    jar.className = `kv-jar lv-${lv}`;
  }
  function milestone() {
    const n = rows.length;
    const marks = KV().marks || {};
    if (!marks[n]) return;
    K.fx.confetti({ count: 140, shapes: ['heart'] });
    K.fx.toast(`<b>💗 ${K.num(n)} kalp!</b> ${K.esc(marks[n])}`, { duration: 6000 });
  }
  let motionOn = false;
  async function motion() {
    if (motionOn) return;
    try {
      if (window.DeviceMotionEvent && typeof DeviceMotionEvent.requestPermission === 'function') {
        const p = await DeviceMotionEvent.requestPermission();
        if (p !== 'granted') return;
      }
    } catch (e) {
      return;
    }
    motionOn = true;
    let last = 0;
    window.addEventListener('devicemotion', (e) => {
      if (K.activeRoom !== 'kavanoz') return;
      const a = e.accelerationIncludingGravity || e.acceleration;
      if (!a) return;
      const m = Math.hypot(a.x || 0, a.y || 0, a.z || 0);
      if (m > 22 && Date.now() - last > 350) {
        last = Date.now();
        shake(Math.min(14, (m - 18) * 0.8));
      }
    });
  }

  K.on('cloud', async (ok) => {
    if (!ok) return;
    rows = await K.cloud.list('kalpk', 2000);
    mergeSeeds();
    loaded = true;
    // Gün dönünce yeni kalp
    setInterval(() => {
      const n = rows.length;
      mergeSeeds();
      if (rows.length !== n) {
        if (K.activeRoom === 'kavanoz') freshDrops();
        else K.renderSpecials && !K.activeRoom && K.renderSpecials();
      }
    }, 5 * 6e4);
    K.cloud.on('kalpk', (r) => {
      if (rows.some((x) => x.id === r.id)) return;
      rows.push(r);
      if (K.activeRoom === 'kavanoz') {
        drop(r);
        count();
        if (r.who !== mine()) K.fx.toast(`💗 <b>${K.esc(nameOf(r.who))} kavanoza bir kalp attı${r.data.note ? ', içinde bir not var' : ''}.</b>`, { duration: 3500, log: false });
      } else if (r.who !== mine() && r.data.note) K.fx.toast(`💗 <b>${K.esc(nameOf(r.who))} kavanoza notlu bir kalp attı.</b> <a href="#kavanoz">Kavanoza bak</a>`, { duration: 7000 });
    });
  });

  // Eln için: görmediği Ardoş kalpleri (ilk girişte 21'in hepsi baştan içeride, sonra günlükler tek tek düşer)
  function pendingSeeds() {
    if (K.isOwner() || !SD()) return [];
    const seen = K.store.get(seenKey(), -1);
    if (seen < 0) return [];
    return seeds().filter((r) => r.data.daily != null && r.data.daily >= seen);
  }
  function freshDrops() {
    if (K.isOwner() || !SD()) return;
    const seen = K.store.get(seenKey(), -1);
    const list = seen < 0 ? [] : seeds().filter((r) => r.data.daily != null && r.data.daily >= seen);
    if (seen < 0) {
      setTimeout(() => K.fx.toast(`💌 <b>${K.esc(K.fill(SD().firstToast || ''))}</b>`, { duration: 7000 }), 600);
      K.store.set(seenKey(), dailyN());
      return;
    }
    K.store.set(seenKey(), dailyN());
    list.forEach((r, i) =>
      setTimeout(() => {
        hold.delete(r.id);
        drop(r);
        K.audio.sfx.pop();
        if (i === list.length - 1) K.fx.toast(`💌 <b>${K.esc(K.fill(SD().dailyToast || ''))}</b> <button type="button" class="linkish" data-kv-last>Oku</button>`, { duration: 7000 });
        count();
      }, i * 500)
    );
  }
  document.addEventListener('click', (e) => {
    if (!e.target.closest('[data-kv-last]')) return;
    const r = seeds().filter((x) => x.data.daily != null).pop();
    r && show(r);
  });
  K.specialHooks = (K.specialHooks || []).concat(() => {
    if (!loaded || K.isOwner() || !SD() || !D.kavanoz) return [];
    const seen = K.store.get(seenKey(), -1);
    if (seen < 0) return [{ icon: 'jar', title: `💌 ${C.myPet} kavanoza senden önce 21 kalp attı`, text: 'İçlerinde birer not var. Kavanozu aç, bir kalbe dokun.', room: 'kavanoz', cta: 'Kavanoza bak' }];
    if (dailyN() > seen) return [{ icon: 'jar', title: K.fill(SD().dailyToast || ''), text: 'İçinde sana küçük bir not var.', room: 'kavanoz', cta: 'Oku' }];
    return [];
  });

  K.kavanoz = { seeds, count: () => rows.length, notesOf: (w) => rows.filter((r) => r.who === w && r.data.note).map((r) => r.data.note) };

  K.room({
    id: 'kavanoz',
    wing: 'kalp',
    title: 'Kalp Kavanozu',
    sub: 'Her "seni seviyorum" bir kalp',
    icon: 'jar',
    color: '#FFE3EE',
    hidden: () => !D.kavanoz || !K.cloud || !K.cloud.enabled,
    badge: () => (loaded ? `${K.num(rows.length)} kalp` : ''),
    init(el) {
      root = el;
      el.innerHTML = `<div class="room-intro">${K.paras(KV().intro || [])}</div>
        <section class="kv-wrap"><div class="kv-jar lv-0"><div class="kv-lid" aria-hidden="true"><i></i></div><canvas class="kv-cv" role="img" aria-label="Kalp kavanozu"></canvas><div class="kv-glass" aria-hidden="true"></div><p class="kv-count" id="kvCount"></p></div></section>
        <p class="kv-stats" id="kvStats"></p>
        <div class="kv-acts"><button type="button" class="btn red" data-kv="at">${A.ui('heart')} Kalp at</button><button type="button" class="btn soft" data-kv="not">${A.icon('letter')} Notlu kalp</button>
          <button type="button" class="btn ghost" data-kv="salla">🫙 Salla</button><button type="button" class="btn ghost" data-kv="cek">💌 Kavanozdan çek</button></div>
        <p class="muted small kv-hint">Bir kalbe dokun: kimin attığı ve notu açılır. Beyaz noktalı kalplerin içinde not var.</p>`;
      cv = K.$('.kv-cv', el);
      ctx = cv.getContext('2d');
      el.addEventListener('click', (e) => {
        const b = e.target.closest('[data-kv]');
        if (b) {
          const k = b.dataset.kv;
          if (k === 'at') return throwHeart('');
          if (k === 'not') return compose();
          if (k === 'salla') {
            motion();
            return shake();
          }
          if (k === 'cek') return pull();
        }
      });
      cv.addEventListener('click', (e) => {
        const r = cv.getBoundingClientRect();
        const x = e.clientX - r.left, y = e.clientY - r.top;
        let best = null, bd = Infinity;
        bodies.forEach((b) => {
          const d = Math.hypot(b.x - x, b.y - y);
          if (d < b.r * 1.4 && d < bd) (bd = d), (best = b);
        });
        if (!best) return;
        sel = best;
        draw();
        show(best.row);
        setTimeout(() => {
          sel = null;
          draw();
        }, 1200);
      });
      window.addEventListener('resize', () => K.activeRoom === 'kavanoz' && resize());
    },
    enter() {
      requestAnimationFrame(() => {
        resize();
        const fresh = pendingSeeds();
        fresh.forEach((r) => hold.add(r.id));
        fill();
        count();
        draw();
        const first = !K.isOwner() && SD() && K.store.get(seenKey(), -1) < 0;
        if (fresh.length || first) setTimeout(freshDrops, 900);
      });
    },
    leave() {
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
    },
  });
})();
