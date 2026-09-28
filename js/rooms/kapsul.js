/* Oda: Zaman Kapsülü — geleceğe mektup: kavanoza kapat, açılış gününe kadar okunmaz. Onun gömdükleri de burada. */
(function () {
  'use strict';
  const K = window.K;
  const A = K.art;
  const D = window.ELN;
  const C = D.config;
  const T = K.time;

  let root;
  const mine = () => K.store.get('capsules', []);

  function presets() {
    const p = T.baku();
    const out = [
      [`${p.y + 1}-01-01`, 'Yılbaşı'],
      [T.key({ y: p.y + 1, mo: p.mo, d: p.d }), 'Bir yıl sonra'],
    ];
    const ann = T.nextAnnual(C.togetherDate.slice(5));
    out.push([T.key(T.baku(ann.date)), 'Yıldönümümüz']);
    const bd = T.nextAnnual(C.herBirthday);
    out.push([T.key(T.baku(bd.date)), 'Doğum günün']);
    return out;
  }

  function jarSvg(sealed, i) {
    const c = ['#FFB3CE', '#C9B6FF', '#8FD3FF', '#FFE08A', '#A8E6C4'][i % 5];
    return `<svg class="kp-jar" viewBox="0 0 120 150" aria-hidden="true">
      <rect x="30" y="8" width="60" height="18" rx="5" fill="${sealed ? '#E3174D' : '#FFB547'}" stroke="#4A2138" stroke-width="4"/>
      <path d="M36 26 H84 V34 C102 42 106 56 106 72 V128 A14 14 0 0 1 92 142 H28 A14 14 0 0 1 14 128 V72 C14 56 18 42 36 34 Z" fill="#EAF6FF" fill-opacity=".85" stroke="#4A2138" stroke-width="4"/>
      <g transform="translate(60 96) rotate(-8)"><rect x="-26" y="-18" width="52" height="36" rx="4" fill="${c}" stroke="#4A2138" stroke-width="3"/><path d="M-26 -16 L0 4 L26 -16" fill="none" stroke="#4A2138" stroke-width="3"/></g>
      <path d="M24 60 Q22 90 26 120" stroke="#fff" stroke-width="5" stroke-linecap="round" fill="none" opacity=".8"/>
      ${sealed ? `<g transform="translate(60 18) scale(.28)">${A.bowShape('#FFD34E', '#4A2138')}</g>` : ''}
    </svg>`;
  }

  function card(c, i, from) {
    const open = T.daysUntil(c.open) <= 0;
    const days = T.daysUntil(c.open);
    return `<article class="kc ${open ? 'open' : 'sealed'}" data-id="${K.esc(c.id)}" data-from="${from}" style="--d:${i * 0.06}s">
      ${jarSvg(!open, i)}
      <div class="kc-tx">
        <p class="card-eyebrow">${from === 'me' ? `${K.esc(C.myPet)}'un kapsülü` : 'Senin kapsülün'}</p>
        <h3>${K.esc(c.title || 'Geleceğe mektup')}</h3>
        <p class="muted small">${open ? `${T.fmt(c.open)} itibarıyla açık` : `${T.fmt(c.open)}'da açılacak · ${K.num(days)} gün`}</p>
        ${open ? `<button class="btn small" data-read>${A.ui('heart')} Aç ve oku</button>` : `<span class="kc-lock">${A.ui('lock')} Mühürlü</span>`}
      </div>
    </article>`;
  }

  function render() {
    const my = mine();
    const his = D.capsules || [];
    K.$('#kcList', root).innerHTML = his.map((c, i) => card(c, i, 'me')).join('') + my.map((c, i) => card(c, i + his.length, 'her')).join('') || '<p class="muted">Kavanozlar boş.</p>';
  }

  function read(id, from) {
    const c = from === 'me' ? (D.capsules || []).find((x) => x.id === id) : mine().find((x) => x.id === id);
    if (!c) return;
    K.audio.sfx.paper();
    const body = from === 'me' ? K.paras(c.body || []) : `<p>${K.esc(c.text).replace(/\n/g, '</p><p>')}</p>`;
    const m = K.ui.modal({
      cls: 'letter-modal',
      label: c.title || 'Zaman kapsülü',
      html: `<div class="la"><article class="la-paper"><p class="la-kicker">${from === 'me' ? 'Geçmişten gelen mektup' : `${T.fmt(c.created)} tarihinde yazdın`}</p><div class="la-text">${body}</div><p class="la-sign">— ${K.esc(from === 'me' ? c.sign || C.myPet : `Geçmişteki ${C.herPet}`)}</p></article></div>`,
    });
    setTimeout(() => m.el.classList.add('opened'), 60);
    K.fx.rain({ count: 30, shapes: ['star', 'heart'] });
  }

  K.room({
    id: 'kapsul',
    wing: 'kalp',
    title: 'Zaman Kapsülü',
    sub: 'Geleceğe mektuplar',
    icon: 'jar',
    color: '#D6F1FF',
    init(el) {
      root = el;
      const pr = presets();
      el.innerHTML = `
        <p class="room-intro">Bugünkü sen, gelecekteki sana (ya da bize) bir şey söylemek istiyorsa buraya yaz. Kavanoz kapanır ve seçtiğin güne kadar açılmaz; kopyası da bende saklanır, kaybolmaz.</p>
        <form class="card kc-form" id="kcForm" autocomplete="off">
          <p class="card-eyebrow">Yeni kapsül</p>
          <input class="input" id="kcTitle" name="kcTitle" maxlength="60" placeholder="Başlık (ör. 2027'deki bize)">
          <textarea class="textarea hand-area" id="kcText" name="kcText" maxlength="3000" placeholder="Sevgili gelecekteki biz..."></textarea>
          <div class="kc-when">
            <span class="muted small">Açılış günü:</span>
            <div class="kc-presets">${pr.map(([d, l], i) => `<button type="button" class="chip" data-d="${d}" aria-pressed="${i === 0}">${l}</button>`).join('')}</div>
            <input class="input" type="date" id="kcDate" name="kcDate" value="${pr[0][0]}" min="${T.todayKey()}">
          </div>
          <button class="btn red" type="submit">${A.icon('jar')} Kavanoza kapat</button>
        </form>
        <h3 class="sub-h">Kavanozlar</h3>
        <div class="kc-list" id="kcList"></div>`;
      const di = K.$('#kcDate', el);
      K.$('.kc-presets', el).addEventListener('click', (e) => {
        const b = e.target.closest('[data-d]');
        if (!b) return;
        di.value = b.dataset.d;
        K.$$('.kc-presets .chip', el).forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
      });
      K.$('#kcForm', el).addEventListener('submit', async (e) => {
        e.preventDefault();
        const text = K.$('#kcText', el).value.trim();
        const title = K.$('#kcTitle', el).value.trim() || 'Geleceğe mektup';
        if (!text) return K.$('#kcText', el).focus();
        if (!di.value || T.daysUntil(di.value) <= 0) {
          K.fx.toast('Açılış günü ileri bir tarih olmalı.');
          return di.focus();
        }
        const list = mine();
        list.push({ id: 'k' + Date.now(), title, text, open: di.value, created: T.todayKey() });
        K.store.set('capsules', list);
        K.$('#kcText', el).value = '';
        K.$('#kcTitle', el).value = '';
        K.audio.sfx.chime();
        K.fx.confetti({ count: 60, shapes: ['star', 'heart'] });
        K.stickers.award('kapsul');
        render();
        const ok = await K.notify(`${C.herName} bir zaman kapsülü gömdü`, `Açılış: ${T.fmt(di.value)}\nBaşlık: ${title}\n\n${text}`, ['hourglass_flowing_sand']);
        K.fx.toast(ok ? `Kavanoz kapandı. Kopyası ${K.esc(C.myName)}'de saklanıyor.` : 'Kavanoz kapandı.', { icon: A.icon('jar') });
      });
      K.$('#kcList', el).addEventListener('click', (e) => {
        const b = e.target.closest('[data-read]');
        if (!b) return;
        const c = b.closest('.kc');
        read(c.dataset.id, c.dataset.from);
      });
    },
    enter() {
      render();
    },
  });
})();
