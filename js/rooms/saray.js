/* Oda (mevsimlik): Doğum Günü Sarayı — 23 Nisan'dan bir hafta önce kurulur, o gün 23 hediye kutusu açılır */
(function () {
  'use strict';
  const K = window.K;
  const A = K.art;
  const D = window.ELN;
  const C = D.config;
  const T = K.time;

  let root;
  const opened = () => K.store.get('giftsOpen', {});
  const bd = () => T.nextAnnual(C.herBirthday);
  const isDay = () => bd().days === 0;
  const after = () => {
    const p = T.baku();
    const [m, d] = C.herBirthday.split('-').map(Number);
    return p.mo === m && p.d >= d;
  };
  const COLS = ['#FF8FB8', '#C9B6FF', '#8FD3FF', '#FFD34E', '#7ED6A5', '#FFB3CE', '#FF6FA3'];

  function box(i, open) {
    const c = COLS[i % COLS.length];
    const r = COLS[(i + 3) % COLS.length];
    return `<svg class="gb-svg" viewBox="0 0 100 100" aria-hidden="true">
      <rect x="14" y="44" width="72" height="50" rx="6" fill="${c}" stroke="#4A2138" stroke-width="4"/>
      <rect x="44" y="44" width="12" height="50" fill="${r}" stroke="#4A2138" stroke-width="3"/>
      <g class="gb-lid"><rect x="8" y="30" width="84" height="18" rx="5" fill="${c}" stroke="#4A2138" stroke-width="4"/><rect x="44" y="30" width="12" height="18" fill="${r}" stroke="#4A2138" stroke-width="3"/>
      <g transform="translate(50 28) scale(.34)">${A.bowShape(r, '#4A2138')}</g></g>
      <text x="50" y="80" text-anchor="middle" font-family="Fredoka, sans-serif" font-weight="700" font-size="18" fill="#fff" stroke="#4A2138" stroke-width="1.2">${i + 1}</text>
    </svg>`;
  }

  function render() {
    const op = opened();
    const can = after();
    const gifts = D.birthdayGifts;
    const n = Object.keys(op).length;
    K.$('#gbHead', root).innerHTML = can
      ? `<p class="card-eyebrow">${isDay() ? 'Bugün senin günün' : 'Sarayın kapıları açık'}</p><h3>İyi ki doğdun, Prenses ${K.esc(C.herPet)}!</h3><p>${n < gifts.length ? `${gifts.length} kutu, her birinde doğduğun güne bir teşekkür. ${gifts.length - n} tanesi hâlâ kapalı.` : 'Bütün kutuları açtın. Son sürpriz aşağıda.'}</p>`
      : `<p class="card-eyebrow">Saray hazırlanıyor</p><h3>${K.num(bd().days)} gün sonra burada büyük bir parti var</h3><p>Balonlar şişiriliyor, kutular paketleniyor. ${K.esc(C.herBirthday.slice(3).replace(/^0/, ''))} ${K.MONTHS[+C.herBirthday.slice(0, 2) - 1]}'da kapılar açılacak.</p>`;
    K.$('#gbGrid', root).innerHTML = gifts
      .map((_, i) => `<button class="gb ${op[i] ? 'open' : ''} ${can ? '' : 'wait'}" data-i="${i}" style="--d:${(i % 8) * 0.06}s" aria-label="${i + 1}. hediye">${box(i)}${op[i] ? `<span class="gb-note hand">${K.esc(K.fill(gifts[i]))}</span>` : ''}</button>`)
      .join('');
    const fin = K.$('#gbFinal', root);
    fin.hidden = !(can && n >= gifts.length);
    if (!fin.hidden)
      fin.innerHTML = `<p class="card-eyebrow">Son sürpriz</p><h3>Pastan ve mektubun hazır</h3>
        <div class="actions" style="justify-content:center"><a class="btn red" href="#ozel">${A.icon('cake')} Mumları üfle</a><a class="btn soft" href="#mektuplar">Doğum günü mektubun</a>${K.voice ? K.voice.btn('dogum-gunu', 'Sana şarkı söyledim') : ''}</div>`;
  }

  function open(i) {
    if (!after()) {
      K.audio.sfx.fail();
      K.fx.toast(`Kutular ${K.num(bd().days)} gün sonra açılacak. Kurdeleyi şimdiden çözme!`, { icon: A.icon('gift') });
      return;
    }
    const op = opened();
    if (op[i]) return;
    op[i] = T.todayKey();
    K.store.set('giftsOpen', op);
    K.audio.sfx.pop();
    const b = K.$(`.gb[data-i="${i}"]`, root);
    const r = b.getBoundingClientRect();
    K.fx.burst(r.left + r.width / 2, r.top + r.height / 3, { count: 14, power: 6, shapes: ['heart', 'star', 'bow'] });
    b.classList.add('opening');
    setTimeout(() => {
      render();
      if (Object.keys(opened()).length >= D.birthdayGifts.length) {
        K.stickers.award('hediyeler');
        K.fx.confetti({ count: 200 });
        K.notify(`${C.herName} 23 kutunun hepsini açtı`, 'Doğum günü sarayı tamamlandı.', ['gift']);
      }
    }, 450);
  }

  K.room({
    id: 'saray',
    wing: 'mevsim',
    title: 'Doğum Günü Sarayı',
    sub: () => (after() ? '23 hediye kutusu seni bekliyor' : `${bd().days} gün sonra açılıyor`),
    icon: 'gift',
    color: '#FFD6E5',
    hidden: () => {
      const p = T.baku();
      const [m, d] = C.herBirthday.split('-').map(Number);
      return !(p.mo === m && p.d >= d - 7 && p.d <= d + 7);
    },
    badge: () => (after() ? `${Object.keys(opened()).length}/${D.birthdayGifts.length}` : ''),
    init(el) {
      root = el;
      el.innerHTML = `
        <div class="gb-balloons" aria-hidden="true">${Array.from({ length: 9 }, (_, i) => `<i style="left:${4 + i * 11}%;--c:${COLS[i % COLS.length]};--d:${-(i * 1.1)}s;--t:${9 + (i % 4)}s"></i>`).join('')}</div>
        <div class="card gb-head" id="gbHead"></div>
        <div class="gb-grid" id="gbGrid"></div>
        <div class="card gb-final" id="gbFinal" hidden></div>`;
      K.$('#gbGrid', el).addEventListener('click', (e) => {
        const b = e.target.closest('.gb');
        if (b) open(+b.dataset.i);
      });
    },
    enter() {
      render();
    },
  });
})();
