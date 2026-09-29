/* Oda: İzleme Kulübü — onun daha önce izleyip ağladığı diziyi bu sefer birlikte izlemek için.
   Bölüm bölüm: benim tahminim (o sonunu bildiği için okuyup güler), onun mühürlü notu (ben bölümü bitirene kadar kapalı),
   aynı anda "oynat" geri sayımı, mendil sayacı, izledikten sonra iki tepki ve finalde bir mektup. Bulutla iki yönlü. */
(function () {
  'use strict';
  const K = window.K;
  const A = K.art;
  const D = window.ELN;
  const C = D.config;
  const T = K.time;

  let root, cur = 1;
  let rows = { wpred: [], wnote: [], wdone: [], wreact: [], wtissue: [] };
  const KU = () => D.kulup || { episodes: [], intro: [], after: [], finale: [] };
  const me = () => (K.isOwner() ? 'me' : 'her');
  const cloudOn = () => Boolean(K.cloud && K.cloud.enabled);
  const local = () => K.store.get('kulup', { done: {}, notes: {}, react: {}, tissues: {} });
  const saveLocal = (s) => K.store.set('kulup', s);

  /* ---------- Durum ---------- */
  const last = (kind, ep, who) => rows[kind].filter((r) => r.data.ep === ep && (!who || r.who === who)).pop();
  const isDone = (ep) => (cloudOn() ? rows.wdone.some((r) => r.data.ep === ep) : Boolean(local().done[ep]));
  const tissues = (ep, who) => (cloudOn() ? rows.wtissue.filter((r) => r.data.ep === ep && r.who === who).length : who === me() ? local().tissues[ep] || 0 : 0);
  const openEp = (ep) => ep === 1 || isDone(ep - 1) || K.isOwner();
  const doneCount = () => KU().episodes.filter((e) => isDone(e.n)).length;
  // Dizinin sonunu bilmeyen kale sahibi için: son bölüm birlikte bitene kadar sonu anlatan yerler kapalı
  K.spoilerOk = () => !K.isOwner() || !D.kulup || isDone(KU().episodes.length);

  /* ---------- Liste ---------- */
  function strip() {
    K.$('#kuStrip', root).innerHTML = KU()
      .episodes.map((e) => {
        const d = isDone(e.n), o = openEp(e.n);
        return `<button class="ku-ep ${d ? 'done' : o ? 'open' : 'locked'} ${e.n === cur ? 'sel' : ''}" data-ep="${e.n}" ${o ? '' : 'aria-disabled="true"'}><span class="ku-n">${e.n}</span><small>${d ? 'İzlendi' : o ? 'Sıradaki' : 'Kilitli'}</small></button>`;
      })
      .join('');
    K.$('#kuProg', root).textContent = `${doneCount()} / ${KU().episodes.length} bölüm birlikte izlendi`;
  }

  /* ---------- Bölüm ---------- */
  function episode() {
    const e = KU().episodes.find((x) => x.n === cur);
    if (!e) return;
    const d = isDone(e.n);
    const pred = cloudOn() ? last('wpred', e.n, 'me') : null;
    const note = cloudOn() ? last('wnote', e.n, 'her') : local().notes[e.n] ? { data: { text: local().notes[e.n] } } : null;
    const myReact = cloudOn() ? last('wreact', e.n, me()) : local().react[e.n] ? { data: local().react[e.n] } : null;
    const otherReact = cloudOn() ? last('wreact', e.n, K.cloud.other()) : null;
    const owner = K.isOwner();
    const other = K.otherName();
    const stars = (n) => Array.from({ length: 5 }, (_, i) => `<span class="${i < n ? 'on' : ''}">${A.ui('heart')}</span>`).join('');
    K.$('#kuEp', root).innerHTML = `<article class="ku-card ${d ? 'is-done' : ''}">
      <header><p class="card-eyebrow">${KU().series || ''} · ${e.n}. bölüm</p><h3>${K.esc(e.title)}</h3><p class="ku-tr">${K.esc(e.tr)}</p><p class="muted">${K.esc(e.teaser)}</p></header>
      <section class="ku-box ku-pred"><p class="card-eyebrow">${K.esc(C.myPet)}'un tahmini</p>
        ${owner && !d ? `<form class="ku-form" data-f="pred"><textarea class="textarea" name="kuPred" rows="2" maxlength="400" placeholder="${K.esc(KU().predictHint || '')}">${pred ? K.esc(pred.data.text) : ''}</textarea><button class="btn small" type="submit">${A.ui('check')} Tahmini kaydet</button></form>`
          : pred ? `<p class="hand">"${K.esc(pred.data.text)}"</p>${!owner && !d ? '<p class="muted small">Sonunu biliyorsun. Gül ama belli etme.</p>' : ''}` : `<p class="muted small">${owner ? 'Bu bölüm için tahmin yazmadın.' : cloudOn() ? `${K.esc(C.myPet)} henüz tahmin yazmadı.` : 'Tahminler ortak kale bağlanınca görünecek.'}</p>`}
      </section>
      <section class="ku-box ku-note"><p class="card-eyebrow">${K.esc(C.herPet)}'un mühürlü notu</p>
        ${!owner && !d ? `<form class="ku-form" data-f="note"><textarea class="textarea" name="kuNote" rows="2" maxlength="600" placeholder="Bu bölüm için ona bir not: ne hissettin, nerede ağladın... O bölümü bitirene kadar mühürlü kalacak.">${note ? K.esc(note.data.text) : ''}</textarea><button class="btn small" type="submit">${A.ui('check')} Mühürle</button></form>`
          : note ? (owner && !d ? `<div class="ku-seal">${A.ui('lock')}<span>Bir not var ama mühürlü. Bölümü bitirince açılacak.</span></div>` : `<p class="hand">"${K.esc(note.data.text)}"</p>`) : `<p class="muted small">${owner ? 'Bu bölüm için not bırakmamış.' : 'Not bırakmadın.'}</p>`}
      </section>
      ${!d ? `<section class="ku-box ku-go">
        <div class="actions"><button class="btn red" type="button" data-go>${A.ui('play')} Birlikte başlat</button><button class="btn soft" type="button" data-tissue>${A.icon('heart')} Mendil</button></div>
        <p class="muted small">"Birlikte başlat"a basınca ikinizin ekranında aynı anda geri sayım başlar; sıfırda ikiniz de oynat'a basarsınız.</p>
        <p class="ku-tis">Mendiller · ${K.esc(C.herPet)}: <b>${tissues(e.n, 'her')}</b> · ${K.esc(C.myPet)}: <b>${tissues(e.n, 'me')}</b></p>
        <div class="actions"><button class="btn" type="button" data-done>${A.ui('check')} Bölümü izledik</button></div>
      </section>` : `<section class="ku-box ku-after">
        <p class="card-eyebrow">Bölüm bitti</p>
        ${KU().after[e.n - 1] ? `<p class="hand ku-aftnote">${K.esc(K.fill(KU().after[e.n - 1]))}</p><p class="ku-sign">— ${K.esc(C.myPet)}</p>` : ''}
        <p class="ku-tis">Mendiller · ${K.esc(C.herPet)}: <b>${tissues(e.n, 'her')}</b> · ${K.esc(C.myPet)}: <b>${tissues(e.n, 'me')}</b></p>
        <div class="ku-reacts">
          <div class="ku-r"><p class="card-eyebrow">Senin tepkin</p>${myReact ? `<p class="ku-stars">${stars(myReact.data.stars)}</p><p class="hand">${K.esc(myReact.data.text || '')}</p>` : `<form class="ku-form" data-f="react"><div class="ku-stars ku-pick">${[1, 2, 3, 4, 5].map((n) => `<button type="button" data-star="${n}" aria-label="${n}">${A.ui('heart')}</button>`).join('')}</div><input class="input" name="kuReact" maxlength="200" placeholder="Tek cümle"><button class="btn small" type="submit">${A.ui('send')} Kaydet</button></form>`}</div>
          ${cloudOn() ? `<div class="ku-r"><p class="card-eyebrow">${K.esc(other)}'un tepkisi</p>${otherReact ? `<p class="ku-stars">${stars(otherReact.data.stars)}</p><p class="hand">${K.esc(otherReact.data.text || '')}</p>` : '<p class="muted small">Henüz yazmadı.</p>'}</div>` : ''}
        </div>
      </section>`}
    </article>`;
  }
  function finale() {
    const box = K.$('#kuFinale', root);
    const all = doneCount() === KU().episodes.length;
    box.hidden = !all;
    if (!all) return;
    box.innerHTML = `<article class="ku-fin"><p class="card-eyebrow">Final</p>${K.paras(KU().finale)}<p class="ku-sign">— ${K.esc(C.myPet)}</p>
      <div class="ku-chart">${KU().episodes.map((e) => `<div class="ku-bar"><i class="her" style="height:${Math.min(100, tissues(e.n, 'her') * 12)}%"></i><i class="me" style="height:${Math.min(100, tissues(e.n, 'me') * 12)}%"></i><small>${e.n}</small></div>`).join('')}</div>
      <p class="muted small" style="text-align:center">Ağlama haritamız: pembe ${K.esc(C.herPet)}, mavi ${K.esc(C.myPet)}</p></article>`;
  }
  function render() {
    if (!root) return;
    strip();
    episode();
    finale();
  }

  /* ---------- Geri sayım ---------- */
  function countdown(at, ep) {
    const el = K.el(`<div class="ku-cd" role="dialog" aria-label="Geri sayım"><p class="ku-cd-t">${ep}. bölüm</p><b class="ku-cd-n">…</b><p class="ku-cd-s">Oynat'a basmaya hazır ol</p><button class="btn ghost small" data-x>Kapat</button></div>`);
    document.body.appendChild(el);
    K.$('[data-x]', el).addEventListener('click', () => el.remove());
    const tick = () => {
      if (!document.body.contains(el)) return;
      const left = Math.ceil((at - Date.now()) / 1000);
      if (left > 0) {
        K.$('.ku-cd-n', el).textContent = left;
        if (left <= 5) K.audio.sfx.tick && K.audio.sfx.tick();
        setTimeout(tick, 250);
      } else {
        K.$('.ku-cd-n', el).innerHTML = A.ui('play');
        K.$('.ku-cd-s', el).textContent = 'Şimdi oynat!';
        K.audio.sfx.chime();
        K.vibrate([200, 80, 200]);
        setTimeout(() => el.remove(), 4000);
      }
    };
    tick();
  }

  /* ---------- Bulut ---------- */
  const KINDS = Object.keys(rows);
  K.on('cloud', async (on) => {
    if (!on) return;
    const got = await Promise.all(KINDS.map((k) => K.cloud.list(k)));
    KINDS.forEach((k, i) => (rows[k] = got[i]));
    KINDS.forEach((k) =>
      K.cloud.on(k, (r) => {
        if (!rows[k].some((x) => x.id === r.id)) rows[k].push(r);
        if (k === 'wdone' && r.who !== me()) K.fx.toast(`<b>${K.esc(K.otherName())}</b> ${r.data.ep}. bölümü "izledik" olarak işaretledi.`, { icon: A.icon('film') });
        if (K.activeRoom === 'kulup') render();
      })
    );
    K.cloud.onLive('wgo', (m) => {
      countdown(m.at, m.ep);
      if (K.activeRoom !== 'kulup') K.fx.toast(`${K.esc(K.otherName())} ${m.ep}. bölümü başlatıyor!`, { icon: A.icon('film') });
    });
    if (K.activeRoom === 'kulup') render();
  });

  async function act(kind, data) {
    if (cloudOn()) return K.cloud.add(kind, data);
    const s = local();
    if (kind === 'wdone') s.done[data.ep] = T.todayKey();
    if (kind === 'wnote') s.notes[data.ep] = data.text;
    if (kind === 'wreact') s.react[data.ep] = { text: data.text, stars: data.stars };
    if (kind === 'wtissue') s.tissues[data.ep] = (s.tissues[data.ep] || 0) + 1;
    saveLocal(s);
    return true;
  }

  K.room({
    id: 'kulup',
    wing: 'zaman',
    title: 'İzleme Kulübü',
    sub: () => (D.kulup ? `${D.kulup.series}: sekiz bölüm, birlikte` : ''),
    icon: 'film',
    color: '#E4E0F7',
    hidden: () => !D.kulup,
    badge: () => (D.kulup && doneCount() < KU().episodes.length ? `${doneCount()}/${KU().episodes.length}` : ''),
    init(el) {
      root = el;
      el.innerHTML = `
        <div class="ku-top"><div class="ku-poster" aria-hidden="true"><b>${K.esc(KU().series || '')}</b><span>${A.icon('door')}</span></div><div>${K.paras(KU().intro)}</div></div>
        <p class="ku-prog" id="kuProg"></p>
        <div class="ku-strip" id="kuStrip"></div>
        <div id="kuEp"></div>
        <div id="kuFinale" hidden></div>`;
      el.addEventListener('click', async (e) => {
        const ep = e.target.closest('[data-ep]');
        if (ep) {
          const n = +ep.dataset.ep;
          if (!openEp(n)) return K.fx.toast('Önce bir önceki bölümü birlikte bitirin.', { icon: A.icon('film') });
          cur = n;
          render();
        }
        if (e.target.closest('[data-go]')) {
          const at = Date.now() + (cloudOn() ? 10000 : 60000);
          if (cloudOn()) K.cloud.send('wgo', { ep: cur, at });
          if (!K.isOwner()) K.notify(`${C.herName} ${cur}. bölümü başlatıyor`, cloudOn() ? 'Kalede geri sayım başladı.' : 'Bir dakika sonra aynı anda oynatın.', ['clapper'], { priority: 5 });
          countdown(at, cur);
        }
        if (e.target.closest('[data-tissue]')) {
          await act('wtissue', { ep: cur });
          K.audio.sfx.pop();
          K.fx.burst(e.clientX || window.innerWidth / 2, e.clientY || window.innerHeight / 2, { count: 5, shapes: ['heart'] });
          render();
        }
        if (e.target.closest('[data-done]')) {
          await act('wdone', { ep: cur });
          K.audio.sfx.success();
          K.fx.confetti({ count: 70 });
          if (!K.isOwner()) K.notify(`${cur}. bölüm bitti`, `${C.herName} bölümü "izledik" olarak işaretledi. Notu artık açık.`, ['clapper']);
          if (doneCount() === KU().episodes.length) {
            K.stickers.award('kulup');
            K.fx.confetti({ count: 180, shapes: ['heart', 'star'] });
          }
          render();
        }
        const st = e.target.closest('[data-star]');
        if (st) {
          const f = st.closest('form');
          f.dataset.stars = st.dataset.star;
          K.$$('[data-star]', f).forEach((b) => b.classList.toggle('on', +b.dataset.star <= +st.dataset.star));
        }
      });
      el.addEventListener('submit', async (e) => {
        const f = e.target.closest('[data-f]');
        if (!f) return;
        e.preventDefault();
        const kind = f.dataset.f;
        if (kind === 'pred') {
          const text = f.kuPred.value.trim();
          if (!text) return;
          await act('wpred', { ep: cur, text });
          K.fx.toast('Tahmin kaydedildi. O okuyup gülecek; belli etmeyecek.', { icon: A.icon('film') });
        }
        if (kind === 'note') {
          const text = f.kuNote.value.trim();
          if (!text) return;
          await act('wnote', { ep: cur, text });
          K.fx.toast(`Mühürlendi. ${K.esc(C.myPet)} bölümü bitirince açılacak.`, { icon: A.ui('lock') });
        }
        if (kind === 'react') {
          const text = f.kuReact.value.trim();
          await act('wreact', { ep: cur, text, stars: +(f.dataset.stars || 5) });
        }
        render();
      });
    },
    enter() {
      const first = KU().episodes.find((e) => !isDone(e.n));
      cur = first ? first.n : KU().episodes.length;
      render();
    },
  });
})();
