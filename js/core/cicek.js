/* Kale 2.0 — Günün Çiçeği: ana salonda iki çiçek, biri senin biri onun. Her günlük ritüel bir yaprak açar:
   günün sorusu, günün kelimesi, günün karesi, içinin havası, bir selam ya da sarılma. İki çiçek de açınca "tam gün".
   Kendi çiçeğinin kapalı yaprağına dokununca o ritüele gider. Yeni bir kayıt gerekmez; hepsi var olan kayıtlardan okunur. */
(function () {
  'use strict';
  const K = window.K;
  const D = window.ELN;
  const C = D.config;
  const T = K.time;

  const CC = () => D.cicek || { petals: [] };
  const mine = () => (K.isOwner() ? 'me' : 'her');
  const other = () => (K.isOwner() ? 'her' : 'me');
  const nameOf = (w) => (w === 'me' ? C.myPet : C.herPet);
  const COLORS = { soru: ['#CDB8FF', '#8F73E6'], kelime: ['#9FE3C2', '#3FA37A'], kare: ['#FFC9A3', '#E58A4E'], hava: ['#A9DCFF', '#4A9BD8'], kalp: ['#FF9DC0', '#E3174D'] };
  const roomOk = (id) => {
    const r = K.rooms.find((x) => x.id === id);
    return Boolean(r && !(typeof r.hidden === 'function' ? r.hidden() : r.hidden));
  };
  // Hangi yapraklar bu kalede var (bulut ya da oda yoksa o yaprak hiç çizilmez)
  const petals = () =>
    (CC().petals || []).filter(([k]) => (k === 'soru' ? Boolean(K.questions && D.questions && D.questions.length) : k === 'kalp' ? Boolean(K.kalp) : roomOk(k)));
  function done(k, w) {
    try {
      if (k === 'soru') {
        const q = K.questions.today();
        return w === mine() ? Boolean(K.questions.answer(q.i)) : Boolean(K.questions.other(q.i));
      }
      if (k === 'kelime') return K.kelime.doneBy(w);
      if (k === 'kare') return K.kare.doneBy(w);
      if (k === 'hava') return Boolean(K.hava.today(w));
      if (k === 'kalp') return K.kalp.todayOf(w);
    } catch (e) {}
    return false;
  }

  // Bir yaprak: merkezden dışa uzanan damla
  const PETAL = 'M0 -9 C13 -18 15 -38 0 -50 C-15 -38 -13 -18 0 -9 Z';
  function flower(w, ps, prev) {
    const n = ps.length;
    const got = ps.filter(([k]) => done(k, w)).length;
    const leaves = ps
      .map(([k, label], i) => {
        const on = done(k, w);
        const [fill, edge] = COLORS[k] || ['#FFD0E1', '#E3174D'];
        const pop = on && prev && prev[w + k] === false;
        const mineF = w === mine();
        return `<g class="cc-p ${on ? 'on' : 'off'} ${pop ? 'pop' : ''}" transform="rotate(${(360 / n) * i})" ${mineF && !on ? `data-cc="${k}" role="button" tabindex="0" aria-label="${K.esc(label)}"` : `aria-label="${K.esc(label)}${on ? ': tamam' : ''}"`}><path d="${PETAL}" fill="${on ? fill : '#fff'}" stroke="${on ? edge : '#E9B9CB'}" stroke-width="2.4" ${on ? '' : 'stroke-dasharray="4 4"'}/>${on ? `<path d="M0 -14 C4 -24 4 -34 0 -42" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" opacity=".6"/>` : ''}</g>`;
      })
      .join('');
    const full = got === n;
    return `<svg class="cc-svg ${full ? 'full' : ''}" viewBox="-60 -60 120 150" aria-hidden="true"><path class="cc-stem" d="M0 10 C-4 40 6 62 0 88" fill="none" stroke="#3FA37A" stroke-width="5" stroke-linecap="round"/><path d="M0 58 C-18 46 -30 52 -34 60 C-22 66 -8 64 0 58 Z" fill="#9FE3C2" stroke="#3FA37A" stroke-width="2.4" stroke-linejoin="round"/>${leaves}<circle r="13" fill="${full ? '#FFD34E' : '#FFF4C7'}" stroke="#4A2138" stroke-width="2.6"/><text y="4.5" text-anchor="middle" class="cc-n">${got}</text></svg>`;
  }

  let prev = null;
  function render() {
    const box = K.$('#cicek');
    if (!box) return;
    const ps = petals();
    if (!K.cloud || !K.cloud.enabled || ps.length < 3) {
      box.hidden = true;
      return;
    }
    const me = mine(), o = other();
    const cnt = (w) => ps.filter(([k]) => done(k, w)).length;
    const a = cnt(me), b = cnt(o), n = ps.length;
    const todo = ps.filter(([k]) => !done(k, me));
    const both = a === n && b === n;
    box.hidden = false;
    box.innerHTML = `<div class="cc-card ${both ? 'full' : ''}">
      <div class="cc-head"><div><p class="card-eyebrow">${K.esc(CC().title || 'Günün Çiçeği')}</p><p class="cc-sub">${K.esc(both ? CC().full || '' : CC().text || '')}</p></div><b class="cc-score">${a + b}<small>/${n * 2}</small></b></div>
      <div class="cc-flowers">
        <figure class="cc-f">${flower(me, ps, prev)}<figcaption>Sen · ${a}/${n}</figcaption></figure>
        <div class="cc-mid ${both ? 'on' : ''}" aria-hidden="true"><span>♥</span></div>
        <figure class="cc-f">${flower(o, ps, prev)}<figcaption>${K.esc(nameOf(o))} · ${b}/${n}</figcaption></figure>
      </div>
      ${todo.length ? `<div class="cc-todo">${todo.map(([k, label, e]) => `<button type="button" class="chip" data-cc="${k}"><span aria-hidden="true">${e}</span> ${K.esc(label)}</button>`).join('')}</div>` : `<p class="cc-done">Senin çiçeğin açtı. ${b < n ? `${K.esc(nameOf(o))} çiçeğinin ${n - b} yaprağı kaldı.` : ''}</p>`}
    </div>`;
    const next = {};
    ps.forEach(([k]) => ['me', 'her'].forEach((w) => (next[w + k] = done(k, w))));
    // Gün tamam: iki çiçek de açtı (günde bir kez kutlanır)
    if (both && K.store.get('ccFull-' + me) !== T.todayKey() && !K.activeRoom) {
      K.store.set('ccFull-' + me, T.todayKey());
      if (prev) {
        setTimeout(() => {
          K.fx.confetti({ count: 120, shapes: ['heart', 'spark'], colors: ['#FF9DC0', '#CDB8FF', '#9FE3C2', '#FFD34E', '#A9DCFF'] });
          K.fx.toast(`🌸 <b>Bugün tam gün!</b> ${K.esc(CC().full || '')}`, { duration: 5000 });
        }, 400);
      }
      K.stickers.award('cicek');
    }
    prev = next;
  }
  function act(k) {
    if (k === 'soru') {
      const q = K.$('#qCard');
      if (q && !q.hidden) {
        q.scrollIntoView({ behavior: K.reduced ? 'auto' : 'smooth', block: 'center', inline: 'center' });
        setTimeout(() => K.$('#qAns') && K.$('#qAns').focus({ preventScroll: true }), 500);
      } else K.go('sorular');
      return;
    }
    if (k === 'kalp') return K.kalp.openMenu();
    K.go(k);
  }

  let rT = 0;
  const later = () => {
    clearTimeout(rT);
    rT = setTimeout(() => !K.activeRoom && render(), 250);
  };
  document.addEventListener('click', (e) => {
    const b = e.target.closest('[data-cc]');
    if (b) act(b.dataset.cc);
  });
  document.addEventListener('keydown', (e) => {
    const b = e.target.closest && e.target.closest('g[data-cc]');
    if (b && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      act(b.dataset.cc);
    }
  });
  K.on('built', () => {
    const after = K.$('#kalpBar') || K.$('#stories');
    if (after && !K.$('#cicek')) after.insertAdjacentHTML('afterend', '<section class="wrap cicek" id="cicek" hidden></section>');
    render();
  });
  K.on('cloud', (ok) => {
    if (!ok) return;
    setTimeout(render, 1800);
    ['answer', 'kelime', 'kare', 'hava', 'selam', 'kucak', 'dusun', 'ozlem'].forEach((k) => K.cloud.on(k, later));
  });
  K.on('answered', later);
  K.on('kalpbar', later);
  K.on('room', later);
  window.addEventListener('hashchange', later);
  setInterval(later, 30000);
  K.cicek = { render, done };
})();
