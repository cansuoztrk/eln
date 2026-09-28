/* Oda: Çıkartma Albümü — başarımlar; hepsi toplanınca gizli mektup açılır */
(function () {
  'use strict';
  const K = window.K;
  const A = K.art;
  const D = window.ELN;
  const C = D.config;
  const T = K.time;

  let root;

  function render() {
    const got = K.stickers.got();
    const n = K.stickers.done();
    const total = K.stickers.total;
    const all = n >= total;
    K.$('#albumHead', root).innerHTML = `<div class="bk-ring" style="--p:${Math.round((n / total) * 100)}"><span>${n}/${total}</span></div>
      <div><h3>${all ? 'Albüm tamamlandı!' : `${total - n} çıkartma daha`}</h3>
      <p class="muted">${all ? 'Gizli mektup artık senin.' : 'Hepsini topladığında albümün son sayfasında gizli bir mektup açılacak. İpuçları boş yerlerin altında.'}</p></div>`;
    K.$('#albumGrid', root).innerHTML = K.stickers.DEFS.map((d, i) => {
      const date = got[d.id];
      return `<div class="slot ${date ? 'has' : ''} ${d.bonus ? 'bonus' : ''}" style="--r:${[-6, 4, -3, 7, -5, 2][i % 6]}deg">
        ${date ? K.stickers.art(d) : `<span class="sticker ghost">${A.icon(d.icon)}</span>`}
        <b>${date ? K.esc(d.name) : '?'}</b>
        <small>${date ? T.fmt(date) : K.esc(d.hint)}</small>${d.bonus ? '<span class="slot-bonus">Bonus</span>' : ''}
      </div>`;
    }).join('');
    const s = K.$('#albumSecret', root);
    s.innerHTML = all
      ? `<div>${A.icon('key')}</div><div><h3>Gizli mektup</h3><p>Bütün çıkartmaları topladın. Bu kapı sadece senin için açıldı.</p><button class="btn red" id="secretBtn">${A.ui('heart')} Mektubu aç</button></div>`
      : `<div class="locked-ic">${A.ui('lock')}</div><div><h3>Gizli mektup</h3><p>Kilitli. Anahtarı: ${total} çıkartmanın hepsi.</p></div>`;
    const b = K.$('#secretBtn', root);
    b &&
      b.addEventListener('click', () => {
        K.audio.sfx.chime();
        K.fx.confetti({ count: 120 });
        K.ui.modal({
          cls: 'letter-modal opened',
          label: 'Gizli mektup',
          html: `<div class="la"><article class="la-paper"><p class="la-kicker">Gizli mektup</p><div class="la-text">${K.paras(D.secretLetter)}</div></article></div>`,
        });
      });
  }

  K.room({
    id: 'album',
    wing: 'hazine',
    title: 'Çıkartma Albümü',
    sub: 'Kalede topladıkların',
    icon: 'sticker',
    color: '#FFF3C4',
    badge: () => `${K.stickers.done()}/${K.stickers.total}`,
    init(el) {
      root = el;
      el.innerHTML = `
        <p class="room-intro">Kalede gezdikçe, oynadıkça ve farklı saatlerde uğradıkça çıkartma kazanırsın. Bazıları kolay, bazıları sabır ister, biri de iyi saklanmış bir sır.</p>
        <div class="card album-head" id="albumHead"></div>
        <div class="album-grid" id="albumGrid"></div>
        <div class="card album-secret" id="albumSecret"></div>`;
      K.on('sticker', () => K.activeRoom === 'album' && render());
    },
    enter() {
      render();
    },
  });
})();
