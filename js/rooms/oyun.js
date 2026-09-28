/* Oda: Bakü'ye Uç — Kitty'nin uçağıyla İstanbul'dan Bakü'ye 1.758 km */
(function () {
  'use strict';
  const K = window.K;
  const A = K.art;
  const C = window.ELN.config;

  const W = 480,
    H = 640;
  const TOTAL = C.distanceKm;
  const DURATION = 62; // saniye (tam hızda)
  const CHECKS = [
    [0, `${C.myCity}'dan kalkış!`],
    [350, 'Karadeniz göründü'],
    [800, 'Trabzon\'un yeşili aşağıda'],
    [1150, 'Gürcistan\'a hoş geldin'],
    [1450, 'Kafkas Dağları'],
    [1680, 'Hazar göründü!'],
  ];

  let root, cv, cx, dpr, raf, imgs = {}, g, running = false;

  const planeSvg = () => `<svg viewBox="0 0 160 100">
    <path d="M20 58 L8 34 L22 34 L44 54 Z" fill="#FF8FB8" stroke="#4A2138" stroke-width="3" stroke-linejoin="round"/>
    <g transform="translate(62 2) scale(.28)">${A.kitty({ eyes: 'normal' }).replace(/^<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '')}</g>
    <ellipse cx="80" cy="64" rx="60" ry="17" fill="#fff" stroke="#4A2138" stroke-width="3.5"/>
    <path d="M100 50 Q124 44 134 58" fill="none" stroke="#8FD3FF" stroke-width="4" stroke-linecap="round"/>
    <path d="M72 68 L54 96 L70 96 L98 70 Z" fill="#FF6FA3" stroke="#4A2138" stroke-width="3" stroke-linejoin="round"/>
    <g fill="#8FD3FF" stroke="#4A2138" stroke-width="2"><circle cx="42" cy="62" r="4"/><circle cx="56" cy="62" r="4"/></g>
    <path d="M138 64 C141 56 146 55 148 60" fill="none" stroke="#4A2138" stroke-width="3"/>
    <rect x="146" y="44" width="5" height="40" rx="2.5" fill="#C9B6FF"/>
  </svg>`;
  const stormSvg = () => `<svg viewBox="0 0 120 90">
    <path d="M22 62 h72 a18 18 0 0 0 0 -36 a26 26 0 0 0 -50 6 a16 16 0 0 0 -22 30 z" fill="#9C8FB8" stroke="#5E4A7A" stroke-width="3"/>
    <path d="M58 60 L46 80 H58 L52 90 L72 70 H60 L66 60 Z" fill="#FFD34E" stroke="#B9783E" stroke-width="2" stroke-linejoin="round"/>
    <circle cx="44" cy="44" r="3" fill="#5E4A7A"/><circle cx="66" cy="44" r="3" fill="#5E4A7A"/><path d="M48 52 Q55 48 62 52" fill="none" stroke="#5E4A7A" stroke-width="2.5" stroke-linecap="round"/>
  </svg>`;

  async function loadImages() {
    if (imgs.plane) return;
    const [plane, storm, ist, baku, flames] = await Promise.all([
      A.toImage(planeSvg(), 160, 100),
      A.toImage(stormSvg(), 120, 90),
      A.toImage(A.kizKulesi(), 160, 220),
      A.toImage(A.qizQalasi(), 160, 220),
      A.toImage(A.flameTowers('#F2B8CF'), 90, 90),
    ]);
    imgs = { plane, storm, ist, baku, flames };
  }

  function reset() {
    g = {
      y: H * 0.45,
      vy: 0,
      km: 0,
      t: 0,
      lives: 3,
      hearts: 0,
      inv: 0,
      clouds: [],
      loves: [],
      bg: Array.from({ length: 7 }, (_, i) => ({ x: Math.random() * W, y: 40 + Math.random() * 420, s: 0.5 + Math.random() * 0.8, v: 0.3 + i * 0.05 })),
      banner: { text: CHECKS[0][1], t: 150 },
      nextCheck: 1,
      state: 'play',
      landing: 0,
      spawnC: 80,
      spawnH: 40,
    };
  }

  function flap() {
    if (!g || g.state !== 'play') return;
    g.vy = -6.4;
    K.audio.sfx.tap();
  }

  function heartPath(x, y, s) {
    cx.beginPath();
    cx.moveTo(x, y + s * 0.35);
    cx.bezierCurveTo(x - s, y - s * 0.2, x - s * 0.55, y - s, x, y - s * 0.45);
    cx.bezierCurveTo(x + s * 0.55, y - s, x + s, y - s * 0.2, x, y + s * 0.35);
  }

  function update() {
    const speed = TOTAL / (DURATION * 60);
    g.t++;
    if (g.state === 'play') {
      g.km = Math.min(TOTAL, g.km + speed);
      g.vy = Math.min(8, g.vy + 0.32);
      g.y += g.vy;
      if (g.y < 104) {
        g.y = 104;
        g.vy = 0.5;
      }
      if (g.y > H - 90) {
        g.y = H - 90;
        g.vy = -4;
      }
      if (g.inv > 0) g.inv--;
      // Doğur
      if (g.km < TOTAL - 60) {
        if (--g.spawnC <= 0) {
          g.clouds.push({ x: W + 60, y: 70 + Math.random() * (H - 220), wob: Math.random() * 6 });
          g.spawnC = Math.max(58, 100 - g.km / 40) + Math.random() * 30;
        }
        if (--g.spawnH <= 0) {
          g.loves.push({ x: W + 30, y: 60 + Math.random() * (H - 200), p: Math.random() * 6 });
          g.spawnH = 50 + Math.random() * 40;
        }
      }
      // Kontrol noktaları
      if (g.nextCheck < CHECKS.length && g.km >= CHECKS[g.nextCheck][0]) {
        g.banner = { text: CHECKS[g.nextCheck][1], t: 150 };
        g.nextCheck++;
      }
      if (g.km >= TOTAL) {
        g.state = 'landing';
        g.landing = 0;
        g.banner = { text: `${C.herCity}'ye iniş`, t: 200 };
      }
    } else if (g.state === 'landing') {
      g.landing++;
      g.y += (H - 190 - g.y) * 0.03;
      g.vy = 0;
      if (g.landing > 170) win();
    }
    const vx = g.state === 'play' ? 3.2 : 1.6;
    g.clouds.forEach((c) => (c.x -= vx * 1.08));
    g.loves.forEach((h) => (h.x -= vx));
    g.bg.forEach((b) => {
      b.x -= b.v * vx * 0.4;
      if (b.x < -80) b.x = W + 80;
    });
    g.clouds = g.clouds.filter((c) => c.x > -80);
    g.loves = g.loves.filter((h) => h.x > -30);
    // Çarpışmalar
    const px = 110,
      py = g.y;
    if (g.state === 'play') {
      g.loves.forEach((h) => {
        if (!h.got && Math.hypot(h.x - px, h.y - py) < 34) {
          h.got = true;
          g.hearts++;
          K.audio.sfx.pop();
        }
      });
      g.loves = g.loves.filter((h) => !h.got);
      if (g.inv === 0)
        g.clouds.forEach((c) => {
          if (!c.hit && Math.hypot(c.x - px, c.y + Math.sin(g.t / 20 + c.wob) * 8 - py) < 42) {
            c.hit = true;
            g.lives--;
            g.inv = 90;
            K.audio.sfx.fail();
            K.vibrate(80);
            if (g.lives <= 0) lose();
          }
        });
    }
    if (g.banner.t > 0) g.banner.t--;
  }

  function draw() {
    const prog = g.km / TOTAL;
    // Gökyüzü
    const sky = cx.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, `hsl(${340 - prog * 30}, 90%, ${86 - prog * 4}%)`);
    sky.addColorStop(1, `hsl(${345 - prog * 20}, 100%, 96%)`);
    cx.fillStyle = sky;
    cx.fillRect(0, 0, W, H);
    // Uzak bulutlar
    cx.fillStyle = 'rgba(255,255,255,.8)';
    g.bg.forEach((b) => {
      cx.beginPath();
      cx.ellipse(b.x, b.y, 44 * b.s, 16 * b.s, 0, 0, Math.PI * 2);
      cx.ellipse(b.x - 18 * b.s, b.y - 10 * b.s, 20 * b.s, 16 * b.s, 0, 0, Math.PI * 2);
      cx.ellipse(b.x + 14 * b.s, b.y - 12 * b.s, 16 * b.s, 14 * b.s, 0, 0, Math.PI * 2);
      cx.fill();
    });
    // Zemin: deniz → dağlar → Hazar
    const gy = H - 56;
    if (prog < 0.62) {
      cx.fillStyle = '#9FD8FF';
      cx.fillRect(0, gy, W, 56);
      cx.fillStyle = '#BFE6FF';
      for (let x = -((g.t * 2) % 40); x < W; x += 40) {
        cx.beginPath();
        cx.arc(x + 20, gy + 2, 14, Math.PI, 0);
        cx.fill();
      }
    } else if (prog < 0.93) {
      cx.fillStyle = '#F4D3E1';
      cx.fillRect(0, gy, W, 56);
      for (let x = -((g.t * 1.4) % 70); x < W + 70; x += 70) {
        cx.fillStyle = '#E7C6D6';
        cx.beginPath();
        cx.moveTo(x, gy + 10);
        cx.lineTo(x + 35, gy - 46);
        cx.lineTo(x + 70, gy + 10);
        cx.fill();
        cx.fillStyle = '#fff';
        cx.beginPath();
        cx.moveTo(x + 24, gy - 28);
        cx.lineTo(x + 35, gy - 46);
        cx.lineTo(x + 46, gy - 28);
        cx.fill();
      }
    } else {
      cx.fillStyle = '#7EC8F5';
      cx.fillRect(0, gy, W, 56);
    }
    // Başlangıç: Kız Kulesi, bitiş: Qız Qalası
    const startX = 40 - g.km * 7;
    if (startX > -140 && imgs.ist) cx.drawImage(imgs.ist, startX, gy - 150, 120, 165);
    if (g.km > TOTAL - 80 && imgs.baku) {
      const endX = W - 150 + (TOTAL - g.km) * 7 - Math.min(40, g.landing * 0.4);
      cx.drawImage(imgs.flames, endX - 70, gy - 90, 80, 80);
      cx.drawImage(imgs.baku, endX, gy - 175, 130, 180);
    }
    // Kalpler
    g.loves.forEach((h) => {
      const s = 13 + Math.sin(g.t / 8 + h.p) * 1.5;
      cx.fillStyle = '#E3174D';
      heartPath(h.x, h.y, s);
      cx.fill();
      cx.fillStyle = 'rgba(255,255,255,.6)';
      cx.beginPath();
      cx.arc(h.x - s * 0.35, h.y - s * 0.45, s * 0.14, 0, Math.PI * 2);
      cx.fill();
    });
    // Fırtına bulutları
    g.clouds.forEach((c) => {
      const y = c.y + Math.sin(g.t / 20 + c.wob) * 8;
      cx.globalAlpha = c.hit ? 0.35 : 1;
      if (imgs.storm) cx.drawImage(imgs.storm, c.x - 55, y - 45, 110, 82);
      cx.globalAlpha = 1;
    });
    // Uçak
    if (!(g.inv > 0 && Math.floor(g.t / 5) % 2)) {
      cx.save();
      cx.translate(110, g.y);
      cx.rotate(K.clamp(g.vy / 14, -0.35, 0.45));
      if (imgs.plane) cx.drawImage(imgs.plane, -80, -58, 160, 100);
      cx.restore();
      // iz
      cx.fillStyle = 'rgba(255,143,184,.55)';
      for (let i = 1; i < 5; i++) {
        heartPath(110 - 70 - i * 16, g.y + 6 + Math.sin((g.t - i * 6) / 6) * 4, 5 - i * 0.7);
        cx.fill();
      }
    }
    // Üst bilgi
    const bx = 24,
      bw = W - 48;
    cx.fillStyle = 'rgba(255,255,255,.85)';
    roundRect(bx - 10, 14, bw + 20, 58, 18);
    cx.fill();
    cx.fillStyle = '#FFE1EC';
    roundRect(bx + 60, 44, bw - 120, 10, 5);
    cx.fill();
    cx.fillStyle = '#FF6FA3';
    roundRect(bx + 60, 44, (bw - 120) * prog, 10, 5);
    cx.fill();
    cx.font = '600 13px Fredoka, sans-serif';
    cx.fillStyle = '#4A2138';
    cx.textAlign = 'left';
    cx.fillText(C.myCity, bx - 2, 53);
    cx.textAlign = 'right';
    cx.fillText(C.herCity, bx + bw + 2, 53);
    cx.textAlign = 'center';
    cx.font = '700 15px Fredoka, sans-serif';
    cx.fillText(`${K.num(Math.floor(g.km))} / ${K.num(TOTAL)} km`, W / 2, 35);
    for (let i = 0; i < 3; i++) {
      cx.fillStyle = i < g.lives ? '#E3174D' : '#F6C9DA';
      heartPath(bx + 4 + i * 20, 34, 8);
      cx.fill();
    }
    cx.textAlign = 'right';
    cx.fillStyle = '#E3174D';
    cx.font = '700 14px Fredoka, sans-serif';
    cx.fillText(`${g.hearts} kalp`, bx + bw + 2, 35);
    // Kontrol noktası yazısı
    if (g.banner.t > 0) {
      const a = Math.min(1, g.banner.t / 30);
      cx.globalAlpha = a;
      cx.font = '600 22px Fredoka, sans-serif';
      const tw = cx.measureText(g.banner.text).width;
      cx.fillStyle = '#fff';
      roundRect(W / 2 - tw / 2 - 18, 96, tw + 36, 40, 20);
      cx.fill();
      cx.fillStyle = '#E3174D';
      cx.textAlign = 'center';
      cx.fillText(g.banner.text, W / 2, 124);
      cx.globalAlpha = 1;
    }
  }
  function roundRect(x, y, w, h, r) {
    cx.beginPath();
    cx.moveTo(x + r, y);
    cx.arcTo(x + w, y, x + w, y + h, r);
    cx.arcTo(x + w, y + h, x, y + h, r);
    cx.arcTo(x, y + h, x, y, r);
    cx.arcTo(x, y, x + w, y, r);
    cx.closePath();
  }

  function loop() {
    if (!running) return;
    update();
    draw();
    raf = requestAnimationFrame(loop);
  }
  function panel(html) {
    const p = K.$('#gmPanel', root);
    p.innerHTML = html;
    p.hidden = false;
  }
  function lose() {
    g.state = 'over';
    running = false;
    const best = Math.max(K.store.get('flyBest', 0), Math.floor(g.km));
    K.store.set('flyBest', best);
    setTimeout(() => {
      draw();
      panel(`<h3>Fırtına seni yordu</h3>
        <p>${K.num(Math.floor(g.km))} km uçtun, ${g.hearts} kalp topladın. En iyi: ${K.num(best)} km.</p>
        <p class="hand" style="font-size:22px">Ama yolun sonunda ben seni bekliyorum. Bir daha dene!</p>
        <button class="btn big" data-start>${A.ui('refresh')} Tekrar uç</button>`);
    }, 60);
  }
  function win() {
    g.state = 'won';
    running = false;
    K.store.set('flyBest', TOTAL);
    const wins = K.store.get('flyWins', 0) + 1;
    K.store.set('flyWins', wins);
    K.stickers.award('pilot');
    K.audio.sfx.chime();
    K.fx.confetti({ count: 150 });
    panel(`<h3>${K.esc(C.herCity)}'ye indin!</h3>
      <p>${K.num(TOTAL)} kilometreyi aştın ve yol boyunca <b>${g.hearts}</b> kalp topladın. Hepsi senin.</p>
      <p class="hand" style="font-size:22px">Bir gün bu yolculuğu gerçekten yapacağım. Pencereden bakınca Qız Qalası'nı görüp seni düşüneceğim.</p>
      <p class="muted small">Bakü'ye ${wins}. inişin.</p>
      <button class="btn big" data-start>${A.ui('refresh')} Bir daha uç</button>`);
  }
  async function start() {
    K.$('#gmPanel', root).hidden = true;
    await loadImages();
    reset();
    running = true;
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(loop);
    cv.focus({ preventScroll: true });
  }

  function size() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    cv.width = W * dpr;
    cv.height = H * dpr;
    cx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  K.room({
    id: 'oyun',
    wing: 'oyun',
    title: 'Bakü\'ye Uç',
    sub: 'Kitty uçağıyla 1.758 km',
    icon: 'plane',
    color: '#D6F1FF',
    badge: () => (K.stickers.has('pilot') ? 'İniş yapıldı' : ''),
    init(el) {
      root = el;
      el.innerHTML = `
        <p class="room-intro">Ekrana dokun (ya da boşluk tuşuna bas), Kitty'nin uçağı yükselsin. Fırtına bulutlarından kaç, kalpleri topla ve ${C.herCity}'ye in.</p>
        <div class="game-wrap">
          <canvas id="gmCanvas" class="game-cv" tabindex="0" aria-label="Bakü'ye Uç oyunu"></canvas>
          <div class="gm-panel" id="gmPanel">
            <h3>Bakü'ye Uç</h3>
            <p>${K.esc(C.myCity)}'dan ${K.esc(C.herCity)}'ye ${K.num(TOTAL)} km. Üç canın var; fırtınaya çarpınca bir tanesi gider. Kalpler ise hep senin.</p>
            <button class="btn big" data-start>${A.ui('play')} Uçuşa başla</button>
            <p class="muted small">${K.store.get('flyBest', 0) ? `En iyi: ${K.num(K.store.get('flyBest', 0))} km` : 'İyi uçuşlar, pilot prenses.'}</p>
          </div>
        </div>`;
      cv = K.$('#gmCanvas', el);
      cx = cv.getContext('2d');
      size();
      reset();
      loadImages().then(() => {
        if (!running) draw();
      });
      cv.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        flap();
      });
      el.addEventListener('click', (e) => {
        if (e.target.closest('[data-start]')) start();
        else if (e.target.closest('[data-resume]')) {
          K.$('#gmPanel', root).hidden = true;
          running = true;
          raf = requestAnimationFrame(loop);
        }
      });
      document.addEventListener('keydown', (e) => {
        if (K.activeRoom !== 'oyun' || e.target.closest('input,textarea')) return;
        if (e.key === ' ' || e.key === 'ArrowUp') {
          e.preventDefault();
          if (running) flap();
          else if (!K.$('#gmPanel', root).hidden) start();
        }
      });
      draw();
    },
    leave() {
      if (running && g.state === 'play') {
        running = false;
        cancelAnimationFrame(raf);
        panel(`<h3>Mola</h3><p>${K.num(Math.floor(g.km))} km'de mola verdin.</p><button class="btn big" data-resume>${A.ui('play')} Devam et</button><button class="btn ghost" data-start>Baştan başla</button>`);
      }
    },
  });
})();
