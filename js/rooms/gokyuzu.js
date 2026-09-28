/* Oda: Dilek Gökyüzü — aşk takımyıldızını birleştir, kayan yıldıza dilek tut */
(function () {
  'use strict';
  const K = window.K;
  const A = K.art;
  const C = window.ELN.config;
  const T = K.time;

  let root, cv, cx, W, H, dpr, raf, stars, t = 0, shoot = null, nextShoot = 240;
  let linked = [];
  const wishes = () => K.store.get('wishes', []);

  // Kalp şeklinde 10 yıldız (0–1 koordinat)
  const HEART = Array.from({ length: 10 }, (_, i) => {
    const a = (i / 10) * Math.PI * 2;
    return [0.5 + (16 * Math.pow(Math.sin(a), 3)) / 37, 0.5 - (13 * Math.cos(a) - 5 * Math.cos(2 * a) - 2 * Math.cos(3 * a) - Math.cos(4 * a)) / 37];
  });
  const done = () => K.store.get('constellation', false);

  function hp(i) {
    const s = Math.min(W, H) * 0.9;
    return [W / 2 + (HEART[i][0] - 0.5) * s, H * 0.47 + (HEART[i][1] - 0.5) * s * 0.92];
  }
  function size() {
    const r = cv.parentElement.getBoundingClientRect();
    W = r.width;
    H = Math.max(420, Math.min(620, window.innerHeight * 0.66));
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    cv.width = W * dpr;
    cv.height = H * dpr;
    cv.style.height = H + 'px';
    cx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const r2 = K.rng(K.hash('gokyuzu'));
    stars = Array.from({ length: Math.round((W * H) / 2200) }, () => ({ x: r2() * W, y: r2() * H, r: 0.4 + r2() * 1.4, p: r2() * 6, s: 0.5 + r2() * 2 }));
  }
  function star(x, y, r, color, glow) {
    cx.save();
    if (glow) {
      cx.shadowColor = color;
      cx.shadowBlur = glow;
    }
    cx.fillStyle = color;
    cx.beginPath();
    for (let i = 0; i < 8; i++) {
      const rr = i % 2 ? r * 0.35 : r;
      const a = (i * Math.PI) / 4 - Math.PI / 2;
      cx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
    }
    cx.closePath();
    cx.fill();
    cx.restore();
  }
  function draw() {
    t++;
    const g = cx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#140F33');
    g.addColorStop(0.6, '#2E2166');
    g.addColorStop(1, '#6B3E8C');
    cx.fillStyle = g;
    cx.fillRect(0, 0, W, H);
    // Samanyolu
    cx.save();
    cx.globalAlpha = 0.12;
    cx.fillStyle = '#FFD6E5';
    cx.beginPath();
    cx.ellipse(W * 0.5, H * 0.45, W * 0.75, H * 0.12, -0.5, 0, Math.PI * 2);
    cx.fill();
    cx.restore();
    stars.forEach((s) => {
      const a = 0.45 + Math.sin(t / 40 * s.s + s.p) * 0.4;
      cx.fillStyle = `rgba(255,248,220,${a})`;
      cx.beginPath();
      cx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      cx.fill();
    });
    // Dilek yıldızları
    wishes().forEach((w) => {
      const x = w.x * W,
        y = w.y * H;
      star(x, y, 6 + Math.sin(t / 25 + w.x * 10) * 1.2, '#FF8FB8', 14);
    });
    // Takımyıldız
    const full = done();
    cx.lineWidth = 2;
    cx.strokeStyle = full ? 'rgba(255,214,229,.9)' : 'rgba(255,214,229,.75)';
    cx.setLineDash(full ? [] : [4, 6]);
    cx.beginPath();
    const path = full ? [...HEART.keys(), 0] : linked;
    path.forEach((i, k) => {
      const [x, y] = hp(i);
      k ? cx.lineTo(x, y) : cx.moveTo(x, y);
    });
    cx.stroke();
    cx.setLineDash([]);
    HEART.forEach((_, i) => {
      const [x, y] = hp(i);
      const on = full || linked.includes(i);
      const next = !full && i === linked.length;
      star(x, y, on ? 7 : next ? 7 + Math.sin(t / 8) * 1.5 : 5, on ? '#FFF4C7' : '#E6DCFF', on ? 16 : next ? 12 : 4);
      if (!full && !on) {
        cx.fillStyle = 'rgba(230,220,255,.55)';
        cx.font = '600 11px Fredoka, sans-serif';
        cx.textAlign = 'center';
        cx.fillText(i + 1, x, y + 20);
      }
    });
    if (full) {
      cx.textAlign = 'center';
      cx.fillStyle = 'rgba(255,244,199,.95)';
      cx.font = '400 30px "Great Vibes", cursive';
      cx.fillText(`${C.herName} & ${C.myName}`, W / 2, H * 0.47 + 6);
      cx.font = '600 12px Fredoka, sans-serif';
      cx.fillStyle = 'rgba(255,214,229,.85)';
      cx.fillText(`Aşk Takımyıldızı · ${T.fmt(C.togetherDate)}`, W / 2, H * 0.47 + 28);
    }
    // Kayan yıldız
    if (--nextShoot <= 0 && !shoot) {
      shoot = { x: W * (0.1 + Math.random() * 0.5), y: H * (0.05 + Math.random() * 0.25), vx: 5 + Math.random() * 3, vy: 2.2 + Math.random() * 1.5, life: 90 };
      nextShoot = 360 + Math.random() * 300;
    }
    if (shoot) {
      shoot.x += shoot.vx;
      shoot.y += shoot.vy;
      shoot.life--;
      const grd = cx.createLinearGradient(shoot.x, shoot.y, shoot.x - shoot.vx * 16, shoot.y - shoot.vy * 16);
      grd.addColorStop(0, 'rgba(255,255,255,1)');
      grd.addColorStop(1, 'rgba(255,143,184,0)');
      cx.strokeStyle = grd;
      cx.lineWidth = 3;
      cx.lineCap = 'round';
      cx.beginPath();
      cx.moveTo(shoot.x, shoot.y);
      cx.lineTo(shoot.x - shoot.vx * 16, shoot.y - shoot.vy * 16);
      cx.stroke();
      star(shoot.x, shoot.y, 6, '#fff', 20);
      if (shoot.life <= 0 || shoot.x > W + 40 || shoot.y > H + 40) shoot = null;
    }
    raf = requestAnimationFrame(draw);
  }

  function tap(e) {
    const r = cv.getBoundingClientRect();
    const x = e.clientX - r.left,
      y = e.clientY - r.top;
    if (shoot && Math.hypot(shoot.x - x, shoot.y - y) < 60) {
      shoot = null;
      K.audio.sfx.sparkle();
      return wishModal();
    }
    const w = wishes().find((w) => Math.hypot(w.x * W - x, w.y * H - y) < 18);
    if (w) {
      K.audio.sfx.tap();
      K.fx.toast(`<b>Dileğin (${T.fmtShort(w.date)}):</b> ${K.esc(w.text)}`, { icon: A.icon('star') });
      return;
    }
    if (done()) return;
    const i = HEART.findIndex((_, k) => {
      const [hx, hy] = hp(k);
      return Math.hypot(hx - x, hy - y) < 26;
    });
    if (i < 0) return;
    if (i === linked.length) {
      linked.push(i);
      K.audio.sfx.note(['C5', 'D5', 'E5', 'F5', 'G5', 'A5', 'B5', 'C6', 'D6', 'E6'][i]);
      if (linked.length === HEART.length) {
        K.store.set('constellation', true);
        K.stickers.award('takimyildiz');
        K.audio.sfx.chime();
        K.fx.confetti({ count: 80, shapes: ['star', 'spark', 'heart'], colors: ['#FFF4C7', '#FFD6E5', '#fff', '#C9B6FF'] });
        K.$('#skyHint', root).textContent = 'Takımyıldızımız artık gökyüzünde. Kayan yıldızları yakalamayı unutma.';
      }
    } else if (!linked.includes(i)) {
      K.audio.sfx.fail();
      K.$('#skyHint', root).textContent = `Sıradaki yıldız ${linked.length + 1} numara.`;
    }
  }

  function wishModal() {
    const m = K.ui.modal({
      label: 'Dilek tut',
      html: `<div style="text-align:center;display:grid;gap:10px">
        <div style="width:90px;margin:0 auto">${A.icon('star')}</div>
        <h3 style="padding:0">Kayan yıldızı yakaladın!</h3>
        <p>Hemen bir dilek tut. Yazdığın dilek gökyüzünde pembe bir yıldız olarak kalacak.</p>
        <textarea class="textarea" id="wishText" name="wishText" maxlength="160" placeholder="Dileğim..."></textarea>
        <div class="actions" style="justify-content:center"><button class="btn" id="wishSave">${A.ui('sparkle')} Gökyüzüne as</button></div></div>`,
    });
    setTimeout(() => K.$('#wishText', m.el).focus(), 200);
    K.$('#wishSave', m.el).addEventListener('click', () => {
      const text = K.$('#wishText', m.el).value.trim();
      if (!text) return K.$('#wishText', m.el).focus();
      const list = wishes();
      list.push({ id: Date.now(), text, date: T.todayKey(), x: 0.08 + Math.random() * 0.84, y: 0.06 + Math.random() * 0.3 });
      K.store.set('wishes', list);
      K.stickers.award('dilek');
      K.audio.sfx.chime();
      m.close();
      renderWishes();
    });
  }
  function renderWishes() {
    const list = wishes();
    K.$('#wishList', root).innerHTML = list.length
      ? `<h3 class="sub-h">Gökyüzündeki dileklerin</h3><ul class="wish-list">${list
          .slice()
          .reverse()
          .map((w) => `<li>${A.icon('star')}<span>${K.esc(w.text)}<small>${T.fmt(w.date)}</small></span></li>`)
          .join('')}</ul>`
      : '';
  }

  K.room({
    id: 'gokyuzu',
    wing: 'oyun',
    title: 'Dilek Gökyüzü',
    sub: 'Takımyıldızımız ve dileklerin',
    icon: 'moon',
    color: '#E0DBFF',
    init(el) {
      root = el;
      const m = A.moonPhase(T.now());
      el.innerHTML = `
        <p class="room-intro">Yıldızları 1'den 10'a kadar sırayla birleştir, gökyüzünde bizim takımyıldızımız belirsin. Arada bir kayan yıldız geçer; yakalarsan dilek tutabilirsin.</p>
        <div class="sky-wrap">
          <canvas id="skyCv" class="sky-cv" aria-label="Gece gökyüzü"></canvas>
          <div class="sky-moon">${A.moonSvg(m.p, 44)}</div>
        </div>
        <div class="sky-bar">
          <p class="muted" id="skyHint">${done() ? 'Takımyıldızımız gökyüzünde. Kayan yıldızları yakalamayı unutma.' : '1 numaralı yıldızdan başla.'}</p>
          <div class="actions" style="display:flex;gap:8px;flex-wrap:wrap">
            <button class="btn soft small" id="skyShoot">${A.ui('sparkle')} Kayan yıldız çağır</button>
            ${done() ? `<button class="btn ghost small" id="skyRedo">${A.ui('refresh')} Yeniden birleştir</button>` : ''}
          </div>
        </div>
        <div class="card sky-info"><p>Bu gece: <b>${m.name}</b>, ay'ın %${Math.round(m.illum * 100)}'i aydınlık. ${C.herCity}'den ve ${C.myCity}'dan aynı ay görünüyor.</p></div>
        <div id="wishList"></div>`;
      cv = K.$('#skyCv', el);
      cx = cv.getContext('2d');
      cv.addEventListener('pointerdown', tap);
      K.$('#skyShoot', el).addEventListener('click', () => (nextShoot = 1));
      const redo = K.$('#skyRedo', el);
      redo &&
        redo.addEventListener('click', () => {
          K.store.set('constellation', false);
          linked = [];
          redo.remove();
          K.$('#skyHint', el).textContent = '1 numaralı yıldızdan başla.';
        });
      window.addEventListener('resize', () => K.activeRoom === 'gokyuzu' && size());
      renderWishes();
    },
    enter() {
      requestAnimationFrame(() => {
        size();
        cancelAnimationFrame(raf);
        nextShoot = 150;
        raf = requestAnimationFrame(draw);
      });
    },
    leave() {
      cancelAnimationFrame(raf);
    },
  });
})();
