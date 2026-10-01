/* Kale 2.0 — Dokunmatik jestler: ana ekrana eklenmiş kalede (iPhone'da tarayıcının geri düğmesi yok) odadan çıkmak için
   ekranın sol kenarından sağa kaydır; oda parmağı izler, yeterince çekince ana salona döner. */
(function () {
  'use strict';
  const K = window.K;

  const standalone = () => Boolean(window.navigator.standalone || (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches));
  const EDGE = 28;
  let st = null;
  function view() {
    return K.$('#roomView');
  }
  document.addEventListener(
    'touchstart',
    (e) => {
      if (!K.activeRoom || e.touches.length !== 1 || !(standalone() || K.store.get('jestHep'))) return;
      const t = e.touches[0];
      if (t.clientX > EDGE) return;
      if (K.$('.modal') || K.$('.kmenu') || K.$('.hk-view') || K.$('.yn')) return;
      st = { x: t.clientX, y: t.clientY, t: Date.now(), dx: 0, on: false };
    },
    { passive: true }
  );
  document.addEventListener(
    'touchmove',
    (e) => {
      if (!st) return;
      const t = e.touches[0];
      const dx = t.clientX - st.x, dy = t.clientY - st.y;
      if (!st.on) {
        if (Math.abs(dy) > 18 && Math.abs(dy) > Math.abs(dx)) return (st = null);
        if (dx < 10) return;
        st.on = true;
        const v = view();
        v.style.transition = 'none';
        document.body.classList.add('jest-on');
      }
      st.dx = Math.max(0, dx);
      view().style.transform = `translateX(${st.dx}px)`;
      view().style.boxShadow = `-12px 0 30px rgba(74,33,56,${0.18 * (1 - st.dx / window.innerWidth)})`;
      if (e.cancelable) e.preventDefault();
    },
    { passive: false }
  );
  function end() {
    if (!st) return;
    const s = st;
    st = null;
    if (!s.on) return;
    const v = view();
    const fast = s.dx / Math.max(1, Date.now() - s.t) > 0.6;
    v.style.transition = 'transform .28s cubic-bezier(.22,1,.36,1), box-shadow .28s';
    document.body.classList.remove('jest-on');
    if (s.dx > window.innerWidth * 0.33 || (fast && s.dx > 60)) {
      v.style.transform = `translateX(${window.innerWidth}px)`;
      K.vibrate(10);
      setTimeout(() => {
        K.$('#roomBack') && K.$('#roomBack').click();
        setTimeout(() => {
          v.style.transition = '';
          v.style.transform = '';
          v.style.boxShadow = '';
        }, 520);
      }, 260);
    } else {
      v.style.transform = '';
      v.style.boxShadow = '';
      setTimeout(() => (v.style.transition = ''), 300);
    }
  }
  document.addEventListener('touchend', end, { passive: true });
  document.addEventListener('touchcancel', end, { passive: true });
  K.jest = { standalone };
})();
