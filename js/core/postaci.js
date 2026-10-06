/* Kale 2.0 — Kitty Postacı: o sen yokken (ya da şu an) kaleye bir şey bıraktıysa (kavanoz notu, ses, kartpostal,
   hikâye, sarılma...) Kitty omzunda postacı çantasıyla ekranın kenarından yürüyerek gelir ve ana salonda bekler.
   Ona dokununca çanta açılır: her zarf bir anı, dokununca o odaya gider. Birkaç zarf biriktiyse çanta şişer.
   Görülenler bu cihazda işaretlenir; öbürü bir şey bırakmadıkça Kitty gelmez. */
(function () {
  'use strict';
  const K = window.K;
  const A = K.art;
  const D = window.ELN;
  const T = K.time;

  const mine = () => (K.isOwner() ? 'me' : 'her');
  let bag = [], el = null, ready = false;
  const seen = () => K.store.get('postaciSeen', 0);
  function collect() {
    if (!K.akis || !K.akis.ready()) return;
    const since = Math.max(seen(), Date.now() - 4 * 864e5);
    // recent() zaten anı diline çevrilmiş kayıtlar: {id, who, at, title, text, room, weight, row}
    bag = K.akis
      .recent()
      .filter((x) => x.who !== mine() && x.at > since && ((x.weight || 0) >= 2 || (x.kind === 'kalpk' && x.row && x.row.data && x.row.data.note)))
      .map((x) => ({ r: x.row || x, n: x }))
      .slice(-12);
    ready = true;
    show();
  }
  function show() {
    if (!bag.length || K.activeRoom || document.body.classList.contains('gate-open')) return hide();
    if (!el) {
      el = K.el(`<button type="button" class="postaci" id="postaci" aria-label="Kitty Postacı: sana zarf getirdi"><span class="pc-kitty">${A.kitty({ cls: 'pc-k', eyes: 'happy' })}</span><span class="pc-canta"><i></i><b></b></span><span class="pc-balon">Sana posta var!</span></button>`);
      document.body.appendChild(el);
      el.addEventListener('click', open);
      requestAnimationFrame(() => el.classList.add('geldi'));
      K.audio.sfx.paper && setTimeout(() => K.audio.sfx.paper(), 900);
    }
    el.style.setProperty('--n', Math.min(bag.length, 8));
    K.$('.pc-canta b', el).textContent = bag.length;
    el.hidden = false;
  }
  function hide() {
    el && (el.hidden = true);
  }
  function open() {
    K.audio.sfx.pop();
    const list = bag.slice().reverse();
    const m = K.ui.modal({
      label: 'Kitty Postacı',
      cls: 'pc-sheet',
      html: `<div class="pc-head">${A.kitty({ cls: 'pc-k2', eyes: 'happy', bow: true })}<div><p class="card-eyebrow">Kitty Postacı</p><h2>${list.length > 1 ? `${list.length} zarf getirdim` : 'Bir zarf getirdim'}</h2><p class="muted">Sen yokken ${K.esc(K.otherName())} kaleye bunları bıraktı.</p></div></div>
        <ul class="pc-list">${list.map((x, i) => `<li><button type="button" class="pc-zarf" data-pc="${i}" style="--d:${i * 70}ms"><span class="pc-mühür">${x.n.emoji || '💌'}</span><span><b>${K.esc(x.n.title)}</b>${x.n.text ? `<small>${K.esc(String(x.n.text).slice(0, 90))}</small>` : ''}<em>${K.esc(K.ago(x.r.at))}</em></span></button></li>`).join('')}</ul>
        <div class="row"><button type="button" class="btn red" data-close>Hepsini okudum</button></div>`,
      onClose: done,
    });
    m.body.addEventListener('click', (e) => {
      const z = e.target.closest('[data-pc]');
      if (!z) return;
      const x = list[+z.dataset.pc];
      m.close();
      const day = K.akis.dayOf(x.r.at);
      if (x.n.room) K.go(x.n.room);
      else if (K.gungun) K.gungun.open(day);
    });
  }
  function done() {
    K.store.set('postaciSeen', Date.now());
    bag = [];
    if (el) {
      el.classList.add('gitti');
      const old = el;
      el = null;
      setTimeout(() => old.remove(), 700);
    }
    K.stickers.award('postaci');
  }
  K.on('built', () => {
    if (!K.akis) return;
    K.akis.onChange(collect);
    setTimeout(collect, 2500);
  });
  K.on('room', () => hide());
  window.addEventListener('hashchange', () => setTimeout(() => (K.activeRoom ? hide() : ready && show()), 0));
  K.postaci = { collect, open, count: () => bag.length };
})();
