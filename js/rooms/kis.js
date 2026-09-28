/* Oda (mevsimlik): Kış Takvimi — tanışma yıldönümünden (6 Aralık) yılbaşına her gün bir kapı */
(function () {
  'use strict';
  const K = window.K;
  const A = K.art;
  const D = window.ELN;
  const C = D.config;
  const T = K.time;

  let root;
  const FIRST = 6;
  const opened = () => K.store.get('adventOpen', {});
  // Aralık'ın hangi yılı: Ocak'taysak geçen yılın Aralık'ı
  const year = () => {
    const p = T.baku();
    return p.mo === 1 ? p.y - 1 : p.y;
  };
  const dateOf = (i) => `${year()}-12-${K.pad(FIRST + i)}`;
  const isOpen = (i) => T.daysUntil(dateOf(i)) <= 0;
  const TYPE = { note: 'heart', az: 'board', task: 'list', memory: 'chat', photo: 'camera', coupon: 'ticket', question: 'question', room: 'star', song: 'vinyl' };

  function render() {
    const op = opened();
    const items = D.advent;
    K.$('#adGrid', root).innerHTML = items
      .map((it, i) => {
        const day = FIRST + i;
        const can = isOpen(i);
        const done = op[i];
        return `<button class="ad-door ${done ? 'done' : ''} ${can ? 'can' : 'locked'}" data-i="${i}" style="--r:${[-2, 1.5, -1, 2, -1.5, 1][i % 6]}deg;--h:${[0, 35, 200, 280, 140][i % 5]}" aria-label="${day} Aralık${can ? '' : ' (henüz kilitli)'}">
          <span class="ad-snow"></span>
          <span class="ad-num">${day}</span>
          ${done ? `<span class="ad-ic">${A.icon(TYPE[it.type] || 'heart')}</span>` : can ? '<span class="ad-bow">' + A.bow('#E3174D') + '</span>' : `<span class="ad-lock">${A.ui('lock')}</span>`}
        </button>`;
      })
      .join('');
    const n = Object.keys(op).length;
    K.$('#adCount', root).textContent = `${n} / ${items.length} kapı açıldı`;
    const next = items.findIndex((_, i) => !isOpen(i));
    K.$('#adNext', root).textContent = next < 0 ? 'Bütün kapılar açık.' : next === 0 ? `İlk kapı ${FIRST} Aralık'ta açılacak: ${K.num(T.daysUntil(dateOf(0)))} gün kaldı.` : `Yarın ${FIRST + next} Aralık kapısı açılacak.`;
  }

  function open(i) {
    const it = D.advent[i];
    if (!isOpen(i)) {
      K.audio.sfx.fail();
      K.fx.toast(`Bu kapı ${FIRST + i} Aralık'ta açılacak. Sabır, prenses.`, { icon: A.icon('snow') });
      return;
    }
    const op = opened();
    const first = !op[i];
    op[i] = T.todayKey();
    K.store.set('adventOpen', op);
    if (Object.keys(op).length >= 10) K.stickers.award('kis');
    K.audio.sfx.sparkle();
    const photo = it.type === 'photo' && it.photo ? `<div class="ad-photo"><img data-vault="${K.esc(it.photo)}" alt=""></div>` : '';
    const extra =
      it.type === 'coupon'
        ? `<button class="btn red small" data-coupon>${A.icon('ticket')} Kuponu kullan</button>`
        : it.type === 'room' && it.room
        ? `<a class="btn small" href="#${K.esc(it.room)}">Oraya git</a>`
        : it.type === 'question' || it.type === 'task'
        ? `<form class="row" data-reply autocomplete="off"><input class="input" name="adReply" id="adReply" maxlength="300" placeholder="Cevabını yaz"><button class="btn small" type="submit">${A.ui('send')}</button></form>`
        : '';
    const m = K.ui.modal({
      cls: 'advent-modal',
      label: `${FIRST + i} Aralık`,
      html: `<div class="ad-open">
        <p class="ad-date">${FIRST + i} Aralık</p>
        <h3>${K.esc(it.title)}</h3>
        ${photo}
        <p class="ad-text">${K.esc(K.fill(it.text))}</p>
        <div class="actions" style="justify-content:center">${extra}</div>
      </div>`,
      onClose: render,
    });
    K.vault.fill(m.el);
    if (first) K.fx.rain({ count: 40, shapes: ['star', 'spark'], colors: ['#FFFFFF', '#DCEBFF', '#C9B6FF', '#FFD6E5'] });
    m.el.addEventListener('click', async (e) => {
      if (!e.target.closest('[data-coupon]')) return;
      const ok = await K.notify(`${C.herName} kış kuponunu kullandı`, it.title + '\n' + it.text, ['ticket']);
      K.fx.toast(ok ? 'Kupon kullanıldı; haberi gitti.' : 'Kupon kullanıldı.', { icon: A.icon('ticket') });
      e.target.closest('[data-coupon]').disabled = true;
    });
    const f = K.$('[data-reply]', m.el);
    f &&
      f.addEventListener('submit', async (e) => {
        e.preventDefault();
        const v = K.$('#adReply', m.el).value.trim();
        if (!v) return;
        await K.notify(`Kış takvimi: ${C.herName} cevapladı`, `${it.text}\n\n"${v}"`, ['snowflake']);
        f.innerHTML = `<p class="muted small">Cevabın gitti ♥</p>`;
      });
  }

  K.room({
    id: 'kis',
    wing: 'mevsim',
    title: 'Kış Takvimi',
    sub: 'Her gün bir kapı, yılın son gününe kadar',
    icon: 'snow',
    color: '#D6F1FF',
    hidden: () => {
      const p = T.baku();
      return !(p.mo === 12 || (p.mo === 1 && p.d <= 10));
    },
    badge: () => {
      const op = opened();
      const n = D.advent.filter((_, i) => isOpen(i) && !op[i]).length;
      return n ? `${n} kapı` : '';
    },
    init(el) {
      root = el;
      el.innerHTML = `
        <div class="ad-hero">
          <div class="ad-flakes" aria-hidden="true">${Array.from({ length: 18 }, (_, i) => `<i style="left:${(i * 37) % 100}%;--d:${-(i * 1.3)}s;--t:${8 + (i % 5)}s"></i>`).join('')}</div>
          <p class="card-eyebrow">6 Aralık · 31 Aralık</p>
          <h3>Kış Takvimi</h3>
          <p>Tanıştığımız günden yılın son gününe kadar her sabah bir kapı açılıyor. İçinde bazen bir mektup, bazen bir soru, bazen bir kupon.</p>
          <p class="muted small" id="adCount"></p>
          <p class="ad-next" id="adNext"></p>
        </div>
        <div class="ad-grid" id="adGrid"></div>`;
      K.$('#adGrid', el).addEventListener('click', (e) => {
        const b = e.target.closest('.ad-door');
        if (b) open(+b.dataset.i);
      });
    },
    enter() {
      render();
    },
  });
})();
