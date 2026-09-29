/* Eln'in Krallığı — Pembenin Tonları: kalenin rengi (pudra, şeker, gül kurusu, fuşya, şeftali). Seçim bu cihazda hatırlanır. */
(function () {
  'use strict';
  const K = window.K;
  const THEMES = [
    ['pudra', 'Pudra', '#FF8FB8', '#FFD0E1'],
    ['seker', 'Şeker', '#FF5FA8', '#FFC4E1'],
    ['gul', 'Gül kurusu', '#C97A92', '#EFCAD3'],
    ['fusya', 'Fuşya', '#E0199A', '#FFC7EA'],
    ['seftali', 'Şeftali', '#F2706D', '#FFD3C8'],
  ];
  function apply(t) {
    const root = document.documentElement;
    if (t && t !== 'pudra') root.dataset.tema = t;
    else delete root.dataset.tema;
    const th = THEMES.find((x) => x[0] === t) || THEMES[0];
    const m = document.querySelector('meta[name="theme-color"]');
    if (m) m.setAttribute('content', th[3]);
  }
  apply(K.store.get('tema', 'pudra'));

  K.on('built', () => {
    const box = K.$('#footTheme');
    if (!box) return;
    const cur = K.store.get('tema', 'pudra');
    box.innerHTML = `<span>Kalenin rengi</span>${THEMES.map(([id, name, c, c2]) => `<button class="th-sw" data-tema="${id}" style="--a:${c};--b:${c2}" aria-pressed="${id === cur}" aria-label="${name}" title="${name}"></button>`).join('')}`;
    box.addEventListener('click', (e) => {
      const b = e.target.closest('[data-tema]');
      if (!b) return;
      K.store.set('tema', b.dataset.tema);
      apply(b.dataset.tema);
      K.$$('[data-tema]', box).forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
      K.audio.sfx.sparkle();
      K.fx.toast(`Kalenin rengi: ${b.getAttribute('aria-label')}. Pembenin her tonu sana yakışıyor.`, { icon: K.art.icon('palette') });
      if (b.dataset.tema !== 'pudra') K.stickers.award('pembe');
    });
  });
})();
