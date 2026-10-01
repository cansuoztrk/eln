/* Kale 2.0 — Kart desteleri: telefonda ana salonun özel kartları ve "Bugün senin için" kartları alt alta uzamak yerine
   yana kayan bir deste olur (yandaki kart kenardan görünür, altta noktalar). Masaüstünde eski ızgara kalır. */
(function () {
  'use strict';
  const K = window.K;

  const mq = window.matchMedia ? window.matchMedia('(max-width: 759px)') : { matches: false, addEventListener() {} };
  const decks = [];
  function make(box, min) {
    if (!box) return;
    const d = { box, min, dots: null };
    decks.push(d);
    const mo = new MutationObserver(() => update(d));
    mo.observe(box, { childList: true, attributes: true, subtree: false, attributeFilter: ['hidden'] });
    // Çocukların [hidden] değişimleri
    new MutationObserver(() => update(d)).observe(box, { subtree: true, attributes: true, attributeFilter: ['hidden'] });
    let raf = 0;
    box.addEventListener('scroll', () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        mark(d);
      });
    }, { passive: true });
    update(d);
  }
  const items = (d) => [...d.box.children].filter((c) => !c.hidden && c.offsetParent !== null && !c.classList.contains('deck-dots'));
  function update(d) {
    const on = mq.matches && !d.box.hidden && [...d.box.children].filter((c) => !c.hidden).length >= d.min;
    d.box.classList.toggle('deck', on);
    if (!on) {
      if (d.dots) d.dots.remove();
      d.dots = null;
      return;
    }
    const list = items(d);
    if (!d.dots) {
      d.dots = K.el('<div class="deck-dots" role="tablist" aria-label="Kartlar"></div>');
      d.box.after(d.dots);
      d.dots.addEventListener('click', (e) => {
        const b = e.target.closest('button');
        if (!b) return;
        const it = items(d)[+b.dataset.i];
        it && d.box.scrollTo({ left: it.offsetLeft - (d.box.clientWidth - it.offsetWidth) / 2, behavior: K.reduced ? 'auto' : 'smooth' });
      });
    }
    if (d.dots.childElementCount !== list.length) d.dots.innerHTML = list.map((_, i) => `<button type="button" data-i="${i}" aria-label="${i + 1}. kart"></button>`).join('');
    mark(d);
  }
  function mark(d) {
    if (!d.dots) return;
    const list = items(d);
    const mid = d.box.scrollLeft + d.box.clientWidth / 2;
    let best = 0, bd = Infinity;
    list.forEach((it, i) => {
      const c = it.offsetLeft + it.offsetWidth / 2;
      if (Math.abs(c - mid) < bd) (bd = Math.abs(c - mid)), (best = i);
    });
    [...d.dots.children].forEach((b, i) => b.setAttribute('aria-current', String(i === best)));
  }
  const all = () => decks.forEach(update);
  mq.addEventListener ? mq.addEventListener('change', all) : mq.addListener && mq.addListener(all);
  K.on('built', () => {
    make(K.$('#special'), 2);
    make(K.$('.today-grid'), 2);
  });
  K.deste = { update: all };
})();
