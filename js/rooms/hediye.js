/* Oda (gizli): Hediye Kapısı — sadece gerçek dünyadaki bir kartın QR kodu (…/#hediye-kutusu) açar */
(function () {
  'use strict';
  const K = window.K;
  const A = K.art;
  const D = window.ELN;
  const C = D.config;

  K.room({
    id: 'hediye-kutusu',
    wing: 'kalp',
    secret: true,
    title: 'Hediye Kapısı',
    sub: 'Gerçek dünyadan açılan oda',
    icon: 'gift',
    color: '#FFE9B8',
    hidden: () => !K.store.get('giftFound'),
    unlockByLink() {
      K.store.set('giftFound', true);
      K.stickers.award('kapi');
      K.notify(`${C.herName} hediye kartını okuttu`, 'Kutu açıldı, kart okundu. Gerçek dünyadan kaleye bir kapı açıldı.', ['gift']);
    },
    init(el) {
      const g = D.giftDoor || {};
      el.innerHTML = `
        <div class="hd">
          <div class="hd-box" aria-hidden="true">
            <div class="hd-lid">${A.bow('#E3174D')}</div>
            <div class="hd-base"></div>
            <div class="hd-shine"></div>
          </div>
          <article class="la-paper hd-letter">
            <p class="la-kicker">${K.esc(g.title || 'Hediye kapısı')}</p>
            <div class="la-text">${K.paras(g.body || [])}</div>
            <p class="la-sign">— ${K.esc(g.sign || C.myPet)}</p>
          </article>
        </div>`;
    },
    enter(el) {
      const hd = K.$('.hd', el);
      hd.classList.remove('open');
      setTimeout(() => {
        hd.classList.add('open');
        K.audio.sfx.chime();
        K.fx.confetti({ count: 120, shapes: ['heart', 'bow', 'star'] });
      }, 500);
    },
  });
})();
