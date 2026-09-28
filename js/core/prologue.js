/* Eln'in Krallığı — açılış filmi: yıldızlı bir gecede, iki şehir arasında bir iplik ve satır satır masalın başı */
(function () {
  'use strict';
  const K = window.K;
  const A = K.art;

  function stars(cv) {
    const cx = cv.getContext('2d');
    let W, H, raf;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const list = [];
    let shoot = null;
    function size() {
      W = cv.clientWidth;
      H = cv.clientHeight;
      cv.width = W * dpr;
      cv.height = H * dpr;
      cx.setTransform(dpr, 0, 0, dpr, 0, 0);
      list.length = 0;
      const n = Math.round((W * H) / 5200);
      for (let i = 0; i < n; i++) list.push({ x: Math.random() * W, y: Math.random() * H * 0.9, r: Math.random() * 1.4 + 0.3, p: Math.random() * 6.3, s: 0.6 + Math.random() * 1.8 });
    }
    function frame(t) {
      cx.clearRect(0, 0, W, H);
      for (const s of list) {
        const a = 0.35 + 0.65 * Math.abs(Math.sin(s.p + (t / 1000) * s.s * 0.6));
        cx.globalAlpha = a;
        cx.fillStyle = '#FFF6FB';
        cx.beginPath();
        cx.arc(s.x, s.y, s.r, 0, 6.283);
        cx.fill();
      }
      if (!shoot && Math.random() < 0.004) shoot = { x: Math.random() * W * 0.7, y: Math.random() * H * 0.35, l: 0 };
      if (shoot) {
        shoot.l += 0.018;
        const x = shoot.x + shoot.l * 260,
          y = shoot.y + shoot.l * 110;
        const g = cx.createLinearGradient(x - 90, y - 38, x, y);
        g.addColorStop(0, 'rgba(255,255,255,0)');
        g.addColorStop(1, 'rgba(255,240,250,.9)');
        cx.globalAlpha = Math.max(0, 1 - shoot.l);
        cx.strokeStyle = g;
        cx.lineWidth = 1.6;
        cx.beginPath();
        cx.moveTo(x - 90, y - 38);
        cx.lineTo(x, y);
        cx.stroke();
        if (shoot.l >= 1) shoot = null;
      }
      cx.globalAlpha = 1;
      if (!K.reduced) raf = requestAnimationFrame(frame);
    }
    size();
    window.addEventListener('resize', size);
    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', size);
    };
  }

  function words(text) {
    return K.fill(text)
      .split(' ')
      .map((w, i) => `<span style="--i:${i}">${K.esc(w)}</span>`)
      .join(' ');
  }

  function play(lines, done) {
    const cfg = window.ELN.config;
    const el = K.el(`<div class="prologue" role="dialog" aria-modal="true" aria-label="Açılış">
      <canvas class="pl-stars" aria-hidden="true"></canvas>
      <div class="pl-glow" aria-hidden="true"></div>
      <div class="pl-cities" aria-hidden="true">
        <span class="pl-city l"><i></i>${K.esc(cfg.myCity)}</span>
        <svg class="pl-thread" viewBox="0 0 100 24" preserveAspectRatio="none"><path class="pl-thread-bg" d="M3 20 Q50 -8 97 20"/><path class="pl-thread-fg" d="M3 20 Q50 -8 97 20" pathLength="1"/></svg>
        <span class="pl-city r"><i></i>${K.esc(cfg.herCity)}</span>
      </div>
      <div class="pl-center">
        <div class="pl-kitty" hidden>${A.kitty({ crown: true, blush: true, cls: 'is-happy' })}</div>
        <p class="pl-line" aria-live="polite"></p>
        <button class="btn red pl-enter" hidden>${A.ui('heart')} Kaleye gir</button>
      </div>
      <button class="pl-skip no-burst">Atla ${A.ui('next')}</button>
      <p class="pl-tap">Devam etmek için dokun</p>
    </div>`);
    document.body.appendChild(el);
    document.body.classList.add('gate-open');
    const stop = stars(K.$('.pl-stars', el));
    const line = K.$('.pl-line', el);
    const thread = K.$('.pl-thread-fg', el);
    let i = -1,
      timer,
      ended = false,
      closing = false;
    requestAnimationFrame(() => el.classList.add('in'));

    function show(n) {
      clearTimeout(timer);
      i = n;
      const last = i === lines.length - 1;
      line.classList.remove('in');
      setTimeout(() => {
        line.innerHTML = words(lines[i]);
        line.classList.toggle('big', last);
        void line.offsetWidth;
        line.classList.add('in');
        thread.style.strokeDashoffset = String(1 - i / Math.max(1, lines.length - 1));
        if (i >= Math.floor(lines.length / 2)) el.classList.add('near');
        if (last) return end();
        const ms = K.clamp(1900 + lines[i].length * 48, 3200, 6800);
        timer = setTimeout(() => show(i + 1), ms);
      }, i === 0 ? 700 : 520);
    }
    function end() {
      ended = true;
      el.classList.add('ended');
      K.$('.pl-tap', el).hidden = true;
      K.$('.pl-skip', el).hidden = true;
      const kit = K.$('.pl-kitty', el);
      kit.hidden = false;
      setTimeout(() => {
        K.audio.sfx.chime();
        const r = kit.getBoundingClientRect();
        K.fx.burst(r.left + r.width / 2, r.top + r.height / 3, { count: 22, power: 6, shapes: ['heart', 'star', 'spark'] });
        const b = K.$('.pl-enter', el);
        b.hidden = false;
        b.focus({ preventScroll: true });
      }, 700);
    }
    function close() {
      if (closing) return;
      closing = true;
      clearTimeout(timer);
      document.removeEventListener('keydown', onKey);
      el.classList.add('out');
      setTimeout(() => {
        stop();
        el.remove();
        document.body.classList.remove('gate-open');
        done && done();
      }, 900);
    }
    function next() {
      if (ended || closing) return;
      K.audio.sfx.tap();
      show(Math.min(i + 1, lines.length - 1));
    }
    function onKey(e) {
      if (e.key === 'Escape') close();
      else if (!ended && (e.key === ' ' || e.key === 'Enter' || e.key === 'ArrowRight')) {
        e.preventDefault();
        next();
      }
    }
    el.addEventListener('click', (e) => {
      if (e.target.closest('.pl-skip')) return close();
      if (e.target.closest('.pl-enter')) {
        K.fx.confetti({ count: 90 });
        return close();
      }
      next();
    });
    document.addEventListener('keydown', onKey);
    show(0);
  }

  K.prologue = { play };
})();
