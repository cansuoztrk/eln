/* Oda: Sesim — Onun sesli notları bir kaset rafında. Ses dosyası gelene kadar bu oda görünmez. */
(function () {
  'use strict';
  const K = window.K;
  const A = K.art;
  const D = window.ELN;
  const C = D.config;
  const T = K.time;

  let root;
  const lockText = (v) => {
    if (!v.lock) return '';
    if (v.lock.length === 5) return `${+v.lock.slice(3)} ${K.MONTHS[+v.lock.slice(0, 2) - 1]}'da açılır`;
    return `${T.fmt(v.lock)}'da açılır`;
  };

  function render() {
    const vs = K.voice.list();
    const heard = K.voice.heard();
    K.$('#svCount', root).textContent = `${vs.filter((v) => heard[v.id]).length} / ${vs.length} ses dinlendi`;
    K.$('#svList', root).innerHTML = vs
      .map((v, i) => {
        const open = K.voice.unlocked(v);
        return `<li class="sv-item ${open ? '' : 'locked'} ${heard[v.id] ? 'heard' : ''}" style="--d:${i * 0.05}s;--c:${['#FFB3CE', '#C9B6FF', '#8FD3FF', '#FFE08A', '#A8E6C4'][i % 5]}">
          <span class="sv-reel" aria-hidden="true"><i></i><i></i></span>
          <div class="sv-tx"><b>${K.esc(v.title)}</b><small>${K.esc(open ? v.where || '' : lockText(v))}</small></div>
          ${open ? `<button class="sv-play" data-voice="${v.id}" aria-label="${K.esc(v.title)} dinle">${A.ui('play')}</button>` : `<span class="sv-lock">${A.ui('lock')}</span>`}
        </li>`;
      })
      .join('');
  }

  K.room({
    id: 'sesim',
    wing: 'kalp',
    title: 'Sesim',
    sub: () => `${C.myPet}'un sesli notları`,
    icon: 'mic',
    color: '#FFE0E0',
    hidden: () => !K.voice || !K.voice.any(),
    badge: () => {
      const n = K.voice.list().filter((v) => K.voice.unlocked(v) && !K.voice.heard()[v.id]).length;
      return n ? `${n} yeni` : '';
    },
    init(el) {
      root = el;
      el.innerHTML = `
        <div class="sv-hero">
          <div class="sv-radio" aria-hidden="true">
            <span class="sv-ant"></span>
            <div class="sv-face">${A.kitty({ bow: '#4FA3E3', eyes: 'happy' })}</div>
            <div class="sv-dial"><i></i></div>
            <div class="sv-speaker">${'<i></i>'.repeat(15)}</div>
          </div>
          <div>
            <p class="room-intro">Bu kalede her şeyi yazdım; bu odaya ise sesimi bıraktım. Bazıları sabah, bazıları gece, bazıları sadece özel bir günde açılıyor. Kulaklığını tak, gözlerini kapat.</p>
            ${K.voice.btn('ilk-ses', 'Önce bunu dinle', 'big')}
            <p class="muted small" id="svCount"></p>
          </div>
        </div>
        <ul class="sv-list" id="svList"></ul>`;
      K.on('voice-heard', () => K.activeRoom === 'sesim' && render());
    },
    enter() {
      render();
    },
  });
})();
