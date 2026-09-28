/* Eln'in Krallığı — efektler: konfeti/kalp yağmuru, dokunma pırıltısı, bildirim balonları, pencereler */
(function () {
  'use strict';
  const K = window.K;
  const COLORS = ['#FF6FA3', '#FF8FB8', '#E3174D', '#FFD34E', '#C9B6FF', '#8FD3FF', '#FFFFFF', '#7ED6A5'];

  /* ---------- Parçacık motoru (tek canvas, sadece gerektiğinde çalışır) ---------- */
  let cv, cx, W, H, dpr;
  const parts = [];
  let running = false;
  function setup() {
    if (cv) return;
    cv = document.createElement('canvas');
    cv.className = 'fx-canvas';
    cv.setAttribute('aria-hidden', 'true');
    document.body.appendChild(cv);
    cx = cv.getContext('2d');
    resize();
    window.addEventListener('resize', resize);
  }
  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = window.innerWidth;
    H = window.innerHeight;
    cv.width = W * dpr;
    cv.height = H * dpr;
    cx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  function drawShape(p) {
    cx.save();
    cx.translate(p.x, p.y);
    cx.rotate(p.rot);
    cx.globalAlpha = Math.max(0, Math.min(1, p.life / p.fade));
    cx.fillStyle = p.color;
    const s = p.size;
    switch (p.shape) {
      case 'heart':
        cx.beginPath();
        cx.moveTo(0, s * 0.35);
        cx.bezierCurveTo(-s, -s * 0.2, -s * 0.55, -s, 0, -s * 0.45);
        cx.bezierCurveTo(s * 0.55, -s, s, -s * 0.2, 0, s * 0.35);
        cx.fill();
        break;
      case 'bow':
        cx.beginPath();
        cx.moveTo(0, 0);
        cx.bezierCurveTo(-s * 0.3, -s * 0.8, -s * 1.1, -s * 0.6, -s, 0);
        cx.bezierCurveTo(-s * 1.1, s * 0.6, -s * 0.3, s * 0.5, 0, 0);
        cx.bezierCurveTo(s * 0.3, -s * 0.8, s * 1.1, -s * 0.6, s, 0);
        cx.bezierCurveTo(s * 1.1, s * 0.6, s * 0.3, s * 0.5, 0, 0);
        cx.fill();
        cx.beginPath();
        cx.arc(0, 0, s * 0.28, 0, Math.PI * 2);
        cx.fill();
        break;
      case 'star': {
        cx.beginPath();
        for (let i = 0; i < 10; i++) {
          const r = i % 2 ? s * 0.42 : s;
          const a = (i * Math.PI) / 5 - Math.PI / 2;
          cx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
        }
        cx.closePath();
        cx.fill();
        break;
      }
      case 'circle':
        cx.beginPath();
        cx.arc(0, 0, s * 0.45, 0, Math.PI * 2);
        cx.fill();
        break;
      case 'spark':
        cx.beginPath();
        cx.moveTo(0, -s);
        cx.quadraticCurveTo(0, 0, s, 0);
        cx.quadraticCurveTo(0, 0, 0, s);
        cx.quadraticCurveTo(0, 0, -s, 0);
        cx.quadraticCurveTo(0, 0, 0, -s);
        cx.fill();
        break;
      default:
        cx.fillRect(-s * 0.5, -s * 0.25, s, s * 0.5 * (0.5 + Math.abs(Math.sin(p.flip))));
    }
    cx.restore();
  }
  function frame() {
    cx.clearRect(0, 0, W, H);
    for (let i = parts.length - 1; i >= 0; i--) {
      const p = parts[i];
      p.vx *= p.drag;
      p.vy = p.vy * p.drag + p.g;
      p.x += p.vx + Math.sin(p.flip) * p.sway;
      p.y += p.vy;
      p.rot += p.vr;
      p.flip += 0.08;
      p.life--;
      if (p.life <= 0 || p.y > H + 40) parts.splice(i, 1);
      else drawShape(p);
    }
    if (parts.length) requestAnimationFrame(frame);
    else {
      running = false;
      cx.clearRect(0, 0, W, H);
    }
  }
  function add(p) {
    setup();
    parts.push(
      Object.assign(
        { x: W / 2, y: H / 2, vx: 0, vy: 0, g: 0.25, drag: 0.985, rot: Math.random() * 6, vr: (Math.random() - 0.5) * 0.3, flip: Math.random() * 6, sway: 0, life: 140, fade: 40, size: 10, shape: 'heart', color: K.pick(COLORS) },
        p
      )
    );
    if (!running) {
      running = true;
      requestAnimationFrame(frame);
    }
  }

  // Merkezden saçılan konfeti
  function confetti(o = {}) {
    const { x = window.innerWidth / 2, y = window.innerHeight * 0.45, count = 90, power = 13, shapes = ['heart', 'bow', 'rect', 'star', 'circle', 'rect'], colors = COLORS } = o;
    const n = K.reduced ? Math.min(20, count) : count;
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      const v = power * (0.35 + Math.random() * 0.75);
      add({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - power * 0.45, g: 0.28, size: 6 + Math.random() * 9, shape: K.pick(shapes), color: K.pick(colors), life: 120 + Math.random() * 80 });
    }
  }
  // Ekranın tepesinden yağmur
  function rain(o = {}) {
    const { count = 60, shapes = ['heart'], colors = ['#FF6FA3', '#FF8FB8', '#E3174D', '#FFB3CE'], duration = 2200 } = o;
    setup();
    const n = K.reduced ? Math.min(12, count) : count;
    for (let i = 0; i < n; i++) {
      setTimeout(() => {
        add({ x: Math.random() * W, y: -20, vx: (Math.random() - 0.5) * 1.2, vy: 1.5 + Math.random() * 2, g: 0.03, drag: 0.995, sway: 0.6, size: 9 + Math.random() * 12, shape: K.pick(shapes), color: K.pick(colors), life: 400, fade: 60 });
      }, Math.random() * duration);
    }
  }
  // Küçük dokunma patlaması
  function burst(x, y, o = {}) {
    const { count = 7, shapes = ['heart', 'spark', 'heart'], colors = ['#FF6FA3', '#FFD34E', '#FF8FB8', '#C9B6FF'], power = 4 } = o;
    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2;
      const v = power * (0.4 + Math.random());
      add({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 1.5, g: 0.12, drag: 0.94, size: 4 + Math.random() * 5, shape: K.pick(shapes), color: K.pick(colors), life: 45, fade: 25 });
    }
  }
  // Havai fişek (son sayfa için)
  function fireworks(ms = 4000) {
    setup();
    const end = Date.now() + ms;
    const shoot = () => {
      if (Date.now() > end) return;
      const x = W * (0.15 + Math.random() * 0.7);
      const y = H * (0.15 + Math.random() * 0.35);
      const color = K.pick(COLORS);
      const n = K.reduced ? 12 : 46;
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2;
        const v = 3 + Math.random() * 3.5;
        add({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, g: 0.06, drag: 0.965, size: 3 + Math.random() * 4, shape: i % 5 ? 'circle' : 'heart', color: Math.random() < 0.8 ? color : '#fff', life: 90, fade: 50 });
      }
      K.audio && K.audio.sfx.pop();
      setTimeout(shoot, 380 + Math.random() * 400);
    };
    shoot();
  }

  /* ---------- Dokunma ve imleç pırıltısı ---------- */
  function ambient() {
    if (K.reduced) return;
    document.addEventListener(
      'pointerdown',
      (e) => {
        if (e.target.closest('canvas, input, textarea, .no-burst')) return;
        burst(e.clientX, e.clientY, { count: 5, power: 3 });
      },
      { passive: true }
    );
    if (!K.touch) {
      let last = 0;
      document.addEventListener(
        'pointermove',
        (e) => {
          const now = performance.now();
          if (now - last < 55 || e.target.closest('canvas')) return;
          last = now;
          add({ x: e.clientX, y: e.clientY, vx: (Math.random() - 0.5) * 0.6, vy: -0.2, g: 0.02, drag: 0.98, size: 3 + Math.random() * 3, shape: Math.random() < 0.5 ? 'spark' : 'heart', color: K.pick(['#FF8FB8', '#FFD34E', '#C9B6FF', '#FF6FA3']), life: 34, fade: 30 });
        },
        { passive: true }
      );
    }
  }

  /* ---------- Bildirim balonu ---------- */
  let toastBox;
  function toast(html, o = {}) {
    if (!toastBox) {
      toastBox = K.el('<div class="toasts" role="status" aria-live="polite"></div>');
      document.body.appendChild(toastBox);
    }
    const t = K.el(`<div class="toast ${o.cls || ''}">${o.icon ? `<span class="toast-ic">${o.icon}</span>` : ''}<span class="toast-tx">${html}</span></div>`);
    toastBox.appendChild(t);
    requestAnimationFrame(() => t.classList.add('in'));
    setTimeout(() => {
      t.classList.remove('in');
      setTimeout(() => t.remove(), 400);
    }, o.duration || 3400);
  }

  /* ---------- Pencere (modal) ---------- */
  function modal(o = {}) {
    const lastFocus = document.activeElement;
    const wrap = K.el(`<div class="modal ${o.cls || ''}" role="dialog" aria-modal="true" ${o.label ? `aria-label="${K.esc(o.label)}"` : ''}>
      <div class="modal-back" data-close></div>
      <div class="modal-panel">
        <button class="modal-x icon-btn" data-close aria-label="Kapat">${K.art.ui('close')}</button>
        <div class="modal-body"></div>
      </div>
    </div>`);
    const body = wrap.querySelector('.modal-body');
    if (typeof o.html === 'string') body.innerHTML = o.html;
    else if (o.html) body.appendChild(o.html);
    document.body.appendChild(wrap);
    document.body.classList.add('has-modal');
    requestAnimationFrame(() => wrap.classList.add('in'));
    let closed = false;
    const close = () => {
      if (closed) return;
      closed = true;
      wrap.classList.remove('in');
      document.removeEventListener('keydown', onKey);
      setTimeout(() => {
        wrap.remove();
        if (!document.querySelector('.modal')) document.body.classList.remove('has-modal');
        lastFocus && lastFocus.focus && lastFocus.focus({ preventScroll: true });
      }, 320);
      o.onClose && o.onClose();
    };
    const onKey = (e) => e.key === 'Escape' && close();
    document.addEventListener('keydown', onKey);
    wrap.addEventListener('click', (e) => {
      if (e.target.closest('[data-close]')) close();
    });
    setTimeout(() => {
      const f = wrap.querySelector('[autofocus], .modal-body button, .modal-body input, .modal-body a');
      (f || wrap.querySelector('.modal-x')).focus({ preventScroll: true });
    }, 60);
    return { el: wrap, body, close };
  }

  K.fx = { confetti, rain, burst, fireworks, ambient, toast, add };
  K.ui = { modal };
})();
