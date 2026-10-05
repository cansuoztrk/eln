/* Oda: Prenses ve User155 — haftalık etkileşimli hikâye. Her bölümde Prenses ve User155 kendi iki seçeneğinden birini
   seçer; öbürünün seçimi gizli kalır, ikisi de seçince sonuç (dört ihtimalden biri) açılır. Bir bölüm bitince bir
   sonraki bölüm, takip eden pazartesi (Bakü) açılır. Kayıtlar: prenses {ch, c} */
(function () {
  'use strict';
  const K = window.K;
  const A = K.art;
  const D = window.ELN;
  const C = D.config;
  const T = K.time;

  const PR = () => D.prenses || { intro: [], chapters: [], season: '', end: '' };
  const mine = () => (K.isOwner() ? 'me' : 'her');
  const other = () => (K.isOwner() ? 'her' : 'me');
  const ROLE = { her: 'Prenses', me: 'User155' };
  let rows = [], loaded = false, root = null, view = null;
  const push = (r) => r && !rows.some((x) => x.id === r.id) && rows.push(r);
  const choice = (ch, w) => rows.filter((r) => r.kind === 'prenses' && r.data.ch === ch && r.who === w).sort((a, b) => a.at - b.at)[0] || null;
  const both = (ch) => choice(ch, 'her') && choice(ch, 'me');
  // Bölümün bittiği andan sonraki ilk pazartesi (Bakü)
  function nextMonday(at) {
    const p = T.baku(new Date(at));
    const d = new Date(Date.UTC(p.y, p.mo - 1, p.d));
    d.setUTCDate(d.getUTCDate() + (((8 - d.getUTCDay()) % 7) || 7));
    return T.at(d.toISOString().slice(0, 10)).getTime();
  }
  function opensAt(ch) {
    if (ch === 0) return 0;
    if (!both(ch - 1)) return Infinity;
    return nextMonday(Math.max(choice(ch - 1, 'her').at, choice(ch - 1, 'me').at));
  }
  // Şu anki bölüm: açılmış ama bitmemiş ilk bölüm, yoksa son biten
  function current() {
    const n = (PR().chapters || []).length;
    for (let i = 0; i < n; i++) if (!both(i)) return opensAt(i) <= T.now().getTime() ? { i, open: true } : { i, open: false, at: opensAt(i) };
    return { i: n, done: true };
  }
  const outcome = (ch) => {
    const c = PR().chapters[ch];
    return c.out[choice(ch, 'her').data.c * 2 + choice(ch, 'me').data.c];
  };

  function chapterHtml(i, live) {
    const c = PR().chapters[i];
    const done = both(i);
    const side = (w) => {
      const my = choice(i, w);
      const opts = c[w] || [];
      if (w === mine() && !my && live) return `<div class="pr-ch my"><p class="card-eyebrow">${K.esc(ROLE[w])} ne yapsın?</p>${opts.map((o, k) => `<button type="button" class="pr-opt" data-pr-c="${k}" data-ch="${i}">${k ? '🅑' : '🅐'} ${K.esc(o)}</button>`).join('')}</div>`;
      if (my && (done || w === mine())) return `<div class="pr-ch ${w}"><p class="card-eyebrow">${K.esc(ROLE[w])} seçti</p><p class="pr-picked">${my.data.c ? '🅑' : '🅐'} ${K.esc(opts[my.data.c])}</p></div>`;
      return `<div class="pr-ch ${w} wait"><p class="card-eyebrow">${K.esc(ROLE[w])}</p><p class="muted">${my ? '✓ Seçimini yaptı · gizli' : '⏳ Henüz seçmedi'}</p></div>`;
    };
    return `<article class="pr-page ${done ? 'done' : ''}"><p class="pr-no">Bölüm ${i + 1}</p><h3 class="pr-title">${K.esc(c.title)}</h3>
      <div class="pr-text">${c.text.map((p) => `<p>${K.esc(K.fill(p))}</p>`).join('')}</div>
      <div class="pr-choices">${side('her')}${side('me')}</div>
      ${done ? `<div class="pr-out"><span aria-hidden="true">✨</span><p>${K.esc(K.fill(outcome(i)))}</p></div>` : ''}</article>`;
  }
  function render() {
    if (!root || K.activeRoom !== 'prenses') return;
    const cur = current();
    const n = (PR().chapters || []).length;
    const show = view != null ? view : cur.done ? n - 1 : cur.open ? cur.i : Math.max(0, cur.i - 1);
    const lock = !cur.done && !cur.open ? `<div class="pr-lock"><span aria-hidden="true">🔒</span><p><b>Bölüm ${cur.i + 1}</b> ${K.esc(T.fmt(new Date(cur.at), true))} sabahı açılacak.</p><p class="muted small">O zamana kadar bu sonucu birlikte konuşun.</p></div>` : '';
    K.$('#prBook', root).innerHTML = `<header class="pr-cover"><span class="pr-bow" aria-hidden="true">${A.bow('#E3174D')}</span><p>${K.esc(PR().season || '')}</p>
        <div class="pr-steps">${PR().chapters.map((c, k) => `<button type="button" class="${k === show ? 'on' : ''} ${both(k) ? 'done' : ''}" data-pr-v="${k}" ${k > cur.i || (k === cur.i && !cur.open && !both(k)) ? 'disabled' : ''} aria-label="Bölüm ${k + 1}">${both(k) ? '✓' : k + 1}</button>`).join('')}</div></header>
      ${chapterHtml(show, show === cur.i && cur.open)}${lock}
      ${cur.done && show === n - 1 ? `<p class="pr-end hand">👑 ${K.esc(PR().end || '')}</p>` : ''}`;
  }
  async function choose(ch, c, btn) {
    if (choice(ch, mine())) return;
    K.$$('.pr-opt', root).forEach((b) => (b.disabled = true));
    const r = await K.cloud.add('prenses', { ch, c });
    if (!r) {
      K.$$('.pr-opt', root).forEach((b) => (b.disabled = false));
      return K.fx.toast('Kaydedilemedi.');
    }
    push(r);
    K.audio.sfx.paper();
    if (both(ch)) {
      K.fx.confetti({ count: 80, shapes: ['bow', 'heart', 'star'] });
      K.audio.sfx.success();
      K.stickers.award('prenses');
      K.ping(`📖 Hikâye ilerledi: ${PR().chapters[ch].title}`, 'İkiniz de seçtiniz; sonuç açıldı.', ['book'], { click: K.roomUrl('prenses') });
    } else K.ping(`📖 ${ROLE[mine()]} seçimini yaptı`, `"${PR().chapters[ch].title}" · sıra sende. Seçimi gizli.`, ['book'], { click: K.roomUrl('prenses') });
    render();
    K.renderSpecials && !K.activeRoom && K.renderSpecials();
  }

  K.on('cloud', async (ok) => {
    if (!ok) return;
    rows = await K.cloud.list('prenses', 400);
    loaded = true;
    K.cloud.on('prenses', (r) => {
      if (!push(r)) return;
      if (r.who !== mine() && both(r.data.ch) && K.activeRoom === 'prenses') {
        K.fx.confetti({ count: 80, shapes: ['bow', 'heart', 'star'] });
        K.stickers.award('prenses');
      }
      render();
      K.renderSpecials && !K.activeRoom && K.renderSpecials();
    });
    render();
  });
  K.specialHooks = (K.specialHooks || []).concat(() => {
    if (!loaded || !D.prenses) return [];
    const cur = current();
    if (cur.done || !cur.open) {
      const last = cur.done ? PR().chapters.length - 1 : cur.i - 1;
      if (last >= 0 && both(last) && K.store.get('prSeen') !== last) return [{ icon: 'story', title: `📖 Bölüm ${last + 1} sonucu açıldı`, text: `"${PR().chapters[last].title}" · ikiniz de seçtiniz.`, run: () => (K.store.set('prSeen', last), (view = last), K.go('prenses')), cta: 'Oku' }];
      return [];
    }
    if (choice(cur.i, mine())) return [];
    const ot = choice(cur.i, other());
    return [{ icon: 'story', title: `📖 Prenses ve User155 · Bölüm ${cur.i + 1}`, text: ot ? `${ROLE[other()]} seçimini yaptı. Sıra sende.` : `"${PR().chapters[cur.i].title}" seni bekliyor.`, room: 'prenses', cta: 'Oku ve seç' }];
  });

  K.room({
    id: 'prenses',
    wing: 'oyun',
    title: 'Prenses ve User155',
    sub: 'Haftalık etkileşimli hikâye',
    icon: 'story',
    color: '#FFE6F0',
    hidden: () => !D.prenses || !K.cloud || !K.cloud.enabled,
    badge: () => {
      if (!loaded) return '';
      const cur = current();
      return !cur.done && cur.open && !choice(cur.i, mine()) ? 'Sıra sende' : '';
    },
    init(el) {
      root = el;
      el.innerHTML = `<div class="room-intro">${K.paras(PR().intro || [])}</div><section class="pr-book" id="prBook"></section>`;
      el.addEventListener('click', (e) => {
        const v = e.target.closest('[data-pr-v]');
        if (v) return (view = +v.dataset.prV), render();
        const c = e.target.closest('[data-pr-c]');
        if (c) choose(+c.dataset.ch, +c.dataset.prC, c);
      });
    },
    enter() {
      const cur = current();
      if (view == null || view > cur.i) view = null;
      const last = cur.done ? PR().chapters.length - 1 : cur.i - 1;
      if (last >= 0 && both(last)) K.store.set('prSeen', last);
      render();
    },
    leave() {
      view = null;
    },
  });
})();
